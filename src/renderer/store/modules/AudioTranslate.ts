/*
 * @Author: tanghaixiang@xindong.com 
 * @Date: 2019-07-05 16:03:32 
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-07-05 17:16:25
 */
import { AudioTranslate as m } from '@/store/mutationTypes';
import { AudioTranslate as a } from '@/store/actionTypes';

enum AudioTranslateStatus {
  Default = 'default',
  Selecting = 'selecting',
  Grabbing = 'grabbing',
  translating = 'translating',
  Fail = 'fail',
  Success = 'success',
}

type AudioTranslateState = {
  status: string,
  selectedTargetLanugage: string,
  translateProgress: number,
  isModalVisiable: boolean,
};

const state = {
  status: '',
  selectedTargetLanugage: '',
  translateProgress: 0,
  isModalVisiable: false,
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
  isTranslating(state: AudioTranslateState) {
    return state.status === 'grabbing' || state.status === 'translating';
  },
};

const mutations = {
  [m.AUDIO_TRANSLATE_SHOW_MODAL](state: AudioTranslateState) {
    state.isModalVisiable = true;
  },
  [m.AUDIO_TRANSLATE_HIDE_MODAL](state: AudioTranslateState) {
    state.isModalVisiable = false;
  },
  [m.AUDIO_TRANSLATE_UPDATE_STATUS](state: AudioTranslateState, status: string) {
    state.status = status
  },
  [m.AUDIO_TRANSLATE_UPDATE_PROGRESS](state: AudioTranslateState, progress: number) {
    state.translateProgress = progress;
  },
};

const actions = {
  [a.AUDIO_TRANSLATE_SHOW_MODAL]({ commit }: any) {
    commit(m.AUDIO_TRANSLATE_SHOW_MODAL);
  },
  [a.AUDIO_TRANSLATE_HIDE_MODAL]({ commit }: any) {
    commit(m.AUDIO_TRANSLATE_HIDE_MODAL);
  },
  [a.AUDIO_TRANSLATE_UPDATE_STATUS]({ commit }: any, status: string) {
    commit(m.AUDIO_TRANSLATE_UPDATE_STATUS, status);
  },
  [a.AUDIO_TRANSLATE_UPDATE_PROGRESS]({ commit }: any, progress: number) {
    commit(m.AUDIO_TRANSLATE_UPDATE_PROGRESS, progress);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};