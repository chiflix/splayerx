import uuidv4 from 'uuid/v4';
import store from '@/store';
import { SubtitleManager as m } from '@/store/mutationTypes';
import { SubtitleManager as a, newSubtitle as subActions } from '@/store/actionTypes';
import { SubtitleControlListItem, Type, EntityGenerator, Entity } from '@/interfaces/ISubtitle';
import { ISubtitleStream, TranscriptInfo, searchForLocalList, retrieveEmbeddedList, fetchOnlineList, OnlineGenerator, LocalGenerator, EmbeddedGenerator } from '@/services/subtitle';
import { generateHints, calculatedName } from '@/libs/utils';
import { log } from '@/libs/Log';
import SubtitleModule from './Subtitle';
import { StoredSubtitleItem } from '@/interfaces/ISubtitleStorage';
import { retrieveSubtitlePreference, DatabaseGenerator } from '@/services/storage/SubtitleStorage';
import { isEqual } from 'lodash';
import Vue from 'vue';

let unwatch: Function;

type SubtitleManagerState = {
  playlistId: number,
  mediaItemId: string,
  primarySubtitleId: string,
  secondarySubtitleId: string,
  isRefreshing: boolean,
  allSubtitles: { [id: string]: SubtitleControlListItem },
}
const state = {
  playlistId: 0,
  mediaItemId: '',
  primarySubtitleId: '',
  secondarySubtitleId: '',
  isRefreshing: false,
  allSubtitles: {},
};
const getters = {
  list(state: SubtitleManagerState) {
    return Object.values(state.allSubtitles).filter((v: any) => !!v);
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
  [m.addSubtitleId](state: SubtitleManagerState, controlItem: SubtitleControlListItem) {
    const { id } = controlItem;
    Vue.set(state.allSubtitles, id, controlItem);
  },
  [m.deleteSubtitleId](state: SubtitleManagerState, id: string) {
    Vue.set(state.allSubtitles, id, undefined);
  },
};
const actions = {
  async [a.initializeManager]({ getters, commit, dispatch }: any) {
    const { playListId, originSrc, mediaHash } = getters;
    getters.list.forEach((s: SubtitleControlListItem) => dispatch(a.removeSubtitle, s.id));
    commit(m.setPlaylistId, playListId);
    commit(m.setMediaItemId, `${mediaHash}-${originSrc}`);
    commit(m.setPrimarySubtitleId, '');
    commit(m.setSecondarySubtitleId, '');
    commit(m.setIsRefreshing, true);
    dispatch(a.refreshSubtitlesInitially);
  },
  async [a.refreshSubtitlesInitially]({ getters, dispatch, commit }: any) {
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
    let dispatchs = [
      dispatch(a.addLocalSubtitles, await searchForLocalList(originSrc)),
      dispatch(a.addEmbeddedSubtitles, embedded ? await retrieveEmbeddedList(originSrc) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineList(originSrc, primaryLanguage, hints) : []),
    ];
    if (secondaryLanguage) {
      dispatchs.push(dispatch(a.addOnlineSubtitles, online ? await fetchOnlineList(originSrc, secondaryLanguage, hints) : []));
    }
    dispatchs.push(dispatch(a.addDatabaseSubtitles, databaseItemsToAdd))
    return Promise.all(dispatchs)
      .then(() => {
        commit(m.setIsRefreshing, false);
      });
  },
  /** only refresh local and online subtitles, delete old online subtitles */
  async [a.refreshSubtitles]({ getters, dispatch, commit }: any) {
    commit(m.setIsRefreshing, true);
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
    ])
      .then(() => {
        commit(m.setIsRefreshing, false);
      });
  },
  async [a.addLocalSubtitles]({ dispatch }: any, paths: string[]) {
    return Promise.all(
      paths.map(path => dispatch(a.addSubtitle, new LocalGenerator(path)))
    );
  },
  async [a.addEmbeddedSubtitles]({ dispatch }: any, streams: [string, ISubtitleStream][]) {
    return Promise.all(
      streams.map(stream => dispatch(a.addSubtitle, new EmbeddedGenerator(stream[0], stream[1])))
    );
  },
  async [a.addOnlineSubtitles]({ dispatch }: any, transcriptInfoList: TranscriptInfo[]) {
    // remove all type online item from list
    return Promise.all(
      transcriptInfoList.map(transcriptInfo => dispatch(a.addSubtitle, new OnlineGenerator(transcriptInfo)))
    );
  },
  async [a.addDatabaseSubtitles]({ dispatch }: any, storedList: StoredSubtitleItem[]) {
    return Promise.all(
      storedList.map(stored => dispatch(a.addSubtitle, DatabaseGenerator.from(stored)))
    );
  },
  async [a.addSubtitle]({ commit, dispatch, getters }: any, subtitleGenerator: EntityGenerator) {
    const id = uuidv4();
    store.registerModule([id], { ...SubtitleModule, name: `${id}` });
    dispatch(`${id}/${subActions.initialize}`, id);
    const subtitle: Entity = await dispatch(`${id}/${subActions.add}`, subtitleGenerator);
    await dispatch(`${id}/${subActions.store}`);
    let subtitleControlListItem: SubtitleControlListItem = {
      id,
      type: subtitle.type,
      language: subtitle.language,
      source: subtitle.source.source,
      name: '',
    };
    subtitleControlListItem.name = calculatedName(subtitleControlListItem, getters.list);
    commit(m.addSubtitleId, subtitleControlListItem);
    return subtitleControlListItem;
  },
  [a.removeSubtitle]({ commit }: any, id: string) {
    store.unregisterModule(id);
    commit(m.deleteSubtitleId, id);
  },
  async [a.deleteSubtitlesByHash](context: any, storedSubtitleItems: StoredSubtitleItem[]) { },
  async [a.deleteSubtitlesByUuid]({ dispatch }: any, storedSubtitleItems: SubtitleControlListItem[]) {
    return Promise.all(storedSubtitleItems.map(({ id }) => dispatch(`${id}/${subActions.delete}`)));
  },
  async [a.changePrimarySubtitle]({ dispatch, commit }: any, id: string) {
    commit(m.setPrimarySubtitleId, id);
    if (id) {
      await dispatch(`${id}/${subActions.load}`);
    }
  },
  async [a.changeSecondarySubtitle]({ dispatch, commit }: any, id: string) {
    commit(m.setSecondarySubtitleId, id); if (id) {
      await dispatch(`${id}/${subActions.load}`);
    }
  },
  async [a.storeSubtitle](context: any, id: string) { },
  async [a.uploadSubtitle](context: any, id: string) { },
  async [a.startAISelection]({ dispatch }: any) {
    unwatch = store.watch(
      (state: any, getters: any) => getters.list,
      (value: SubtitleControlListItem[], oldValue: SubtitleControlListItem[]) => {
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
