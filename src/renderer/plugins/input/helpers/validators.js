import { isNumber, isNaN, isFinite } from 'lodash';

export function isValidNumber(deltaValue) {
  return isNumber(deltaValue) && !isNaN(deltaValue) && isFinite(deltaValue);
}

export { isInteger } from 'lodash';

export function isValidComponentName(componentName) {
  return typeof componentName === 'string';
}
