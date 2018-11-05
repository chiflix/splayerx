const state = {
  showState: [true, false, false], // 0.mainMenu 1.subItems 2. audioItems
};
const getters = {
  stateInfo: state => state.showState,
};

const mutations = {
  update(state, payload) {
    state.showState.forEach((item, index) => {
      if (index !== payload) {
        state.showState.splice(index, 1, false);
      } else {
        state.showState.splice(index, 1, true);
      }
    });
  },
};

const actions = {
  updateState({ commit }, payload) {
    commit('update', payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
