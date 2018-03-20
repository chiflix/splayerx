const state = {
  playback: 'unknown',
};

const getters = {
  getPlaybackStat: state => state.playback,
};

const mutations = {
  PAUSE_PLAYBACK(state) {
    state.playback = 'paused';
  },
  START_PLAYBACK(state) {
    state.playback = 'played';
  },
};

const actions = {
  pausePlayback({ commit }) {
    // do something async
    commit('PAUSE_PLAYBACK');
  },
  startPlayback({ commit }) {
    // do something async
    commit('START_PLAYBACK');
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
