import state from './state';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import { nameDefaultOption, namespacedDefaultOption } from '../constants';

export default function module(options) {
  const { name, namespaced } = options;
  return {
    name: name || nameDefaultOption,
    namespaced: namespaced === true || namespacedDefaultOption,
    state: state(options),
    getters: getters(options),
    mutations: mutations(options),
    actions: actions(options),
  };
}
