/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-07-05 16:03:32
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-07-18 13:23:20
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AudioTranslate as m } from '@/store/mutationTypes';
import { AudioTranslate as a, SubtitleManager as smActions } from '@/store/actionTypes';
import { audioGrabService } from '@/services/media/AudioGrabService';
import { AITaskInfo } from '@/interfaces/IMediaStorable';
import { TranscriptInfo } from '@/services/subtitle';
import { SubtitleControlListItem } from '@/interfaces/ISubtitle';
import { mediaStorageService } from '@/services/storage/MediaStorageService';
import { TranslatedGenerator } from '@/services/subtitle/loaders/translated';

let taskTimer: number;
let timerCount: number;
let firstGetTaskEstimateTime: number;

export enum AudioTranslateStatus {
  Default = 'default',
  Selecting = 'selecting',
  Grabbing = 'grabbing',
  Translating = 'translating',
  Back = 'back',
  Fail = 'fail',
  Success = 'success',
}

export enum AudioTranslateBubbleOrigin {
  WindowClose = 'window-close',
  VideoChange = 'video-change',
  NextVideoChange = 'next-video-change',
  OtherAIButtonClick = 'other-ai-button-click',
  Refresh = 'refresh',
  TranslateFail = 'translate-fail',
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
  FailAfterTranslate = 'fail-when-translate',
}

type AudioTranslateState = {
  key: string,
  status: string,
  selectedTargetLanugage: string,
  selectedTargetSubtitleId: string,
  translateProgress: number,
  translateEstimateTime: number,
  isModalVisiable: boolean,
  callbackAfterBubble: Function,
  isBubbleVisible: boolean,
  bubbleMessage: string,
  bubbleType: string,
  callbackAfterCancelBubble: Function,
};

const state = {
  key: '',
  status: '',
  selectedTargetLanugage: '',
  selectedTargetSubtitleId: '',
  translateProgress: 0,
  translateEstimateTime: 0,
  isModalVisiable: false,
  isBubbleVisible: false,
  bubbleMessage: '',
  bubbleType: '',
  callbackAfterBubble: () => { },
  callbackAfterCancelBubble: () => { },
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
  isTranslateModalVisiable(state: AudioTranslateState) {
    return state.isModalVisiable;
  },
  isTranslateBubbleVisiable(state: AudioTranslateState) {
    return state.isBubbleVisible;
  },
  isTranslating(state: AudioTranslateState) {
    return state.status === AudioTranslateStatus.Grabbing
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
};

const mutations = {
  [m.AUDIO_TRANSLATE_SAVE_KEY](state: AudioTranslateState, key: string) {
    state.key = key;
  },
  [m.AUDIO_TRANSLATE_SHOW_MODAL](state: AudioTranslateState) {
    state.isModalVisiable = true;
  },
  [m.AUDIO_TRANSLATE_HIDE_MODAL](state: AudioTranslateState) {
    state.isModalVisiable = false;
  },
  [m.AUDIO_TRANSLATE_SELECTED_UPDATE](state: AudioTranslateState, sub: SubtitleControlListItem) {
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
  [m.AUDIO_TRANSLATE_RECOVERY](state: AudioTranslateState) {
    state.translateProgress = 0;
    state.translateEstimateTime = 0;
    state.status = AudioTranslateStatus.Default;
    state.selectedTargetSubtitleId = '';
    state.selectedTargetLanugage = '';
    state.key = '';
    state.isModalVisiable = false;
    state.isBubbleVisible = false;
    state.bubbleType = '';
    state.bubbleMessage = '';
  },
};

const actions = {
  [a.AUDIO_TRANSLATE_START]({
    commit, getters, state, dispatch,
  }: any, audioLanguageCode: string) {
    // 记录当前智能翻译的信息
    commit(m.AUDIO_TRANSLATE_SAVE_KEY, `${getters.mediaHash}-${getters.selectedTargetLanugage}`);
    audioGrabService.remove();
    const grab = audioGrabService.send({
      audioId: getters.currentAudioTrackId,
      mediaHash: getters.mediaHash,
      videoSrc: getters.originSrc,
      audioLanguageCode,
      targetLanguageCode: getters.selectedTargetLanugage,
    });
    if (grab) {
      // 旋转对应目标语言的字幕
      dispatch(smActions.changePrimarySubtitle, state.selectedTargetSubtitleId);
      // 设置智能翻译的状态
      commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Grabbing);
      timerCount = 0;
      firstGetTaskEstimateTime = (getters.duration * 0.005) + 160;
      commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, firstGetTaskEstimateTime);
      commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, timerCount);
      taskTimer = window.setInterval(() => {
        if (state.status !== AudioTranslateStatus.Grabbing) {
          clearInterval(taskTimer);
          return;
        }
        timerCount += 1;
        const estimateTime = firstGetTaskEstimateTime - (Math.log(timerCount) * 2);
        const progress = 100 - ((estimateTime / firstGetTaskEstimateTime) * 100);
        commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, estimateTime);
        commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
      }, 1000);
      grab.on('grab', (time: number) => {
        // 清除之前的倒计时
        if (taskTimer) {
          clearInterval(taskTimer);
        }
        // 提取音频阶段的进度和倒计时规则
        // 提取音频阶段，即使全部提取完成进度条也仅仅算一半
        // 倒计时计算公式(视频时长 - 已经提取音频时长) * 系数 + 预估预约识别的时长
        // 系数0.005 2000s的视频提取完成话费10s, 系数 = 10 / 2000
        const estimateTime = firstGetTaskEstimateTime
          - ((Math.log(timerCount) * 2) + (time * 0.005));
        const progress = 100 - ((estimateTime / firstGetTaskEstimateTime) * 100);
        commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, estimateTime);
        commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
      });
      grab.on('error', (error: Error) => {
        console.log(error, 'audio-log');
        audioGrabService.remove();
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Fail);
        if (!state.isModalVisiable) {
          commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 0);
          // TODO 如果开启了第二字幕
          dispatch(smActions.changePrimarySubtitle, '');
          // 如果当前有其他的bubble显示，就暂时不出失败的bubble
          if (!state.isBubbleVisible) {
            dispatch(a.AUDIO_TRANSLATE_SHOW_BUBBLE, AudioTranslateBubbleOrigin.TranslateFail);
          } else {
            commit(m.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK, () => {
              dispatch(a.AUDIO_TRANSLATE_SHOW_BUBBLE, AudioTranslateBubbleOrigin.TranslateFail);
            });
          }
        }
        try {
          // TODO 目前grabAudioFrame出错直接继续提取，需要确认错误类型
          // ga 翻译过程(第二步)失败的次数
          this.$ga.event('app', 'ai-translate-server-translate-fail');
        } catch (error) {
          // empty
        }
      });
      grab.on('grabCompleted', () => {
        // 假进度
        timerCount = 0;
        firstGetTaskEstimateTime = 150;
        taskTimer = window.setInterval(() => {
          if (state.status !== AudioTranslateStatus.Grabbing) {
            clearInterval(taskTimer);
            return;
          }
          timerCount += 1;
          const estimateTime = firstGetTaskEstimateTime - Math.log(timerCount);
          const progress = 100 - ((estimateTime / firstGetTaskEstimateTime) * 50);
          console.log(estimateTime, progress);
          commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, estimateTime);
          commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
        }, 1000);
        // ga 提取(第一步)成功的次数
        try {
          this.$ga.event('app', 'ai-translate-extract-audio-success');
        } catch (error) {
          // empty
        }
      });
      grab.on('task', (taskInfo: AITaskInfo) => {
        console.log(taskInfo, 'audio-log');
        if (taskInfo.mediaHash !== getters.mediaHash) {
          return;
        }
        audioGrabService.taskInfo = taskInfo;
        let lastProgress = state.translateProgress;
        const estimateTime = taskInfo.estimateTime * 1;
        firstGetTaskEstimateTime = state.translateEstimateTime;
        if (firstGetTaskEstimateTime > estimateTime) {
          lastProgress += (firstGetTaskEstimateTime - estimateTime) / firstGetTaskEstimateTime;
          firstGetTaskEstimateTime = estimateTime;
        }
        timerCount = 0;
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Translating);
        // 进入服务端语音识别阶段，倒计时完全使用服务器给的倒计时
        commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, firstGetTaskEstimateTime);
        // 进度条计算公式((第一次给的预估时间 - 本次预估时间) / 第一次给的预估时间) + 50
        commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, lastProgress);
        // 开启定时器模拟倒计时和进度
        if (taskTimer) {
          clearInterval(taskTimer);
        }
        taskTimer = window.setInterval(() => {
          if (taskInfo.mediaHash !== getters.mediaHash
            || state.status === AudioTranslateStatus.Fail) {
            clearInterval(taskTimer);
            return;
          }
          timerCount += 1;
          const estimateTime = firstGetTaskEstimateTime - Math.log(timerCount);
          const progress = 100 - ((estimateTime / firstGetTaskEstimateTime) * (100 - lastProgress));
          commit(m.AUDIO_TRANSLATE_UPDATE_ESTIMATE_TIME, estimateTime);
          commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
        }, 1000);
      });
      grab.on('transcriptInfo', async (transcriptInfo: TranscriptInfo) => {
        console.log(transcriptInfo, 'audio-log');
        // 清除task阶段倒计时定时器
        if (taskTimer) {
          clearInterval(taskTimer);
        }
        firstGetTaskEstimateTime = 0;
        const targetId = state.selectedTargetSubtitleId;
        commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Success);
        // 成功后清理任务缓存
        mediaStorageService.clearAsyncTaskInfo(state.key);
        // 结束任务
        audioGrabService.remove();
        // 恢复vuex
        commit(m.AUDIO_TRANSLATE_RECOVERY);
        let txt = this.$i18n.t('translateBubble.bubbleWhenSuccessOnOtherVideo', this.$i18n.locale, this.$i18n.locale);
        if (audioGrabService.mediaHash === getters.mediaHash) {
          txt = this.$i18n.t('translateBubble.bubbleWhenSuccess', this.$i18n.locale, this.$i18n.locale);
          // 先删除AI按钮对应的ID
          dispatch(smActions.removeSubtitle, targetId);
          // 加入刚刚翻译好的AI字幕
          const generator = new TranslatedGenerator(transcriptInfo);
          const subtitle = await dispatch(smActions.addSubtitle, {
            generator,
            playlistId: getters.playListId,
            mediaItemId: `${getters.mediaHash}-${getters.originSrc}`,
          });
          if (subtitle && subtitle.id) {
            // 选中当前翻译的字幕
            // TODO 如果开启了第二字幕
            dispatch(smActions.changePrimarySubtitle, subtitle.id);
          }
        }
        // 如果当前有其他气泡需要用户确认，就先不出成功的气泡
        if (!state.isBubbleVisible) {
          // 提示翻译成功
          dispatch('addMessages', {
            type: 'result',
            title: '',
            content: txt,
            dismissAfter: 5000,
          });
        } else {
          commit(m.AUDIO_TRANSLATE_BUBBLE_CANCEL_CALLBACK, () => {
            // 提示翻译成功
            dispatch('addMessages', {
              type: 'result',
              title: '',
              content: txt,
              dismissAfter: 5000,
            });
          });
        }
        // ga 翻译过程(第二步)成功次数
        try {
          this.$ga.event('app', 'ai-translate-server-translate-success');
        } catch (error) {
          // empty
        }
      });
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
        this.$ga.event('app', 'ai-translate-extract-audio-abort', discardFromWhere);
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
        this.$ga.event('app', 'ai-translate-server-translate-exit', discardFromWhere);
      }
    } catch (error) {
      // empty
    }
    // 如果时服务器已经开始任务的
    // 丢弃之前先把本次任务记录到本地
    if (getters.isTranslating || state.status === AudioTranslateStatus.Back) {
      audioGrabService.saveTask();
    }
    // 丢弃service
    audioGrabService.remove();
    // 丢弃任务，执行用户强制操作
    dispatch(smActions.changePrimarySubtitle, '');
    commit(m.AUDIO_TRANSLATE_RECOVERY);
    state.callbackAfterBubble();
    dispatch(a.AUDIO_TRANSLATE_HIDE_BUBBLE);
  },
  [a.AUDIO_TRANSLATE_BACKSATGE]({ commit, dispatch }: any) {
    state.callbackAfterBubble();
    dispatch(a.AUDIO_TRANSLATE_HIDE_BUBBLE);
    commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
    commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 0);
    commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Back);
  },
  [a.AUDIO_TRANSLATE_SHOW_MODAL]({
    commit, getters, state, dispatch,
  }: any, sub: SubtitleControlListItem) {
    dispatch(a.AUDIO_TRANSLATE_HIDE_BUBBLE);
    const key = `${getters.mediaHash}-${sub.language}`;
    const taskInfo = mediaStorageService.getAsyncTaskInfo(key);
    if (getters.isTranslating && state.key === key) {
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
      // TODO 如果开启了第二字幕
      dispatch(smActions.changePrimarySubtitle, sub.id);
    } else if (getters.isTranslating || state.status === AudioTranslateStatus.Back) {
      dispatch(a.AUDIO_TRANSLATE_SHOW_BUBBLE, AudioTranslateBubbleOrigin.OtherAIButtonClick);
      dispatch(a.AUDIO_TRANSLATE_BUBBLE_CALLBACK, () => {
        // TODO 如果开启了第二字幕
        dispatch(smActions.changePrimarySubtitle, '');
        dispatch(a.AUDIO_TRANSLATE_SHOW_MODAL, sub);
      });
    } else if (state.key === key && taskInfo && taskInfo.targetLanguage === sub.language) {
      commit(m.AUDIO_TRANSLATE_SELECTED_UPDATE, sub);
      dispatch(a.AUDIO_TRANSLATE_START, taskInfo.audioLanguageCode);
      commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 51);
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
    } else {
      commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Default);
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
      commit(m.AUDIO_TRANSLATE_SELECTED_UPDATE, sub);
    }
  },
  [a.AUDIO_TRANSLATE_HIDE_MODAL]({ commit, dispatch }: any) {
    commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
    if (state.status === AudioTranslateStatus.Fail) {
      dispatch(a.AUDIO_TRANSLATE_DISCARD);
    }
  },
  [a.AUDIO_TRANSLATE_UPDATE_STATUS]({ commit }: any, status: string) {
    commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, status);
  },
  [a.AUDIO_TRANSLATE_SHOW_BUBBLE]( // eslint-disable-line complexity
    { commit, state }: any,
    origin: string,
  ) {
    const messageWhenGrab = this.$i18n.t('translateBubble.bubbleWhenGrab', this.$i18n.locale, this.$i18n.locale);
    const messageWhenTranslate = this.$i18n.t('translateBubble.bubbleWhenTranslate', this.$i18n.locale, this.$i18n.locale);
    const messageWhenForbidden = this.$i18n.t('translateBubble.bubbleWhenForbidden', this.$i18n.locale, this.$i18n.locale);
    const messageWhenFail = this.$i18n.t('translateBubble.bubbleWhenFail', this.$i18n.locale, this.$i18n.locale);
    if (origin === AudioTranslateBubbleOrigin.VideoChange
      && state.status === AudioTranslateStatus.Grabbing) {
      // 当正在提取音频，切换视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ChangeWhenGrab,
        message: messageWhenGrab,
      });
    } else if (origin === AudioTranslateBubbleOrigin.NextVideoChange
      && state.status === AudioTranslateStatus.Grabbing) {
      // 当正在提取音频，自动下一个视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.NextVideoWhenGrab,
        message: messageWhenGrab,
      });
    } else if (origin === AudioTranslateBubbleOrigin.WindowClose
      && state.status === AudioTranslateStatus.Grabbing) {
      // 当前正在提取音频, 关闭窗口
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.CloseWhenGrab,
        message: messageWhenGrab,
      });
    } else if (origin === AudioTranslateBubbleOrigin.VideoChange
      && state.status === AudioTranslateStatus.Translating) {
      // 当正在后台翻译，切换视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ChangeWhenTranslate,
        message: messageWhenTranslate,
      });
    } else if (origin === AudioTranslateBubbleOrigin.NextVideoChange
      && state.status === AudioTranslateStatus.Translating) {
      // 当正在后台翻译，切换视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.NextVideoWhenTranslate,
        message: messageWhenTranslate,
      });
    } else if (origin === AudioTranslateBubbleOrigin.WindowClose
      && state.status === AudioTranslateStatus.Translating) {
      // 当正在后台翻译，关闭window
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.CloseWhenTranslate,
        message: messageWhenTranslate,
      });
    } else if (origin === AudioTranslateBubbleOrigin.OtherAIButtonClick
      && (state.status === AudioTranslateStatus.Translating
        || state.status === AudioTranslateStatus.Back
        || state.status === AudioTranslateStatus.Grabbing)) {
      // 当又一个AI翻译正在进行时，还想再AI翻译
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ClickWhenTranslate,
        message: messageWhenForbidden,
      });
    } else if (origin === AudioTranslateBubbleOrigin.Refresh
      && (state.status === AudioTranslateStatus.Translating
        || state.status === AudioTranslateStatus.Grabbing)) {
      // 当当前有一个AI翻译正在进行时，想刷新字幕列表
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.RefreshWhenTranslate,
        message: messageWhenForbidden,
      });
    } else if (origin === AudioTranslateBubbleOrigin.TranslateFail
      && state.status === AudioTranslateStatus.Fail) {
      // 当AI翻译失败时
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.FailAfterTranslate,
        message: messageWhenFail,
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
  [a.AUDIO_TRANSLATE_BUBBLE_CALLBACK]({ commit }: any, callback: Function) {
    commit(m.AUDIO_TRANSLATE_BUBBLE_CALLBACK, callback);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
