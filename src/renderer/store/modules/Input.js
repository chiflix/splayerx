import { Input as mutationTypes } from '../mutationTypes';
import { Input as actionTypes } from '../actionTypes';

const state = {
  mousemoveClientPosition: { x: 0, y: 0 },
  mousemoveComponentName: 'TheVideoController',
  pressedMouseButtonNames: [],
  mousedownComponentName: 'TheVideoController',
  mouseupComponentName: 'TheVideoController',
  pressedKeyboardCodes: [],
  wheelComponentName: 'TheVideoController',
  wheelTimestamp: 0,
  wheelDirection: '',
};

const getters = {
  progressKeydown: state => state.pressedKeyboardCodes.includes('ArrowLeft') || state.pressedKeyboardCodes.includes('ArrowRight') || state.pressedKeyboardCodes.includes('BracketLeft') || state.pressedKeyboardCodes.includes('BracketRight'),
  volumeKeydown: state => state.pressedKeyboardCodes.includes('KeyM') || state.pressedKeyboardCodes.includes('Minus') || state.pressedKeyboardCodes.includes('Equal'),
  leftMousedown: state => state.pressedMouseButtonNames.includes('left'),
  wheelTriggered: state => state.wheelTimestamp,
  volumeWheelTriggered: ({ wheelDirection, wheelComponentName }, { showSidebar }) => (
    wheelDirection === 'vertical'
    && wheelComponentName !== 'SubtitleControl' && wheelComponentName !== 'AdvanceControl' && wheelComponentName !== 'AudioTranslateModal'
    && !showSidebar
  ),
};

const mutations = {
  [mutationTypes.MOUSEMOVE_CLIENT_POSITION_UPDATE](state, payload) {
    state.mousemoveClientPosition = payload;
  },
  [mutationTypes.MOUSEMOVE_COMPONENT_NAME_UPDATE](state, payload) {
    state.mousemoveComponentName = payload;
  },
  [mutationTypes.PRESSED_MOUSE_BUTTON_NAMES_UPDATE](state, payload) {
    state.pressedMouseButtonNames = payload;
  },
  [mutationTypes.MOUSEDOWN_COMPONENT_NAME_UPDATE](state, payload) {
    state.mousedownComponentName = payload;
  },
  [mutationTypes.MOUSEUP_COMPONENT_NAME_UPDATE](state, payload) {
    state.mouseupComponentName = payload;
  },
  [mutationTypes.PRESSED_KEYBOARD_CODES_UPDATE](state, payload) {
    state.pressedKeyboardCodes = payload;
  },
  [mutationTypes.WHEEL_COMPONENT_NAME_UPDATE](state, payload) {
    state.wheelComponentName = payload;
  },
  [mutationTypes.WHEEL_TIMESTAMP_UPDATE](state, payload) {
    state.wheelTimestamp = payload;
  },
  [mutationTypes.WHEEL_DIRECTION_UPDATE](state, payload) {
    state.wheelDirection = payload;
  },
};

const buttonsToButtonNames = (buttons) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
  const buttonsMap = ['left', 'right', 'middle', 'back', 'forward'];
  return buttons.toString(2).split('').reverse()
    .map((number, index) => (number === '1' ? buttonsMap[index] : ''))
    .filter(button => button !== '');
};

const actions = {
  [actionTypes.MOUSEMOVE_UPDATE]({ commit }, { clientPosition: position, componentName }) {
    commit(mutationTypes.MOUSEMOVE_CLIENT_POSITION_UPDATE, { x: position[0], y: position[1] });
    commit(mutationTypes.MOUSEMOVE_COMPONENT_NAME_UPDATE, componentName);
  },
  [actionTypes.MOUSEDOWN_UPDATE]({ commit }, { buttons, componentName }) {
    if (buttons) {
      commit(mutationTypes.PRESSED_MOUSE_BUTTON_NAMES_UPDATE, buttonsToButtonNames(buttons));
    }
    commit(mutationTypes.MOUSEDOWN_COMPONENT_NAME_UPDATE, componentName);
  },
  [actionTypes.MOUSEUP_UPDATE]({ commit }, { buttons, componentName }) {
    if (buttons) {
      commit(mutationTypes.PRESSED_MOUSE_BUTTON_NAMES_UPDATE, buttonsToButtonNames(buttons));
    }
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
  [actionTypes.WHEEL_UPDATE]({ commit }, { componentName, timestamp, direction }) {
    commit(mutationTypes.WHEEL_COMPONENT_NAME_UPDATE, componentName);
    commit(mutationTypes.WHEEL_TIMESTAMP_UPDATE, timestamp);
    commit(mutationTypes.WHEEL_DIRECTION_UPDATE, direction);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
