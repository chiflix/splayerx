import { ipcRenderer } from 'electron';

const state = {
  windowSize: [0, 0],
  windowPosition: [0, 0],
  fullscreenState: false,
};

const getters = {
  winWidth: state => state.windowSize[0],
  winHeight: state => state.windowSize[1],
  winSize: state => state.windowSize,
  winPosX: state => state.windowPosition[0],
  winPosY: state => state.windowPosition[1],
  winPos: state => state.windowPosition,
  fullscreen: state => state.fullscreenState,
};

const mutations = {
  windowSize(state, payload) {
    state.windowSize = payload;
  },
  windowPosition(state, payload) {
    state.windowPosition = payload;
  },
  fullscreen(state, payload) {
    state.fullscreenState = payload;
  },
};

const actions = {
  mainWindowSize(context, payload) {
    context.commit('windowSize', payload);
  },
  rendererWindowSize(context, payload) {
    ipcRenderer.send('windowSizeChange', payload);
    context.commit('windowSize', payload);
  },
  mainWindowPosition(context, payload) {
    context.commit('windowPosition', payload);
  },
  rendererWindowPosition(context, payload) {
    ipcRenderer.send('windowPositionChange', payload);
    context.commit('windowPosition', payload);
  },
  rendererSetFullscreen(context, payload) {
    ipcRenderer.send('fullscreenStateChange', payload);
    context.commit('fullscreen', payload);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
