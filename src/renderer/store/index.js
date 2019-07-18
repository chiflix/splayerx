import Vue from 'vue';
import Vuex from 'vuex';

import modules from './modules';

Vue.use(Vuex);

if (!Vuex.Store.prototype.hasModule) {
  // Temporary check for subtitle module. Should find a better mechanism
  Vuex.Store.prototype.hasModule = function hasModule(moduleName) {
    return !!this._modules.root._children[moduleName]; // eslint-disable-line no-underscore-dangle
  };
}

export default new Vuex.Store({
  modules,
  strict: process.env.NODE_ENV !== 'production',
});
