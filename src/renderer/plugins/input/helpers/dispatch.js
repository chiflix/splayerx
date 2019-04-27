import { VuexStore } from '../constants';

// eslint-disable-next-line import/prefer-default-export
export function dispatch(type, payload) {
  return VuexStore.dispatch(type, payload);
}
