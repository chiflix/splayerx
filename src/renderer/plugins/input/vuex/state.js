/* eslint-disable no-fallthrough */
import { defaultOptions } from '../constants';

// eslint-disable-next-line complexity
export default function state(options = defaultOptions) {
  const result = {};
  // eslint-disable-next-line default-case
  switch (true) {
    case options.mouse.mousemove.position:
      result.mousemoveClientPosition = { x: 0, y: 0 };
    case options.mouse.mousemove.component:
      result.mousemoveComponentName = '';
    case options.mouse.mousemove.phase:
      result.mousemovePhase = 'stopped';
    case options.mouse.mousedown.buttons:
      result.mousedownButtonNames = [];
    case options.mouse.mousedown.component:
      result.mousedownComponentName = '';
    case options.mouse.mouseup.component:
      result.mouseupComponentName = '';
    case options.keyboard.keys:
      result.pressedKeyCodes = [];
    case options.keyboard.alt:
      result.altKeyPressedKeyCodes = [];
    case options.keyboard.shift:
      result.shiftKeyPressedKeyCodes = [];
    case options.keyboard.ctrl:
      result.ctrlKeyPressedKeyCodes = [];
    case options.keyboard.meta:
      result.metaKeyPressedKeyCodes = [];
    case options.wheel.phase:
      result.wheelPhase = 'stopped';
    case options.wheel.direction:
      result.wheelDirection = '';
    case options.wheel.component:
      result.wheelComponentName = '';
    case options.wheel.device:
      result.wheelDeviceType = 'mouse';
    case options.wheel.deltaX:
      result.wheelDeltaX = 0;
    case options.wheel.deltaY:
      result.wheelDeltaY = 0;
    case options.wheel.deltaZ:
      result.wheelDeltaZ = 0;
  }
  return result;
}
