import Vue from 'vue';
import Vuex from 'vuex';

import modules from './modules';

Vue.use(Vuex);

if (!Vuex.Store.prototype['hasModule']) {
  // Temporary check for subtitle module. Should find a better mechanism
  Vuex.Store.prototype['hasModule'] = function hasModule(moduleName: string) {
    return !!this._modules.root._children[moduleName]; // eslint-disable-line no-underscore-dangle
  };
}

const store = new Vuex.Store({
  modules: modules as any, // eslint-disable-line
  strict: process.env.NODE_ENV !== 'production',
});
export default <StoreEx>store;
