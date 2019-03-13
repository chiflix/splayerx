
import { Window as windowMutations } from '../mutationTypes';

const state = {
  windowSize: [0, 0],
  windowMinimumSize: [0, 0],
  windowPosition: [0, 0],
  isFullScreen: false,
  isFocused: true,
  isMaximized: false,
  isMinimized: false,
  isEditable: false, // 字幕编辑模式
  isProfessional: false, // 字幕高级编辑模式
};

const getters = {
  winWidth: state => state.windowSize[0],
  winHeight: state => state.windowSize[1],
  winSize: state => state.windowSize,
  winRatio: state => state.windowSize[0] / state.windowSize[1],
  winPosX: state => state.windowPosition[0],
  winPosY: state => state.windowPosition[1],
  winPos: state => state.windowPosition,
  isFullScreen: state => state.isFullScreen,
  isFocused: state => state.isFocused,
  isMaximized: state => state.isMaximized,
  isMinimized: state => state.isMinimized,
  isEditable: state => state.isEditable,
  isProfessional: state => state.isProfessional,
};

const mutations = {
  windowSize(state, payload) {
    state.windowSize = payload;
  },
  windowMinimumSize(state, payload) {
    state.windowMinimumSize = payload;
  },
  windowPosition(state, payload) {
    state.windowPosition = payload;
  },
  isFullScreen(state, payload) {
    state.isFullScreen = payload;
  },
  isFocused(state, payload) {
    state.isFocused = payload;
  },
  isMaximized(state, payload) {
    state.isMaximized = payload;
  },
  isMinimized(state, payload) {
    state.isMinimized = payload;
  },
  [windowMutations.TOGGLE_EDITABLE](state, payload) {
    state.isEditable = payload;
  },
  [windowMutations.TOGGLE_PROFESSIONAL](state, payload) {
    // state.isEditable = payload;
    state.isProfessional = payload;
  },
};

const actions = {
};

export default {
  state,
  mutations,
  actions,
  getters,
};
