import { Input as mutationTypes } from '../mutationTypes';
import { Input as actionTypes } from '../actionTypes';

const state = {
  mouse: {
    move: {
      position: [],
    },
  },
};

const getters = {
  mousemovePosition: state => [...state.mouse.move.position],
};

const mutations = {
  [mutationTypes.MOUSE_UPDATE](state, payload) {
    state.mouse = payload;
  },
};

const actions = {
  [actionTypes.MOUSEMOVE_POSITION]({ commit, state }, position) {
    const { mouse } = state;
    commit(mutationTypes.MOUSE_UPDATE, Object.assign({}, mouse, { move: { position } }));
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
