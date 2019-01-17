import asyncStorage from '@/helpers/asyncStorage';

const languageToCode = {
  简体中文: 'zh-CN',
  繁體中文: 'zh-TW',
  English: 'en',
  Español: 'es',
  日本語: 'ja',
  Français: 'fr',
  한국어: 'ko',
  Português: 'pt',
  العربية: 'ar',
  Deutsch: 'de',
  Русский: 'ru',
  हिन्दी: 'hi',
  Italiano: 'it',
};

const state = {
  deleteVideoHistoryOnExit: false,
  privacyAgreement: false,
  primaryLanguage: '',
  secondaryLanguage: '',
};
const getters = {
  preferenceData: state => state,
  deleteVideoHistoryOnExit: state => state.deleteVideoHistoryOnExit,
  privacyAgreement: state => state.privacyAgreement,
  primaryLanguage: state => Object
    .keys(languageToCode)[Object.values(languageToCode).indexOf(state.primaryLanguage)] || '',
  primaryLanguageCode: state => state.primaryLanguage,
  secondaryLanguage: state => Object
    .keys(languageToCode)[Object.values(languageToCode).indexOf(state.secondaryLanguage)] || '',
  secondaryLanguageCode: state => state.secondaryLanguage,
  codeToLanguage: () => code => Object
    .keys(languageToCode)[Object.values(languageToCode).indexOf(code)] || '',
};

const mutations = {
  deleteVideoHistoryOnExit(state, payload) {
    state.deleteVideoHistoryOnExit = payload;
  },
  privacyAgreement(state, payload) {
    state.privacyAgreement = payload;
  },
  primaryLanguage(state, payload) {
    state.primaryLanguage = payload;
  },
  secondaryLanguage(state, payload) {
    state.secondaryLanguage = payload;
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
  primaryLanguage({ commit, state }, payload) {
    commit('primaryLanguage', languageToCode[payload] || 'none');
    asyncStorage.set('preferences', state);
  },
  secondaryLanguage({ commit, state }, payload) {
    commit('secondaryLanguage', languageToCode[payload] || 'none');
    asyncStorage.set('preferences', state);
  },
  getLocalPreference({ commit }) {
    asyncStorage.get('preferences').then((data) => {
      commit('setPreference', data);
    });
  },
  setPreference({ commit, state }, payload) {
    commit('setPreference', payload);
    asyncStorage.set('preferences', state);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
