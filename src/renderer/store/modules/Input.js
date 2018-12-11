import { Input as mutationTypes } from '../mutationTypes';
import { Input as actionTypes } from '../actionTypes';

const state = {
  mouse: {
    move: {
      position: [],
    },
  },
  keyboard: {
    down: {
      keys: [],
    },
  },
};

const getters = {
  mousemovePosition: state => [...state.mouse.move.position],
  downKeys: state => [...state.keyboard.down.keys],
};

const mutations = {
  [mutationTypes.MOUSE_UPDATE](state, payload) {
    state.mouse = payload;
  },
  [mutationTypes.KEYBOARD_UPDATE](state, payload) {
    state.keyboard = payload;
  },
};

const actions = {
  [actionTypes.MOUSEMOVE_POSITION]({ commit, state }, position) {
    const { mouse } = state;
    commit(mutationTypes.MOUSE_UPDATE, Object.assign({}, mouse, { move: { position } }));
  },
  [actionTypes.KEYDOWN_UPDATE]({ commit, state }, downKey) {
    const { keyboard } = state;
    const tempKeys = [...keyboard.down.keys];
    if (!tempKeys.includes(downKey)) tempKeys.push(downKey);
    commit(
      mutationTypes.KEYBOARD_UPDATE,
      Object.assign({}, keyboard, { down: { keys: tempKeys } }),
    );
  },
  [actionTypes.KEYUP_UPDATE]({ commit, state }, upKey) {
    const { keyboard } = state;
    const tempKeys = [...keyboard.down.keys];
    if (tempKeys.includes(upKey)) tempKeys.splice(tempKeys.indexOf(upKey), 1);
    commit(
      mutationTypes.KEYBOARD_UPDATE,
      Object.assign({}, keyboard, { down: { keys: tempKeys } }),
    );
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
