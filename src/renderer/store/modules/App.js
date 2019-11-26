import electron from 'electron'; // eslint-disable-line
import { getEnvironmentName } from '@/../shared/utils';

export default {
  state: {
    version: '',
    countryCode: '',
    ip: '',
  },
  getters: {
    countryCode(state) {
      return state.countryCode;
    },
    ip(state) {
      return state.ip;
    },
    environmentName() {
      return getEnvironmentName();
    },
  },
  mutations: {
    version(state, payload) {
      state.version = payload;
    },
    geo(state, payload) {
      state.ip = payload.ip;
      state.countryCode = payload.countryCode;
    },
  },
  actions: {
    refreshVersion(context) {
      requestAnimationFrame(() => {
        context.commit('version', electron.remote.app.getVersion());
      });
    },
    updateGeo(context, geo) {
      context.commit('geo', geo);
    },
  },
};
