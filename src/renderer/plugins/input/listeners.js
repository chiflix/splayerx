import { actionTypes as t, defaultOptions as o } from './constants';
import { dispatch } from './helpers';

export function generateMousemoveListener(options = o.mouse.mousemove) {
  const { component, position, phase } = options;
  return (event) => {
    if (component) dispatch(t.UPDATE_MOUSEMOVE_COMPONENT, event);
    if (position) dispatch(t.UPDATE_MOUSEMOVE_POSITION, event);
    if (phase) dispatch(t.UPDATE_MOUSEMOVE_PHASE, event);
  };
}
export function generateMousedownAndMouseupListener(options = o.mouse.mousedown) {
  const { buttons, component } = options;
  return {
    mousedown: (event) => {
      if (buttons) dispatch(t.UPDATE_MOUSEDOWN_BUTTONS, event);
      if (component) dispatch(t.UPDATE_MOUSEDOWN_COMPONENT, event);
    },
    mosueup: (event) => {
      if (buttons) dispatch(t.UPDATE_MOUSEUP_BUTTONS, event);
      if (component) dispatch(t.UPDATE_MOUSEUP_COMPONENT, event);
    },
  };
}
export function generateKeyDownAndKeyUpListener(options = o.keyboard) {
  const {
    keys, alt, shift, ctrl, meta,
  } = options;
  return {
    keydown: (event) => {
      if (keys) dispatch(t.UPDATE_KEYDOWN_CODES, event);
      if (alt) dispatch(t.UPDATE_ALT_KEYDOWN_CODES, event);
      if (shift) dispatch(t.UPDATE_SHIFT_KEYDOWN_CODES, event);
      if (ctrl) dispatch(t.UPDATE_CTRL_KEYDOWN_CODES, event);
      if (meta) dispatch(t.UPDATE_META_KEYDOWN_CODES, event);
    },
    keyup: (event) => {
      if (keys) dispatch(t.UPDATE_KEYUP_CODES, event);
      if (alt) dispatch(t.UPDATE_ALT_KEYUP_CODES, event);
      if (shift) dispatch(t.UPDATE_SHIFT_KEYUP_CODES, event);
      if (ctrl) dispatch(t.UPDATE_CTRL_KEYUP_CODES, event);
      if (meta) dispatch(t.UPDATE_META_KEYUP_CODES, event);
    },
  };
}
export function generateWheelListener(options = o.wheel) {
  const {
    phase, direction, component, device,
    deltaX, deltaY, deltaZ,
  } = options;
  return (event) => {
    if (phase) dispatch(t.UPDATE_WHEEL_PHASE, event);
    if (direction) dispatch(t.UPDATE_WHEEL_DIRECTION, event);
    if (component) dispatch(t.UPDATE_WHEEL_COMPONENT, event);
    if (device) dispatch(t.UPDATE_WHEEL_DEVICE, event);
    if (deltaX) dispatch(t.UPDATE_WHEEL_DELTA_X, event);
    if (deltaY) dispatch(t.UPDATE_WHEEL_DELTA_Y, event);
    if (deltaZ) dispatch(t.UPDATE_WHEEL_DELTA_Z, event);
  };
}
