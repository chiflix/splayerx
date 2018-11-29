import asyncStorage from '@/helpers/asyncStorage.js';
const state = {
  deleteVideoHistoryOnExit: false,
  privacyAgreement: true,
};
const getters = {
  preferenceData: state => state,
  deleteVideoHistoryOnExit: state => state.deleteVideoHistoryOnExit,
  privacyAgreement: state => state.privacyAgreement,
};

const mutations = {
  deleteVideoHistoryOnExit(state, payload) {
    state.deleteVideoHistoryOnExit = payload;
  },
  privacyAgreement(state, payload) {
    state.privacyAgreement = payload;
  },
  setPreference(state, payload) {
    Object.assign(state, payload);
  },
};
const actions = {
  agreeOnPrivacyPolicy({ commit, state }) {
    asyncStorage.set('preferences', state).then(() => {
      commit('privacyAgreement', true);
    });
  },
  disagreeOnPrivacyPolicy({ commit, state }) {
    asyncStorage.set('preferences', state).then(() => {
      commit('privacyAgreement', false);
    });
  },
  deleteVideoHistoryOnExit({ commit, state }) {
    asyncStorage.set('preferences', state).then(() => {
      commit('deleteVideoHistoryOnExit', true);
    });
  },
  notDeleteVideoHistoryOnExit({ commit, state }) {
    asyncStorage.set('preferences', state).then(() => {
      commit('deleteVideoHistoryOnExit', false);
    });
  },
  getLocalPreference({ commit }) {
    asyncStorage.get('preferences').then((data) => {
      commit('setPreference', data);
    });
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
