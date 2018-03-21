const PlaybackState = Object.freeze({
  PLAYING: Symbol('playing'),
  PAUSED: Symbol('paused'),
  UNKNOWN: Symbol('unknown'),
});

const state = {
  playback: PlaybackState.UNKNOWN,
};

const getters = {
  getPlaybackStat: state => state.playback,
};

const mutations = {
  PAUSE_PLAYBACK(state) {
    state.playback = PlaybackState.PAUSED;
  },
  START_PLAYBACK(state) {
    state.playback = PlaybackState.PLAYING;
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
  togglePlayback({ commit }) {
    // do something async
    switch (state.playback) {
      case PlaybackState.PAUSED:
        commit('START_PLAYBACK');
        break;
      case PlaybackState.PLAYING:
      default:
        commit('PAUSE_PLAYBACK');
        break;
    }
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
