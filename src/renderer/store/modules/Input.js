import { Input as mutationTypes } from '../mutationTypes';
import { Input as actionTypes } from '../actionTypes';

const state = {
  mousemovePosition: { x: 0, y: 0 },
  downKeys: [],
};

const getters = {
  mousemovePosition: state => state.mousemovePosition,
  progressKeydown: state => state.downKeys.includes('ArrowLeft') || state.downKeys.includes('ArrowRight') || state.downKeys.includes('BracketLeft') || state.downKeys.includes('BracketRight'),
};

const mutations = {
  [mutationTypes.MOUSEMOVE_POSITION_UPDATE](state, payload) {
    state.mousemovePosition = payload;
  },
  [mutationTypes.DOWN_KEYS_UPDATE](state, payload) {
    state.downKeys = payload;
  },
};

const actions = {
  [actionTypes.MOUSEMOVE_POSITION]({ commit }, position) {
    commit(mutationTypes.MOUSEMOVE_POSITION_UPDATE, { x: position[0], y: position[1] });
  },
  [actionTypes.KEYDOWN_UPDATE]({ commit, state }, downKey) {
    const tempKeys = [...state.downKeys];
    if (!tempKeys.includes(downKey)) tempKeys.push(downKey);
    commit(mutationTypes.DOWN_KEYS_UPDATE, tempKeys);
  },
  [actionTypes.KEYUP_UPDATE]({ commit, state }, upKey) {
    const tempKeys = [...state.downKeys];
    if (tempKeys.includes(upKey)) tempKeys.splice(tempKeys.indexOf(upKey), 1);
    commit(mutationTypes.DOWN_KEYS_UPDATE, tempKeys);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
