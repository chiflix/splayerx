// reserved component type
export const INPUT_COMPONENT_TYPE = 'INPUT_COMPONENT_TYPE';

// default options
export const nameDefaultOption = 'InputPlugin';
export const namespacedDefaultOption = false;
export const mouseDefaultOptions = {
  mousemove: {
    position: true,
    component: true,
    phase: true,
  },
  mousedown: {
    buttons: true,
    component: true,
  },
};
export const keyboardDefaultOptions = {
  keys: true,
  alt: true,
  shift: true,
  ctrl: true,
  meta: true, // note that when global shortcuts happens, this will sometimes function abnormally
};
export const wheelDefaultOptions = {
  phase: true,
  direction: true,
  deltaX: true,
  deltaY: true,
  deltaZ: true,
  device: true,
  component: true,
};
export const defaultOptions = {
  name: nameDefaultOption,
  namespaced: namespacedDefaultOption,
  mouse: mouseDefaultOptions,
  keyboard: keyboardDefaultOptions,
  wheel: wheelDefaultOptions,
};

// vuex state posibble values

// mousemove phases
export const MOUSEMOVE_MOVING_PHASE = 'moving';
export const MOUSEMOVE_STOPPED_PHASE = 'stopped';
export const mousemovePhases = [
  MOUSEMOVE_MOVING_PHASE,
  MOUSEMOVE_STOPPED_PHASE,
];
// wheel phases
export const WHEEL_SCROLL_TOUCH_BEGIN_PHASE = 'scroll-touch-start';
export const WHEEL_SCROLLING_PHASE = 'scrolling';
export const WHEEL_SCROLL_TOUCH_END_PHASE = 'scroll-touch-end';
export const WHEEL_INERTIAL_SCROLLING_PHASE = 'inertial-scrolling';
export const WHEEL_STOPPED_PHASE = 'stopped';
export const wheelPhases = [
  WHEEL_SCROLL_TOUCH_BEGIN_PHASE,
  WHEEL_SCROLLING_PHASE,
  WHEEL_SCROLL_TOUCH_END_PHASE,
  WHEEL_INERTIAL_SCROLLING_PHASE,
  WHEEL_STOPPED_PHASE,
];
// wheel directions
export const WHEEL_NO_DIRECTION = '';
export const WHEEL_HORIZONTAL_DIRECTION = 'horizontal';
export const WHEEL_VERTICAL_DIRECTION = 'vertical';
export const wheelDirections = [
  WHEEL_NO_DIRECTION,
  WHEEL_HORIZONTAL_DIRECTION,
  WHEEL_VERTICAL_DIRECTION,
];
// wheel device types
export const WHEEL_MOUSE_DEVICE = 'mouse';
export const WHEEL_TRACKPAD_DEVICE = 'trackpad';
export const wheelDeviceTypes = [
  WHEEL_MOUSE_DEVICE,
  WHEEL_TRACKPAD_DEVICE,
];

// mutation types
export const mutationTypes = {
  MOUSEMOVE_CLIENT_POSITION: 'MOUSEMOVE_CLIENT_POSITION_UPDATE',
  MOUSEMOVE_COMPONENT_NAME: 'MOUSEMOVE_COMPONENT_NAME_UPDATE',
  MOUSEMOVE_PHASE: 'MOUSEMOVE_PHASE_UPDATE',
  MOUSEDOWN_BUTTON_NAMES: 'MOUSEDOWN_BUTTONS_UPDATE',
  MOUSEDOWN_COMPONENT_NAME: 'MOUSEDOWN_COMPONENT_NAME_UPDATE',
  MOUSEUP_COMPONENT_NAME: 'MOUSEUP_COMPONENT_NAME_UPDATE',
  PRESSED_KEY_CODES: 'PRESSED_KEY_CODES_UPDATE',
  ALT_KEY_PRESSED_KEY_CODES: 'ALT_KEY_PRESSED_KEY_CODES_UPDATE',
  SHIFT_KEY_PRESSED_KEY_CODES: 'SHIFT_KEY_PRESSED_KEY_CODES_UPDATE',
  CTRL_KEY_PRESSED_KEY_CODES: 'CTRL_KEY_PRESSED_KEY_CODES_UPDATE',
  META_KEY_PRESSED_KEY_CODES: 'META_KEY_PRESSED_KEY_CODES_UPDATE',
  WHEEL_PHASE: 'WHEEL_PHASE_UPDATE',
  WHEEL_DIRECTION: 'WHEEL_DIRECTION_UPDATE',
  WHEEL_COMPONENT_NAME: 'WHEEL_COMPONENT_NAME_UPDATE',
  WHEEL_DELTA_X: 'WHEEL_DELTA_X_UPDATE',
  WHEEL_DELTA_Y: 'WHEEL_DELTA_Y_UPDATE',
  WHEEL_DELTA_Z: 'WHEEL_DELTA_Z_UPDATE',
  WHEEL_DEVICE_TYPE: 'WHEEL_DEVICE_TYPE_UPDATE',
};

// action types
export const actionTypes = {
  UPDATE_MOUSEMOVE_POSITION: 'UPDATE_MOUSEMOVE_POSITION',
  UPDATE_MOUSEMOVE_COMPONENT: 'UPDATE_MOUSEMOVE_COMPONENT',
  UPDATE_MOUSEMOVE_PHASE: 'UPDATE_MOUSEMOVE_PHASE',
  UPDATE_MOUSEDOWN_COMPONENT: 'UPDATE_MOUSEDOWN_COMPONENT',
  UPDATE_MOUSEDOWN_BUTTONS: 'UPDATE_MOUSEDOWN_BUTTONS',
  UPDATE_MOUSEUP_COMPONENT: 'UPDATE_MOUSEUP_COMPONENT',
  UPDATE_MOUSEUP_BUTTONS: 'UPDATE_MOUSEUP_BUTTONS',
  UPDATE_KEYDOWN_CODES: 'UPDATE_KEYDOWN_CODES',
  UPDATE_KEYUP_CODES: 'UPDATE_KEYUP_CODES',
  UPDATE_ALT_KEYDOWN_CODES: 'UPDATE_ALT_KEYDOWN_CODES',
  UPDATE_ALT_KEYUP_CODES: 'UPDATE_ALT_KEYUP_CODES',
  UPDATE_SHIFT_KEYDOWN_CODES: 'UPDATE_SHIFT_KEYDOWN_CODES',
  UPDATE_SHIFT_KEYUP_CODES: 'UPDATE_SHIFT_KEYUP_CODES',
  UPDATE_CTRL_KEYDOWN_CODES: 'UPDATE_CTRL_KEYDOWN_CODES',
  UPDATE_CTRL_KEYUP_CODES: 'UPDATE_CTRL_KEYUP_CODES',
  UPDATE_META_KEYDOWN_CODES: 'UPDATE_META_KEYDOWN_CODES',
  UPDATE_META_KEYUP_CODES: 'UPDATE_META_KEYUP_CODES',
  UPDATE_WHEEL_PHASE: 'UPDATE_WHEEL_PHASE',
  UPDATE_WHEEL_DIRECTION: 'UPDATE_WHEEL_DIRECTION',
  UPDATE_WHEEL_COMPONENT: 'UPDATE_WHEEL_COMPONENT',
  UPDATE_WHEEL_DEVICE: 'UPDATE_WHEEL_DEVICE',
  UPDATE_WHEEL_DELTA_X: 'UPDATE_WHEEL_DELTA_X',
  UPDATE_WHEEL_DELTA_Y: 'UPDATE_WHEEL_DELTA_Y',
  UPDATE_WHEEL_DELTA_Z: 'UPDATE_WHEEL_DELTA_Z',
};

// getter types
export const getterTypes = {
  GET_MOUSEMOVE_POSITION: 'mousemovePosition',
  GET_MOUSEMOVE_COMPONENT: 'mousemoveComponent',
  GET_MOUSEMOVE_PHASE: 'mousemovePhase',
  GET_MOUSEMOVE_STOPPED: 'mousemoveStopped',
  GET_MOUSEDOWN_BUTTONS: 'mousedownButtons',
  GET_WHICH_BUTTON_PRESSED: 'whichButtonPressed',
  GET_MOUSEDOWN_COMPONENT: 'mousedownComponent',
  GET_MOUSEUP_COMPONENT: 'mouseupComponent',
  GET_WHICH_KEY_PRESSED: 'whichKeyPressed',
  GET_KEYS: 'keys',
  GET_ALT_KEYS: 'altKeys',
  GET_SHIFT_KEYS: 'shiftKeys',
  GET_CTRL_KEYS: 'ctrlKeys',
  GET_META_KEYS: 'metaKeys',
  GET_WHEEL_PHASE: 'wheelPhase',
  GET_WHEEL_STOPPED: 'wheelStopped',
  GET_WHEEL_DIRECTION: 'wheelDirection',
  GET_WHEEL_COMPONENT: 'wheelComponent',
  GET_WHEEL_DEVICE: 'wheelDevice',
};
