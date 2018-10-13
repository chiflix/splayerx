const state = {
  RotateRate: 20,
};

const mutations = {
  RotateRate(state, t) {
    state.RotateRate = t;
  },
};

export default {
  state,
  mutations,
};
