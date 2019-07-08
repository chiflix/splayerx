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
import { isEqual, get, sortBy, differenceWith, flatten, remove, debounce } from 'lodash';
import Vue from 'vue';
import { extname } from 'path';
import { addBubble } from '../../helpers/notificationControl';
import { ONLINE_LOADING, REQUEST_TIMEOUT, SUBTITLE_UPLOAD, UPLOAD_SUCCESS, UPLOAD_FAILED, LOCAL_SUBTITLE_REMOVED } from '../../helpers/notificationcodes';
import { LanguageCode } from '@/libs/language';
import { existsSync } from 'fs';
import { TranslatedGenerator } from '@/services/subtitle/loaders/translated';

const sortOfTypes = {
  local: 0,
  embedded: 1,
  online: 2,
  translated: 2,
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
    if (state.primarySubtitleId || state.secondarySubtitleId) {
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
  playlistId: number;
  mediaItemId: string;
};
type AddSubtitleOptions = {
  generator: EntityGenerator;
  playlistId: number;
  mediaItemId: string;
};
function privacyConfirm() {
  const { $bus } = Vue.prototype;
  $bus.$emit('privacy-confirm');
  return new Promise((resolve) => {
    $bus.$once('subtitle-refresh-continue', resolve);
  })
}

let primarySelectionComplete = false;
let secondarySelectionComplete = false;
function fetchOnlineListWithErrorHandling(
  videoSrc: string,
  languageCode: LanguageCode,
  hints?: string,
): Promise<TranscriptInfo[]> {
  let results: TranscriptInfo[] = [];
  return new Promise(async (resolve) => {
    const onlineTimeoutId = setTimeout(() => {
      resolve(results);
      addBubble(REQUEST_TIMEOUT, { id: `fetchOnlineListWithBubble-${videoSrc}` });
    }, 10000);
    try {
      results = await fetchOnlineList(videoSrc, languageCode, hints);
    } catch (err) {
      results = [];
    } finally {
      resolve(results);
      clearTimeout(onlineTimeoutId);
    }
  });
}
function initializeManager({ getters, commit, dispatch }: any) {
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
}
const debouncedInitializeManager = debounce(initializeManager, 1000);
const actions = {
  async [a.initializeManager](context: any) {
    debouncedInitializeManager(context);
  },
  async [a.refreshSubtitlesInitially]({ state, getters, dispatch, commit }: any) {
    primarySelectionComplete = false;
    secondarySelectionComplete = false;
    commit(m.setIsRefreshing, true);
    dispatch(a.startAISelection);
    const { playlistId, mediaItemId } = state;
    const preference = await retrieveSubtitlePreference(playlistId, mediaItemId);
    const { primaryLanguage, secondaryLanguage } = getters;
    const needRefreshing = (
      !preference ||
      !preference.list.length ||
      !!differenceWith(
        Object.values(preference.language),
        [primaryLanguage, secondaryLanguage],
      ).length
    );
    // add ai button
    dispatch(a.addSubtitle, { generator: new TranslatedGenerator(primaryLanguage, 0), playlistId, mediaItemId });   
    if (preference && !needRefreshing) {
      try {
        await Promise.race([
          dispatch(a.addDatabaseSubtitles, {
            storedList: preference.list,
            selected: preference.selected,
            playlistId, mediaItemId,
          }),
          new Promise((resolve, reject) => setTimeout(() => reject('timeout'), 10000)),
        ]);
      } catch(error) {
        console.error(error);
      } finally {
        commit(m.setIsRefreshing, false);
        dispatch(a.stopAISelection);
      }
    } else if (!preference && needRefreshing) {
      return dispatch(a.refreshSubtitles, { playlistId, mediaItemId });
    } else if (preference && needRefreshing) {
      return dispatch(a.addDatabaseSubtitles, {
        storedList: preference.list,
        selected: preference.selected,
        playlistId, mediaItemId,
      })
      .then(() => dispatch(a.refreshSubtitles, { playlistId, mediaItemId }));
    }
  },
  async [a.refreshSubtitles](
    { state, getters, dispatch, commit }: any,
    args: { playlistId: number, mediaItemId: string },
  ) {
    const { playlistId, mediaItemId } = args || state;

    primarySelectionComplete = false;
    secondarySelectionComplete = false;
    commit(m.setIsRefreshing, true);
    dispatch(a.startAISelection);
    const { list } = getters as { list: SubtitleControlListItem[] };
    const { originSrc, primaryLanguage, secondaryLanguage } = getters;
    let onlinePromise = new Promise((resolve) => resolve());
    /** do not serach online subtitles if extension is not one of mkv, ts, avi and mp4 */
    let online = ['mkv', 'avi', 'ts', 'mp4'].includes(extname(originSrc).slice(1));
    if (online && !getters.privacyAgreement) online = !!(await privacyConfirm());
    if (online) {
      addBubble(ONLINE_LOADING);
      const hints = generateHints(originSrc);
      onlinePromise = Promise.all([
        fetchOnlineListWithErrorHandling(originSrc, primaryLanguage, hints),
        fetchOnlineListWithErrorHandling(originSrc, secondaryLanguage, hints),
      ]).then((resultsList) => {
        const results = flatten(resultsList);
        const newSubtitlesToAdd: TranscriptInfo[] = [];
        const oldSubtitlesToDel: SubtitleControlListItem[] = [];
        const oldSubtitles = [...(getters as { list: SubtitleControlListItem[] }).list];
        oldSubtitlesToDel.push(...remove(oldSubtitles, ({ type, language }) => type === Type.Online && language !== primaryLanguage && language !== secondaryLanguage));
        oldSubtitlesToDel.push(...remove(oldSubtitles, ({ type, hash }) => type === Type.Online && !results.find(({ transcriptIdentity }) => transcriptIdentity === hash)));
        newSubtitlesToAdd.push(...results.filter(({ transcriptIdentity }) => !oldSubtitles.find(({ id }) => id === transcriptIdentity)));
        return { delete: oldSubtitlesToDel, add: newSubtitlesToAdd };
      }).then((result) => dispatch(a.addOnlineSubtitles, { transcriptInfoList: result.add, playlistId, mediaItemId })
        .then(() => dispatch(a.deleteSubtitlesByUuid, result.delete)));
    }
    /** whether to search embedded subtitles */
    const embedded = list.some(({ type }) => type === Type.Embedded);
    if (embedded) retrieveEmbeddedList(originSrc).then((streams) => dispatch(a.addEmbeddedSubtitles, { streams, playlistId, mediaItemId }));
    try {
      await Promise.race([
        onlinePromise,
        dispatch(a.addLocalSubtitles, { paths: await searchForLocalList(originSrc), playlistId, mediaItemId }),
        new Promise((resolve) => setTimeout(() => resolve(new Error('timeout')), 10000)),
      ]);
      dispatch(a.stopAISelection);
      storeSubtitleLanguage([primaryLanguage, secondaryLanguage], playlistId, mediaItemId);
      addSubtitleItemsToList(getters.list, playlistId, mediaItemId);
      dispatch(a.checkLocalSubtitles);
    } catch(ex) {
      console.error(ex);
    } finally {
      commit(m.setIsRefreshing, false);
    }
  },
  [a.checkLocalSubtitles]({ dispatch, getters }: any) {
    const localInvalidSubtitles = getters.list.filter(({ type, source }: any) => type === Type.Local && !existsSync(source));
    if (localInvalidSubtitles.length) return dispatch(a.deleteSubtitlesByUuid, localInvalidSubtitles).then(() => addBubble(LOCAL_SUBTITLE_REMOVED));
  },
  async [a.addLocalSubtitles]({ dispatch }: any, { paths, playlistId, mediaItemId }: any) {
    return Promise.all(
      paths.map((path: string) => dispatch(a.addSubtitle, { generator: new LocalGenerator(path), playlistId, mediaItemId }))
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
  async [a.addEmbeddedSubtitles]({ dispatch }: any, { streams, playlistId, mediaItemId }: any) {
    return Promise.all(
      streams.map((stream: [string, ISubtitleStream]) => dispatch(a.addSubtitle, { generator: new EmbeddedGenerator(stream[0], stream[1]), playlistId, mediaItemId }))
    );
  },
  async [a.addOnlineSubtitles]({ dispatch }: any, { transcriptInfoList, playlistId, mediaItemId }: any) {
    return Promise.all(
      transcriptInfoList.map((info: TranscriptInfo) => dispatch(a.addSubtitle, { generator: new OnlineGenerator(info), playlistId, mediaItemId }))
    );
  },
  async [a.addDatabaseSubtitles]({ getters, dispatch }: any, options: AddDatabaseSubtitlesOptions) {
    return Promise.all(
      options.storedList.map(async stored => dispatch(a.addSubtitle, {
        generator: await DatabaseGenerator.from(stored),
        playlistId: options.playlistId,
        mediaItemId: options.mediaItemId,
      }))
    )
      .then(() => {
        const { list } = getters;
        let primary: SelectedSubtitle, secondary: SelectedSubtitle;
        let primaryId: string = '', secondaryId: string = '';
        if (primary = get(options, 'selected.primary')) {
          let subtitles = list.filter((sub: SubtitleControlListItem) => sub.hash === primary.hash) as SubtitleControlListItem[];
          if (subtitles.length > 1) subtitles = subtitles.filter(sub => isEqual(sub.source, primary.source));
          if (subtitles.length) primaryId = subtitles[0].id;
        }
        if (secondary = get(options, 'selected.secondary')) {
          let subtitles = list.filter((sub: SubtitleControlListItem) => sub.hash === secondary.hash) as SubtitleControlListItem[];
          if (subtitles.length > 1) subtitles = subtitles.filter(sub => isEqual(sub.source, secondary.source));
          if (subtitles.length) secondaryId = subtitles[0].id;
        }
        return Promise.all([
          dispatch(a.changePrimarySubtitle, primaryId),
          dispatch(a.changeSecondarySubtitle, secondaryId),
        ]);
      });
  },
  async [a.addSubtitle]({ commit, dispatch, getters }: any, options: AddSubtitleOptions) {
    if (options.playlistId === state.playlistId && options.mediaItemId === state.mediaItemId) {
      const subtitleGenerator = options.generator;
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
        if (value.length) {
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
        }
      });
  },
  async [a.stopAISelection]() {
    if (typeof unwatch === 'function') unwatch();
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
    const bubbleId = `${Date.now()}-${Math.random()}`;
    if (primarySubtitleId) actions.push(
      dispatch(`${primarySubtitleId}/${subActions.updatePlayedTime}`, times)
        .then((playedTime: number) => {
          if (playedTime >= getters.duration * 0.6) {
            addBubble(SUBTITLE_UPLOAD, { id: `${SUBTITLE_UPLOAD}-${bubbleId}`});
            dispatch(`${primarySubtitleId}/${subActions.upload}`).then((result: boolean) => {
              const bubbleType = result ? UPLOAD_SUCCESS : UPLOAD_FAILED;
              addBubble(bubbleType, { id: `${bubbleType}-${bubbleId}` });
            });
          }
        })
    );
    if (secondarySubtitleId) actions.push(
      dispatch(`${secondarySubtitleId}/${subActions.updatePlayedTime}`, times)
        .then((playedTime: number) => {
          if (playedTime >= getters.duration * 0.6) {
            addBubble(SUBTITLE_UPLOAD, { id: `${SUBTITLE_UPLOAD}-${bubbleId}`});
            dispatch(`${secondarySubtitleId}/${subActions.upload}`).then((result: boolean) => {
              const bubbleType = result ? UPLOAD_SUCCESS : UPLOAD_FAILED;
              addBubble(bubbleType, { id: `${bubbleType}-${bubbleId}` });
            });
          }
        })
    );
    return Promise.all(actions);
  },
  async [a.manualUploadAllSubtitles]({ state, dispatch }: any) {
    if (navigator.onLine) {
      addBubble(SUBTITLE_UPLOAD);
      const actions: Promise<any>[] = [];
      const { primarySubtitleId, secondarySubtitleId } = state;
      if (primarySubtitleId) actions.push(dispatch(`${primarySubtitleId}/${subActions.manualUpload}`));
      if (secondarySubtitleId) actions.push(dispatch(`${secondarySubtitleId}/${subActions.manualUpload}`));
      return Promise.all(actions)
        .then((result: boolean[]) => {
          addBubble(result.every(res => res) ? UPLOAD_SUCCESS : UPLOAD_FAILED);
        });
    } else {
      addBubble(UPLOAD_FAILED);
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
