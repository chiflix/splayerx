import state from './state';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export default function module(options) {
  return {
    name: 'InputPlugin',
    // namespaced: true,
    state: state(options),
    getters: getters(options),
    mutations: mutations(options),
    actions: actions(options),
  };
}
