import VuexStore from '@/store';

export function dispatch(type, payload) {
  return VuexStore.dispatch(type, payload);
}
