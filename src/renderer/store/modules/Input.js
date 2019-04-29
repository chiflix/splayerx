import { Input as mutationTypes } from '../mutationTypes';
import { Input as actionTypes } from '../actionTypes';

const state = {
  mousedownComponentName: 'the-video-controller',
  mouseupComponentName: 'the-video-controller',
  pressedKeyboardCodes: [],
};

const getters = {
  progressKeydown: state => state.pressedKeyboardCodes.includes('ArrowLeft') || state.pressedKeyboardCodes.includes('ArrowRight') || state.pressedKeyboardCodes.includes('BracketLeft') || state.pressedKeyboardCodes.includes('BracketRight'),
};

const mutations = {
  [mutationTypes.MOUSEDOWN_COMPONENT_NAME_UPDATE](state, payload) {
    state.mousedownComponentName = payload;
  },
  [mutationTypes.MOUSEUP_COMPONENT_NAME_UPDATE](state, payload) {
    state.mouseupComponentName = payload;
  },
  [mutationTypes.PRESSED_KEYBOARD_CODES_UPDATE](state, payload) {
    state.pressedKeyboardCodes = payload;
  },
};

const actions = {
  [actionTypes.MOUSEDOWN_UPDATE]({ commit }, { componentName }) {
    commit(mutationTypes.MOUSEDOWN_COMPONENT_NAME_UPDATE, componentName);
  },
  [actionTypes.MOUSEUP_UPDATE]({ commit }, { componentName }) {
    commit(mutationTypes.MOUSEUP_COMPONENT_NAME_UPDATE, componentName);
  },
  [actionTypes.KEYDOWN_UPDATE]({ commit, state }, { pressedKeyboardCode: code }) {
    const pressedKeys = [...state.pressedKeyboardCodes];
    if (!pressedKeys.includes(code)) pressedKeys.push(code);
    commit(mutationTypes.PRESSED_KEYBOARD_CODES_UPDATE, pressedKeys);
  },
  [actionTypes.KEYUP_UPDATE]({ commit, state }, { releasedKeyboardCode: code }) {
    const pressedKeys = [...state.pressedKeyboardCodes];
    if (pressedKeys.includes(code)) pressedKeys.splice(pressedKeys.indexOf(code), 1);
    commit(mutationTypes.PRESSED_KEYBOARD_CODES_UPDATE, pressedKeys);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
