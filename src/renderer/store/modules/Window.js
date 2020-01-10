const state = {
  windowSize: [0, 0],
  windowMinimumSize: [0, 0],
  windowPosition: [0, 0],
  windowAngle: 0,
  isFullScreen: false,
  isFocused: true,
  isMaximized: false,
  isMinimized: false,
  isHiddenByBossKey: false,
  sizePercent: 0,
  browsingSize: [1200, 900],
  pipSize: [420, 236],
  pipPos: [],
  browsingPos: [0, 0],
  isDarkMode: false,
};

const getters = {
  winWidth: state => state.windowSize[0],
  winHeight: state => state.windowSize[1],
  winSize: state => state.windowSize,
  winRatio: state => state.windowSize[0] / state.windowSize[1],
  winPosX: state => state.windowPosition[0],
  winPosY: state => state.windowPosition[1],
  windowMinimumSize: state => state.windowMinimumSize,
  winPos: state => state.windowPosition,
  winAngle: state => state.windowAngle,
  isFullScreen: state => state.isFullScreen,
  isFocused: state => state.isFocused,
  isMaximized: state => state.isMaximized,
  isMinimized: state => state.isMinimized,
  isHiddenByBossKey: state => state.isHiddenByBossKey,
  sizePercent: state => state.sizePercent,
  browsingSize: state => state.browsingSize,
  pipSize: state => state.pipSize,
  pipPos: state => state.pipPos,
  browsingPos: state => state.browsingPos,
  isDarkMode: state => state.isDarkMode,
};

const mutations = {
  windowSize(state, payload) {
    state.windowSize = payload;
    state.sizePercent = 0;
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
  isHiddenByBossKey(state, payload) {
    state.isHiddenByBossKey = payload;
  },
  sizePercentUpdate(state, payload) {
    state.sizePercent = payload;
  },
  windowAngle(state, payload) {
    state.windowAngle = payload;
  },
  browsingSizeUpdate(state, payload) {
    state.browsingSize = payload;
  },
  pipSizeUpdate(state, payload) {
    state.pipSize = payload;
  },
  pipPosUpdate(state, payload) {
    state.pipPos = payload;
  },
  browsingPosUpdate(state, payload) {
    state.browsingPos = payload;
  },
  isDarkModeUpdate(state, payload) {
    state.isDarkMode = payload;
  },
};

const actions = {
  updateSizePercent({ commit }, delta) {
    commit('sizePercentUpdate', delta);
  },
  windowRotate90Deg({ commit, state }) {
    (state.windowAngle + 90) === 360 ? commit('windowAngle', 0) : commit('windowAngle', state.windowAngle + 90);
  },
  initWindowRotate({ commit }) {
    commit('windowAngle', 0);
  },
  updateBrowsingSize({ commit }, delta) {
    commit('browsingSizeUpdate', delta);
  },
  updatePipSize({ commit }, delta) {
    commit('pipSizeUpdate', delta);
  },
  updatePipPos({ commit }, delta) {
    commit('pipPosUpdate', delta);
  },
  updateBrowsingPos({ commit }, delta) {
    commit('browsingPosUpdate', delta);
  },
  updateIsDarkMode({ commit }, delta) {
    commit('isDarkModeUpdate', delta);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
