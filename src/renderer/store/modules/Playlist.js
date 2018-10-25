
const state = {
  currentPlaying: '',
  PlayingList: [],
};

const getters = {
  nextVideo: (state) => {
    const index = state.PlayingList.findIndex(value => value === state.currentPlaying);
    if (index !== -1 && index + 1 < state.PlayingList.length) {
      return state.PlayingList[index + 1];
    }
    return '';
  },
};

const mutations = {
  currentPlaying(state, t) {
    state.currentPlaying = t;
  },
  PlayingList(state, t) {
    state.PlayingList = t;
  },
};

const actions = {
  currentPlaying({ commit }, t) {
    commit('currentPlaying', t);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
