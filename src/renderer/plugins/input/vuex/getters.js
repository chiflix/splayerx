import { get } from 'lodash';
import {
  defaultOptions,
  MOUSEMOVE_STOPPED_PHASE,
  WHEEL_STOPPED_PHASE,
} from '../constants';

// eslint-disable-next-line complexity
export default function getters(options = defaultOptions) {
  const result = {};
  const { mouse, keyboard, wheel } = options;
  if (get(mouse, 'mousemove.position')) {
    result.mousemovePosition = ({ mousemoveClientPosition }) => mousemoveClientPosition;
  }
  if (get(mouse, 'mousemove.component')) {
    result.mousemoveComponent = ({ mousemoveComponentName }) => mousemoveComponentName;
  }
  if (get(mouse, 'mousemove.phase')) {
    result.mousemovePhase = ({ mousemovePhase }) => mousemovePhase;
    result.mousemoveStopped = ({ mousemovePhase }) => mousemovePhase === MOUSEMOVE_STOPPED_PHASE;
  }
  if (get(mouse, 'mousedown.buttons')) {
    result.mousedownButtons = ({ mousedownButtonNames }) => mousedownButtonNames;
    result.whichButtonPressed = ({ mousedownButtonNames }) => mousedownButtonName =>
      mousedownButtonNames.includes(mousedownButtonName);
  }
  if (get(mouse, 'mousedown.component')) {
    result.mousedownComponent = ({ mousedownComponentName }) => mousedownComponentName;
  }
  if (get(mouse, 'mosueup.component')) {
    result.mouseupComponent = ({ mouseupComponentName }) => mouseupComponentName;
  }
  if (get(keyboard, 'keys')) {
    result.whichKeyPressed = ({ pressedKeyCodes }) => keyCode =>
      pressedKeyCodes.includes(keyCode);
    result.keys = ({ pressedKeyCodes }) => pressedKeyCodes;
  }
  if (get(keyboard, 'alt')) {
    result.altKeys = ({ altKeyPressedKeyCodes }) => altKeyPressedKeyCodes;
  }
  if (get(keyboard, 'shift')) {
    result.shiftKeys = ({ shiftKeyPressedKeyCodes }) => shiftKeyPressedKeyCodes;
  }
  if (get(keyboard, 'ctrl')) {
    result.ctrlKeys = ({ ctrlKeyPressedKeyCodes }) => ctrlKeyPressedKeyCodes;
  }
  if (get(keyboard, 'meta')) {
    result.metaKeys = ({ metaKeyPressedKeyCodes }) => metaKeyPressedKeyCodes;
  }
  if (get(wheel, 'phase')) {
    result.wheelPhase = ({ wheelPhase }) => wheelPhase;
    result.wheelStopped = ({ wheelPhase }) => wheelPhase === WHEEL_STOPPED_PHASE;
  }
  if (get(wheel, 'direction')) {
    result.wheelDirection = ({ wheelDirection }) => wheelDirection;
  }
  if (get(wheel, 'component')) {
    result.wheelComponent = ({ wheelComponentName }) => wheelComponentName;
  }
  if (get(wheel, 'device')) {
    result.wheelDevice = ({ wheelDeviceType }) => wheelDeviceType;
  }
  return result;
}
