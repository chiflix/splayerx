import asyncStorage from '@/helpers/asyncStorage.js';
const state = {
  deleteVideoHistoryOnExit: false,
  privacyAgreement: false,
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
    commit('privacyAgreement', true);
    asyncStorage.set('preferences', state);
  },
  disagreeOnPrivacyPolicy({ commit, state }) {
    commit('privacyAgreement', false);
    asyncStorage.set('preferences', state);
  },
  deleteVideoHistoryOnExit({ commit, state }) {
    commit('deleteVideoHistoryOnExit', true);
    asyncStorage.set('preferences', state);
  },
  notDeleteVideoHistoryOnExit({ commit, state }) {
    commit('deleteVideoHistoryOnExit', false);
    asyncStorage.set('preferences', state);
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
