import uuidv4 from 'uuid/v4';
import store from '@/store';
import { SubtitleManager as m } from '@/store/mutationTypes';
import { SubtitleManager as a, newSubtitle as subActions } from '@/store/actionTypes';
import { SubtitleControlListItem, Type } from '@/interfaces/ISubtitle';
import { ISubtitleStream, TranscriptInfo, searchForLocalList, retrieveEmbeddedList, fetchOnlineList, OnlineGenerator } from '@/services/subtitle';
import { generateHints } from '@/libs/utils';
import { log } from '@/libs/Log';
import subtitle from './Subtitle';
import { StoredSubtitleItem } from '@/interfaces/ISubtitleStorage';
import { retrieveSubtitlePreference } from '@/services/storage/SubtitleStorage';
import { isEqual } from 'lodash';

let unwatch: Function;

type SubtitleManagerState = {
  playlistId: number,
  mediaItemId: string,
  primarySubtitleId: string,
  secondarySubtitleId: string,
  isRefreshing: boolean,
}
const state = {
  playlistId: 0,
  mediaItemId: '',
  primarySubtitleId: '',
  secondarySubtitleId: '',
  isRefreshing: false,
};
const getters = {
  list(state: any): SubtitleControlListItem[] {
    return Object.keys(state)
      .filter(stateName => /-/.test(stateName))
      .map(stateName => {
        const value = store.state.SubtitleManager[stateName];
        return {
          id: value.moduleId,
          type: value.type,
          language: value.language,
        };
      }) || [];
  },
  primarySubtitleId(state: SubtitleManagerState): string { return state.primarySubtitleId },
  secondarySubtitleId(state: SubtitleManagerState): string { return state.secondarySubtitleId },
  isRefreshing(state: SubtitleManagerState): boolean { return state.isRefreshing },
};
const mutations = {
  [m.setPlaylistId](state: SubtitleManagerState, id: number) {
    state.playlistId = id;
  },
  [m.setMediaItemId](state: SubtitleManagerState, id: string) {
    state.mediaItemId = id;
  },
  [m.setPrimarySubtitleId](state: SubtitleManagerState, id: string) {
    state.primarySubtitleId = id;
  },
  [m.setSecondarySubtitleId](state: SubtitleManagerState, id: string) {
    state.secondarySubtitleId = id;
  },
  [m.setIsRefreshing](state: SubtitleManagerState, isRefreshing: boolean) {
    state.isRefreshing = isRefreshing;
  },
};
const actions = {
  async [a.initializeManager]({ getters, commit, dispatch }: any) {
    const { playListId, originSrc, mediaHash, list } = getters;
    list.forEach(({ id }: SubtitleControlListItem) => store.unregisterModule(['SubtitleManager', id]));
    commit(m.setPlaylistId, playListId);
    commit(m.setMediaItemId, `${mediaHash}-${originSrc}`);
    dispatch(a.refreshSubtitlesInitially);
  },
  async [a.refreshSubtitlesInitially]({ getters, dispatch }: any) {
    const { playlistId, mediaItemId, originSrc, primaryLanguage, secondaryLanguage } = getters;
    const preference = await retrieveSubtitlePreference(playlistId, mediaItemId);
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
      online = !isEqual(language, { primary: primaryLanguage, secondary: secondaryLanguage });

      const onlineStoredSubtitles = list.filter(({ type }) => type === Type.Online);
      if (online) databaseItemsToDelete.concat(onlineStoredSubtitles);
      else databaseItemsToAdd.concat(onlineStoredSubtitles);
    }
    const hints = generateHints(originSrc);
    await dispatch(a.deleteSubtitlesByHash, databaseItemsToDelete);
    dispatch(a.startAISelection);
    return Promise.all([
      dispatch(a.addLocalSubtitles, await searchForLocalList(originSrc)),
      dispatch(a.addEmbeddedSubtitles, embedded ? await retrieveEmbeddedList(originSrc) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineList(originSrc, primaryLanguage, hints) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineList(originSrc, secondaryLanguage, hints) : []),
      dispatch(a.addDatabaseSubtitles, databaseItemsToAdd),
    ]);
  },
  /** only refresh local and online subtitles, delete old online subtitles */
  async [a.refreshSubtitles]({ getters, dispatch }: any) {
    const { list } = getters as { list: SubtitleControlListItem[] };
    const { originSrc, primaryLanguage, secondaryLanguage } = getters;
    const [primary, secondary] = list.reduce((subtitleList, currentSubtitle) => {
      if (!subtitleList[0][0]) {
        subtitleList[0].push(currentSubtitle);
      } else if (subtitleList[0][0].language === currentSubtitle.language) {
        subtitleList[0].push(currentSubtitle);
      } else {
        subtitleList[1].push(currentSubtitle);
      }
      return subtitleList;
    }, [[], []] as [SubtitleControlListItem[], SubtitleControlListItem[]]);

    const hints = generateHints(originSrc);
    const primaryDeletePromise = () => dispatch(a.deleteSubtitlesByUuid, primary);
    const secondaryDeletePromise = () => dispatch(a.deleteSubtitlesByUuid, secondary);
    dispatch(a.startAISelection);
    return Promise.all([
      dispatch(a.addLocalSubtitles, await searchForLocalList(originSrc)),
      dispatch(a.addOnlineSubtitles, await fetchOnlineList(originSrc, primaryLanguage, hints)).then(primaryDeletePromise),
      dispatch(a.addOnlineSubtitles, await fetchOnlineList(originSrc, secondaryLanguage, hints)).then(secondaryDeletePromise),
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
      store.registerModule(['SubtitleManager', id], { ...subtitle, name: `${id}` });
      dispatch(`${id}/${subActions.initialize}`, id);
      dispatch(`${id}/${subActions.add}`, transcript);
    });
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
  async [a.changeSecondarySubtitle]({ dispatch, commit }: any, id: string) {
    commit(m.setSecondarySubtitleId, id);
    await dispatch(`${id}/${subActions.load}`);
  },
  async [a.storeSubtitle](context: any, id: string) { },
  async [a.uploadSubtitle](context: any, id: string) { },
  async [a.startAISelection]({ dispatch }: any) {
    unwatch = store.watch((state: any, getters: any) => getters.list, (value: SubtitleControlListItem[], oldValue: SubtitleControlListItem[]) => {
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
