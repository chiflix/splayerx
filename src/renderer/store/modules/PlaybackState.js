
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  Duration: NaN,
};

const getters = {
};

const mutations = {
  CurrentTime(state, t) {
    state.CurrentTime = t;
  },
  Duration(state, t) {
    state.Duration = t;
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
