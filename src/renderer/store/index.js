import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import modules from './modules';

Vue.use(Vuex);

export default new Vuex.Store({
  modules,
  strict: process.env.NODE_ENV !== 'production',
  plugins: process.env.NODE_ENV === 'development' ? [createLogger({
    filter: mutation => mutation.type === 'AUDIO_TRACK_LIST_UPDATE',
  })] : [],
});

