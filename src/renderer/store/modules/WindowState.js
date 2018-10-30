const state = {
  windowSize: [0, 0],
  windowMinimumSize: [0, 0],
  windowPosition: [0, 0],
  windowBounds: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },
  isFullScreen: false,
  isFocused: true,
  isMaximized: false,
};

const getters = {
  winWidth: state => state.windowSize[0],
  winHeight: state => state.windowSize[1],
  winSize: state => state.windowSize,
  winPosX: state => state.windowPosition[0],
  winPosY: state => state.windowPosition[1],
  winPos: state => state.windowPosition,
  isFullScreen: state => state.isFullScreen,
  isFocused: state => state.isFocused,
  isMaximized: state => state.isMaximized,
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
  windowBounds(state, payload) {
    state.windowBounds = payload;
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
};

const actions = {};

export default {
  state,
  mutations,
  actions,
  getters,
};
