import uuidv4 from 'uuid/v4';
import store from '@/store';
import { SubtitleManager as m } from '@/store/mutationTypes';
import { SubtitleManager as a, newSubtitle as subActions } from '@/store/actionTypes';
import { SubtitleControlListItem, Type, EntityGenerator, Entity } from '@/interfaces/ISubtitle';
import { ISubtitleStream, TranscriptInfo, searchForLocalList, retrieveEmbeddedList, fetchOnlineList, OnlineGenerator, LocalGenerator, EmbeddedGenerator } from '@/services/subtitle';
import { generateHints, calculatedName } from '@/libs/utils';
import { log } from '@/libs/Log';
import SubtitleModule from './Subtitle';
import { StoredSubtitleItem, SelectedSubtitle } from '@/interfaces/ISubtitleStorage';
import { retrieveSubtitlePreference, DatabaseGenerator, storeSubtitleLanguage, addSubtitleItemsToList, removeSubtitleItemsFromList, storeSelectedSubtitles } from '@/services/storage/SubtitleStorage';
import { isEqual, get, sortBy, remove } from 'lodash';
import Vue from 'vue';
import { extname } from 'path';
import { addBubble } from '../../../shared/notificationControl';
import { ONLINE_LOADING, REQUEST_TIMEOUT, SUBTITLE_UPLOAD, UPLOAD_SUCCESS, UPLOAD_FAILED, LOCAL_SUBTITLE_REMOVED } from '../../../shared/notificationcodes';
import { LanguageCode } from '@/libs/language';
import { existsSync } from 'fs';

const sortOfTypes = {
  local: 0,
  embedded: 1,
  online: 2,
};

let unwatch: Function;

type SubtitleManagerState = {
  playlistId: number,
  mediaItemId: string,
  primarySubtitleId: string,
  secondarySubtitleId: string,
  isRefreshing: boolean,
  allSubtitles: { [id: string]: SubtitleControlListItem },
  globalDelay: number,
}
const state = {
  playlistId: 0,
  mediaItemId: '',
  primarySubtitleId: '',
  secondarySubtitleId: '',
  isRefreshing: false,
  allSubtitles: {},
  globalDelay: 0,
};
const getters = {
  list(state: SubtitleManagerState) {
    const list = Object.values(state.allSubtitles).filter((v: any) => !!v);
    return sortBy(list, (sub: SubtitleControlListItem) => {
      if (sub.type === Type.Online && sub.language !== store.getters.primaryLanguage) {
        return sortOfTypes[sub.type] + 1;
      }
      return sortOfTypes[sub.type];
    }).map((sub: SubtitleControlListItem) => ({
      ...sub,
      name: calculatedName(sub, list),
    }));
  },
  primarySubtitleId(state: SubtitleManagerState): string { return state.primarySubtitleId },
  secondarySubtitleId(state: SubtitleManagerState): string { return state.secondarySubtitleId },
  isRefreshing(state: SubtitleManagerState): boolean { return state.isRefreshing },
  ableToPushCurrentSubtitle(state: SubtitleManagerState): boolean {
    let enable = false;
    // TODO
    if (state.primarySubtitleId) {
      enable = true;
    }
    return enable;
  },
  globalDelay(state: SubtitleManagerState) { return state.globalDelay; },
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
    const { primarySubtitleId, secondarySubtitleId } = state;
    if (primarySubtitleId && !state.allSubtitles[primarySubtitleId]) state.primarySubtitleId = '';
    if (secondarySubtitleId && !state.allSubtitles[secondarySubtitleId]) state.secondarySubtitleId = '';
  },
  [m.deleteSubtitleId](state: SubtitleManagerState, id: string) {
    Vue.set(state.allSubtitles, id, undefined);
  },
  [m.setGlobalDelay](state: SubtitleManagerState, delay: number) {
    if (delay === 0) {
      state.globalDelay = delay;
    } else if (Math.abs((state.globalDelay / 1000) + delay) <= 10000) {
      state.globalDelay += delay * 1000;
    }
  },
};
type AddDatabaseSubtitlesOptions = {
  storedList: StoredSubtitleItem[];
  selected?: {
    primary?: SelectedSubtitle;
    secondary?: SelectedSubtitle;
  };
};
function privacyConfirm() {
  const { $bus } = Vue.prototype;
  $bus.$emit('privacy-confirm');
  return new Promise((resolve) => {
    $bus.$once('subtitle-refresh-continue', resolve);
  })
}
let onlineTimeoutId: any;
let onlineTimeout = false;

let primarySelectionComplete = false;
let secondarySelectionComplete = false;
function fetchOnlineListWithBubble(
  videoSrc: string,
  languageCode: LanguageCode,
  hints?: string,
): Promise<TranscriptInfo[]> {
  let results: TranscriptInfo[] = [];
  onlineTimeout = false;
  return new Promise(async (resolve) => {
    onlineTimeoutId = setTimeout(() => {
      onlineTimeout = true;
      resolve(results);
    }, 10000);
    try {
      results = await fetchOnlineList(videoSrc, languageCode, hints);
      clearTimeout(onlineTimeoutId);
    } catch (err) {
      results = [];
    } finally {
      resolve(results);
    }
  });
}
const actions = {
  async [a.initializeManager]({ getters, commit, dispatch }: any) {
    const { playListId, originSrc, mediaHash } = getters;
    getters.list.forEach((s: SubtitleControlListItem) => dispatch(a.removeSubtitle, s.id));
    commit(m.setPlaylistId, playListId);
    commit(m.setMediaItemId, `${mediaHash}-${originSrc}`);
    commit(m.setPrimarySubtitleId, '');
    commit(m.setSecondarySubtitleId, '');
    primarySelectionComplete = false;;
    secondarySelectionComplete = false;
    commit(m.setGlobalDelay, 0);
    dispatch(a.refreshSubtitlesInitially);
  },
  async [a.refreshSubtitlesInitially]({ state, getters, dispatch, commit }: any) {
    onlineTimeout = false;
    const { playlistId, mediaItemId } = state;
    const { originSrc, primaryLanguage, secondaryLanguage } = getters;
    const preference = await retrieveSubtitlePreference(playlistId, mediaItemId);
    const databaseItemsToAdd: StoredSubtitleItem[] = [];
    const databaseItemsToDelete: StoredSubtitleItem[] = [];
    /** whether or not to fetch new online list */
    let online = true;
    /** do not serach online subtitles if extension is not one of mkv, ts, avi and mp4 */
    online = ['mkv', 'avi', 'ts', 'mp4'].includes(extname(originSrc).slice(1));
    if (online && !getters.privacyAgreement) online = !!(await privacyConfirm());
    /** whether or not to extract new embedded list */
    let embedded = true;
    let selected: any;
    if (preference) {
      const { language, list } = preference;
      selected = preference.selected;

      const embeddedStoredSubtitles = list.filter(({ type }) => type === Type.Embedded);;
      databaseItemsToAdd.push(...list.filter(({ type }) => type === Type.Local));
      databaseItemsToAdd.push(...embeddedStoredSubtitles);
      embedded = !embeddedStoredSubtitles.length;
      if (online) online = !isEqual(language, { primary: primaryLanguage, secondary: secondaryLanguage });

      const onlineStoredSubtitles = list.filter(({ type }) => type === Type.Online);
      if (online) databaseItemsToDelete.push(...onlineStoredSubtitles);
      else databaseItemsToAdd.push(...onlineStoredSubtitles);
    }

    if (online) commit(m.setIsRefreshing, true);
    const hints = generateHints(originSrc);
    await dispatch(a.deleteSubtitlesByUuid, databaseItemsToDelete);
    const actions = [
      dispatch(a.addLocalSubtitles, await searchForLocalList(originSrc)),
      dispatch(a.addEmbeddedSubtitles, embedded ? await retrieveEmbeddedList(originSrc) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineListWithBubble(originSrc, secondaryLanguage, hints) : []),
      dispatch(a.addOnlineSubtitles, online ? await fetchOnlineListWithBubble(originSrc, primaryLanguage, hints) : []),
    ];
    dispatch(a.startAISelection);
    return Promise.all(actions)
      .then(async () => {
        if (!primarySelectionComplete || !secondarySelectionComplete) dispatch(a.stopAISelection);
        if (onlineTimeout) addBubble(REQUEST_TIMEOUT, store.$i18n);
        await dispatch(a.addDatabaseSubtitles, { storedList: databaseItemsToAdd, selected })
        storeSubtitleLanguage([primaryLanguage, secondaryLanguage], playlistId, mediaItemId);
        addSubtitleItemsToList(getters.list, playlistId, mediaItemId);
        commit(m.setIsRefreshing, false);
        dispatch(a.checkLocalSubtitles);
      });
  },
  /** only refresh local and online subtitles, delete old online subtitles */
  async [a.refreshSubtitles]({ state, getters, dispatch, commit }: any) {
    primarySelectionComplete = false;;
    secondarySelectionComplete = false;
    commit(m.setIsRefreshing, true);
    addBubble(ONLINE_LOADING, store.$i18n);
    const { list } = getters as { list: SubtitleControlListItem[] };
    const { originSrc, primaryLanguage, secondaryLanguage } = getters;
    /** do not serach online subtitles if extension is not one of mkv, ts, avi and mp4 */
    let online = ['mkv', 'avi', 'ts', 'mp4'].includes(extname(originSrc).slice(1));
    if (online && !getters.privacyAgreement) online = !!(await privacyConfirm());
    const [primary, secondary] = list
      .filter(({ type }) => type === Type.Online)
      .reduce((subtitleList, currentSubtitle) => {
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
    dispatch(a.startAISelection);
    const actions = [dispatch(a.addLocalSubtitles, await searchForLocalList(originSrc))];
    if (online) {
      try {
        const [ primaryResults, secondaryResults ] = await Promise.all([
          fetchOnlineListWithBubble(originSrc, primaryLanguage, hints),
          fetchOnlineListWithBubble(originSrc, secondaryLanguage, hints),
        ]);
        dispatch(a.deleteSubtitlesByUuid, primary)
        dispatch(a.deleteSubtitlesByUuid, secondary)
        actions.push(dispatch(a.addOnlineSubtitles, primaryResults));
        actions.push(dispatch(a.addOnlineSubtitles, secondaryResults));
      } catch (error) {
      }
    }
    return Promise.all(actions)
      .then(() => {
        if (!primarySelectionComplete || !secondarySelectionComplete) dispatch(a.stopAISelection);
        if (onlineTimeout) addBubble(REQUEST_TIMEOUT, store.$i18n);
        const { playlistId, mediaItemId } = state;
        storeSubtitleLanguage([primaryLanguage, secondaryLanguage], playlistId, mediaItemId);
        addSubtitleItemsToList(getters.list, playlistId, mediaItemId);
        commit(m.setIsRefreshing, false);
        dispatch(a.checkLocalSubtitles);
      });
  },
  async [a.checkLocalSubtitles]({ dispatch, getters }: any) {
    const localInvalidSubtitles = getters.list.filter(({ type, source }: any) => type === Type.Local && !existsSync(source));
    if (localInvalidSubtitles.length) return dispatch(a.deleteSubtitlesByUuid, localInvalidSubtitles).then(() => addBubble(LOCAL_SUBTITLE_REMOVED, store.$i18n));
  },
  async [a.addLocalSubtitles]({ dispatch }: any, paths: string[]) {
    return Promise.all(
      paths.map(path => dispatch(a.addSubtitle, new LocalGenerator(path)))
    );
  },
  async [a.addLocalSubtitlesWithSelect]({ state, dispatch, getters }: any, paths: string[]) {
    let selectedHash = paths[0];
    const { playlistId, mediaItemId } = state;
    return Promise.all(
      paths.map(async (path: string, i: number) => {
        const g = new LocalGenerator(path);
        if (i === 0) {
          selectedHash = await g.getHash();
        }
        return dispatch(a.addSubtitle, g);
      })
    ).then((localEntities: SubtitleControlListItem[]) => {
      addSubtitleItemsToList(localEntities, playlistId, mediaItemId);
      const sub: SubtitleControlListItem = getters.list.find((sub: SubtitleControlListItem) => sub.hash === selectedHash);
      if (sub && getters.isFirstSubtitle) {
        dispatch(a.changePrimarySubtitle, sub.id);
      } else if (sub && !getters.isFirstSubtitle) {
        dispatch(a.changeSecondarySubtitle, sub.id);
      }
    });
  },
  async [a.addEmbeddedSubtitles]({ dispatch }: any, streams: [string, ISubtitleStream][]) {
    return Promise.all(
      streams.map(stream => dispatch(a.addSubtitle, new EmbeddedGenerator(stream[0], stream[1])))
    );
  },
  async [a.addOnlineSubtitles]({ dispatch }: any, transcriptInfoList: TranscriptInfo[]) {
    return Promise.all(
      transcriptInfoList.map(info => dispatch(a.addSubtitle, new OnlineGenerator(info)))
    );
  },
  async [a.addDatabaseSubtitles]({ getters, dispatch }: any, options: AddDatabaseSubtitlesOptions) {
    return Promise.all(
      options.storedList.map(async stored => dispatch(a.addSubtitle, await DatabaseGenerator.from(stored)))
    )
      .then(() => {
        const { list } = getters;
        let primary: SelectedSubtitle, secondary: SelectedSubtitle;
        if (primary = get(options, 'selected.primary')) {
          let subtitles = list.filter((sub: SubtitleControlListItem) => sub.hash === primary.hash) as SubtitleControlListItem[];
          if (subtitles.length > 1) subtitles = subtitles.filter(sub => isEqual(sub.source, primary.source));
          if (subtitles.length) dispatch(a.changePrimarySubtitle, subtitles[0].id);
        }
        if (secondary = get(options, 'selected.secondary')) {
          let subtitles = list.filter((sub: SubtitleControlListItem) => sub.hash === secondary.hash) as SubtitleControlListItem[];
          if (subtitles.length > 1) subtitles = subtitles.filter(sub => isEqual(sub.source, secondary.source));
          if (subtitles.length) dispatch(a.changeSecondarySubtitle, subtitles[0].id);
        }
      });
  },
  async [a.addSubtitle]({ commit, dispatch, getters }: any, subtitleGenerator: EntityGenerator) {
    const hash = await subtitleGenerator.getHash();
    const type = await subtitleGenerator.getType();
    const existedHash = getters.list.find((subtitle: SubtitleControlListItem) => subtitle.hash === hash && subtitle.type === type);
    const source = await subtitleGenerator.getSource();
    const existedOrigin = getters.list.find((subtitle: SubtitleControlListItem) => isEqual(subtitle.source, source.source));
    if (!existedHash || !existedOrigin) {
      const id = uuidv4();
      store.registerModule([id], { ...SubtitleModule, name: `${id}` });
      dispatch(`${id}/${subActions.initialize}`, id);
      const subtitle: Entity = await dispatch(`${id}/${subActions.add}`, subtitleGenerator);
      await dispatch(`${id}/${subActions.store}`);
      let subtitleControlListItem: SubtitleControlListItem = {
        id,
        hash: subtitle.hash,
        type: subtitle.type,
        language: subtitle.language,
        source: subtitle.source.source,
      };
      commit(m.addSubtitleId, subtitleControlListItem);
      return subtitleControlListItem;
    }
  },
  [a.removeSubtitle]({ commit, getters, state }: any, id: string) {
    store.unregisterModule(id);
    commit(m.deleteSubtitleId, id);
    if (getters.isFirstSubtitle && getters.primarySubtitleId === id) {
      commit(m.setPrimarySubtitleId, '');
    } else if (!getters.isFirstSubtitle && getters.secondarySubtitleId === id) {
      commit(m.setSecondarySubtitleId, '');
    }
  },
  async [a.deleteSubtitlesByUuid]({ state, dispatch }: any, storedSubtitleItems: SubtitleControlListItem[]) {
    storedSubtitleItems.map(({ id }) => {
      dispatch(`${id}/${subActions.delete}`);
      dispatch(a.removeSubtitle, id);
    });
    return removeSubtitleItemsFromList(storedSubtitleItems, state.playlistId, state.mediaItemId);
  },
  async [a.changePrimarySubtitle]({ dispatch, commit, getters }: any, id: string) {
    let primary = id;
    let secondary = getters.secondarySubtitleId;
    if (id === secondary) secondary = '';
    commit(m.setPrimarySubtitleId, primary);
    commit(m.setSecondarySubtitleId, secondary);
    dispatch(a.storeSelectedSubtitle, [primary, secondary]);
    if (id) await dispatch(`${id}/${subActions.load}`);
  },
  async [a.changeSecondarySubtitle]({ dispatch, commit, getters }: any, id: string) {
    let primary = getters.primarySubtitleId;
    let secondary = id;
    if (id === primary) primary = '';
    commit(m.setPrimarySubtitleId, primary);
    commit(m.setSecondarySubtitleId, secondary);
    dispatch(a.storeSelectedSubtitle, [primary, secondary]);
    if (id) await dispatch(`${id}/${subActions.load}`);
  },
  async [a.storeSelectedSubtitle]({ state }: any, ids: string[]) {
    const { allSubtitles, playlistId, mediaItemId } = state;
    const subtitles = ids.map(id => {
      if (allSubtitles[id]) {
        const { hash, source } = allSubtitles[id];
        return { hash, source };
      }
    });
    storeSelectedSubtitles(subtitles as SelectedSubtitle[], playlistId, mediaItemId);
  },
  async [a.storeSubtitle](context: any, id: string) { },
  async [a.uploadSubtitle](context: any, id: string) { },
  async [a.startAISelection]({ getters, dispatch }: any) {
    unwatch = store.watch(
      (state: any, getters: any) => getters.list.map(({ id, type, source, language }: any) => ({ id, type, source, language })),
      (value: SubtitleControlListItem[], oldValue: SubtitleControlListItem[]) => {
        console.log(value);
        const { primaryLanguage, secondaryLanguage } = getters;
        if (!primarySelectionComplete || !secondarySelectionComplete) {
          const hasPrimaryLanguage = value
            .find(({ language }) => language === primaryLanguage);
          const hasSecondaryLanguage = value
            .find(({ language }) => language === secondaryLanguage);
          if (hasPrimaryLanguage) {
            dispatch(a.changePrimarySubtitle, hasPrimaryLanguage.id);
            primarySelectionComplete = true;
            if (hasSecondaryLanguage) {
              dispatch(a.changeSecondarySubtitle, hasSecondaryLanguage.id);
              secondarySelectionComplete = true;
            }
          } else if (hasSecondaryLanguage) {
            if (primarySelectionComplete) {
              dispatch(a.changeSecondarySubtitle, hasSecondaryLanguage.id);
              secondarySelectionComplete = true;
            } else {
              dispatch(a.changePrimarySubtitle, hasSecondaryLanguage.id);
              dispatch(a.changeSecondarySubtitle, '');
              primarySelectionComplete = true;
              secondarySelectionComplete = true;
            }
          } else {
            dispatch(a.changePrimarySubtitle, '');
            dispatch(a.changeSecondarySubtitle, '');
          }
          if (primarySelectionComplete && secondarySelectionComplete) dispatch(a.stopAISelection);
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

    if (getters.enabledSecondarySub && getters.secondarySubtitleId) {
      try {
        const dialogues = await dispatch(`${getters.secondarySubtitleId}/${subActions.getDialogues}`, time);
        secondSub.cues = dialogues;
      } catch (error) {
        log.error('SubtitleManager', error);
      }
    }
    return [firstSub, secondSub];
  },
  async [a.updatePlayedTime]({ state, dispatch, getters }: any, times: { start: number, end: number }) {
    const actions: Promise<any>[] = [];
    const { primarySubtitleId, secondarySubtitleId } = state;
    if (primarySubtitleId) actions.push(
      dispatch(`${primarySubtitleId}/${subActions.updatePlayedTime}`, times)
        .then((playedTime: number) => {
          if (playedTime >= getters.duration * 0.6) {
            addBubble(SUBTITLE_UPLOAD, store.$i18n);
            dispatch(`${primarySubtitleId}/${subActions.upload}`).then((result: boolean) => addBubble(result ? UPLOAD_SUCCESS : UPLOAD_FAILED, store.$i18n));
          }
        })
    );
    if (secondarySubtitleId) actions.push(
      dispatch(`${secondarySubtitleId}/${subActions.updatePlayedTime}`, times)
        .then((playedTime: number) => {
          if (playedTime >= getters.duration * 0.6) {
            addBubble(SUBTITLE_UPLOAD, store.$i18n);
            dispatch(`${secondarySubtitleId}/${subActions.upload}`).then((result: boolean) => addBubble(result ? UPLOAD_SUCCESS : UPLOAD_FAILED, store.$i18n));
          }
        })
    );
    return Promise.all(actions);
  },
  async [a.manualUploadAllSubtitles]({ state, dispatch }: any) {
    if (navigator.onLine) {
      addBubble(SUBTITLE_UPLOAD, store.$i18n);
      const actions: Promise<any>[] = [];
      const { primarySubtitleId, secondarySubtitleId } = state;
      if (primarySubtitleId) actions.push(dispatch(`${primarySubtitleId}/${subActions.manualUpload}`));
      if (secondarySubtitleId) actions.push(dispatch(`${secondarySubtitleId}/${subActions.manualUpload}`));
      return Promise.all(actions)
        .then((result: boolean[]) => {
          addBubble(result.every(res => res) ? UPLOAD_SUCCESS : UPLOAD_FAILED, store.$i18n);
        });
    } else {
      addBubble(UPLOAD_FAILED, store.$i18n);
    }
  },
  [a.setGlobalDelay]({ commit }: any, delta: any) {
    commit(m.setGlobalDelay, delta);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
