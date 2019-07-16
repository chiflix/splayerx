import uuidv4 from 'uuid/v4';
import store from '@/store';
import { SubtitleManager as m } from '@/store/mutationTypes';
import { SubtitleManager as a, newSubtitle as subActions, Subtitle as legacyActions } from '@/store/actionTypes';
import { SubtitleControlListItem, Type, EntityGenerator, Entity } from '@/interfaces/ISubtitle';
import { ISubtitleStream, TranscriptInfo, searchForLocalList, retrieveEmbeddedList, fetchOnlineList, OnlineGenerator, LocalGenerator, EmbeddedGenerator } from '@/services/subtitle';
import { generateHints, calculatedName } from '@/libs/utils';
import { log } from '@/libs/Log';
import SubtitleModule from './Subtitle';
import { StoredSubtitleItem, SelectedSubtitle } from '@/interfaces/ISubtitleStorage';
import { retrieveSubtitlePreference, DatabaseGenerator, storeSubtitleLanguage, addSubtitleItemsToList, removeSubtitleItemsFromList, storeSelectedSubtitles, updateSubtitleList } from '@/services/storage/subtitle';
import { isEqual, get, sortBy, differenceWith, flatten, remove, debounce } from 'lodash';
import Vue from 'vue';
import { extname } from 'path';
import { addBubble } from '../../helpers/notificationControl';
import { ONLINE_LOADING, REQUEST_TIMEOUT, SUBTITLE_UPLOAD, UPLOAD_SUCCESS, UPLOAD_FAILED, LOCAL_SUBTITLE_REMOVED } from '../../helpers/notificationcodes';
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
  primaryDelay: number,
  secondaryDelay: number,
}
const state = {
  playlistId: 0,
  mediaItemId: '',
  primarySubtitleId: '',
  secondarySubtitleId: '',
  isRefreshing: false,
  allSubtitles: {},
  primaryDelay: 0,
  secondaryDelay: 0,
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
  primaryDelay({ primaryDelay }: SubtitleManagerState) { return primaryDelay; },
  secondaryDelay({ secondaryDelay }: SubtitleManagerState) { return secondaryDelay; },
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
  [m.deletaAllSubtitleIds](state: SubtitleManagerState) { state.allSubtitles = {}; },
  [m.setPrimaryDelay](state: SubtitleManagerState, delayInSeconds: number) {
    state.primaryDelay = delayInSeconds;
    const subtitle = state.allSubtitles[state.primarySubtitleId];
    if (subtitle) subtitle.delay = delayInSeconds;
  },
  [m.setSecondaryDelay](state: SubtitleManagerState, delayInSeconds: number) {
    state.secondaryDelay = delayInSeconds;
    const subtitle = state.allSubtitles[state.secondarySubtitleId];
    if (subtitle) subtitle.delay = delayInSeconds;
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
function privacyConfirm(): Promise<boolean> {
  const { $bus } = Vue.prototype;
  $bus.$emit('privacy-confirm');
  return new Promise((resolve) => {
    $bus.$once('subtitle-refresh-continue', resolve);
  })
}

let primarySelectionComplete = false;
let secondarySelectionComplete = false;
let alterDelayTimeoutId: any = 0;
function setDelayTimeout() {
  clearTimeout(alterDelayTimeoutId);
  alterDelayTimeoutId = setTimeout(() => store.dispatch(a.storeSubtitleDelays), 10000);
}
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
  dispatch(a.refreshSubtitlesInitially);
}
const debouncedInitializeManager = debounce(initializeManager, 1000);
const actions = {
  async [a.initializeManager](context: any) {
    debouncedInitializeManager(context);
  },
  [a.resetManager]({ commit }: any) {
    commit(m.setPlaylistId, 0);
    commit(m.setMediaItemId, '');
    commit(m.setPrimarySubtitleId, '');
    commit(m.setSecondarySubtitleId, '');
    commit(m.setIsRefreshing, false);
    commit(m.deletaAllSubtitleIds);
    primarySelectionComplete = false;;
    secondarySelectionComplete = false;
  },
  async [a.refreshSubtitlesInitially]({ state, getters, dispatch, commit }: any) {
    primarySelectionComplete = false;
    secondarySelectionComplete = false;
    commit(m.setIsRefreshing, true);
    dispatch(a.startAISelection);

    const { playlistId, mediaItemId } = state;
    const {
      primaryLanguage, secondaryLanguage,
      originSrc,
      privacyAgreement,
    } = getters;
    const preference = await retrieveSubtitlePreference(playlistId, mediaItemId);
    const hasStoredSubtitles = !!preference && !!preference.list.length;
    const languageHasChanged = (
      !preference ||
      !!differenceWith(
        Object.values(preference.language),
        [primaryLanguage, secondaryLanguage],
      ).length
    );

    if (hasStoredSubtitles && !languageHasChanged && preference) {
      return Promise.race([
        dispatch(a.addDatabaseSubtitles, {
          storedList: preference.list,
          selected: preference.selected,
          playlistId, mediaItemId,
        }),
        new Promise((resolve, reject) => setTimeout(() => reject('timeout'), 10000)),
      ])
        .then(() => {
          commit(m.setIsRefreshing, false);
          dispatch(legacyActions.UPDATE_SUBTITLE_TYPE, true);
          dispatch(a.stopAISelection);
        })
        .catch(console.error);
    }

    if (hasStoredSubtitles && preference) await dispatch(a.addDatabaseSubtitles, {
      storedList: preference.list,
      selected: preference.selected,
      playlistId, mediaItemId,
    });

    let onlinePromise = Promise.resolve();
    /** whether or not to refresh online subtitles */
    let onlineNeeded = (languageHasChanged || !hasStoredSubtitles) && ['mkv', 'avi', 'ts', 'mp4'].includes(extname(originSrc).slice(1)) && privacyAgreement;
    if (onlineNeeded) onlinePromise = dispatch(a.refreshOnlineSubtitles);
    /** whether or not to refresh embedded subtitles */
    const embeddedNeeded = getters.list.some(({ type }: SubtitleControlListItem) => type === Type.Embedded);
    if (embeddedNeeded) retrieveEmbeddedList(originSrc).then((streams) => dispatch(a.addEmbeddedSubtitles, streams));

    return Promise.race([
      Promise.all([
        onlinePromise,
        dispatch(a.addLocalSubtitles, await searchForLocalList(originSrc)),
      ]),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
    ])
      .catch(console.error)
      .finally(() => {
        dispatch(a.stopAISelection);
        storeSubtitleLanguage([primaryLanguage, secondaryLanguage], playlistId, mediaItemId);
        addSubtitleItemsToList(getters.list, playlistId, mediaItemId);
        dispatch(a.checkLocalSubtitles);
        dispatch(a.checkSubtitleList);
        commit(m.setIsRefreshing, false);
        dispatch(legacyActions.UPDATE_SUBTITLE_TYPE, true);
      });
  },
  async [a.refreshSubtitles]({ state, getters, dispatch, commit }: any) {
    const { playlistId, mediaItemId } = state;
    const {
      originSrc,
      primaryLanguage, secondaryLanguage,
      privacyAgreement,
    } = getters;

    primarySelectionComplete = false;
    secondarySelectionComplete = false;
    commit(m.setIsRefreshing, true);
    dispatch(a.startAISelection);
    const onlineNeeded = privacyAgreement ? true : await privacyConfirm();
    const onlinePromise = onlineNeeded ? dispatch(a.refreshOnlineSubtitles) : Promise.resolve();
    if (onlineNeeded) addBubble(ONLINE_LOADING);
    return Promise.race([
      Promise.all([
        onlinePromise,
        dispatch(a.addLocalSubtitles, await searchForLocalList(originSrc)),
      ]),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
    ])
      .catch(console.error)
      .finally(() => {
        dispatch(a.stopAISelection);
        storeSubtitleLanguage([primaryLanguage, secondaryLanguage], playlistId, mediaItemId);
        addSubtitleItemsToList(getters.list, playlistId, mediaItemId);
        dispatch(a.checkLocalSubtitles);
        dispatch(a.checkSubtitleList);
        commit(m.setIsRefreshing, false);
        dispatch(legacyActions.UPDATE_SUBTITLE_TYPE, true);
      });
  },
  async [a.refreshOnlineSubtitles]({ getters, dispatch }: any) {
    const {
      originSrc,
      primaryLanguage, secondaryLanguage,
      playlistId, mediaItemId,
    } = getters;
    const hints = generateHints(originSrc);
    return Promise.all([
      fetchOnlineListWithErrorHandling(originSrc, primaryLanguage, hints),
      fetchOnlineListWithErrorHandling(originSrc, secondaryLanguage, hints),
    ]).then((resultsList) => {
      const results = flatten(resultsList);
      const newSubtitlesToAdd: TranscriptInfo[] = [];
      const oldSubtitlesToDel: SubtitleControlListItem[] = [];
      const oldSubtitles = [...(getters as { list: SubtitleControlListItem[] }).list];
      // delete subtitles not matching the current language preference
      oldSubtitlesToDel.push(...remove(oldSubtitles, ({ type, language }) => type === Type.Online && language !== primaryLanguage && language !== secondaryLanguage));
      // delete subtitles not existed in the new subtitles
      oldSubtitlesToDel.push(...remove(oldSubtitles, ({ type, hash }) => type === Type.Online && !results.find(({ transcriptIdentity }) => transcriptIdentity === hash)));
      // add subtitles not existed in the old subtitles
      newSubtitlesToAdd.push(...results.filter(({ transcriptIdentity }) => !oldSubtitles.find(({ id }) => id === transcriptIdentity)));
      return { delete: oldSubtitlesToDel, add: newSubtitlesToAdd };
    }).then((result) => dispatch(a.addOnlineSubtitles, result.add)
      .then(() => dispatch(a.deleteSubtitlesByUuid, result.delete)));
  },
  [a.checkLocalSubtitles]({ dispatch, getters }: any) {
    const localInvalidSubtitles = getters.list.filter(({ type, source }: any) => type === Type.Local && !existsSync(source));
    if (localInvalidSubtitles.length) return dispatch(a.deleteSubtitlesByUuid, localInvalidSubtitles).then(() => addBubble(LOCAL_SUBTITLE_REMOVED));
  },
  async [a.addLocalSubtitles]({ dispatch, state }: any, paths: string[]) {
    return Promise.all(
      paths.map((path: string) => dispatch(a.addSubtitle, {
        generator: new LocalGenerator(path),
        playlistId: state.playlistId,
        mediaItemId: state.mediaItemId,
      }))
    );
  },
  async [a.addLocalSubtitlesWithSelect]({ state, dispatch, getters }: any, paths: string[]) {
    let selectedHash = paths[0];
    const { playlistId, mediaItemId } = state;
    // tempoary solution, need db validation schema to ensure data consistent
    if (playlistId && mediaItemId) {
      return Promise.all(
        paths.map(async (path: string, i: number) => {
          const g = new LocalGenerator(path);
          if (i === 0) {
            try {
              selectedHash = await g.getHash();
            } catch (ex) {}
          }
          return dispatch(a.addSubtitle, {
            generator: g,
            playlistId, mediaItemId,
          });
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
    }
  },
  async [a.addEmbeddedSubtitles]({ dispatch, state }: any, streams: [string, ISubtitleStream][]) {
    return Promise.all(
      streams.map((stream) => dispatch(a.addSubtitle, {
        generator: new EmbeddedGenerator(stream[0], stream[1]),
        playlistId: state.playlistId,
        mediaItemId: state.mediaItemId,
      }))
    );
  },
  async [a.addOnlineSubtitles]({ dispatch, state }: any, transcriptInfoList: TranscriptInfo[]) {
    return Promise.all(
      transcriptInfoList.map((info: TranscriptInfo) => dispatch(a.addSubtitle, {
        generator: new OnlineGenerator(info),
        playlistId: state.playlistId,
        mediaItemId: state.mediaItemId,
      }))
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
        ]).then(() => {
          primarySelectionComplete = true;
          secondarySelectionComplete = true;
        });
      });
  },
  async [a.addSubtitle]({ commit, dispatch, getters }: any, options: AddSubtitleOptions) {
    if (options.playlistId === state.playlistId && options.mediaItemId === state.mediaItemId) {
      const subtitleGenerator = options.generator;
      try {
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
            delay: subtitle.delay,
          };
          commit(m.addSubtitleId, subtitleControlListItem);
          return subtitleControlListItem;
        }
      } catch (ex) {
        log.warn('SubtitleManager addSubtitle action', ex);
        return;
      }
    }
  },
  [a.removeSubtitle]({ commit, getters }: any, id: string) {
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
  async [a.changePrimarySubtitle]({ dispatch, commit, getters, state }: any, id: string) {
    let primary = id;
    let secondary = getters.secondarySubtitleId;
    if (id === secondary) secondary = '';
    commit(m.setPrimarySubtitleId, primary);
    if (state.allSubtitles[primary]) commit(m.setPrimaryDelay, state.allSubtitles[primary].delay);
    commit(m.setSecondarySubtitleId, secondary);
    if (state.allSubtitles[secondary]) commit(m.setSecondaryDelay, state.allSubtitles[secondary].delay);
    dispatch(a.storeSelectedSubtitle, [primary, secondary]);
    if (id) await dispatch(`${id}/${subActions.load}`);
  },
  async [a.changeSecondarySubtitle]({ dispatch, commit, getters }: any, id: string) {
    let primary = getters.primarySubtitleId;
    let secondary = id;
    if (id && id === primary) primary = '';
    commit(m.setPrimarySubtitleId, primary);
    if (state.allSubtitles[primary]) commit(m.setPrimaryDelay, state.allSubtitles[primary].delay);
    commit(m.setSecondarySubtitleId, secondary);
    if (state.allSubtitles[secondary]) commit(m.setSecondaryDelay, state.allSubtitles[secondary].delay);
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
      () => dispatch(a.checkSubtitleList),
    );
  },
  [a.checkSubtitleList]({ getters, dispatch }: any) {
    const { list } = getters as { list: SubtitleControlListItem[] };
    if (list.length) {
      const { primaryLanguage, secondaryLanguage } = getters;
      if (!primarySelectionComplete || !secondarySelectionComplete) {
        const hasPrimaryLanguage = list
          .find(({ language }) => language === primaryLanguage);
        const hasSecondaryLanguage = list
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
        const { metadata = {}, dialogues = [] } = await dispatch(`${getters.primarySubtitleId}/${subActions.getDialogues}`, time);
        firstSub.cues = dialogues;
        if (metadata) {
          if (metadata.PlayResX) firstSub.subPlayResX = parseInt(metadata.PlayResX, 10);
          if (metadata.PlayResY) firstSub.subPlayResY = parseInt(metadata.PlayResY, 10);
        }
      } catch (error) {
        log.error('SubtitleManager', error);
      }
    }

    if (getters.enabledSecondarySub && getters.secondarySubtitleId) {
      try {
        const { metadata = {}, dialogues = [] } = await dispatch(`${getters.secondarySubtitleId}/${subActions.getDialogues}`, time);
        secondSub.cues = dialogues;
        if (metadata) {
          if (metadata.PlayResX) firstSub.subPlayResX = parseInt(metadata.PlayResX, 10);
          if (metadata.PlayResY) firstSub.subPlayResY = parseInt(metadata.PlayResY, 10);
        }
      } catch (error) {
        log.error('SubtitleManager', error);
      }
    }
    return [firstSub, secondSub];
  },
  async [a.updatePlayedTime]({ state, dispatch, getters }: any, times: { start: number, end: number }) {
    if (times.start !== times.end) {
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
    }
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
  async [a.alterPrimaryDelay]({ state, dispatch, commit }: any, deltaInSeconds: number) {
    const { primarySubtitleId } = state;
    const delay = await dispatch(`${primarySubtitleId}/${subActions.alterDelay}`, deltaInSeconds);
    commit(m.setPrimaryDelay, delay);
    setDelayTimeout();
  },
  async [a.resetPrimaryDelay]({ state, dispatch, commit }: any) {
    const { primarySubtitleId } = state;
    await dispatch(`${primarySubtitleId}/${subActions.resetDelay}`);
    commit(m.setPrimaryDelay, 0);
    setDelayTimeout();
  },
  async [a.alterSecondaryDelay]({ state, dispatch, commit }: any, deltaInSeconds: number) {
    const { secondarySubtitleId } = state;
    const delay = await dispatch(`${secondarySubtitleId}/${subActions.alterDelay}`, deltaInSeconds);
    commit(m.setSecondaryDelay, delay);
    setDelayTimeout();
  },
  async [a.resetSecondaryDelay]({ state, dispatch, commit }: any) {
    const { secondarySubtitleId } = state;
    await dispatch(`${secondarySubtitleId}/${subActions.resetDelay}`);
    commit(m.setSecondaryDelay, 0);
    setDelayTimeout();
  },
  async [a.storeSubtitleDelays]({ getters, state }: any) {
    const { list } = getters;
    const { playlistId, mediaItemId } = state;
    updateSubtitleList(list, playlistId, mediaItemId);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
