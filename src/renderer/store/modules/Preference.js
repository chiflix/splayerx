import asyncStorage from '@/helpers/asyncStorage';
import syncStorage from '@/helpers/syncStorage';

const state = {
  welcomeProcessDone: false,
  hideVideoHistoryOnExit: false,
  privacyAgreement: undefined,
  displayLanguage: '',
  primaryLanguage: undefined,
  secondaryLanguage: undefined,
  singleCycle: false,
  reverseScrolling: false,
  subtitleOff: false,
};
const getters = {
  welcomeProcessDone: state => state.welcomeProcessDone,
  preferenceData: state => state,
  hideVideoHistoryOnExit: state => state.hideVideoHistoryOnExit,
  reverseScrolling: state => state.reverseScrolling,
  privacyAgreement: state => state.privacyAgreement,
  displayLanguage: (state) => {
    let { displayLanguage } = state;
    // COMPATIBILITY: 4.1.14
    if (displayLanguage === 'zhCN') displayLanguage = 'zh-Hans';
    if (displayLanguage === 'zhTW') displayLanguage = 'zh-Hant';
    return displayLanguage;
  },
  primaryLanguage: state => state.primaryLanguage,
  secondaryLanguage: state => state.secondaryLanguage,
  singleCycle: state => state.singleCycle,
  subtitleOff: state => state.subtitleOff,
};

const mutations = {
  welcomeProcessDone(state) {
    state.welcomeProcessDone = true;
  },
  displayLanguage(state, payload) {
    state.displayLanguage = payload;
  },
  hideVideoHistoryOnExit(state, payload) {
    state.hideVideoHistoryOnExit = payload;
  },
  reverseScrolling(state, payload) {
    state.reverseScrolling = payload;
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
  singleCycle(state, payload) {
    state.singleCycle = payload;
  },
  setPreference(state, payload) {
    Object.assign(state, payload);
  },
  getLocalPreference(state) {
    const data = syncStorage.getSync('preferences');
    Object.assign(state, data);
  },
  subtitleOff(state, payload) {
    state.subtitleOff = !!payload;
    console.log(state.subtitleOff);
  },
};
const actions = {
  welcomeProcess({ commit, state }, payload) {
    commit('welcomeProcessDone');
    commit('privacyAgreement', payload.privacyAgreement);
    commit('primaryLanguage', payload.primaryLanguage);
    commit('secondaryLanguage', payload.secondaryLanguage);
    return asyncStorage.set('preferences', state);
  },
  displayLanguage({ commit, state }, payload) {
    commit('displayLanguage', payload);
    return asyncStorage.set('preferences', state);
  },
  agreeOnPrivacyPolicy({ commit, state }) {
    commit('privacyAgreement', true);
    return asyncStorage.set('preferences', state);
  },
  disagreeOnPrivacyPolicy({ commit, state }) {
    commit('privacyAgreement', false);
    return asyncStorage.set('preferences', state);
  },
  reverseScrolling({ commit, state }) {
    commit('reverseScrolling', true);
    return asyncStorage.set('preferences', state);
  },
  notReverseScrolling({ commit, state }) {
    commit('reverseScrolling', false);
    return asyncStorage.set('preferences', state);
  },
  hideVideoHistoryOnExit({ commit, state }) {
    commit('hideVideoHistoryOnExit', true);
    return asyncStorage.set('preferences', state);
  },
  nothideVideoHistoryOnExit({ commit, state }) {
    commit('hideVideoHistoryOnExit', false);
    return asyncStorage.set('preferences', state);
  },
  primaryLanguage({ commit, state }, payload) {
    commit('primaryLanguage', payload);
    return asyncStorage.set('preferences', state);
  },
  secondaryLanguage({ commit, state }, payload) {
    commit('secondaryLanguage', payload);
    return asyncStorage.set('preferences', state);
  },
  singleCycle({ commit }) {
    commit('singleCycle', true);
    commit('LOOP_UPDATE', true);
  },
  notSingleCycle({ commit }) {
    commit('singleCycle', false);
    commit('LOOP_UPDATE', false);
  },
  setPreference({ commit, state }, payload) {
    commit('setPreference', payload);
    return asyncStorage.set('preferences', state);
  },
  setSubtitleOff({ commit, state }, payload) {
    commit('subtitleOff', payload);
    return asyncStorage.set('preferences', state);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
