import {
  actionTypes as t,
  defaultOptions as o,
  nameDefaultOption,
  namespacedDefaultOption,
} from './constants';
import { namespacedNameHelper } from './helpers/namespacedNameHelper';
import { dispatch } from './helpers/dispatch';

const vuexDefaultOptions = {
  name: nameDefaultOption,
  namespaced: namespacedDefaultOption,
};
const vo = vuexDefaultOptions;

export function generateMousemoveListener(options = o.mouse.mousemove, vuexOptions = vo) {
  const { component, position, phase } = options;
  const { name, namespaced } = vuexOptions;
  function nameHelper(mutationName) {
    return namespacedNameHelper(namespaced, mutationName, name);
  }
  return (event) => {
    if (component) dispatch(nameHelper(t.UPDATE_MOUSEMOVE_COMPONENT), event);
    if (position) dispatch(nameHelper(t.UPDATE_MOUSEMOVE_POSITION), event);
    if (phase) dispatch(nameHelper(t.UPDATE_MOUSEMOVE_PHASE), event);
  };
}
export function generateMousedownAndMouseupListener(options = o.mouse.mousedown, vuexOptions = vo) {
  const { buttons, component } = options;
  const { name, namespaced } = vuexOptions;
  function nameHelper(mutationName) {
    return namespacedNameHelper(namespaced, mutationName, name);
  }
  return {
    mousedown: (event) => {
      if (buttons) dispatch(nameHelper(t.UPDATE_MOUSEDOWN_BUTTONS), event);
      if (component) dispatch(nameHelper(t.UPDATE_MOUSEDOWN_COMPONENT), event);
    },
    mosueup: (event) => {
      if (buttons) dispatch(nameHelper(t.UPDATE_MOUSEUP_BUTTONS), event);
      if (component) dispatch(nameHelper(t.UPDATE_MOUSEUP_COMPONENT), event);
    },
  };
}
export function generateKeyDownAndKeyUpListener(options = o.keyboard, vuexOptions = vo) {
  const {
    keys, alt, shift, ctrl, meta,
  } = options;
  const { name, namespaced } = vuexOptions;
  function nameHelper(mutationName) {
    return namespacedNameHelper(namespaced, mutationName, name);
  }
  return {
    keydown: (event) => {
      if (keys) dispatch(nameHelper(t.UPDATE_KEYDOWN_CODES), event);
      if (alt) dispatch(nameHelper(t.UPDATE_ALT_KEYDOWN_CODES), event);
      if (shift) dispatch(nameHelper(t.UPDATE_SHIFT_KEYDOWN_CODES), event);
      if (ctrl) dispatch(nameHelper(t.UPDATE_CTRL_KEYDOWN_CODES), event);
      if (meta) dispatch(nameHelper(t.UPDATE_META_KEYDOWN_CODES), event);
    },
    keyup: (event) => {
      if (keys) dispatch(nameHelper(t.UPDATE_KEYUP_CODES), event);
      if (alt) dispatch(nameHelper(t.UPDATE_ALT_KEYUP_CODES), event);
      if (shift) dispatch(nameHelper(t.UPDATE_SHIFT_KEYUP_CODES), event);
      if (ctrl) dispatch(nameHelper(t.UPDATE_CTRL_KEYUP_CODES), event);
      if (meta) dispatch(nameHelper(t.UPDATE_META_KEYUP_CODES), event);
    },
  };
}
export function generateWheelListener(options = o.wheel, vuexOptions = vo) {
  const {
    phase, direction, component, device,
    deltaX, deltaY, deltaZ,
  } = options;
  const { name, namespaced } = vuexOptions;
  function nameHelper(mutationName) {
    return namespacedNameHelper(namespaced, mutationName, name);
  }
  return (event) => {
    if (phase) dispatch(nameHelper(t.UPDATE_WHEEL_PHASE), event);
    if (direction) dispatch(nameHelper(t.UPDATE_WHEEL_DIRECTION), event);
    if (component) dispatch(nameHelper(t.UPDATE_WHEEL_COMPONENT), event);
    if (device) dispatch(nameHelper(t.UPDATE_WHEEL_DEVICE), event);
    if (deltaX) dispatch(nameHelper(t.UPDATE_WHEEL_DELTA_X), event);
    if (deltaY) dispatch(nameHelper(t.UPDATE_WHEEL_DELTA_Y), event);
    if (deltaZ) dispatch(nameHelper(t.UPDATE_WHEEL_DELTA_Z), event);
  };
}
