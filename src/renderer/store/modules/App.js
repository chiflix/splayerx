import electron from 'electron'; // eslint-disable-line

export default {
  state: {
    version: '',
  },
  mutations: {
    version(state, payload) {
      state.version = payload;
    },
  },
  actions: {
    refreshVersion(context) {
      requestAnimationFrame(() => {
        context.commit('version', electron.remote.app.getVersion());
      });
    },
  },
};
