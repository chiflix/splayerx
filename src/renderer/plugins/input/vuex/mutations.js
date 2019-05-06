import { get } from 'lodash';
import {
  defaultOptions,
  mutationTypes as t,
} from '../constants';

const allMutations = {
  [t.MOUSEMOVE_CLIENT_POSITION]: (state, positionArray) => {
    const x = positionArray[0];
    const y = positionArray[1];
    state.mousemoveClientPosition = { x, y };
  },
  [t.MOUSEMOVE_COMPONENT_NAME]: (state, componentName) => {
    state.mousemoveComponentName = componentName;
  },
  [t.MOUSEMOVE_PHASE]: (state, phase) => {
    state.mousemovePhase = phase;
  },
  [t.MOUSEDOWN_BUTTON_NAMES]: (state, buttonNames) => {
    state.mousedownButtonNames = buttonNames;
  },
  [t.MOUSEDOWN_COMPONENT_NAME]: (state, componentName) => {
    state.mousedownComponentName = componentName;
  },
  [t.MOUSEUP_COMPONENT_NAME]: (state, componentName) => {
    state.mouseupComponentName = componentName;
  },
  [t.PRESSED_KEY_CODES]: (state, keycodes) => {
    state.pressedKeyCodes = keycodes;
  },
  [t.ALT_KEY_PRESSED_KEY_CODES]: (state, altKeyPressedKeyCodes) => {
    state.altKeyPressedKeyCodes = altKeyPressedKeyCodes;
  },
  [t.SHIFT_KEY_PRESSED_KEY_CODES]: (state, shiftKeyPressedKeyCodes) => {
    state.shiftKeyPressedKeyCodes = shiftKeyPressedKeyCodes;
  },
  [t.CTRL_KEY_PRESSED_KEY_CODES]: (state, ctrlKeyPressedKeyCodes) => {
    state.ctrlKeyPressedKeyCodes = ctrlKeyPressedKeyCodes;
  },
  [t.META_KEY_PRESSED_KEY_CODES]: (state, metaKeyPressedKeyCodes) => {
    state.metaKeyPressedKeyCodes = metaKeyPressedKeyCodes;
  },
  [t.WHEEL_PHASE]: (state, phase) => {
    state.wheelPhase = phase;
  },
  [t.WHEEL_DIRECTION]: (state, wheelDirection) => {
    state.wheelDirection = wheelDirection;
  },
  [t.WHEEL_COMPONENT_NAME]: (state, componentName) => {
    state.wheelComponentName = componentName;
  },
  [t.WHEEL_DEVICE_TYPE]: (state, deviceType) => {
    state.wheelDeviceType = deviceType;
  },
  [t.WHEEL_DELTA_X]: (state, deltaX) => {
    state.wheelDeltaX = deltaX;
  },
  [t.WHEEL_DELTA_Y]: (state, deltaY) => {
    state.wheelDeltaX = deltaY;
  },
  [t.WHEEL_DELTA_Z]: (state, deltaZ) => {
    state.wheelDeltaZ = deltaZ;
  },
};

// eslint-disable-next-line complexity
export default function mutations(options = defaultOptions) {
  const result = {};
  const { mouse, keyboard, wheel } = options;
  if (get(mouse, 'mousemove.position')) {
    result[t.MOUSEMOVE_CLIENT_POSITION] = allMutations[t.MOUSEMOVE_CLIENT_POSITION];
  }
  if (get(mouse, 'mousemove.component')) {
    result[t.MOUSEMOVE_COMPONENT_NAME] = allMutations[t.MOUSEMOVE_COMPONENT_NAME];
  }
  if (get(mouse, 'mousemove.phase')) {
    result[t.MOUSEMOVE_PHASE] = allMutations[t.MOUSEMOVE_PHASE];
  }
  if (get(mouse, 'mousedown.buttons')) {
    result[t.MOUSEDOWN_BUTTON_NAMES] = allMutations[t.MOUSEDOWN_BUTTON_NAMES];
  }
  if (get(mouse, 'mousedown.component')) {
    result[t.MOUSEDOWN_COMPONENT_NAME] = allMutations[t.MOUSEDOWN_COMPONENT_NAME];
  }
  if (get(mouse, 'mosueup.component')) {
    result[t.MOUSEUP_COMPONENT_NAME] = allMutations[t.MOUSEUP_COMPONENT_NAME];
  }
  if (get(keyboard, 'keys')) {
    result[t.PRESSED_KEY_CODES] = allMutations[t.PRESSED_KEY_CODES];
  }
  if (get(keyboard, 'alt')) {
    result[t.ALT_KEY_PRESSED_KEY_CODES] = allMutations[t.ALT_KEY_PRESSED_KEY_CODES];
  }
  if (get(keyboard, 'shift')) {
    result[t.SHIFT_KEY_PRESSED_KEY_CODES] = allMutations[t.SHIFT_KEY_PRESSED_KEY_CODES];
  }
  if (get(keyboard, 'ctrl')) {
    result[t.CTRL_KEY_PRESSED_KEY_CODES] = allMutations[t.CTRL_KEY_PRESSED_KEY_CODES];
  }
  if (get(keyboard, 'meta')) {
    result[t.META_KEY_PRESSED_KEY_CODES] = allMutations[t.META_KEY_PRESSED_KEY_CODES];
  }
  if (get(wheel, 'phase') || get(wheel, 'direction')) {
    result[t.WHEEL_PHASE] = allMutations[t.WHEEL_PHASE];
    result[t.WHEEL_DIRECTION] = allMutations[t.WHEEL_DIRECTION];
  }
  if (get(wheel, 'component')) {
    result[t.WHEEL_COMPONENT_NAME] = allMutations[t.WHEEL_COMPONENT_NAME];
  }
  if (get(wheel, 'device')) {
    result[t.WHEEL_DEVICE_TYPE] = allMutations[t.WHEEL_DEVICE_TYPE];
  }
  if (get(wheel, 'deltaX')) {
    result[t.WHEEL_DELTA_X] = allMutations[t.WHEEL_DELTA_X];
  }
  if (get(wheel, 'deltaY')) {
    result[t.WHEEL_DELTA_Y] = allMutations[t.WHEEL_DELTA_Y];
  }
  if (get(wheel, 'deltaZ')) {
    result[t.WHEEL_DELTA_Z] = allMutations[t.WHEEL_DELTA_Z];
  }
  return result;
}
