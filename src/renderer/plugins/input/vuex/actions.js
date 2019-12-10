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
  // wheel phases
  WHEEL_STOPPED_PHASE as wheelStopped,
} from '../constants';
import {
  getComponentName,
} from '../helpers/componentStore';
import {
  isInteger, isValidComponentName,
} from '../helpers/validators';
import {
  buttonsToButtonNames,
} from '../helpers/buttonsToButtonNames';
import {
  keydownCalculator as keydownCalc,
  specialKeydownCalculator as speKeydownCalc,
  keyupCalculator as keyupCalc,
  specialKeyupCalculator as speKeyupCalc,
} from '../helpers/keyboardCalculator';
import {
  lethargyWheel, electronWheel,
} from '../helpers/wheelDetector';

const wheelDetector = process.platform === 'darwin' ? electronWheel : lethargyWheel;

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
      wheelDetector.on('phase-change', (phase) => {
        commit(mt.WHEEL_PHASE, phase);
        if (
          phase === wheelStopped
          && ((process.platform === 'darwin' && wheelDetector.scrollEnd) || process.platform !== 'darwin')
        ) {
          commit(mt.WHEEL_DIRECTION, no);
        }
      });
    }
    if (process.platform !== 'darwin'
      || (process.platform === 'darwin' && !wheelDetector.isTrackPad)) {
      console.warn('cac', wheelDetector.isTrackPad);
      wheelDetector.calculate(event);
    }
  },
  [at.UPDATE_WHEEL_DIRECTION]: ({ commit, getters }, { deltaX, deltaY }) => {
    const { wheelDirection: d } = getters;
    // angle less than 45 degrees will result to horizontal
    const direction = Math.abs(deltaX) > Math.abs(deltaY) ? horizontal : vertical;
    if (
      direction === horizontal
      && (d === no || d === horizontal)
    ) commit(mt.WHEEL_DIRECTION, horizontal);
    else if (
      direction === vertical
      && (d === no || d === vertical)
    ) commit(mt.WHEEL_DIRECTION, vertical);
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
  const { mouse, keyboard, wheel } = options;
  if (get(mouse, 'mousemove.position')) {
    result[at.UPDATE_MOUSEMOVE_POSITION] = allActions[at.UPDATE_MOUSEMOVE_POSITION];
  }
  if (get(mouse, 'mousemove.component')) {
    result[at.UPDATE_MOUSEMOVE_COMPONENT] = allActions[at.UPDATE_MOUSEMOVE_COMPONENT];
  }
  if (get(mouse, 'mousemove.phase')) {
    result[at.UPDATE_MOUSEMOVE_PHASE] = allActions[at.UPDATE_MOUSEMOVE_PHASE];
  }
  if (get(mouse, 'mousedown.buttons')) {
    result[at.UPDATE_MOUSEDOWN_BUTTONS] = allActions[at.UPDATE_MOUSEDOWN_BUTTONS];
    result[at.UPDATE_MOUSEUP_BUTTONS] = allActions[at.UPDATE_MOUSEUP_BUTTONS];
  }
  if (get(mouse, 'mousedown.component')) {
    result[at.UPDATE_MOUSEDOWN_COMPONENT] = allActions[at.UPDATE_MOUSEDOWN_COMPONENT];
  }
  if (get(mouse, 'mosueup.component')) {
    result[at.UPDATE_MOUSEUP_COMPONENT] = allActions[at.UPDATE_MOUSEUP_COMPONENT];
  }
  if (get(keyboard, 'keys')) {
    result[at.UPDATE_KEYDOWN_CODES] = allActions[at.UPDATE_KEYDOWN_CODES];
    result[at.UPDATE_KEYUP_CODES] = allActions[at.UPDATE_KEYUP_CODES];
  }
  if (get(keyboard, 'alt')) {
    result[at.UPDATE_ALT_KEYDOWN_CODES] = allActions[at.UPDATE_ALT_KEYDOWN_CODES];
    result[at.UPDATE_ALT_KEYUP_CODES] = allActions[at.UPDATE_ALT_KEYUP_CODES];
  }
  if (get(keyboard, 'shift')) {
    result[at.UPDATE_SHIFT_KEYDOWN_CODES] = allActions[at.UPDATE_SHIFT_KEYDOWN_CODES];
    result[at.UPDATE_SHIFT_KEYUP_CODES] = allActions[at.UPDATE_SHIFT_KEYUP_CODES];
  }
  if (get(keyboard, 'ctrl')) {
    result[at.UPDATE_CTRL_KEYDOWN_CODES] = allActions[at.UPDATE_CTRL_KEYDOWN_CODES];
    result[at.UPDATE_CTRL_KEYUP_CODES] = allActions[at.UPDATE_CTRL_KEYUP_CODES];
  }
  if (get(keyboard, 'meta')) {
    result[at.UPDATE_META_KEYDOWN_CODES] = allActions[at.UPDATE_META_KEYDOWN_CODES];
    result[at.UPDATE_META_KEYUP_CODES] = allActions[at.UPDATE_META_KEYUP_CODES];
  }
  if (get(wheel, 'phase') || get(wheel, 'direction')) {
    result[at.UPDATE_WHEEL_PHASE] = allActions[at.UPDATE_WHEEL_PHASE];
    result[at.UPDATE_WHEEL_DIRECTION] = allActions[at.UPDATE_WHEEL_DIRECTION];
  }
  if (get(wheel, 'component')) {
    result[at.UPDATE_WHEEL_COMPONENT] = allActions[at.UPDATE_WHEEL_COMPONENT];
  }
  if (get(wheel, 'device')) {
    result[at.UPDATE_WHEEL_DEVICE] = allActions[at.UPDATE_WHEEL_DEVICE];
  }
  if (get(wheel, 'deltaX')) {
    result[at.UPDATE_WHEEL_DELTA_X] = allActions[at.UPDATE_WHEEL_DELTA_X];
  }
  if (get(wheel, 'deltaY')) {
    result[at.UPDATE_WHEEL_DELTA_Y] = allActions[at.UPDATE_WHEEL_DELTA_Y];
  }
  if (get(wheel, 'deltaZ')) {
    result[at.UPDATE_WHEEL_DELTA_Z] = allActions[at.UPDATE_WHEEL_DELTA_Z];
  }
  return result;
}
