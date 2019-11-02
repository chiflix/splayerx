import {
  MutationTree, GetterTree, ActionTree,
  Module, ActionContext,
} from 'vuex';
import uuidv4 from 'uuid/v4';
import {
  isEqual, sortBy, differenceWith, flatten, remove, debounce, difference,
} from 'lodash';
import Vue from 'vue';
import { remote } from 'electron';
import { extname, basename, join } from 'path';
import { existsSync } from 'fs';
import store from '@/store';
import { SubtitleManager as m } from '@/store/mutationTypes';
import {
  SubtitleManager as a,
  newSubtitle as subActions,
  Subtitle as legacyActions,
  AudioTranslate as atActions,
  UserInfo as usActions,
} from '@/store/actionTypes';
import {
  ISubtitleControlListItem, Type, IEntityGenerator, IEntity, NOT_SELECTED_SUBTITLE,
} from '@/interfaces/ISubtitle';
import {
  TranscriptInfo,
  searchForLocalList, retrieveEmbeddedList, fetchOnlineList,
  OnlineGenerator, LocalGenerator, EmbeddedGenerator, TranslatedGenerator, PreTranslatedGenerator,
} from '@/services/subtitle';
import { generateHints, calculatedName } from '@/libs/utils';
import { log } from '@/libs/Log';
import SubtitleModule from './Subtitle';
import { IStoredSubtitleItem, SelectedSubtitle } from '@/interfaces/ISubtitleStorage';
import {
  retrieveSubtitlePreference, DatabaseGenerator,
  storeSubtitleLanguage, addSubtitleItemsToList, removeSubtitleItemsFromList,
  storeSelectedSubtitles, updateSubtitleList,
} from '@/services/storage/subtitle';
import { addBubble } from '../../helpers/notificationControl';
import {
  ONLINE_LOADING, REQUEST_TIMEOUT,
  SUBTITLE_UPLOAD, UPLOAD_SUCCESS, UPLOAD_FAILED,
  LOCAL_SUBTITLE_REMOVED,
} from '../../helpers/notificationcodes';
import { LanguageCode, codeToLanguageName } from '@/libs/language';
import { AudioTranslateBubbleOrigin } from './AudioTranslate';
import { ISubtitleStream } from '@/plugins/mediaTasks';
import { isAIEnabled } from '@/helpers/featureSwitch';
import { IEmbeddedOrigin } from '@/services/subtitle/utils/loaders';
import { sagiSubtitleToSRT } from '@/services/subtitle/utils/transcoders';
import { write } from '@/libs/file';

const sortOfTypes = {
  local: 0,
  embedded: 1,
  online: 2,
  translated: 3,
  preTranslated: 3,
};

let unwatch: Function;

interface ISubtitleManagerState {
  mediaHash: string;
  primarySubtitleId: string;
  secondarySubtitleId: string;
  isRefreshing: boolean;
  allSubtitles: { [id: string]: IEntity };
  primaryDelay: number;
  secondaryDelay: number;
}
const state = {
  mediaHash: '',
  isRefreshing: false,
  allSubtitles: {},
  primarySubtitleId: '',
  secondarySubtitleId: '',
  primaryDelay: 0,
  secondaryDelay: 0,
};
const getters: GetterTree<ISubtitleManagerState, {}> = {
  list(state): ISubtitleControlListItem[] {
    const list = Object.keys(state.allSubtitles)
      .filter(id => state.allSubtitles[id])
      .map(id => ({ id, sub: state.allSubtitles[id] }));
    const controlList = sortBy(list, ({ sub }) => {
      const { type } = sub.displaySource;
      if ((type === Type.Online || type === Type.Translated || type === Type.PreTranslated)
        && sub.language !== store.getters.primaryLanguage) {
        return sortOfTypes[type] + 2;
      }
      if (type === Type.Embedded) {
        const embeddedRank = (sub.displaySource as IEmbeddedOrigin).source.streamIndex / 10;
        return sortOfTypes[type] + embeddedRank;
      }
      return sortOfTypes[type];
    }).map(({ id, sub }) => ({
      id,
      hash: sub.hash,
      language: sub.language,
      source: sub.displaySource,
      type: sub.displaySource.type,
    }));
    return controlList.map(sub => ({ ...sub, name: calculatedName(sub, controlList) }));
  },
  primarySubtitleId(state): string { return state.primarySubtitleId; },
  secondarySubtitleId(state): string { return state.secondarySubtitleId; },
  isRefreshing(state): boolean { return state.isRefreshing; },
  ableToPushCurrentSubtitle(state, getters, rootState): boolean {
    const { primarySubtitleId: pid, secondarySubtitleId: sid } = state;
    return (((store.hasModule(sid) || store.hasModule(pid))
      && ((!store.hasModule(pid) || rootState[pid].canUpload)))
      && ((!store.hasModule(sid) || rootState[sid].canUpload)));
  },
  primaryDelay({ primaryDelay }) { return primaryDelay; },
  secondaryDelay({ secondaryDelay }) { return secondaryDelay; },
  calculatedNoSub(state, { list }) { return !list.length; },
};
const mutations: MutationTree<ISubtitleManagerState> = {
  [m.setMediaHash](state, hash: string) {
    state.mediaHash = hash;
  },
  [m.setPrimarySubtitleId](state, id: string) {
    const lastId = state.primarySubtitleId;
    state.primarySubtitleId = id;
    if (store.hasModule(lastId)) store.dispatch(`${lastId}/${subActions.pause}`);
    if (store.hasModule(id)) store.dispatch(`${id}/${subActions.resume}`);
  },
  [m.setSecondarySubtitleId](state, id: string) {
    const lastId = state.secondarySubtitleId;
    state.secondarySubtitleId = id;
    if (store.hasModule(lastId)) store.dispatch(`${lastId}/${subActions.pause}`);
    if (store.hasModule(id)) store.dispatch(`${id}/${subActions.resume}`);
  },
  [m.setNotSelectedSubtitle](state, subtitle?: 'primary' | 'secondary') {
    if (subtitle === 'primary') state.primarySubtitleId = NOT_SELECTED_SUBTITLE;
    else if (subtitle === 'secondary') state.secondarySubtitleId = NOT_SELECTED_SUBTITLE;
    else {
      state.primarySubtitleId = NOT_SELECTED_SUBTITLE;
      state.secondarySubtitleId = NOT_SELECTED_SUBTITLE;
    }
  },
  [m.setIsRefreshing](state, isRefreshing: boolean) {
    state.isRefreshing = isRefreshing;
  },
  [m.addSubtitleId](state, { id, entity }: { id: string, entity: IEntity }) {
    Vue.set(state.allSubtitles, id, entity);
    const { primarySubtitleId, secondarySubtitleId } = state;
    if (primarySubtitleId && !state.allSubtitles[primarySubtitleId]) state.primarySubtitleId = '';
    if (secondarySubtitleId && !state.allSubtitles[secondarySubtitleId]) state.secondarySubtitleId = '';
  },
  [m.deleteSubtitleId](state, id: string) {
    Vue.set(state.allSubtitles, id, undefined);
    delete state.allSubtitles[id];
  },
  [m.setPrimaryDelay](state, delayInSeconds: number) {
    state.primaryDelay = delayInSeconds;
    const subtitle = state.allSubtitles[state.primarySubtitleId];
    if (subtitle) subtitle.delay = delayInSeconds;
  },
  [m.setSecondaryDelay](state, delayInSeconds: number) {
    state.secondaryDelay = delayInSeconds;
    const subtitle = state.allSubtitles[state.secondarySubtitleId];
    if (subtitle) subtitle.delay = delayInSeconds;
  },
};
interface IAddSubtitlesOptions<SourceType> {
  mediaHash: string,
  source: SourceType[];
}
interface IAddSubtitleOptions {
  generator: IEntityGenerator;
  mediaHash: string;
}
function privacyConfirm(): Promise<boolean> {
  const { $bus } = Vue.prototype;
  $bus.$emit('privacy-confirm');
  return new Promise((resolve) => {
    $bus.$once('subtitle-refresh-continue', resolve);
  });
}

let primarySelectionComplete = false;
let secondarySelectionComplete = false;
let alterDelayTimeoutId: NodeJS.Timer;
function setDelayTimeout() {
  clearTimeout(alterDelayTimeoutId);
  alterDelayTimeoutId = setTimeout(() => store.dispatch(a.storeSubtitleDelays), 10000);
}
function fetchOnlineListWrapper(
  bubble: boolean,
  videoSrc: string,
  languageCode: LanguageCode,
  hints?: string,
): Promise<TranscriptInfo[]> {
  let results: TranscriptInfo[] = [];
  return new Promise(async (resolve, reject) => {
    const onlineTimeoutId = setTimeout(() => {
      if (bubble) {
        addBubble(REQUEST_TIMEOUT, { id: `fetchOnlineListWithBubble-${videoSrc}` });
      }
      reject(results);
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
function initializeManager(context: ActionContext<ISubtitleManagerState, {}>) {
  const { commit, dispatch, getters } = context;
  commit(m.setMediaHash, getters.mediaHash);
  dispatch(a.refreshSubtitlesInitially);
}

const debouncedInitializeManager = debounce(initializeManager, 1000);
const actions: ActionTree<ISubtitleManagerState, {}> = {
  async [a.initializeManager](context) {
    debouncedInitializeManager(context);
  },
  async [a.resetManager]({ commit, dispatch }) {
    commit(m.setMediaHash, '');
    commit(m.setNotSelectedSubtitle);
    commit(m.setIsRefreshing, false);
    primarySelectionComplete = false;
    secondarySelectionComplete = false;
    await Promise.all(Object.keys(state.allSubtitles).map(id => dispatch(a.removeSubtitle, id)));
  },
  async [a.refreshSubtitlesInitially]({
    state, getters, dispatch, commit,
  }) {
    primarySelectionComplete = false;
    secondarySelectionComplete = false;
    commit(m.setIsRefreshing, true);
    dispatch(a.startAISelection);

    const {
      primaryLanguage, secondaryLanguage,
      originSrc,
      privacyAgreement,
    } = getters;
    const { mediaHash } = state;

    const preference = await retrieveSubtitlePreference(state.mediaHash);
    const hasStoredSubtitles = !!preference && !!preference.list.length;
    const languageHasChanged = (
      !preference
      || !!differenceWith(
        Object.values(preference.language),
        [primaryLanguage, secondaryLanguage],
      ).length
    );

    if (hasStoredSubtitles && !languageHasChanged && preference) {
      return Promise.race([
        dispatch(a.addDatabaseSubtitles, {
          source: preference.list,
          mediaHash: state.mediaHash,
        }),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timeout: addDatabaseSubtitles')), 10000)),
      ])
        .then(() => dispatch(a.chooseSelectedSubtitles, preference.selected))
        .catch(console.error)
        .finally(() => {
          commit(m.setIsRefreshing, false);
          dispatch(legacyActions.UPDATE_SUBTITLE_TYPE, true);
          dispatch(a.stopAISelection);
          retrieveEmbeddedList(originSrc)
            .then(streams => dispatch(a.addEmbeddedSubtitles, { mediaHash, source: streams }));
          // 继续上次的翻译任务
          dispatch(atActions.AUDIO_TRANSLATE_CONTINUE);
        });
    }

    if (hasStoredSubtitles && preference) {
      await dispatch(a.addDatabaseSubtitles, {
        source: preference.list,
        mediaHash: state.mediaHash,
      }).then(() => {
        dispatch(a.chooseSelectedSubtitles, preference.selected);
        retrieveEmbeddedList(originSrc)
          .then(streams => dispatch(a.addEmbeddedSubtitles, { mediaHash, source: streams }));
      });
    }

    let onlinePromise = Promise.resolve();
    /** whether or not to refresh online subtitles */
    const onlineNeeded = (languageHasChanged || !hasStoredSubtitles) && ['mkv', 'avi', 'ts', 'mp4'].includes(extname(originSrc).slice(1)) && privacyAgreement;
    if (onlineNeeded) {
      onlinePromise = dispatch(a.refreshOnlineSubtitles, { mediaHash, bubble: false });
    }

    retrieveEmbeddedList(originSrc)
      .then(streams => dispatch(a.addEmbeddedSubtitles, { mediaHash, source: streams }));
    return Promise.race([
      Promise.all([
        onlinePromise,
        dispatch(a.addLocalSubtitles, {
          mediaHash,
          source: await searchForLocalList(originSrc),
        }),
      ]),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timeout: addLocalSubtitles')), 10000)),
    ])
      .catch(console.error)
      .finally(() => {
        dispatch(a.stopAISelection);
        storeSubtitleLanguage([primaryLanguage, secondaryLanguage], state.mediaHash);
        dispatch(a.checkLocalSubtitles);
        dispatch(a.checkSubtitleList);
        commit(m.setIsRefreshing, false);
        dispatch(legacyActions.UPDATE_SUBTITLE_TYPE, true);
        // 继续上次的翻译任务
        dispatch(atActions.AUDIO_TRANSLATE_CONTINUE);
      });
  },
  async [a.refreshSubtitles]({
    state, getters, dispatch, commit,
  }) {
    const {
      originSrc, isTranslating,
      primaryLanguage, secondaryLanguage,
      privacyAgreement,
    } = getters;
    const { mediaHash } = state;
    // 如果当前有翻译任务
    if (isTranslating) {
      dispatch(atActions.AUDIO_TRANSLATE_SHOW_BUBBLE, AudioTranslateBubbleOrigin.Refresh);
      dispatch(atActions.AUDIO_TRANSLATE_BUBBLE_CALLBACK, () => {
        dispatch(a.refreshSubtitles);
      });
      return false;
    }
    primarySelectionComplete = false;
    secondarySelectionComplete = false;
    commit(m.setIsRefreshing, true);
    dispatch(a.startAISelection);
    const onlineNeeded = privacyAgreement ? true : await privacyConfirm();
    const onlinePromise = onlineNeeded
      ? dispatch(a.refreshOnlineSubtitles, { mediaHash, bubble: true })
      : Promise.resolve();

    return Promise.race([
      Promise.all([
        onlinePromise,
        dispatch(a.addLocalSubtitles, { mediaHash, source: await searchForLocalList(originSrc) }),
      ]),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timeout: refreshOnlineSubtitles')), 10000)),
    ])
      .catch(console.error)
      .finally(() => {
        dispatch(a.stopAISelection);
        storeSubtitleLanguage([primaryLanguage, secondaryLanguage], mediaHash);
        dispatch(a.checkLocalSubtitles);
        dispatch(a.checkSubtitleList);
        commit(m.setIsRefreshing, false);
        dispatch(legacyActions.UPDATE_SUBTITLE_TYPE, true);
      });
  },
  // 这个方法仅仅给智能翻译成功后去加载另外一个AI翻译
  async [a.fetchSubtitleWhenTrabslateSuccess](
    { getters, dispatch, state }, languageCode: LanguageCode,
  ) {
    const {
      mediaHash,
    } = state;
    const {
      originSrc,
    } = getters;
    const hints = generateHints(originSrc);
    fetchOnlineListWrapper(false, originSrc, languageCode, hints)
      .then(async (resultsList) => {
        const results = flatten(resultsList);
        const newSubtitlesToAdd: TranscriptInfo[] = [];
        const oldSubtitlesToDel: ISubtitleControlListItem[] = [];
        const oldSubtitles = [...(getters as { list: ISubtitleControlListItem[] }).list]
          .filter(({ language }) => language === languageCode);
        // 将Translated类型的都删除掉
        const translatedSubs = remove(oldSubtitles, ({
          type,
        }) => type === Type.PreTranslated);
        // delete subtitles not existed in the new subtitles
        const notExistedOldSubs = remove(
          oldSubtitles,
          ({ type, hash }) => (
            (type === Type.Online || type === Type.Translated)
            && !results.find(({ transcriptIdentity }) => transcriptIdentity === hash)
          ),
        );
        oldSubtitlesToDel.push(...translatedSubs, ...notExistedOldSubs);
        // add subtitles not existed in the old subtitles
        const notExistedNewSubs = results
          .filter(({ transcriptIdentity }) => !oldSubtitles
            .find(({ hash }) => hash === transcriptIdentity));
        const isAllResultsFromES = notExistedNewSubs
          .every((info: TranscriptInfo) => info.tagsList.length > 0 && info.tagsList.indexOf('ES') > -1);
        let addAIButton = false;
        if (results.length === 0 || isAllResultsFromES) {
          addAIButton = true;
          const oldLen = oldSubtitles.length;
          // 如果出现AI按钮，在线字幕列表不能超过2个
          if (oldLen > 2) {
            oldSubtitlesToDel.push(...oldSubtitles.splice(2, oldLen));
          } else {
            newSubtitlesToAdd.push(...notExistedNewSubs.splice(0, 2 - oldLen));
          }
          // 如果出现需要添加ai翻译按钮，先检查是不是有过翻译记录，有的话，就不添加ai翻译按钮，不删除翻译的记录
          const preTranslated = remove(oldSubtitlesToDel,
            ({ type, source, language }) => (type === Type.PreTranslated && language === languageCode && source.source !== ''));
          if (preTranslated.length > 0) {
            addAIButton = false;
          }
        } else {
          const oldLen = oldSubtitles.length;
          // 在线字幕列表不能超过3个
          if (oldLen > 3) {
            oldSubtitlesToDel.push(...oldSubtitles.splice(3, oldLen));
          } else {
            newSubtitlesToAdd.push(...notExistedNewSubs.splice(0, 3 - oldLen));
          }
        }
        return {
          delete: oldSubtitlesToDel,
          add: newSubtitlesToAdd,
          addAIButton,
        };
      }).then(async (result) => {
        if (result.addAIButton) {
          dispatch(a.addSubtitle, {
            generator: new PreTranslatedGenerator(null, languageCode), mediaHash,
          });
        }
        await dispatch(a.addOnlineSubtitles, { mediaHash, source: result.add })
          .then(() => dispatch(a.deleteSubtitlesByHash, result.delete.map(({ hash }) => hash)));
      });
  },
  async [a.refreshOnlineSubtitles](
    { getters, dispatch },
    { mediaHash, bubble }: { mediaHash: string, bubble: boolean },
  ) {
    const {
      originSrc,
      primaryLanguage, secondaryLanguage,
    } = getters;
    if (bubble) addBubble(ONLINE_LOADING);
    const hints = generateHints(originSrc);
    return Promise.all([
      fetchOnlineListWrapper(!!bubble, originSrc, primaryLanguage, hints),
      fetchOnlineListWrapper(!!bubble, originSrc, secondaryLanguage, hints),
    ]).then(async (resultsList) => {
      const results = flatten(resultsList);
      const newSubtitlesToAdd: TranscriptInfo[] = [];
      const oldSubtitlesToDel: ISubtitleControlListItem[] = [];
      const oldSubtitles: ISubtitleControlListItem[] = [...getters.list];
      // 将Translated类型的都删除掉
      const translatedSubs = remove(oldSubtitles, ({
        type,
      }) => type === Type.PreTranslated);
      // delete subtitles not matching the current language preference
      const wrongLanguageSubs = remove(
        oldSubtitles,
        ({ type, language }) => (
          (type === Type.Online || type === Type.Translated)
          && language !== primaryLanguage
          && language !== secondaryLanguage
        ),
      );
      // delete subtitles not existed in the new subtitles
      const notExistedOldSubs = remove(
        oldSubtitles,
        ({ type, hash }) => (
          (type === Type.Online || type === Type.Translated)
          && !results.find(({ transcriptIdentity }) => transcriptIdentity === hash)
        ),
      );
      oldSubtitlesToDel.push(...translatedSubs, ...wrongLanguageSubs, ...notExistedOldSubs);
      // add subtitles not existed in the old subtitles
      const notExistedNewSubs = results
        .filter(({ transcriptIdentity }) => !oldSubtitles
          .find(({ hash }) => hash === transcriptIdentity));
      // 计算是不是手动添加AI按钮
      let addPrimaryAIButton = false;
      let addSecondaryAIButton = false;
      const oldPrimarySubs = oldSubtitles
        .filter((
          sub: ISubtitleControlListItem,
        ) => (sub.type === Type.Online || sub.type === Type.Translated)
          && sub.language === primaryLanguage);
      const oldSecondarySubs = oldSubtitles
        .filter((
          sub: ISubtitleControlListItem,
        ) => (sub.type === Type.Online || sub.type === Type.Translated)
          && sub.language === secondaryLanguage);
      // sagi 结果
      const primaryResults = results
        .filter((info: TranscriptInfo) => info.languageCode === primaryLanguage);
      const secondaryResults = results
        .filter((info: TranscriptInfo) => info.languageCode === secondaryLanguage);
      const oldPrimaryAISubs = oldPrimarySubs.filter((
        sub: ISubtitleControlListItem,
      ) => sub.type === Type.Translated);
      const oldSecondaryAISubs = oldSecondarySubs.filter((
        sub: ISubtitleControlListItem,
      ) => sub.type === Type.Translated);
      const isAllPrimaryResultsFromES = primaryResults
        .every((info: TranscriptInfo) => info.tagsList.length > 0 && info.tagsList.indexOf('ES') > -1);
      const isAllSecondaryResultsFromES = secondaryResults
        .every((info: TranscriptInfo) => info.tagsList.length > 0 && info.tagsList.indexOf('ES') > -1);
      // filter 结果
      const primaryNotExistedResults = notExistedNewSubs
        .filter((info: TranscriptInfo) => info.languageCode === primaryLanguage);
      const secondaryNotExistedResults = notExistedNewSubs
        .filter((info: TranscriptInfo) => info.languageCode === secondaryLanguage);
      if ((await isAIEnabled())) {
        // 出现AI按钮的情况
        // 1. 在线字幕tags都是ES(模糊搜索)
        // 2. 没有在线字幕
        if ((primaryResults.length === 0 && oldPrimarySubs.length === 0)
          || (isAllPrimaryResultsFromES && oldPrimaryAISubs.length === 0)) {
          addPrimaryAIButton = true;
          const oldLen = oldPrimarySubs.length;
          // 如果出现AI按钮，在线字幕列表不能超过2个
          if (oldLen > 2) {
            oldSubtitlesToDel.push(...oldPrimarySubs.splice(2, oldLen));
          } else {
            newSubtitlesToAdd.push(...primaryNotExistedResults.splice(0, 2 - oldLen));
          }
          // 如果出现需要添加ai翻译按钮，先检查是不是有过翻译记录，有的话，就不添加ai翻译按钮，不删除翻译的记录
          const primaryPreTranslated = remove(oldSubtitlesToDel,
            ({ type, source, language }) => (type === Type.PreTranslated && language === primaryLanguage && source.source !== ''));
          if (primaryPreTranslated.length > 0) {
            addPrimaryAIButton = false;
          }
        } else {
          newSubtitlesToAdd.push(...primaryNotExistedResults);
        }
        if (secondaryLanguage
          && ((secondaryResults.length === 0 && oldSecondarySubs.length === 0)
            || (isAllSecondaryResultsFromES && oldSecondaryAISubs.length === 0))) {
          addSecondaryAIButton = true;
          const oldLen = oldSecondarySubs.length;
          // 如果出现AI按钮，在线字幕列表不能超过2个
          if (oldLen > 2) {
            oldSubtitlesToDel.push(...oldSecondarySubs.splice(2, oldLen));
          } else {
            newSubtitlesToAdd.push(...secondaryNotExistedResults.splice(0, 2 - oldLen));
          }
          // 如果出现需要添加ai翻译按钮，先检查是不是有过翻译记录，有的话，就不添加ai翻译按钮，不删除翻译的记录
          const secondaryPreTranslated = remove(oldSubtitlesToDel,
            ({ type, source, language }) => (type === Type.PreTranslated && language === secondaryLanguage && source.source !== ''));
          if (secondaryPreTranslated.length > 0) {
            addSecondaryAIButton = false;
          }
        } else {
          newSubtitlesToAdd.push(...secondaryNotExistedResults);
        }
      } else {
        newSubtitlesToAdd.push(...notExistedNewSubs);
      }
      return {
        delete: oldSubtitlesToDel,
        add: newSubtitlesToAdd,
        addPrimaryAIButton,
        addSecondaryAIButton,
      };
    }).then(async (result) => {
      if (result.addPrimaryAIButton) {
        dispatch(a.addSubtitle, {
          generator: new PreTranslatedGenerator(null, primaryLanguage), mediaHash,
        });
      }
      if (result.addSecondaryAIButton) {
        dispatch(a.addSubtitle, {
          generator: new PreTranslatedGenerator(null, secondaryLanguage), mediaHash,
        });
      }
      await dispatch(a.addOnlineSubtitles, { mediaHash, source: result.add })
        .then(() => dispatch(a.deleteSubtitlesByUuid, result.delete.map(({ id }) => id)));
    });
  },
  [a.checkLocalSubtitles]({ state, dispatch }) {
    const localInvalidSubtitleIds = Object.keys(state.allSubtitles)
      .filter(id => state.allSubtitles[id])
      .filter((id) => {
        const subtitle = state.allSubtitles[id];
        const source = subtitle.displaySource;
        return source && source.type === Type.Local && !existsSync(source.source as string);
      });
    if (localInvalidSubtitleIds.length) {
      dispatch(a.deleteSubtitlesByUuid, localInvalidSubtitleIds)
        .then(() => addBubble(LOCAL_SUBTITLE_REMOVED));
    }
  },
  async [a.addLocalSubtitles](
    { dispatch },
    { mediaHash, source = [] }: IAddSubtitlesOptions<string>,
  ) {
    return Promise.all(
      source.map((path: string) => dispatch(a.addSubtitle, {
        generator: new LocalGenerator(path),
        mediaHash,
      })),
    ).then(subtitles => addSubtitleItemsToList(subtitles, mediaHash));
  },
  async [a.addLocalSubtitlesWithSelect]({ state, dispatch, getters }, paths: string[]) {
    let selectedHash = paths[0];
    const { mediaHash } = state;
    // tempoary solution, need db validation schema to ensure data consistent
    if (mediaHash) {
      return Promise.all(
        paths.map(async (path: string, i: number) => {
          const g = new LocalGenerator(path);
          if (i === 0) {
            try {
              selectedHash = await g.getHash();
            } catch (ex) { console.error(ex); }
          }
          return dispatch(a.addSubtitle, { generator: g, mediaHash });
        }),
      )
        .then((list: IEntity[]) => addSubtitleItemsToList(list, state.mediaHash))
        .then(() => {
          const sub = getters.list
            .find((sub: ISubtitleControlListItem) => sub.hash === selectedHash);
          if (sub && getters.isFirstSubtitle) {
            dispatch(a.manualChangePrimarySubtitle, sub.id);
          } else if (sub && !getters.isFirstSubtitle) {
            dispatch(a.manualChangeSecondarySubtitle, sub.id);
          }
        });
    }
    return {};
  },
  async [a.addEmbeddedSubtitles](
    { dispatch },
    { mediaHash, source = [] }: IAddSubtitlesOptions<[string, ISubtitleStream]>,
  ) {
    return Promise.all(
      source.map(stream => dispatch(a.addSubtitle, {
        generator: new EmbeddedGenerator(stream[0], stream[1]),
        mediaHash,
      })),
    ).then(subtitles => addSubtitleItemsToList(subtitles, mediaHash));
  },
  async [a.addOnlineSubtitles](
    { dispatch },
    { mediaHash, source = [] }: IAddSubtitlesOptions<TranscriptInfo>,
  ) {
    return Promise.all(
      source.map((info: TranscriptInfo) => {
        if (info.tagsList.length > 0 && info.tagsList.indexOf('AI') > -1) {
          // 如果在线字幕有AI标签，就使用TranslatedGenerator
          return dispatch(a.addSubtitle, {
            generator: new TranslatedGenerator(info),
            mediaHash,
          });
        }
        return dispatch(a.addSubtitle, {
          generator: new OnlineGenerator(info),
          mediaHash,
        });
      }),
    ).then(subtitles => addSubtitleItemsToList(subtitles, mediaHash));
  },
  async [a.addDatabaseSubtitles](
    { dispatch },
    { source = [], mediaHash }: IAddSubtitlesOptions<IStoredSubtitleItem>,
  ) {
    return Promise.all(
      source.map(async stored => dispatch(a.addSubtitle, {
        generator: await DatabaseGenerator.from(stored),
        mediaHash,
      })),
    );
  },
  async [a.addSubtitle]({ state, dispatch, commit }, options: IAddSubtitleOptions) {
    if (options.mediaHash === state.mediaHash) {
      const subtitleGenerator = options.generator;
      try {
        const list = Object.values(state.allSubtitles).filter(v => v);
        const hash = await subtitleGenerator.getHash();
        const source = await subtitleGenerator.getDisplaySource();
        const existed = list
          .find(subtitle => subtitle.hash === hash && isEqual(subtitle.displaySource, source));
        if (!existed) {
          const id = uuidv4();
          store.registerModule([id], { ...SubtitleModule, name: `${id}` });
          dispatch(`${id}/${subActions.initialize}`, { id, mediaHash: state.mediaHash });
          const subtitle: IEntity = await dispatch(`${id}/${subActions.add}`, subtitleGenerator);
          await dispatch(`${id}/${subActions.store}`);
          commit(m.addSubtitleId, { id, entity: subtitle });
          return Object.assign(subtitle, { id });
        }
      } catch (ex) {
        log.warn('SubtitleManager addSubtitle action', ex);
      }
    }
    return {};
  },
  async [a.removeSubtitle]({ commit, getters, dispatch }, id: string) {
    commit(m.deleteSubtitleId, id);
    if (getters.isFirstSubtitle && getters.primarySubtitleId === id) {
      commit(m.setNotSelectedSubtitle, 'primary');
    } else if (!getters.isFirstSubtitle && getters.secondarySubtitleId === id) {
      commit(m.setNotSelectedSubtitle, 'secondary');
    }
    if (store.hasModule(id)) {
      await dispatch(`${id}/${subActions.destroy}`);
      store.unregisterModule(id);
    }
  },
  async [a.deleteSubtitlesByUuid]({ state, dispatch }, ids: string[]) {
    ids.forEach(id => dispatch(a.removeSubtitle, id));
    return removeSubtitleItemsFromList(ids.map(id => state.allSubtitles[id]), state.mediaHash);
  },
  async [a.deleteSubtitlesByHash]({ state, dispatch }, hashes: string[]) {
    const { allSubtitles } = state;
    const ids = hashes
      .map(hash => Object.keys(allSubtitles).find(id => allSubtitles[id].hash === hash) || '')
      .filter(id => id);
    ids.forEach(id => dispatch(a.removeSubtitle, id));
    return removeSubtitleItemsFromList(ids.map(id => state.allSubtitles[id]), state.mediaHash);
  },
  async [a.autoChangePrimarySubtitle]({
    dispatch, commit, getters, state,
  }, id: string) {
    const lastSelected = [state.primarySubtitleId, state.secondarySubtitleId];
    if (getters.subtitleOff) commit(m.setPrimarySubtitleId, '');
    else {
      const primaryId = id;
      let secondaryId = state.secondarySubtitleId;

      if (primaryId === secondaryId) {
        secondaryId = '';
        if (!primaryId) commit(m.setNotSelectedSubtitle);
        else commit(m.setNotSelectedSubtitle, 'secondary');
      }

      if (!primaryId) commit(m.setNotSelectedSubtitle, 'primary');
      else {
        commit(m.setPrimarySubtitleId, primaryId);
        if (state.allSubtitles[primaryId]) {
          commit(m.setPrimaryDelay, state.allSubtitles[primaryId].delay);
        }
      }

      const finalSelected = [state.primarySubtitleId, state.secondarySubtitleId];
      difference(lastSelected, finalSelected).forEach((id) => {
        if (store.hasModule(id)) dispatch(`${id}/${subActions.pause}`);
      });
      difference(finalSelected, lastSelected).forEach((id) => {
        if (store.hasModule(id)) dispatch(`${id}/${subActions.resume}`);
      });

      dispatch(a.storeSelectedSubtitles, [primaryId, secondaryId]);
    }
  },
  async [a.manualChangePrimarySubtitle]({ dispatch, commit, state }, id: string) {
    await dispatch('setSubtitleOff', !id);
    if (!id) dispatch(a.autoChangeSecondarySubtitle, '');
    else if (!state.secondarySubtitleId) commit(m.setNotSelectedSubtitle, 'secondary');
    dispatch(a.autoChangePrimarySubtitle, id);
  },
  async [a.autoChangeSecondarySubtitle]({
    dispatch, commit, getters, state,
  }, id: string) {
    const lastSelected = [state.primarySubtitleId, state.secondarySubtitleId];
    if (getters.subtitleOff) commit(m.setSecondarySubtitleId, '');
    else {
      let primaryId = state.primarySubtitleId;
      const secondaryId = id;

      if (primaryId === secondaryId) {
        primaryId = '';
        if (!secondaryId) commit(m.setNotSelectedSubtitle);
        else commit(m.setNotSelectedSubtitle, 'primary');
      }

      if (!secondaryId) commit(m.setNotSelectedSubtitle, 'secondary');
      else {
        commit(m.setSecondarySubtitleId, secondaryId);
        if (state.allSubtitles[secondaryId]) {
          commit(m.setSecondaryDelay, state.allSubtitles[secondaryId].delay);
        }
      }

      const finalSelected = [state.primarySubtitleId, state.secondarySubtitleId];
      difference(lastSelected, finalSelected).forEach((id) => {
        if (store.hasModule(id)) dispatch(`${id}/${subActions.pause}`);
      });
      difference(finalSelected, lastSelected).forEach((id) => {
        if (store.hasModule(id)) dispatch(`${id}/${subActions.resume}`);
      });

      dispatch(a.storeSelectedSubtitles, [primaryId, secondaryId]);
    }
  },
  async [a.manualChangeSecondarySubtitle]({ dispatch, commit, state }, id: string) {
    await dispatch('setSubtitleOff', !id);
    if (!id) dispatch(a.autoChangePrimarySubtitle, '');
    else if (!state.primarySubtitleId) commit(m.setNotSelectedSubtitle, 'primary');
    dispatch(a.autoChangeSecondarySubtitle, id);
  },
  async [a.storeSelectedSubtitles]({ state }, ids: string[]) {
    const { allSubtitles, mediaHash } = state;
    const subtitles = ids
      .filter(id => state.allSubtitles[id])
      .filter((id) => {
        const source = state.allSubtitles[id].displaySource;
        return source && source.source;
      })
      .map((id) => {
        const { hash, displaySource } = allSubtitles[id];
        return { hash, source: displaySource };
      });
    storeSelectedSubtitles(subtitles as SelectedSubtitle[], mediaHash);
  },
  async [a.chooseSelectedSubtitles](
    { getters, dispatch },
    { primary, secondary }: { primary: SelectedSubtitle, secondary?: SelectedSubtitle },
  ) {
    const { list } = getters as { list: ISubtitleControlListItem[] };
    let primaryId = '';
    let secondaryId = '';
    if (primary) {
      let subtitles = list
        .filter((sub: ISubtitleControlListItem) => sub.hash === primary.hash);
      if (subtitles.length > 1) {
        subtitles = subtitles.filter(sub => isEqual(sub.source, primary.source));
      }
      if (subtitles.length) primaryId = subtitles[0].id;
    }
    if (secondary) {
      let subtitles = list
        .filter((sub: ISubtitleControlListItem) => sub.hash === secondary.hash);
      if (subtitles.length > 1) {
        subtitles = subtitles.filter(sub => isEqual(sub.source, secondary.source));
      }
      if (subtitles.length) secondaryId = subtitles[0].id;
    }
    return Promise.all([
      dispatch(a.autoChangePrimarySubtitle, primaryId),
      dispatch(a.autoChangeSecondarySubtitle, secondaryId),
    ]).then(() => {
      primarySelectionComplete = true;
      secondarySelectionComplete = true;
    });
  },
  async [a.startAISelection]({ dispatch }) {
    unwatch = store.watch(
      (state: ISubtitleManagerState, getters: { list: ISubtitleControlListItem[] }) => getters.list
        .map(({
          id, type, source, language,
        }) => ({
          id, type, source, language,
        })),
      () => dispatch(a.checkSubtitleList),
    );
  },
  [a.checkSubtitleList]({ getters, dispatch, commit }) {
    const { list } = getters as { list: ISubtitleControlListItem[] };
    if (list.length) {
      const { primaryLanguage, secondaryLanguage } = getters;
      if (!primarySelectionComplete || !secondarySelectionComplete) {
        const hasPrimaryLanguage = list
          .find(({ language, type }) => language === primaryLanguage
            && !(type === Type.Translated || type === Type.PreTranslated));
        const hasSecondaryLanguage = list
          .find(({ language, type }) => language === secondaryLanguage
            && !(type === Type.Translated || type === Type.PreTranslated));
        if (hasPrimaryLanguage) {
          dispatch(a.autoChangePrimarySubtitle, hasPrimaryLanguage.id);
          primarySelectionComplete = true;
          if (hasSecondaryLanguage) {
            dispatch(a.autoChangeSecondarySubtitle, hasSecondaryLanguage.id);
            secondarySelectionComplete = true;
          }
        } else if (hasSecondaryLanguage) {
          if (primarySelectionComplete) {
            dispatch(a.autoChangeSecondarySubtitle, hasSecondaryLanguage.id);
            secondarySelectionComplete = true;
          } else {
            dispatch(a.autoChangePrimarySubtitle, hasSecondaryLanguage.id);
            dispatch(a.autoChangeSecondarySubtitle, '');
            primarySelectionComplete = true;
            secondarySelectionComplete = true;
          }
        } else if (!getters.subtitleOff) {
          commit(m.setNotSelectedSubtitle);
        }
        if (primarySelectionComplete && secondarySelectionComplete) dispatch(a.stopAISelection);
      }
    }
  },
  async [a.stopAISelection]() {
    if (typeof unwatch === 'function') unwatch();
  },
  async [a.getCues]({ dispatch, getters }, time?: number) {
    const firstSub = {
      cues: [],
      subPlayResX: 720,
      subPlayResY: 405,
    };
    const secondSub = {
      cues: [],
      subPlayResX: 720,
      subPlayResY: 405,
    };
    if (getters.primarySubtitleId && store.hasModule(getters.primarySubtitleId)) {
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

    if (getters.enabledSecondarySub
      && getters.secondarySubtitleId
      && store.hasModule(getters.secondarySubtitleId)) {
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
  async [a.updatePlayedTime](
    { state, dispatch, getters },
    times: { start: number, end: number },
  ) {
    const actions: Promise<unknown>[] = [];
    if (times.start !== times.end) {
      const { primarySubtitleId, secondarySubtitleId } = state;
      const bubbleId = `${Date.now()}-${Math.random()}`;
      if (primarySubtitleId && store.hasModule(primarySubtitleId)) {
        actions.push(
          dispatch(`${primarySubtitleId}/${subActions.updatePlayedTime}`, times)
            .then((playedTime: number) => {
              if (playedTime >= getters.duration * 0.6) {
                addBubble(SUBTITLE_UPLOAD, { id: `${SUBTITLE_UPLOAD}-${bubbleId}` });
                dispatch(`${primarySubtitleId}/${subActions.upload}`).then((result: boolean) => {
                  const bubbleType = result ? UPLOAD_SUCCESS : UPLOAD_FAILED;
                  addBubble(bubbleType, { id: `${bubbleType}-${bubbleId}` });
                });
              }
            }),
        );
      }
      if (secondarySubtitleId && store.hasModule(secondarySubtitleId)) {
        actions.push(
          dispatch(`${secondarySubtitleId}/${subActions.updatePlayedTime}`, times)
            .then((playedTime: number) => {
              if (playedTime >= getters.duration * 0.6) {
                addBubble(SUBTITLE_UPLOAD, { id: `${SUBTITLE_UPLOAD}-${bubbleId}` });
                dispatch(`${secondarySubtitleId}/${subActions.upload}`).then((result: boolean) => {
                  const bubbleType = result ? UPLOAD_SUCCESS : UPLOAD_FAILED;
                  addBubble(bubbleType, { id: `${bubbleType}-${bubbleId}` });
                });
              }
            }),
        );
      }
    }
    return Promise.all(actions);
  },
  async [a.manualUploadAllSubtitles]({ state, dispatch }) {
    if (navigator.onLine) {
      addBubble(SUBTITLE_UPLOAD);
      const actions: Promise<boolean>[] = [];
      const { primarySubtitleId, secondarySubtitleId } = state;
      if (primarySubtitleId && store.hasModule(primarySubtitleId)) actions.push(dispatch(`${primarySubtitleId}/${subActions.manualUpload}`));
      if (secondarySubtitleId && store.hasModule(secondarySubtitleId)) actions.push(dispatch(`${secondarySubtitleId}/${subActions.manualUpload}`));
      return Promise.all(actions)
        .then((result: boolean[]) => {
          addBubble(result.every(res => res) ? UPLOAD_SUCCESS : UPLOAD_FAILED);
        });
    }
    return addBubble(UPLOAD_FAILED);
  },
  async [a.alterPrimaryDelay]({ state, dispatch, commit }, deltaInSeconds: number) {
    const { primarySubtitleId } = state;
    if (!store.hasModule(primarySubtitleId)) return;
    const delay = await dispatch(`${primarySubtitleId}/${subActions.alterDelay}`, deltaInSeconds);
    commit(m.setPrimaryDelay, delay);
    setDelayTimeout();
  },
  async [a.resetPrimaryDelay]({ state, dispatch, commit }) {
    const { primarySubtitleId } = state;
    await dispatch(`${primarySubtitleId}/${subActions.resetDelay}`);
    commit(m.setPrimaryDelay, 0);
    setDelayTimeout();
  },
  async [a.alterSecondaryDelay]({ state, dispatch, commit }, deltaInSeconds: number) {
    const { secondarySubtitleId } = state;
    const delay = await dispatch(`${secondarySubtitleId}/${subActions.alterDelay}`, deltaInSeconds);
    commit(m.setSecondaryDelay, delay);
    setDelayTimeout();
  },
  async [a.resetSecondaryDelay]({ state, dispatch, commit }) {
    const { secondarySubtitleId } = state;
    await dispatch(`${secondarySubtitleId}/${subActions.resetDelay}`);
    commit(m.setSecondaryDelay, 0);
    setDelayTimeout();
  },
  async [a.storeSubtitleDelays]({ getters, state }) {
    const list = getters.list.map(({ id }: ISubtitleControlListItem) => getters[`${id}/entity`]);
    updateSubtitleList(list, state.mediaHash);
  },
  async [a.exportSubtitle]({ getters, dispatch, rootState }, item: ISubtitleControlListItem) {
    const { $bus } = Vue.prototype;
    if (!getters.token || !(getters.userInfo && getters.userInfo.isVip)) {
      dispatch(usActions.SHOW_FORBIDDEN_MODAL, 'export');
      dispatch(usActions.UPDATE_SIGN_IN_CALLBACK, () => {
        dispatch(usActions.HIDE_FORBIDDEN_MODAL);
        dispatch(a.exportSubtitle, item);
      });
      return;
    }
    if (item && item.type === Type.Embedded
      && (!rootState[item.id] || !rootState[item.id].fullyRead)) {
      // Embedded not cache
      $bus.$emit('embedded-subtitle-can-not-export');
      return;
    }

    if (item && !(item.type === 'preTranslated' && item.source.source === '')) {
      const { dialog } = remote;
      const browserWindow = remote.BrowserWindow;
      const focusWindow = browserWindow.getFocusedWindow();
      const originSrc = getters.originSrc;
      const videoName = `${basename(originSrc, extname(originSrc))}`;
      const left = originSrc.split(videoName)[0];
      const lang = item.language ? `-${codeToLanguageName(item.language)}` : '';
      const name = `${videoName}${lang}`;
      const fileName = `${basename(name, '.srt')}.srt`;
      const defaultPath = join(left, fileName);
      if (focusWindow) {
        dialog.showSaveDialog(focusWindow, {
          defaultPath,
        }, async (filePath) => {
          if (filePath) {
            const { dialogues = [] } = await dispatch(`${getters.primarySubtitleId}/${subActions.getDialogues}`, undefined);
            log.debug('export', dialogues);
            const str = sagiSubtitleToSRT(dialogues);
            try {
              write(filePath, Buffer.from(`\ufeff${str}`, 'utf8'));
            } catch (err) {
              log.error('exportSubtitle', err);
            }
            dispatch('UPDATE_DEFAULT_DIR', filePath);
          }
        });
      }
    }
  },
};

const SubtitleManager: Module<ISubtitleManagerState, {}> = {
  state,
  getters,
  mutations,
  actions,
};

export default SubtitleManager;
