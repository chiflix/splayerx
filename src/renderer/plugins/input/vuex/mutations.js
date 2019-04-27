/* eslint-disable no-fallthrough */
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
  // eslint-disable-next-line default-case
  switch (true) {
    case options.mouse.mousemove.position:
      result[t.MOUSEMOVE_CLIENT_POSITION] = allMutations[t.MOUSEMOVE_CLIENT_POSITION];
    case options.mouse.mousemove.component:
      result[t.MOUSEMOVE_COMPONENT_NAME] = allMutations[t.MOUSEMOVE_COMPONENT_NAME];
    case options.mouse.mousemove.phase:
      result[t.MOUSEMOVE_PHASE] = allMutations[t.MOUSEMOVE_PHASE];
    case options.mouse.mousedown.buttons:
      result[t.MOUSEDOWN_BUTTON_NAMES] = allMutations[t.MOUSEDOWN_BUTTON_NAMES];
    case options.mouse.mousedown.component:
      result[t.MOUSEDOWN_COMPONENT_NAME] = allMutations[t.MOUSEDOWN_COMPONENT_NAME];
    case options.mouse.mouseup.component:
      result[t.MOUSEUP_COMPONENT_NAME] = allMutations[t.MOUSEUP_COMPONENT_NAME];
    case options.keyboard.keys:
      result[t.PRESSED_KEY_CODES] = allMutations[t.PRESSED_KEY_CODES];
    case options.keyboard.alt:
      result[t.ALT_KEY_PRESSED_KEY_CODES] = allMutations[t.ALT_KEY_PRESSED_KEY_CODES];
    case options.keyboard.shift:
      result[t.SHIFT_KEY_PRESSED_KEY_CODES] = allMutations[t.SHIFT_KEY_PRESSED_KEY_CODES];
    case options.keyboard.ctrl:
      result[t.CTRL_KEY_PRESSED_KEY_CODES] = allMutations[t.CTRL_KEY_PRESSED_KEY_CODES];
    case options.keyboard.meta:
      result[t.META_KEY_PRESSED_KEY_CODES] = allMutations[t.META_KEY_PRESSED_KEY_CODES];
    case options.wheel.phase:
      result[t.WHEEL_PHASE] = allMutations[t.WHEEL_PHASE];
    case options.wheel.direction:
      result[t.WHEEL_DIRECTION] = allMutations[t.WHEEL_DIRECTION];
    case options.wheel.component:
      result[t.WHEEL_COMPONENT_NAME] = allMutations[t.WHEEL_COMPONENT_NAME];
    case options.wheel.device:
      result[t.WHEEL_DEVICE_TYPE] = allMutations[t.WHEEL_DEVICE_TYPE];
    case options.wheel.deltaX:
      result[t.WHEEL_DELTA_X] = allMutations[t.WHEEL_DELTA_X];
    case options.wheel.deltaY:
      result[t.WHEEL_DELTA_Y] = allMutations[t.WHEEL_DELTA_Y];
    case options.wheel.deltaZ:
      result[t.WHEEL_DELTA_Z] = allMutations[t.WHEEL_DELTA_Z];
  }
  return result;
}
