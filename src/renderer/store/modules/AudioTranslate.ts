/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-07-05 16:03:32
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-08-20 17:37:01
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore
import { event } from 'vue-analytics';
import uuidv4 from 'uuid/v4';
import { AudioTranslate as m } from '@/store/mutationTypes';
import store from '@/store';
import { AudioTranslate as a, SubtitleManager as smActions } from '@/store/actionTypes';
import { audioTranslateService } from '@/services/media/AudioTranslateService';
import { AITaskInfo } from '@/interfaces/IMediaStorable';
import { TranscriptInfo } from '@/services/subtitle';
import { ISubtitleControlListItem, Type } from '@/interfaces/ISubtitle';
import { mediaStorageService } from '@/services/storage/MediaStorageService';
import { TranslatedGenerator } from '@/services/subtitle/loaders/translated';
import { addBubble } from '../../helpers/notificationControl';
import {
  TRANSLATE_SERVER_ERROR_FAIL, TRANSLATE_SUCCESS,
  TRANSLATE_SUCCESS_WHEN_VIDEO_CHANGE, TRANSLATE_REQUEST_TIMEOUT,
} from '../../helpers/notificationcodes';
import { log } from '@/libs/Log';
import { LanguageCode } from '@/libs/language';
import { addSubtitleItemsToList } from '@/services/storage/subtitle';

let taskTimer: number;
let timerCount: number;
let staticEstimateTime: number;

export enum AudioTranslateStatus {
  Default = 'default',
  Selecting = 'selecting',
  Searching = 'searching',
  Grabbing = 'grabbing',
  GrabCompleted= 'grab-completed',
  Translating = 'translating',
  Back = 'back',
  Fail = 'fail',
  Success = 'success',
}

export enum AudioTranslateFailType {
  Default = 'default',
  NoLine = 'noLine',
  TimeOut = 'timeOut',
  ServerError = 'serverError',
}

export enum AudioTranslateBubbleOrigin {
  WindowClose = 'window-close',
  VideoChange = 'video-change',
  NextVideoChange = 'next-video-change',
  OtherAIButtonClick = 'other-ai-button-click',
  Refresh = 'refresh',
}

export enum AudioTranslateBubbleType {
  Default = '',
  ChangeWhenGrab = 'change-when-grab',
  NextVideoWhenGrab = 'next-video-when-grab',
  CloseWhenGrab = 'close-when-grab',
  ChangeWhenTranslate = 'change-when-translate',
  NextVideoWhenTranslate = 'next-video-when-translate',
  CloseWhenTranslate = 'close-when-translate',
  ClickWhenTranslate = 'click-when-translate',
  RefreshWhenTranslate = 'refresh-when-translate',
}

type AudioTranslateState = {
  key: string,
  status: string,
  selectedTargetLanugage: string,
  selectedTargetSubtitleId: string,
  translateProgress: number,
  translateEstimateTime: number,
  isModalVisible: boolean,
  callbackAfterBubble: Function,
  isBubbleVisible: boolean,
  bubbleMessage: string,
  bubbleType: string,
  callbackAfterCancelBubble: Function,
  callbackAfterHideModal: Function,
  lastAudioLanguage: string,
  failBubbleId: string,
  failType: AudioTranslateFailType,
};

const state = {
  key: '',
  status: '',
  selectedTargetLanugage: '',
  selectedTargetSubtitleId: '',
  translateProgress: 0,
  translateEstimateTime: 0,
  isModalVisible: false,
  isBubbleVisible: false,
  bubbleMessage: '',
  bubbleType: '',
  callbackAfterBubble: () => { },
  callbackAfterCancelBubble: () => { },
  callbackAfterHideModal: () => { },
  lastAudioLanguage: '',
  failBubbleId: '',
  failType: AudioTranslateFailType.Default,
};


const taskCallback = (taskInfo: AITaskInfo) => {
  log.debug('AudioTranslate', taskInfo, 'audio-log');
  // @ts-ignore
  if (taskInfo.mediaHash !== store.getters.mediaHash) {
    return;
  }
  audioTranslateService.taskInfo = taskInfo;
  // const estimateTime = taskInfo.estimateTime * 1;
  // @ts-ignore
  let startEstimateTime = store.getters.translateEstimateTime;
  let reduce = 1.2;
  let slowPoint = staticEstimateTime * 0.2;
  slowPoint = slowPoint < 20 ? 20 : slowPoint;
  let stopPoint = staticEstimateTime * 0.07;
  stopPoint = stopPoint < 7 ? 7 : stopPoint;
  if (startEstimateTime < stopPoint) {
    reduce = 0;
    startEstimateTime = stopPoint;
  } else if (startEstimateTime < slowPoint) {
    reduce = 0.7;
  } else if (startEstimateTime > staticEstimateTime * 0.6) {
    startEstimateTime = staticEstimateTime * 0.6;
  }
  // else if (startEstimateTime > estimateTime && estimateTime !== 0) {
  //   startEstimateTime = estimateTime;
  // }
  // @ts-ignore
  store.commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Translating);
  // 开启定时器模拟倒计时和进度
  if (taskTimer) {
    clearInterval(taskTimer);
  }
  taskTimer = window.setInterval(() => {
    // @ts-ignore
    if (taskInfo.mediaHash !== store.getters.mediaHash && !store.getters.isTranslating) {
      // @ts-ignore
      store.commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 0);
      clearInterval(taskTimer);
      return;
    }
    timerCount += 1;
    const estimateTime = startEstimateTime - (Math.log(timerCount) * reduce);
    const progress = ((staticEstimateTime - estimateTime) / staticEstimateTime) * 100;
    // @ts-ignore
    store.commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, estimateTime);
    // @ts-ignore
    store.commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
  }, 1000);
};

const getters = {
  selectedTargetLanugage(state: AudioTranslateState) {
    return state.selectedTargetLanugage;
  },
  translateProgress(state: AudioTranslateState) {
    return state.translateProgress;
  },
  translateEstimateTime(state: AudioTranslateState) {
    return state.translateEstimateTime;
  },
  isTranslateModalVisible(state: AudioTranslateState) {
    return state.isModalVisible;
  },
  isTranslateBubbleVisible(state: AudioTranslateState) {
    return state.isBubbleVisible;
  },
  isTranslating(state: AudioTranslateState) {
    return state.status === AudioTranslateStatus.Searching
      || state.status === AudioTranslateStatus.Grabbing
      || state.status === AudioTranslateStatus.GrabCompleted
      || state.status === AudioTranslateStatus.Translating;
  },
  translateStatus(state: AudioTranslateState) {
    return state.status;
  },
  translateBubbleMessage(state: AudioTranslateState) {
    return state.bubbleMessage;
  },
  translateBubbleType(state: AudioTranslateState) {
    return state.bubbleType;
  },
  lastAudioLanguage(state: AudioTranslateState) {
    return state.lastAudioLanguage;
  },
  failBubbleId(state: AudioTranslateState) {
    return state.failBubbleId;
  },
  failType(state: AudioTranslateState) {
    return state.failType;
  },
};

const mutations = {
  [m.AUDIO_TRANSLATE_SAVE_KEY](state: AudioTranslateState, key: string) {
    state.key = key;
  },
  [m.AUDIO_TRANSLATE_SHOW_MODAL](state: AudioTranslateState) {
    state.isModalVisible = true;
  },
  [m.AUDIO_TRANSLATE_HIDE_MODAL](state: AudioTranslateState) {
    state.isModalVisible = false;
  },
  [m.AUDIO_TRANSLATE_SELECTED_UPDATE](state: AudioTranslateState, sub: ISubtitleControlListItem) {
    state.selectedTargetLanugage = sub.language;
    state.selectedTargetSubtitleId = sub.id;
  },
  [m.AUDIO_TRANSLATE_UPDATE_STATUS](state: AudioTranslateState, status: string) {
    state.status = status;
  },
  [m.AUDIO_TRANSLATE_UPDATE_PROGRESS](state: AudioTranslateState, progress: number) {
    state.translateProgress = progress <= 100 ? Math.ceil(progress) : 100;
  },
  [m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME](state: AudioTranslateState, time: number) {
    state.translateEstimateTime = time > 0 ? Math.floor(time) : 0;
  },
  [m.AUDIO_TRANSLATE_SHOW_BUBBLE](state: AudioTranslateState) {
    state.isBubbleVisible = true;
  },
  [m.AUDIO_TRANSLATE_HIDE_BUBBLE](state: AudioTranslateState) {
    state.isBubbleVisible = false;
  },
  [m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE](
    state: AudioTranslateState,
    { type, message }: { type: string, message: string },
  ) {
    state.bubbleMessage = message;
    state.bubbleType = type;
  },
  [m.AUDIO_TRANSLATE_BUBBLE_CALLBACK](state: AudioTranslateState, callback: Function) {
    state.callbackAfterBubble = callback;
  },
  [m.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK](state: AudioTranslateState, callback: Function) {
    state.callbackAfterCancelBubble = callback;
  },
  [m.AUDIO_TRANSLATE_MODAL_HIDE_CALLBACK](state: AudioTranslateState, callback: Function) {
    state.callbackAfterHideModal = callback;
  },
  [m.AUDIO_TRANSLATE_RECOVERY](state: AudioTranslateState) {
    state.translateProgress = 0;
    state.translateEstimateTime = 0;
    state.status = AudioTranslateStatus.Default;
    state.selectedTargetSubtitleId = '';
    state.selectedTargetLanugage = '';
    state.key = '';
    state.isModalVisible = false;
    state.isBubbleVisible = false;
    state.bubbleType = '';
    state.bubbleMessage = '';
    state.callbackAfterCancelBubble = () => { };
    state.callbackAfterHideModal = () => { };
    state.lastAudioLanguage = '';
    state.failBubbleId = '';
  },
  [m.AUDIO_TRANSLATE_UPDATE_LAST_AUDIO_LANGUAGE](state: AudioTranslateState, language: string) {
    state.lastAudioLanguage = language;
  },
  [m.AUDIO_TRANSLATE_UPDATE_FAIL_BUBBLE_ID](state: AudioTranslateState, id: string) {
    state.failBubbleId = id;
  },
  [m.AUDIO_TRANSLATE_UPDATE_FAIL_TYPE](state: AudioTranslateState, type: AudioTranslateFailType) {
    state.failType = type;
  },
};

const actions = {
  [a.AUDIO_TRANSLATE_START]({
    commit, getters, state, dispatch,
  }: any, audioLanguageCode: string) {
    // 记录当前智能翻译的信息
    if (!navigator.onLine) {
      // 网络断开的
      commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Fail);
      commit(m.AUDIO_TRANSLATE_UPDATE_FAIL_TYPE, AudioTranslateFailType.NoLine);
      return;
    }
    commit(m.AUDIO_TRANSLATE_SAVE_KEY, `${getters.mediaHash}`);
    audioTranslateService.stop();
    const grab = audioTranslateService.startJob({
      audioId: getters.currentAudioTrackId,
      mediaHash: getters.mediaHash,
      videoSrc: getters.originSrc,
      audioLanguageCode,
      targetLanguageCode: getters.selectedTargetLanugage,
    });
    if (grab) {
      // 旋转对应目标语言的字幕
      if (getters.isFirstSubtitle) {
        dispatch(smActions.manualChangePrimarySubtitle, state.selectedTargetSubtitleId);
      } else {
        dispatch(smActions.manualChangeSecondarySubtitle, state.selectedTargetSubtitleId);
      }
      // 设置智能翻译的状态
      commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Searching);
      timerCount = 1;
      // 提取audio大概是暂视频总长的0.006，听写大概是视频的1/4
      staticEstimateTime = (getters.duration * 0.256) < 100 ? 100 : (getters.duration * 0.256);
      // 但是如果时间超过5分钟就按5分钟倒计时
      // staticEstimateTime = staticEstimateTime > 300 ? 300 : staticEstimateTime;
      commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, staticEstimateTime);
      commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, timerCount);
      if (taskTimer) {
        clearInterval(taskTimer);
      }
      taskTimer = window.setInterval(() => {
        if (state.status !== AudioTranslateStatus.Searching) {
          clearInterval(taskTimer);
          return;
        }
        timerCount += 1;
        const estimateTime = staticEstimateTime - (Math.log(timerCount) * 2);
        const progress = ((staticEstimateTime - estimateTime) / staticEstimateTime) * 100;
        commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, estimateTime);
        commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
      }, 1000);
      grab.on('grab', (time: number) => {
        // 清除之前的倒计时
        if (taskTimer) {
          clearInterval(taskTimer);
        }
        const estimateTime = staticEstimateTime
          - ((Math.log(timerCount) * 2) + (time * 0.019));
        const progress = ((staticEstimateTime - estimateTime) / staticEstimateTime) * 100;
        commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, estimateTime);
        commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Grabbing);
      });
      grab.on('error', (error: Error) => {
        log.error('AudioTranslate', error);
        if (taskTimer) {
          clearInterval(taskTimer);
        }
        audioTranslateService.stop();
        // 成功后清理任务缓存
        mediaStorageService.clearAsyncTaskInfo(grab.mediaHash);
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Fail);
        let bubbleType = TRANSLATE_SERVER_ERROR_FAIL;
        let fileType = AudioTranslateFailType.ServerError;
        let failReason = 'server-error';
        if (error && error.message === 'time out') {
          bubbleType = TRANSLATE_REQUEST_TIMEOUT;
          fileType = AudioTranslateFailType.TimeOut;
          failReason = 'time-out';
        }
        commit(m.AUDIO_TRANSLATE_UPDATE_FAIL_TYPE, fileType);
        if (!state.isModalVisible) {
          commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 0);
          const selectId = state.selectedTargetSubtitleId;
          if (getters.primarySubtitleId === selectId) {
            // do not directly pass empty string to manualChangeSubtitle
            dispatch(smActions.autoChangePrimarySubtitle, '');
          } else if (getters.secondarySubtitleId === selectId) {
            dispatch(smActions.autoChangeSecondarySubtitle, '');
          }
          const failBubbleId = uuidv4();
          commit(m.AUDIO_TRANSLATE_UPDATE_FAIL_BUBBLE_ID, failBubbleId);
          // 如果当前有其他的bubble显示，就暂时不出失败的bubble
          if (!state.isBubbleVisible) {
            addBubble(bubbleType, { id: failBubbleId });
          } else {
            commit(m.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK, () => {
              addBubble(bubbleType, { id: failBubbleId });
            });
          }
        }
        try {
          // TODO 目前grabAudioFrame出错直接继续提取，需要确认错误类型
          // ga 翻译过程(第二步)失败的次数
          event('app', 'ai-translate-server-translate-fail', failReason);
        } catch (error) {
          // empty
        }
      });
      grab.on('grabCompleted', () => {
        log.debug('AudioTranslate', 'grabCompleted');
        // 假进度
        timerCount = 1;
        let startEstimateTime = state.translateEstimateTime;
        if (startEstimateTime > staticEstimateTime * 0.6) {
          startEstimateTime = staticEstimateTime * 0.6;
        }
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.GrabCompleted);
        if (taskTimer) {
          clearInterval(taskTimer);
        }
        taskTimer = window.setInterval(() => {
          if (state.status !== AudioTranslateStatus.GrabCompleted) {
            clearInterval(taskTimer);
            return;
          }
          timerCount += 1;
          const estimateTime = startEstimateTime - Math.log(timerCount);
          const progress = ((staticEstimateTime - estimateTime) / staticEstimateTime) * 100;
          commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, estimateTime);
          commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
        }, 1000);
        // ga 提取(第一步)成功的次数
        try {
          event('app', 'ai-translate-extract-audio-success');
        } catch (error) {
          // empty
        }
      });
      grab.removeListener('task', taskCallback);
      grab.on('task', taskCallback);
      grab.on('transcriptInfo', async (transcriptInfo: TranscriptInfo) => {
        log.debug('AudioTranslate', transcriptInfo, 'audio-log');
        // 清除task阶段倒计时定时器
        if (taskTimer) {
          clearInterval(taskTimer);
        }
        staticEstimateTime = 0;
        commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Success);
        // 成功后清理任务缓存
        mediaStorageService.clearAsyncTaskInfo(grab.mediaHash);
        // 结束任务
        audioTranslateService.stop();
        let result = TRANSLATE_SUCCESS_WHEN_VIDEO_CHANGE;
        if (audioTranslateService.mediaHash === getters.mediaHash) {
          const selectId = state.selectedTargetSubtitleId;
          result = TRANSLATE_SUCCESS;
          // 加入刚刚翻译好的AI字幕
          const generator = new TranslatedGenerator(transcriptInfo);
          const subtitle = await dispatch(smActions.addSubtitle, {
            generator, mediaHash: audioTranslateService.mediaHash,
          });
          // 保存本次字幕到数据库
          addSubtitleItemsToList([subtitle], audioTranslateService.mediaHash);
          if (subtitle && subtitle.id) {
            // 选中当前翻译的字幕
            if (getters.primarySubtitleId === selectId) {
              dispatch(smActions.manualChangePrimarySubtitle, subtitle.id);
            } else if (getters.secondarySubtitleId === selectId) {
              dispatch(smActions.manualChangeSecondarySubtitle, subtitle.id);
            }
          }
          // 先删除AI按钮对应的ID
          dispatch(smActions.removeSubtitle, selectId);
          // 智能翻译成功后，刷新另外的语言AI是否也成功
          const {
            primaryLanguage, secondaryLanguage, list,
          } = getters;
          const secondaryAIButtonExist = list
            .find((
              sub: ISubtitleControlListItem,
            ) => sub.language === secondaryLanguage && !sub.source && sub.type === Type.Translated);
          const primaryAIButtonExist = list
            .find((
              sub: ISubtitleControlListItem,
            ) => sub.language === primaryLanguage && !sub.source && sub.type === Type.Translated);
          if (primaryLanguage === subtitle.language
            && !!secondaryLanguage && !!secondaryAIButtonExist) {
            dispatch(smActions.fetchSubtitleWhenTrabslateSuccess, secondaryLanguage);
          } else if (secondaryLanguage === subtitle.language
            && !!primaryLanguage && !!primaryAIButtonExist) {
            dispatch(smActions.fetchSubtitleWhenTrabslateSuccess, primaryLanguage);
          }
        }
        // 如果当前有其他气泡需要用户确认，就先不出成功的气泡
        if (!state.isBubbleVisible) {
          // 提示翻译成功
          setTimeout(() => {
            addBubble(result);
          }, 100);
        } else {
          commit(m.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK, () => {
            // 提示翻译成功
            addBubble(result);
          });
        }
        // 恢复vuex
        commit(m.AUDIO_TRANSLATE_RECOVERY);
        // ga 翻译过程(第二步)成功次数
        try {
          event('app', 'ai-translate-server-translate-success');
        } catch (error) {
          // empty
        }
      });
    }
  },
  async [a.AUDIO_TRANSLATE_CONTINUE](
    { getters, dispatch, commit }: any,
  ) {
    const {
      primaryLanguage, secondaryLanguage, mediaHash,
    } = getters;
    const list = getters.list as ISubtitleControlListItem[];
    const key = `${getters.mediaHash}`;
    const taskInfo = mediaStorageService.getAsyncTaskInfo(key);
    if (taskInfo && getters.mediaHash === taskInfo.mediaHash
      && (taskInfo.targetLanguage === primaryLanguage
        || taskInfo.targetLanguage === secondaryLanguage)) {
      let sub = list.find((
        sub: ISubtitleControlListItem,
      ) => sub.type === Type.Translated && sub.language === taskInfo.targetLanguage);
      if (!sub) {
        try {
          sub = await dispatch(smActions.addSubtitle, {
            generator: new TranslatedGenerator(
              null, taskInfo.targetLanguage as LanguageCode,
            ),
            mediaHash,
          });
        } catch (error) {
          // empty
        }
      }
      commit(m.AUDIO_TRANSLATE_UPDATE_LAST_AUDIO_LANGUAGE, taskInfo.audioLanguageCode);
      if (sub) {
        commit(m.AUDIO_TRANSLATE_SELECTED_UPDATE, sub);
        if (getters.isFirstSubtitle) {
          dispatch(smActions.manualChangePrimarySubtitle, sub.id);
        } else {
          dispatch(smActions.manualChangeSecondarySubtitle, sub.id);
        }
      }
      dispatch(a.AUDIO_TRANSLATE_START, taskInfo.audioLanguageCode);
    }
  },
  [a.AUDIO_TRANSLATE_DISCARD]( // eslint-disable-line complexity
    {
      commit,
      getters,
      state,
      dispatch,
    }: any,
  ) {
    try {
      let discardFromWhere = '';
      if (state.status === AudioTranslateStatus.Grabbing) {
        switch (state.bubbleType) {
          case AudioTranslateBubbleType.Default:
            discardFromWhere = 'progress-bar-cancel';
            break;
          case AudioTranslateBubbleType.ChangeWhenGrab:
          case AudioTranslateBubbleType.NextVideoWhenGrab:
            discardFromWhere = 'change-video';
            break;
          case AudioTranslateBubbleType.CloseWhenGrab:
            discardFromWhere = 'close-player';
            break;
          case AudioTranslateBubbleType.ClickWhenTranslate:
            discardFromWhere = 'change-language';
            break;
          case AudioTranslateBubbleType.RefreshWhenTranslate:
            discardFromWhere = 'refresh';
            break;
          default:
            discardFromWhere = 'other';
        }
        // ga 提取(第一步)中退出的次数 (切换视频、关闭播放、切换语言、取消、刷新、其他)
        event('app', 'ai-translate-extract-audio-abort', discardFromWhere);
      } else if (state.status === AudioTranslateStatus.Translating) {
        switch (state.bubbleType) {
          case AudioTranslateBubbleType.Default:
            discardFromWhere = 'progress-bar-cancel';
            break;
          case AudioTranslateBubbleType.ChangeWhenTranslate:
          case AudioTranslateBubbleType.NextVideoWhenTranslate:
            discardFromWhere = 'change-video';
            break;
          case AudioTranslateBubbleType.CloseWhenTranslate:
            discardFromWhere = 'close-player';
            break;
          case AudioTranslateBubbleType.ClickWhenTranslate:
            discardFromWhere = 'change-language';
            break;
          case AudioTranslateBubbleType.RefreshWhenTranslate:
            discardFromWhere = 'refresh';
            break;
          default:
            discardFromWhere = 'other';
        }
        // ga 翻译过程(第二步)中退出的次数 (切换视频、关闭播放、切换语言、取消、刷新、其他)
        event('app', 'ai-translate-server-translate-exit', discardFromWhere);
      }
    } catch (error) {
      // empty
    }
    // 清除之前的倒计时
    if (taskTimer) {
      clearInterval(taskTimer);
    }
    // 丢弃service
    audioTranslateService.stop();
    // 丢弃任务，执行用户强制操作
    const selectId = state.selectedTargetSubtitleId;
    if (getters.primarySubtitleId === selectId) {
      // do not directly pass empty string to manualChangeSubtitle
      dispatch(smActions.autoChangePrimarySubtitle, '');
    } else if (getters.secondarySubtitleId === selectId) {
      dispatch(smActions.autoChangeSecondarySubtitle, '');
    }
    commit(m.AUDIO_TRANSLATE_RECOVERY);
    state.callbackAfterBubble();
    dispatch(a.AUDIO_TRANSLATE_HIDE_BUBBLE);
  },
  [a.AUDIO_TRANSLATE_BACKSATGE]({ commit, dispatch }: any) {
    // 保存当前进度
    if (state.status === AudioTranslateStatus.Translating) {
      audioTranslateService.saveTask();
    }
    if (taskTimer) {
      clearInterval(taskTimer);
    }
    commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Back);
    commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 0);
    commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
    state.callbackAfterBubble();
    dispatch(a.AUDIO_TRANSLATE_HIDE_BUBBLE);
    audioTranslateService.removeListener('task', taskCallback);
  },
  [a.AUDIO_TRANSLATE_SHOW_MODAL]({
    commit, getters, state, dispatch,
  }: any, sub: ISubtitleControlListItem) {
    dispatch(a.AUDIO_TRANSLATE_HIDE_BUBBLE);
    const key = `${getters.mediaHash}`;
    const taskInfo = mediaStorageService.getAsyncTaskInfo(key);
    if ((getters.isTranslating || state.status === AudioTranslateStatus.Back)
      && state.selectedTargetSubtitleId === sub.id) {
      if (getters.isFirstSubtitle) {
        dispatch(smActions.manualChangePrimarySubtitle, sub.id);
      } else {
        dispatch(smActions.manualChangeSecondarySubtitle, sub.id);
      }
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
    } else if (getters.isTranslating || state.status === AudioTranslateStatus.Back) {
      dispatch(a.AUDIO_TRANSLATE_SHOW_BUBBLE, AudioTranslateBubbleOrigin.OtherAIButtonClick);
      dispatch(a.AUDIO_TRANSLATE_BUBBLE_CALLBACK, () => {
        dispatch(a.AUDIO_TRANSLATE_SHOW_MODAL, sub);
      });
    } else if (state.key === key && taskInfo && taskInfo.targetLanguage === sub.language) {
      commit(m.AUDIO_TRANSLATE_SELECTED_UPDATE, sub);
      dispatch(a.AUDIO_TRANSLATE_START, taskInfo.audioLanguageCode);
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
    } else {
      commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Default);
      commit(m.AUDIO_TRANSLATE_SELECTED_UPDATE, sub);
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
    }
  },
  [a.AUDIO_TRANSLATE_HIDE_MODAL]({ commit, dispatch }: any) {
    commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
    if (state.status === AudioTranslateStatus.Fail) {
      setTimeout(() => {
        dispatch(a.AUDIO_TRANSLATE_DISCARD);
      }, 300);
    }
  },
  [a.AUDIO_TRANSLATE_UPDATE_STATUS]({ commit }: any, status: string) {
    commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, status);
  },
  [a.AUDIO_TRANSLATE_SHOW_BUBBLE]( // eslint-disable-line complexity
    { commit, state, getters }: any,
    origin: string,
  ) {
    const messageWhenGrab = this.$i18n.t('translateBubble.bubbleWhenGrab', this.$i18n.locale, this.$i18n.locale);
    const messageWhenTranslate = this.$i18n.t('translateBubble.bubbleWhenTranslate', this.$i18n.locale, this.$i18n.locale);
    const messageWhenForbidden = this.$i18n.t('translateBubble.bubbleFunctionForbidden', this.$i18n.locale, this.$i18n.locale);
    if (origin === AudioTranslateBubbleOrigin.OtherAIButtonClick
      && state.status === AudioTranslateStatus.Back) {
      // 当又一个AI翻译正在进行时，还想再AI翻译
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ClickWhenTranslate,
        message: messageWhenForbidden,
      });
      commit(m.AUDIO_TRANSLATE_SHOW_BUBBLE);
      return;
    }

    if (!getters.isTranslating) {
      return;
    }

    if (origin === AudioTranslateBubbleOrigin.VideoChange
      && state.status !== AudioTranslateStatus.Translating) {
      // 当正在提取音频，切换视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ChangeWhenGrab,
        message: messageWhenGrab,
      });
    } else if (origin === AudioTranslateBubbleOrigin.NextVideoChange
      && state.status !== AudioTranslateStatus.Translating) {
      // 当正在提取音频，自动下一个视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.NextVideoWhenGrab,
        message: messageWhenGrab,
      });
    } else if (origin === AudioTranslateBubbleOrigin.WindowClose
      && state.status !== AudioTranslateStatus.Translating) {
      // 当前正在提取音频, 关闭窗口
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.CloseWhenGrab,
        message: messageWhenGrab,
      });
    } else if (origin === AudioTranslateBubbleOrigin.VideoChange) {
      // 当正在后台翻译，切换视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ChangeWhenTranslate,
        message: messageWhenTranslate,
      });
    } else if (origin === AudioTranslateBubbleOrigin.NextVideoChange) {
      // 当正在后台翻译，切换视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.NextVideoWhenTranslate,
        message: messageWhenTranslate,
      });
    } else if (origin === AudioTranslateBubbleOrigin.WindowClose) {
      // 当正在后台翻译，关闭window
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.CloseWhenTranslate,
        message: messageWhenTranslate,
      });
    } else if (origin === AudioTranslateBubbleOrigin.OtherAIButtonClick) {
      // 当又一个AI翻译正在进行时，还想再AI翻译
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ClickWhenTranslate,
        message: messageWhenForbidden,
      });
    } else if (origin === AudioTranslateBubbleOrigin.Refresh) {
      // 当当前有一个AI翻译正在进行时，想刷新字幕列表
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.RefreshWhenTranslate,
        message: messageWhenForbidden,
      });
    }
    commit(m.AUDIO_TRANSLATE_SHOW_BUBBLE);
  },
  [a.AUDIO_TRANSLATE_HIDE_BUBBLE]({ commit, state }: any) {
    commit(m.AUDIO_TRANSLATE_HIDE_BUBBLE);
    commit(m.AUDIO_TRANSLATE_BUBBLE_CALLBACK, () => { });
    if (state.callbackAfterCancelBubble) {
      state.callbackAfterCancelBubble();
    }
    commit(m.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK, () => { });
  },
  [a.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK]({ commit }: any, callback: Function) {
    commit(m.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK, callback);
  },
  [a.AUDIO_TRANSLATE_BUBBLE_CALLBACK]({ commit }: any, callback: Function) {
    commit(m.AUDIO_TRANSLATE_BUBBLE_CALLBACK, callback);
  },
  [a.AUDIO_TRANSLATE_MODAL_HIDE_CALLBACK]({ commit }: any, callback: Function) {
    commit(m.AUDIO_TRANSLATE_MODAL_HIDE_CALLBACK, callback);
  },
  [a.AUDIO_TRANSLATE_INIT]({ commit, dispatch, getters }: any) {
    dispatch('removeMessages', getters.failBubbleId);
    commit(m.AUDIO_TRANSLATE_RECOVERY);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
