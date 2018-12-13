import { Input as mutationTypes } from '../mutationTypes';
import { Input as actionTypes } from '../actionTypes';

const state = {
  mousemovePosition: { x: 0, y: 0 },
  mousemoveTarget: 'the-video-controller',
  mousedownButtons: [],
  mousedownTarget: 'the-video-controller',
  mouseupTarget: 'the-video-controller',
  downKeys: [],
};

const getters = {
  progressKeydown: state => state.downKeys.includes('ArrowLeft') || state.downKeys.includes('ArrowRight') || state.downKeys.includes('BracketLeft') || state.downKeys.includes('BracketRight'),
};

const mutations = {
  [mutationTypes.MOUSEMOVE_POSITION_UPDATE](state, payload) {
    state.mousemovePosition = payload;
  },
  [mutationTypes.MOUSEMOVE_TARGET_UPDATE](state, payload) {
    state.mousemoveTarget = payload;
  },
  [mutationTypes.MOUSEDOWN_BUTTONS_UPDATE](state, payload) {
    state.mousedownButtons = payload;
  },
  [mutationTypes.MOUSEDOWN_TARGET_UPDATE](state, payload) {
    state.mousedownTarget = payload;
  },
  [mutationTypes.MOUSEUP_TARGET_UPDATE](state, payload) {
    state.mouseupTarget = payload;
  },
  [mutationTypes.DOWN_KEYS_UPDATE](state, payload) {
    state.downKeys = payload;
  },
};

const getButtonNames = (buttons) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
  const buttonsMap = ['left', 'right', 'middle', 'back', 'forward'];
  return buttons.toString(2).split('').reverse()
    .map((number, index) => (number === '1' ? buttonsMap[index] : ''))
    .filter(button => button !== '');
};

const actions = {
  [actionTypes.MOUSEMOVE_POSITION]({ commit }, position) {
    commit(mutationTypes.MOUSEMOVE_POSITION_UPDATE, { x: position[0], y: position[1] });
  },
  [actionTypes.MOUSEDOWN_UPDATE]({ commit }, mousedownEvent) {
    const { buttons, target } = mousedownEvent;
    commit(mutationTypes.MOUSEDOWN_BUTTONS_UPDATE, getButtonNames(buttons));
    commit(mutationTypes.MOUSEDOWN_TARGET_UPDATE, target);
  },
  [actionTypes.MOUSEUP_UPDATE]({ commit }, mouseupEvent) {
    const { buttons, target } = mouseupEvent;
    commit(mutationTypes.MOUSEDOWN_BUTTONS_UPDATE, getButtonNames(buttons));
    commit(mutationTypes.MOUSEUP_TARGET_UPDATE, target);
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
