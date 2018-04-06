
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
};

const getters = {
  getCurrentTime: state => state.CurrentTime,
};

const mutations = {
  CurrentTime(state, t) {
    state.CurrentTime = t;
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
