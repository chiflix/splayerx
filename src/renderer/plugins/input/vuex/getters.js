import { get } from 'lodash';
import {
  defaultOptions,
  getterTypes as t,
  MOUSEMOVE_STOPPED_PHASE,
  WHEEL_STOPPED_PHASE,
} from '../constants';

// eslint-disable-next-line complexity
export default function getters(options = defaultOptions) {
  const result = {};
  const { mouse, keyboard, wheel } = options;
  if (get(mouse, 'mousemove.position')) {
    result[t.GET_MOUSEMOVE_POSITION] = ({ mousemoveClientPosition }) => mousemoveClientPosition;
  }
  if (get(mouse, 'mousemove.component')) {
    result[t.GET_MOUSEMOVE_COMPONENT] = ({ mousemoveComponentName }) => mousemoveComponentName;
  }
  if (get(mouse, 'mousemove.phase')) {
    result[t.GET_MOUSEMOVE_PHASE] = ({ mousemovePhase }) => mousemovePhase;
    result[t.GET_MOUSEMOVE_STOPPED] = ({ mousemovePhase: p }) => (p === MOUSEMOVE_STOPPED_PHASE);
  }
  if (get(mouse, 'mousedown.buttons')) {
    result[t.GET_MOUSEDOWN_BUTTONS] = ({ mousedownButtonNames }) => mousedownButtonNames;
    result[t.GET_WHICH_BUTTON_PRESSED] = ({ mousedownButtonNames: n }) => name => n.includes(name);
  }
  if (get(mouse, 'mousedown.component')) {
    result[t.GET_MOUSEDOWN_COMPONENT] = ({ mousedownComponentName }) => mousedownComponentName;
  }
  if (get(mouse, 'mosueup.component')) {
    result[t.GET_MOUSEUP_COMPONENT] = ({ mouseupComponentName }) => mouseupComponentName;
  }
  if (get(keyboard, 'keys')) {
    result[t.GET_WHICH_KEY_PRESSED] = ({ pressedKeyCodes: k }) => keyCode => k.includes(keyCode);
    result[t.GET_KEYS] = ({ pressedKeyCodes }) => pressedKeyCodes;
  }
  if (get(keyboard, 'alt')) {
    result[t.GET_ALT_KEYS] = ({ altKeyPressedKeyCodes }) => altKeyPressedKeyCodes;
  }
  if (get(keyboard, 'shift')) {
    result[t.GET_SHIFT_KEYS] = ({ shiftKeyPressedKeyCodes }) => shiftKeyPressedKeyCodes;
  }
  if (get(keyboard, 'ctrl')) {
    result[t.GET_CTRL_KEYS] = ({ ctrlKeyPressedKeyCodes }) => ctrlKeyPressedKeyCodes;
  }
  if (get(keyboard, 'meta')) {
    result[t.GET_META_KEYS] = ({ metaKeyPressedKeyCodes }) => metaKeyPressedKeyCodes;
  }
  if (get(wheel, 'phase') || get(wheel, 'direction')) {
    result[t.GET_WHEEL_PHASE] = ({ wheelPhase }) => wheelPhase;
    result[t.GET_WHEEL_STOPPED] = ({ wheelPhase }) => wheelPhase === WHEEL_STOPPED_PHASE;
    result[t.GET_WHEEL_DIRECTION] = ({ wheelDirection }) => wheelDirection;
  }
  if (get(wheel, 'component')) {
    result[t.GET_WHEEL_COMPONENT] = ({ wheelComponentName }) => wheelComponentName;
  }
  if (get(wheel, 'device')) {
    result[t.GET_WHEEL_DEVICE] = ({ wheelDeviceType }) => wheelDeviceType;
  }
  return result;
}
