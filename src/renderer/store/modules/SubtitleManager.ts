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
  isRefreshing: boolean,
}
const state = {
  list: [],
  primarySubtitleId: '',
  secondarySubtitleId: '',
  isRefreshing: false,
};
const getters = {
  subtitleNewList(state: SubtitleManagerState): SubtitleControlListItem[] {
    return state.list;
  },
  primarySubtitleId(state: SubtitleManagerState): string { return state.primarySubtitleId },
  secondarySubtitleId(state: SubtitleManagerState): string { return state.secondarySubtitleId },
  isRefreshing(state: SubtitleManagerState): boolean { return state.isRefreshing },
};
const mutations = {
  [m.initSubtitleManager](state: SubtitleManagerState) {
    state.list = [];
    state.primarySubtitleId = '';
    state.secondarySubtitleId = '';
  },
  [m.setStatus](state: SubtitleManagerState, status: boolean) {
    state.isRefreshing = status;
  },
  [m.addSubtitle](state: SubtitleManagerState, source: SubtitleControlListItem) {
    state.list.push(source);
    console.log(state.list);
  },
  [m.setPrimarySubtitleId](state: SubtitleManagerState, id: string) {
    state.primarySubtitleId = id;
  },
  [m.setSecondarySubtitleId](state: SubtitleManagerState, id: string) {
    state.secondarySubtitleId = id;
  },
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
  async [a.refreshSubtitlesInitially]({ commit, dispatch, getters }: any) {
    getters.subtitleNewList.forEach((sub: SubtitleControlListItem) => {
      store.unregisterModule(`${sub.id}`);
    })
    commit(m.initSubtitleManager);
    commit(m.setStatus, true);
    // get subtitles
    const videoSrc = getters.originSrc;
    const playlistId = getters.playlistId;
    const mediaHash = getters.mediaHash;
    const selectLanguage = {
      primary: getters.primaryLanguage,
      secondary: getters.secondaryLanguage
    };
    // const { mediaItem, videoSrc } = options;
    const preference = await retrieveSubtitlePreference(playlistId, mediaHash);
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
      online = !isEqual(language, selectLanguage);

      const onlineStoredSubtitles = list.filter(({ type }) => type === Type.Online);
      if (online) databaseItemsToDelete.concat(onlineStoredSubtitles);
      else databaseItemsToAdd.concat(onlineStoredSubtitles);
    }
    const hints = generateHints(videoSrc);
    await dispatch(a.deleteSubtitlesByHash, databaseItemsToDelete);
    dispatch(a.startAISelection);
    return Promise.all([
      dispatch(a.addLocalSubtitles, await searchForLocalList(videoSrc)),
      dispatch(a.addEmbeddedSubtitles, embedded ? await retrieveEmbeddedList(videoSrc) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineList(videoSrc, selectLanguage.primary, hints) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineList(videoSrc, selectLanguage.secondary, hints) : []),
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
    dispatch(a.startAISelection);
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
      store.registerModule([id], { ...subtitle, name: `${id}` });
      commit(m.addSubtitle, item);
      dispatch(`${id}/${subActions.add}`, transcript);
    })
  },
  async [a.addDatabaseSubtitles](context: any, storedSubtitleItems: StoredSubtitleItem[]) { },
  async [a.deleteSubtitlesByHash](context: any, storedSubtitleItems: StoredSubtitleItem[]) { },
  async [a.deleteSubtitlesByUuid](context: any, storedSubtitleItems: SubtitleControlListItem[]) { },
  async [a.changePrimarySubtitle]({ dispatch, commit }: any, id: string) {
    commit(m.setPrimarySubtitleId, id);
    await dispatch(`${id}/${subActions.load}`);
  },
  async [a.changeSecondarySubtitle]({ dispatch, commit }: any, id: string) {
    commit(m.setSecondarySubtitleId, id);
    await dispatch(`${id}/${subActions.load}`);
  },
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
  async [a.getCues]({ dispatch, getters }: any, time?: number) {
    const firstSub = {
      cues: [],
      subPlayResX: 720,
      subPlayResY: 405,
    };
    const secondSub = {
      cues: [],
      subPlayResX: 720,
      subPlayResY: 405,
    }
    if (getters.primarySubtitleId) {
      try {
        const dialogues = await dispatch(`${getters.primarySubtitleId}/${subActions.getDialogues}`, time);
        firstSub.cues = dialogues;
      } catch (error) {
        log.error('SubtitleManager', error);
      }
    }

    if (getters.secondarySubtitleId) {
      try {
        const dialogues = await dispatch(`${getters.secondarySubtitleId}/${subActions.getDialogues}`, time);
        secondSub.cues = dialogues;
      } catch (error) {
        log.error('SubtitleManager', error);
      }
    }
    return [firstSub, secondSub];
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
