import { VuexStore } from '../constants';

export function dispatch(type, payload) {
  return VuexStore.dispatch(type, payload);
}
