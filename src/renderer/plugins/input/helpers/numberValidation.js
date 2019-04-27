import { isNumber, isNaN, isFinite } from 'lodash';

export function isValid(deltaValue) {
  return isNumber(deltaValue) && !isNaN(deltaValue) && isFinite(deltaValue);
}

export { isInteger } from 'lodash';
