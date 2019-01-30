import { Input as mutationTypes } from '../mutationTypes';
import { Input as actionTypes } from '../actionTypes';

const state = {
  mousemovePosition: { x: 0, y: 0 },
  mousemoveComponentName: 'the-video-controller',
  pressedMouseButtonNames: [],
  mousedownComponentName: 'the-video-controller',
  mouseupComponentName: 'the-video-controller',
  pressedKeyboardCodes: [],
  wheelComponentName: 'the-video-controller',
  wheelTimestamp: 0,
};

const getters = {
  progressKeydown: state => state.pressedKeyboardCodes.includes('ArrowLeft') || state.pressedKeyboardCodes.includes('ArrowRight') || state.pressedKeyboardCodes.includes('BracketLeft') || state.pressedKeyboardCodes.includes('BracketRight'),
  volumeKeydown: state => state.pressedKeyboardCodes.includes('ArrowUp') || state.pressedKeyboardCodes.includes('ArrowDown') || state.pressedKeyboardCodes.includes('KeyM'),
  leftMousedown: state => state.pressedMouseButtonNames.includes('left'),
};

const mutations = {
  [mutationTypes.MOUSEMOVE_POSITION_UPDATE](state, payload) {
    state.mousemovePosition = payload;
  },
  [mutationTypes.MOUSEMOVE_TARGET_UPDATE](state, payload) {
    state.mousemoveComponentName = payload;
  },
  [mutationTypes.MOUSEDOWN_BUTTONS_UPDATE](state, payload) {
    state.pressedMouseButtonNames = payload;
  },
  [mutationTypes.MOUSEDOWN_TARGET_UPDATE](state, payload) {
    state.mousedownComponentName = payload;
  },
  [mutationTypes.MOUSEUP_TARGET_UPDATE](state, payload) {
    state.mouseupComponentName = payload;
  },
  [mutationTypes.DOWN_KEYS_UPDATE](state, payload) {
    state.pressedKeyboardCodes = payload;
  },
  [mutationTypes.WHEEL_TARGET_UPDATE](state, payload) {
    state.wheelComponentName = payload;
  },
  [mutationTypes.WHEEL_TIMESTAMP_UPDATE](state, payload) {
    state.wheelTimestamp = payload;
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
    if (buttons) {
      commit(mutationTypes.MOUSEDOWN_BUTTONS_UPDATE, getButtonNames(buttons));
    }
    commit(mutationTypes.MOUSEDOWN_TARGET_UPDATE, target);
  },
  [actionTypes.MOUSEUP_UPDATE]({ commit }, mouseupEvent) {
    const { buttons, target } = mouseupEvent;
    if (buttons) {
      commit(mutationTypes.MOUSEDOWN_BUTTONS_UPDATE, getButtonNames(buttons));
    }
    commit(mutationTypes.MOUSEUP_TARGET_UPDATE, target);
  },
  [actionTypes.KEYDOWN_UPDATE]({ commit, state }, downKey) {
    const tempKeys = [...state.pressedKeyboardCodes];
    if (!tempKeys.includes(downKey)) tempKeys.push(downKey);
    commit(mutationTypes.DOWN_KEYS_UPDATE, tempKeys);
  },
  [actionTypes.KEYUP_UPDATE]({ commit, state }, upKey) {
    const tempKeys = [...state.pressedKeyboardCodes];
    if (tempKeys.includes(upKey)) tempKeys.splice(tempKeys.indexOf(upKey), 1);
    commit(mutationTypes.DOWN_KEYS_UPDATE, tempKeys);
  },
  [actionTypes.WHEEL_UPDATE]({ commit }, wheelEvent) {
    const { target, timestamp } = wheelEvent;
    commit(mutationTypes.WHEEL_TARGET_UPDATE, target);
    commit(mutationTypes.WHEEL_TIMESTAMP_UPDATE, timestamp);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
