import { get } from 'lodash';
import {
  defaultOptions,
  mutationTypes as mt,
  actionTypes as at,
  // mousemove phases
  MOUSEMOVE_MOVING_PHASE as mouseMoving, MOUSEMOVE_STOPPED_PHASE as mouseStopped,
  // wheel devices
  WHEEL_MOUSE_DEVICE as mouse, WHEEL_TRACKPAD_DEVICE as trackpad,
  // wheel directions
  WHEEL_NO_DIRECTION as no,
  WHEEL_HORIZONTAL_DIRECTION as horizontal,
  WHEEL_VERTICAL_DIRECTION as vertical,
} from '../constants';
import {
  namespacedNameHelper,
  getComponentName,
  isInteger, isValidComponentName,
  buttonsToButtonNames,
  keydownCalculator as keydownCalc,
  specialKeydownCalculator as speKeydownCalc,
  keyupCalculator as keyupCalc,
  specialKeyupCalculator as speKeyupCalc,
  electronWheel as wheelDetector,
} from '../helpers';

let mousemoveTimer = 0;
const allActions = {
  [at.UPDATE_MOUSEMOVE_COMPONENT]: ({ commit }, { target }) => {
    const { name } = getComponentName(target);
    if (isValidComponentName(name)) commit(mt.MOUSEMOVE_COMPONENT_NAME, name);
  },
  [at.UPDATE_MOUSEMOVE_POSITION]: ({ commit }, { clientX, clientY }) => {
    commit(mt.MOUSEMOVE_CLIENT_POSITION, [clientX, clientY]);
  },
  [at.UPDATE_MOUSEMOVE_PHASE]: ({ commit }) => {
    clearTimeout(mousemoveTimer);
    mousemoveTimer = setTimeout(() => commit(mt.MOUSEMOVE_PHASE, mouseStopped), 100);
    commit(mt.MOUSEMOVE_PHASE, mouseMoving);
  },
  [at.UPDATE_MOUSEDOWN_BUTTONS]: ({ commit }, { buttons }) => {
    commit(mt.MOUSEDOWN_BUTTON_NAMES, buttonsToButtonNames(buttons));
  },
  [at.UPDATE_MOUSEDOWN_COMPONENT]: ({ commit }, { target }) => {
    const { name } = getComponentName(target);
    if (isValidComponentName(name)) commit(mt.MOUSEDOWN_COMPONENT_NAME, name);
  },
  [at.UPDATE_MOUSEUP_BUTTONS]: ({ commit }, { buttons }) => {
    commit(mt.MOUSEDOWN_BUTTON_NAMES, buttonsToButtonNames(buttons));
  },
  [at.UPDATE_MOUSEUP_COMPONENT]: ({ commit }, { target }) => {
    const { name } = getComponentName(target);
    if (isValidComponentName(name)) commit(mt.MOUSEUP_COMPONENT_NAME, name);
  },
  [at.UPDATE_KEYDOWN_CODES]: ({ commit, getters }, { code }) => {
    const { keys } = getters;
    commit(mt.PRESSED_KEY_CODES, keydownCalc(keys, code));
  },
  [at.UPDATE_KEYUP_CODES]: ({ commit, getters }, { code }) => {
    const { keys } = getters;
    commit(mt.PRESSED_KEY_CODES, keyupCalc(keys, code));
  },
  [at.UPDATE_ALT_KEYDOWN_CODES]: ({ commit, getters }, { altKey, code }) => {
    if (altKey) {
      const { altKeys } = getters;
      commit(mt.ALT_KEY_PRESSED_KEY_CODES, speKeydownCalc(altKeys, code));
    }
  },
  [at.UPDATE_ALT_KEYUP_CODES]: ({ commit, getters }, { altKey, code }) => {
    if (altKey) {
      const { altKeys } = getters;
      commit(mt.ALT_KEY_PRESSED_KEY_CODES, speKeyupCalc(altKeys, code));
    }
  },
  [at.UPDATE_SHIFT_KEYDOWN_CODES]: ({ commit, getters }, { shiftKey, code }) => {
    if (shiftKey) {
      const { shiftKeys } = getters;
      commit(mt.SHIFT_KEY_PRESSED_KEY_CODES, speKeydownCalc(shiftKeys, code));
    }
  },
  [at.UPDATE_SHIFT_KEYUP_CODES]: ({ commit, getters }, { shiftKey, code }) => {
    if (shiftKey) {
      const { shiftKeys } = getters;
      commit(mt.SHIFT_KEY_PRESSED_KEY_CODES, speKeyupCalc(shiftKeys, code));
    }
  },
  [at.UPDATE_CTRL_KEYDOWN_CODES]: ({ commit, getters }, { ctrlKey, code }) => {
    if (ctrlKey) {
      const { ctrlKeys } = getters;
      commit(mt.CTRL_KEY_PRESSED_KEY_CODES, speKeydownCalc(ctrlKeys, code));
    }
  },
  [at.UPDATE_CTRL_KEYUP_CODES]: ({ commit, getters }, { ctrlKey, code }) => {
    if (ctrlKey) {
      const { ctrlKeys } = getters;
      commit(mt.CTRL_KEY_PRESSED_KEY_CODES, speKeyupCalc(ctrlKeys, code));
    }
  },
  [at.UPDATE_META_KEYDOWN_CODES]: ({ commit, getters }, { metaKey, code }) => {
    if (metaKey) {
      const { metaKeys } = getters;
      commit(mt.META_KEY_PRESSED_KEY_CODES, speKeydownCalc(metaKeys, code));
    }
  },
  [at.UPDATE_META_KEYUP_CODES]: ({ commit, getters }, { metaKey, code }) => {
    if (metaKey) {
      const { metaKeys } = getters;
      commit(mt.META_KEY_PRESSED_KEY_CODES, speKeyupCalc(metaKeys, code));
    }
  },
  [at.UPDATE_WHEEL_PHASE]: ({ commit }, event) => {
    if (!wheelDetector.listeners('phase-change').length) {
      wheelDetector.on('phase-change', phase => commit(mt.WHEEL_PHASE, phase));
    }
    wheelDetector.calcalate(event);
  },
  [at.UPDATE_WHEEL_DIRECTION]: ({ commit, getters }, { deltaX, deltaY }) => {
    const { wheelDirection: d } = getters;
    if (deltaX && (d === no || d === horizontal)) commit(mt.WHEEL_DIRECTION, horizontal);
    else if (deltaY && (d === no || d === vertical)) commit(mt.WHEEL_DIRECTION, vertical);
    else commit(mt.WHEEL_DIRECTION, no);
  },
  [at.UPDATE_WHEEL_COMPONENT]: ({ commit }, { target }) => {
    const { name } = getComponentName(target);
    if (isValidComponentName(name)) commit(mt.WHEEL_COMPONENT_NAME, name);
  },
  [at.UPDATE_WHEEL_DEVICE]: ({ commit }, { deltaX, deltaY, deltaZ }) => {
    if (isInteger(deltaX) && isInteger(deltaY) && isInteger(deltaZ)) {
      commit(mt.WHEEL_DEVICE_TYPE, trackpad);
    } else commit(mt.WHEEL_DEVICE_TYPE, mouse);
  },
  [at.UPDATE_WHEEL_DELTA_X]: ({ commit }, { deltaX }) => {
    commit(mt.WHEEL_DELTA_X, deltaX);
  },
  [at.UPDATE_WHEEL_DELTA_Y]: ({ commit }, { deltaY }) => {
    commit(mt.WHEEL_DELTA_Y, deltaY);
  },
  [at.UPDATE_WHEEL_DELTA_Z]: ({ commit }, { deltaZ }) => {
    commit(mt.WHEEL_DELTA_Z, deltaZ);
  },
};

// eslint-disable-next-line complexity
export default function actions(options = defaultOptions) {
  const result = {};
  const {
    name, namespaced,
    mouse, keyboard, wheel,
  } = options;
  function nameHelper(mutationName) {
    return namespacedNameHelper(namespaced, mutationName, name);
  }
  if (get(mouse, 'mousemove.position')) {
    result[nameHelper(at.UPDATE_MOUSEMOVE_POSITION)] = allActions[at.UPDATE_MOUSEMOVE_POSITION];
  }
  if (get(mouse, 'mousemove.component')) {
    result[nameHelper(at.UPDATE_MOUSEMOVE_COMPONENT)] = allActions[at.UPDATE_MOUSEMOVE_COMPONENT];
  }
  if (get(mouse, 'mousemove.phase')) {
    result[nameHelper(at.UPDATE_MOUSEMOVE_PHASE)] = allActions[at.UPDATE_MOUSEMOVE_PHASE];
  }
  if (get(mouse, 'mousedown.buttons')) {
    result[nameHelper(at.UPDATE_MOUSEDOWN_BUTTONS)] = allActions[at.UPDATE_MOUSEDOWN_BUTTONS];
    result[nameHelper(at.UPDATE_MOUSEUP_BUTTONS)] = allActions[at.UPDATE_MOUSEUP_BUTTONS];
  }
  if (get(mouse, 'mousedown.component')) {
    result[nameHelper(at.UPDATE_MOUSEDOWN_COMPONENT)] = allActions[at.UPDATE_MOUSEDOWN_COMPONENT];
  }
  if (get(mouse, 'mosueup.component')) {
    result[nameHelper(at.UPDATE_MOUSEUP_COMPONENT)] = allActions[at.UPDATE_MOUSEUP_COMPONENT];
  }
  if (get(keyboard, 'keys')) {
    result[nameHelper(at.UPDATE_KEYDOWN_CODES)] = allActions[at.UPDATE_KEYDOWN_CODES];
    result[nameHelper(at.UPDATE_KEYUP_CODES)] = allActions[at.UPDATE_KEYUP_CODES];
  }
  if (get(keyboard, 'alt')) {
    result[nameHelper(at.UPDATE_ALT_KEYDOWN_CODES)] = allActions[at.UPDATE_ALT_KEYDOWN_CODES];
    result[nameHelper(at.UPDATE_ALT_KEYUP_CODES)] = allActions[at.UPDATE_ALT_KEYUP_CODES];
  }
  if (get(keyboard, 'shift')) {
    result[nameHelper(at.UPDATE_SHIFT_KEYDOWN_CODES)] = allActions[at.UPDATE_SHIFT_KEYDOWN_CODES];
    result[nameHelper(at.UPDATE_SHIFT_KEYUP_CODES)] = allActions[at.UPDATE_SHIFT_KEYUP_CODES];
  }
  if (get(keyboard, 'ctrl')) {
    result[nameHelper(at.UPDATE_CTRL_KEYDOWN_CODES)] = allActions[at.UPDATE_CTRL_KEYDOWN_CODES];
    result[nameHelper(at.UPDATE_CTRL_KEYUP_CODES)] = allActions[at.UPDATE_CTRL_KEYUP_CODES];
  }
  if (get(keyboard, 'meta')) {
    result[nameHelper(at.UPDATE_META_KEYDOWN_CODES)] = allActions[at.UPDATE_META_KEYDOWN_CODES];
    result[nameHelper(at.UPDATE_META_KEYUP_CODES)] = allActions[at.UPDATE_META_KEYUP_CODES];
  }
  if (get(wheel, 'phase')) {
    result[nameHelper(at.UPDATE_WHEEL_PHASE)] = allActions[at.UPDATE_WHEEL_PHASE];
  }
  if (get(wheel, 'direction')) {
    result[nameHelper(at.UPDATE_WHEEL_DIRECTION)] = allActions[at.UPDATE_WHEEL_DIRECTION];
  }
  if (get(wheel, 'component')) {
    result[nameHelper(at.UPDATE_WHEEL_COMPONENT)] = allActions[at.UPDATE_WHEEL_COMPONENT];
  }
  if (get(wheel, 'device')) {
    result[nameHelper(at.UPDATE_WHEEL_DEVICE)] = allActions[at.UPDATE_WHEEL_DEVICE];
  }
  if (get(wheel, 'deltaX')) {
    result[nameHelper(at.UPDATE_WHEEL_DELTA_X)] = allActions[at.UPDATE_WHEEL_DELTA_X];
  }
  if (get(wheel, 'deltaY')) {
    result[nameHelper(at.UPDATE_WHEEL_DELTA_Y)] = allActions[at.UPDATE_WHEEL_DELTA_Y];
  }
  if (get(wheel, 'deltaZ')) {
    result[nameHelper(at.UPDATE_WHEEL_DELTA_Z)] = allActions[at.UPDATE_WHEEL_DELTA_Z];
  }
  return result;
}
