import { get } from 'lodash';
import { defaultOptions, stateTypes as t } from '../constants';

// eslint-disable-next-line complexity
export default function state(options = defaultOptions) {
  const result = {};
  const { mouse, keyboard, wheel } = options;
  if (get(mouse, 'mousemove.position')) {
    result[t.MOUSEMOVE_CLIENT_POSITION] = { x: 0, y: 0 };
  }
  if (get(mouse, 'mousemove.component')) {
    result[t.MOUSEMOVE_COMPONENT_NAME] = '';
  }
  if (get(mouse, 'mousemove.phase')) {
    result[t.MOUSEMOVE_PHASE] = 'stopped';
  }
  if (get(mouse, 'mousedown.buttons')) {
    result[t.MOUSEDOWN_BUTTON_NAMES] = [];
  }
  if (get(mouse, 'mousedown.component')) {
    result[t.MOUSEDOWN_COMPONENT_NAME] = '';
  }
  if (get(mouse, 'mosueup.component')) {
    result[t.MOUSEUP_COMPONENT_NAME] = '';
  }
  if (get(keyboard, 'keys')) {
    result[t.PRESSED_KEY_CODES] = [];
  }
  if (get(keyboard, 'alt')) {
    result[t.ALT_KEY_PRESSED_KEY_CODES] = [];
  }
  if (get(keyboard, 'shift')) {
    result[t.SHIFT_KEY_PRESSED_KEY_CODES] = [];
  }
  if (get(keyboard, 'ctrl')) {
    result[t.CTRL_KEY_PRESSED_KEY_CODES] = [];
  }
  if (get(keyboard, 'meta')) {
    result[t.META_KEY_PRESSED_KEY_CODES] = [];
  }
  if (get(wheel, 'phase')) {
    result[t.WHEEL_PHASE] = 'stopped';
  }
  if (get(wheel, 'direction')) {
    result[t.WHEEL_DIRECTION] = '';
  }
  if (get(wheel, 'component')) {
    result[t.WHEEL_COMPONENT_NAME] = '';
  }
  if (get(wheel, 'device')) {
    result[t.WHEEL_DEVICE_TYPE] = 'mouse';
  }
  if (get(wheel, 'deltaX')) {
    result[t.WHEEL_DELTA_X] = 0;
  }
  if (get(wheel, 'deltaY')) {
    result[t.WHEEL_DELTA_Y] = 0;
  }
  if (get(wheel, 'deltaZ')) {
    result[t.WHEEL_DELTA_Z] = 0;
  }
  return result;
}
