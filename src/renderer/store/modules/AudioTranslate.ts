/*
 * @Author: tanghaixiang@xindong.com 
 * @Date: 2019-07-05 16:03:32 
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-07-09 18:48:01
 */
import { AudioTranslate as m } from '@/store/mutationTypes';
import { AudioTranslate as a, SubtitleManager as smActions } from '@/store/actionTypes';
import { audioGrabService } from '@/services/media/AudioGrabService';
import { AITaskInfo } from '@/interfaces/IMediaStorable';
import { TranscriptInfo } from '@/services/subtitle';
import { SubtitleControlListItem } from '@/interfaces/ISubtitle';
import { mediaStorageService } from '@/services/storage/MediaStorageService';

enum AudioTranslateStatus {
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
  OtherAIButtonClick = 'other-ai-button-click',
  TranslateFail = 'translate-fail',
}

export enum AudioTranslateBubbleType {
  ChangeWhenGrab = 'change-when-grab',
  ChangeWhenTranslate = 'change-when-translate',
  ClickWhenTranslate = 'click-when-translate',
  FailAfterTranslate = 'fail-when-translate',
}

type AudioTranslateState = {
  key: string,
  status: string,
  selectedTargetLanugage: string,
  selectedTargetSubtitleId: string,
  translateProgress: number,
  isModalVisiable: boolean,
  callbackAfterBubble: Function,
  isBubbleVisible: boolean,
  bubbleMessage: string,
  bubbleType: string,
};

const state = {
  key: '',
  status: '',
  selectedTargetLanugage: '',
  selectedTargetSubtitleId: '',
  translateProgress: 0,
  isModalVisiable: false,
  isBubbleVisible: false,
  bubbleMessage: '',
  bubbleType: '',
  callbackAfterBubble: () => { },
} as AudioTranslateState;

const getters = {
  selectedTargetLanugage(state: AudioTranslateState) {
    return state.selectedTargetLanugage;
  },
  translateProgress(state: AudioTranslateState) {
    return state.translateProgress;
  },
  isTranslateModalVisiable(state: AudioTranslateState) {
    return state.isModalVisiable;
  },
  isTranslateBubbleVisiable(state: AudioTranslateState) {
    return state.isBubbleVisible;
  },
  isTranslating(state: AudioTranslateState) {
    return state.status === 'grabbing' || state.status === 'translating';
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
    state.status = status
  },
  [m.AUDIO_TRANSLATE_UPDATE_PROGRESS](state: AudioTranslateState, progress: number) {
    state.translateProgress = progress;
  },
  [m.AUDIO_TRANSLATE_SHOW_BUBBLE](state: AudioTranslateState) {
    state.isBubbleVisible = true;
  },
  [m.AUDIO_TRANSLATE_HIDE_BUBBLE](state: AudioTranslateState) {
    state.isBubbleVisible = false;
  },
  [m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE](state: AudioTranslateState, { type, message }: { type: string, message: string }) {
    state.bubbleMessage = message;
    state.bubbleType = type;
  },
  [m.AUDIO_TRANSLATE_BUBBLE_CALLBACK](state: AudioTranslateState, callback: Function) {
    state.callbackAfterBubble = callback;
  }
};

const actions = {
  [a.AUDIO_TRANSLATE_START]({ commit, getters, state, dispatch }: any, audioLanguageCode: string) {
    // 记录当前智能翻译的信息
    commit(m.AUDIO_TRANSLATE_SAVE_KEY, getters.mediaHash);
    const grab = audioGrabService.send({
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
      grab.on('grab', (time: number) => {
        const progress = Math.ceil((time / getters.duration) * 100);
        // TODO 计算倒计时
        commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
      });
      grab.on('error', (error: Error) => {
        commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Fail);
        dispatch(a.AUDIO_TRANSLATE_SHOW_BUBBLE, AudioTranslateBubbleOrigin.TranslateFail);
      });
      grab.on('task', (taskInfo: AITaskInfo) => {
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Translating);
        this.grabProgress = taskInfo.estimateTime;
        audioGrabService.taskInfo = taskInfo;
      });
      grab.on('transcriptInfo', (transcriptInfo: TranscriptInfo) => {
        commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Success);
        let txt = 'ai 翻译已完成，将在下次打开视频时自动显示';
        if (audioGrabService.mediaHash === getters.mediaHash) {
          txt = 'AI翻译已完成，可在翻译结果列表中查看';
          // TODO 选中字幕，并加载字幕
        }
        // 提示翻译成功
        dispatch('addMessages', {
          type: 'result',
          title: '',
          content: txt,
          dismissAfter: 5000,
        });
        audioGrabService.remove();
      });
    }
  },
  [a.AUDIO_TRANSLATE_DISCARD]({ commit, state }: any) {
    commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
    commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 0);
    commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Default);
    // 丢弃service
    audioGrabService.remove();
    // 丢弃任务，执行用户强制操作
    state.callbackAfterBubble();
  },
  [a.AUDIO_TRANSLATE_BACKSATGE]({ commit }: any) {
    commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
    commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 0);
    commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, AudioTranslateStatus.Back);
    audioGrabService.saveTask();
    state.callbackAfterBubble();
  },
  [a.AUDIO_TRANSLATE_SHOW_MODAL]({ commit, getters, state, dispatch }: any, sub: SubtitleControlListItem) {
    let taskInfo = mediaStorageService.getAsyncTaskInfo(getters.mediaHash);
    if (getters.isTranslating && state.key === getters.mediaHash && sub.language === state.selectedTargetLanugage) {
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
      // TODO 如果开启了第二字幕
      dispatch(smActions.changePrimarySubtitle, sub.id);
    } else if (getters.isTranslating) {
      dispatch(a.AUDIO_TRANSLATE_SHOW_BUBBLE, AudioTranslateBubbleOrigin.OtherAIButtonClick);
      dispatch(a.AUDIO_TRANSLATE_BUBBLE_CALLBACK, () => {
        // TODO 如果开启了第二字幕
        dispatch(smActions.changePrimarySubtitle, '');
        dispatch(a.AUDIO_TRANSLATE_SHOW_MODAL, sub);
      });
    } else if (taskInfo && taskInfo.targetLanguage === sub.language) {
      commit(m.AUDIO_TRANSLATE_SELECTED_UPDATE, sub);
      // TODO 检查audioLanguage 是否已经添加到taskInfo
      dispatch(a.AUDIO_TRANSLATE_START, taskInfo.audioLanguageCode);
      commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, 51);
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
    } else {
      commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
      commit(m.AUDIO_TRANSLATE_SELECTED_UPDATE, sub);
    }
  },
  [a.AUDIO_TRANSLATE_HIDE_MODAL]({ commit }: any) {
    commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
  },
  [a.AUDIO_TRANSLATE_UPDATE_STATUS]({ commit }: any, status: string) {
    commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, status);
  },
  [a.AUDIO_TRANSLATE_UPDATE_PROGRESS]({ commit }: any, progress: number) {
    // TODO 这个acion可以拿掉
    commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
  },
  [a.AUDIO_TRANSLATE_SHOW_BUBBLE]({ commit, state }: any, origin: string) {
    if ((origin === AudioTranslateBubbleOrigin.VideoChange || origin === AudioTranslateBubbleOrigin.WindowClose)
      && (state.status === AudioTranslateStatus.Grabbing)) {
      // 当正在提取音频，关闭window或者切换视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ChangeWhenGrab,
        message: '正在进行AI翻译，关闭视频将无法继续',
      });
    } else if ((origin === AudioTranslateBubbleOrigin.VideoChange || origin === AudioTranslateBubbleOrigin.WindowClose)
      && (state.status === AudioTranslateStatus.Translating)) {
      // 当正在后台翻译，关闭window或者切换视频
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ChangeWhenTranslate,
        message: 'AI翻译会在云端继续处理，下次播放该视频时将自动获取翻译进度',
      });
    } else if (origin === AudioTranslateBubbleOrigin.OtherAIButtonClick
      && (state.status === AudioTranslateStatus.Translating
      || state.status === AudioTranslateStatus.Back || state.status === AudioTranslateStatus.Grabbing)) {
      // 当又一个AI翻译正在进行时，还想再AI翻译
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.ClickWhenTranslate,
        message: 'ai翻译正在进行中，暂时不能使用该功能',
      });
    } else if (origin === AudioTranslateBubbleOrigin.TranslateFail && state.status === AudioTranslateStatus.Fail) {
      // 当AI翻译失败时
      commit(m.AUDIO_TRANSLATE_BUBBLE_INFO_UPDATE, {
        type: AudioTranslateBubbleType.FailAfterTranslate,
        message: '翻译失败-请稍后重试，谢谢',
      });
    }
    commit(m.AUDIO_TRANSLATE_SHOW_BUBBLE);
  },
  [a.AUDIO_TRANSLATE_HIDE_BUBBLE]({ commit }: any) {
    commit(m.AUDIO_TRANSLATE_HIDE_BUBBLE);
  },
  [a.AUDIO_TRANSLATE_BUBBLE_CALLBACK]({ commit }: any, callback: Function) {
    commit(m.AUDIO_TRANSLATE_BUBBLE_CALLBACK, callback)
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};