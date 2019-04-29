import { get } from 'lodash';
import { defaultOptions } from '../constants';

// eslint-disable-next-line complexity
export default function state(options = defaultOptions) {
  const result = {};
  const { mouse, keyboard, wheel } = options;
  if (get(mouse, 'mousemove.position')) {
    result.mousemoveClientPosition = { x: 0, y: 0 };
  }
  if (get(mouse, 'mousemove.component')) {
    result.mousemoveComponentName = '';
  }
  if (get(mouse, 'mousemove.phase')) {
    result.mousemovePhase = 'stopped';
  }
  if (get(mouse, 'mousedown.buttons')) {
    result.mousedownButtonNames = [];
  }
  if (get(mouse, 'mousedown.component')) {
    result.mousedownComponentName = '';
  }
  if (get(mouse, 'mosueup.component')) {
    result.mouseupComponentName = '';
  }
  if (get(keyboard, 'keys')) {
    result.pressedKeyCodes = [];
  }
  if (get(keyboard, 'alt')) {
    result.altKeyPressedKeyCodes = [];
  }
  if (get(keyboard, 'shift')) {
    result.shiftKeyPressedKeyCodes = [];
  }
  if (get(keyboard, 'ctrl')) {
    result.ctrlKeyPressedKeyCodes = [];
  }
  if (get(keyboard, 'meta')) {
    result.metaKeyPressedKeyCodes = [];
  }
  if (get(wheel, 'phase') || get(wheel, 'direction')) {
    result.wheelPhase = 'stopped';
    result.wheelDirection = '';
  }
  if (get(wheel, 'component')) {
    result.wheelComponentName = '';
  }
  if (get(wheel, 'device')) {
    result.wheelDeviceType = 'mouse';
  }
  if (get(wheel, 'deltaX')) {
    result.wheelDeltaX = 0;
  }
  if (get(wheel, 'deltaY')) {
    result.wheelDeltaY = 0;
  }
  if (get(wheel, 'deltaZ')) {
    result.wheelDeltaZ = 0;
  }
  return result;
}
