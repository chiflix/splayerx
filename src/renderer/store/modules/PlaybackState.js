import { PLAYBACKSTATE } from '../../constants';

const state = {
  playback: PLAYBACKSTATE.UNKNOWN,
};

const getters = {
  getPlaybackStat: state => state.playback,
};

const mutations = {
  PAUSE_PLAYBACK(state) {
    state.playback = PLAYBACKSTATE.PAUSED;
  },
  START_PLAYBACK(state) {
    state.playback = PLAYBACKSTATE.PLAYING;
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
      case PLAYBACKSTATE.PAUSED:
      case PLAYBACKSTATE.UNKNOWN:
        commit('START_PLAYBACK');
        break;
      case PLAYBACKSTATE.PLAYING:
        commit('PAUSE_PLAYBACK');
        break;
      default:
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
