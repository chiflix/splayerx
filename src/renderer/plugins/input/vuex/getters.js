/* eslint-disable no-fallthrough */
import {
  defaultOptions,
  MOUSEMOVE_STOPPED_PHASE,
  WHEEL_STOPPED_PHASE,
} from '../constants';

// eslint-disable-next-line complexity
export default function getters(options = defaultOptions) {
  const result = {};
  // eslint-disable-next-line default-case
  switch (true) {
    case options.mouse.mousemove.position:
      result.mousemovePosition = ({ mousemoveClientPosition }) => mousemoveClientPosition;
    case options.mouse.mousemove.component:
      result.mousemoveComponent = ({ mousemoveComponentName }) => mousemoveComponentName;
    case options.mouse.mousemove.phase:
      result.mousemovePhase = ({ mousemovePhase }) => mousemovePhase;
      result.mousemoveStopped = ({ mousemovePhase }) => mousemovePhase === MOUSEMOVE_STOPPED_PHASE;
    case options.mouse.mousedown.buttons:
      result.mousedownButtons = ({ mousedownButtonNames }) => mousedownButtonNames;
      result.whichButtonPressed = ({ mousedownButtonNames }) => mousedownButtonName =>
        mousedownButtonNames.includes(mousedownButtonName);
    case options.mouse.mousedown.component:
      result.mousedownComponent = ({ mousedownComponentName }) => mousedownComponentName;
    case options.mouse.mouseup.component:
      result.mouseupComponent = ({ mouseupComponentName }) => mouseupComponentName;
    case options.keyboard.keys:
      result.whichKeyPressed = ({ pressedKeyCodes }) => keyCode =>
        pressedKeyCodes.includes(keyCode);
      result.keys = ({ pressedKeyCodes }) => pressedKeyCodes;
    case options.keyboard.alt:
      result.altKeys = ({ altKeyPressedKeyCodes }) => altKeyPressedKeyCodes;
    case options.keyboard.shift:
      result.shiftKeys = ({ shiftKeyPressedKeyCodes }) => shiftKeyPressedKeyCodes;
    case options.keyboard.ctrl:
      result.ctrlKeys = ({ ctrlKeyPressedKeyCodes }) => ctrlKeyPressedKeyCodes;
    case options.keyboard.meta:
      result.metaKeys = ({ metaKeyPressedKeyCodes }) => metaKeyPressedKeyCodes;
    case options.wheel.phase:
      result.wheelPhase = ({ wheelPhase }) => wheelPhase;
      result.wheelStopped = ({ wheelPhase }) => wheelPhase === WHEEL_STOPPED_PHASE;
    case options.wheel.direction:
      result.wheelDirection = ({ wheelDirection }) => wheelDirection;
    case options.wheel.component:
      result.wheelComponent = ({ wheelComponentName }) => wheelComponentName;
    case options.wheel.device:
      result.wheelDevice = ({ wheelDeviceType }) => wheelDeviceType;
  }
  return result;
}
