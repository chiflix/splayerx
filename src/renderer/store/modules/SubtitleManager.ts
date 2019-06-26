import uuidv4 from 'uuid/v4';
import store from '@/store';
import { SubtitleManager as m } from '@/store/mutationTypes';
import { SubtitleManager as a, newSubtitle as subActions } from '@/store/actionTypes';
import { SubtitleControlListItem, Type } from '@/interfaces/ISubtitle';
import { ISubtitleStream, TranscriptInfo, searchForLocalList, retrieveEmbeddedList, fetchOnlineList, OnlineGenerator } from '@/services/subtitle';
import { generateHints } from '@/libs/utils';
import { LanguageCode } from '@/libs/language';
import { log } from '@/libs/Log';
import subtitle from './Subtitle';
import { StoredSubtitleItem } from '@/interfaces/ISubtitleStorage';
import { retrieveSubtitlePreference } from '@/services/storage/SubtitleStorage';
import { isEqual } from 'lodash';

let unwatch: Function;

type SubtitleManagerState = {
  list: SubtitleControlListItem[],
  primarySubtitleId: string,
  secondarySubtitleId: string,
}
const state = {
  list: [],
  primarySubtitleId: '',
  secondarySubtitleId: '',
  isRefreshing: false,
};
const getters = {
  subtitleNewList(state: SubtitleManagerState): SubtitleControlListItem[] { return state.list },
};
const mutations = {
  [m.addSubtitle](state: SubtitleManagerState, source: SubtitleControlListItem) {
    state.list.push(source);
  },
  [m.setPrimarySubtitleId](state: SubtitleManagerState, id: string) {
    state.primarySubtitleId = id;
  }
};
type RefreshSubtitlesOptions = {
  videoSrc: string;
  mediaItem: {
    playlistId: number;
    mediaItemId: string;
  };
  language: {
    primary: LanguageCode;
    secondary: LanguageCode;
  };
};
const actions = {
  async [a.refreshSubtitlesInitially]({ dispatch }: any, options: RefreshSubtitlesOptions) {
    const { mediaItem, videoSrc } = options;
    const preference = await retrieveSubtitlePreference(mediaItem.playlistId, mediaItem.mediaItemId);
    const databaseItemsToAdd: StoredSubtitleItem[] = [];
    const databaseItemsToDelete: StoredSubtitleItem[] = [];
    /** whether or not to fetch new online list */
    let online = true;
    /** whether or not to extract new embedded list */
    let embedded = true;
    if (preference) {
      const { language, list } = preference;

      const embeddedStoredSubtitles = list.filter(({ type }) => type === Type.Embedded);;
      databaseItemsToAdd
        .concat(list.filter(({ type }) => type === Type.Local))
        .concat(embeddedStoredSubtitles);
      embedded = !embeddedStoredSubtitles.length;
      online = !isEqual(language, options.language);

      const onlineStoredSubtitles = list.filter(({ type }) => type === Type.Online);
      if (online) databaseItemsToDelete.concat(onlineStoredSubtitles);
      else databaseItemsToAdd.concat(onlineStoredSubtitles);
    }

    const hints = generateHints(videoSrc);
    await dispatch(a.deleteSubtitlesByHash, databaseItemsToDelete);
    return Promise.all([
      dispatch(a.addLocalSubtitles, await searchForLocalList(videoSrc)),
      dispatch(a.addEmbeddedSubtitles, embedded ? await retrieveEmbeddedList(videoSrc) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineList(videoSrc, options.language.primary, hints) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineList(videoSrc, options.language.secondary, hints) : []),
      dispatch(a.addDatabaseSubtitles, databaseItemsToAdd),
    ]);
  },
  /** only refresh local and online subtitles, delete old online subtitles */
  async [a.refreshSubtitles]({ getters, dispatch }: any, options: RefreshSubtitlesOptions) {
    const { subtitleNewList } = getters as { subtitleNewList: SubtitleControlListItem[] };
    const [primary, secondary] = subtitleNewList.reduce((subtitleList, currentSubtitle) => {
      if (!subtitleList[0][0]) {
        subtitleList[0].push(currentSubtitle);
      } else if (subtitleList[0][0].language === currentSubtitle.language) {
        subtitleList[0].push(currentSubtitle);
      } else {
        subtitleList[1].push(currentSubtitle);
      }
      return subtitleList;
    }, [[], []] as [SubtitleControlListItem[], SubtitleControlListItem[]]);

    const { videoSrc, language } = options;
    const hints = generateHints(videoSrc);
    const primaryDeletePromise = () => dispatch(a.deleteSubtitlesByUuid, primary);
    const secondaryDeletePromise = () => dispatch(a.deleteSubtitlesByUuid, secondary);
    return Promise.all([
      dispatch(a.addLocalSubtitles, await searchForLocalList(videoSrc)),
      dispatch(a.addOnlineSubtitles, await fetchOnlineList(videoSrc, language.primary, hints)).then(primaryDeletePromise),
      dispatch(a.addOnlineSubtitles, await fetchOnlineList(videoSrc, language.secondary, hints)).then(secondaryDeletePromise),
    ]);
  },
  async [a.addLocalSubtitles](context: any, paths: string[]) { },
  async [a.addEmbeddedSubtitles](context: any, subtitleStreams: ISubtitleStream[]) { },
  async [a.addOnlineSubtitles]({ commit, dispatch }: any, transcriptInfoList: TranscriptInfo[]) {
    // remove all type online item from list
    transcriptInfoList.forEach(async (transcriptInfo: TranscriptInfo) => {
      const id = uuidv4();
      const transcript = new OnlineGenerator(transcriptInfo);
      const language = await transcript.getLanguage();
      const type = await transcript.getType();
      const item: SubtitleControlListItem = {
        id,
        language,
        type,
      }
      store.registerModule(['Subtitle', id], { ...subtitle, name: `${id}` });
      commit(m.addSubtitle, item);
      dispatch(`${id}/${subActions.add}`, transcript);
    })
  },
  async [a.addDatabaseSubtitles](context: any, storedSubtitleItems: StoredSubtitleItem[]) {},
  async [a.deleteSubtitlesByHash](context: any, storedSubtitleItems: StoredSubtitleItem[]) {},
  async [a.deleteSubtitlesByUuid]({ dispatch }: any, storedSubtitleItems: SubtitleControlListItem[]) {
    return Promise.all(storedSubtitleItems.map(({ id }) => dispatch(`${id}/${subActions.delete}`)));
  },
  async [a.changePrimarySubtitle]({ dispatch, commit }: any, id: string) {
    commit(m.setPrimarySubtitleId, id);
    await dispatch(`${id}/${subActions.load}`);
  },
  async [a.changeSecondarySubtitle](context: any, id: string) { },
  async [a.storeSubtitle](context: any, id: string) { },
  async [a.uploadSubtitle](context: any, id: string) { },
  async [a.startAISelection]({ dispatch }: any) {
    unwatch = store.watch((state: any, getters: any) => getters.subtitleNewList, (value: SubtitleControlListItem[], oldValue: SubtitleControlListItem[]) => {
      // AI select
      if (value.length > 0) {
        dispatch(a.changePrimarySubtitle, value[0].id);
        dispatch(a.stopAISelection);
      }
    });
  },
  async [a.stopAISelection]() {
    unwatch();
  },
  async [a.getCues]({ dispatch, state }: any, time?: number) {
    if (state.primarySubtitleId) {
      try {
        let dialogues = await dispatch(`${state.primarySubtitleId}/${subActions.getDialogues}`, time);
        return dialogues;
      } catch (error) {
        log.error('SubtitleManager', error);
      }
    }
    return [];
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
