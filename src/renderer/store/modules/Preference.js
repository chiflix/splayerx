import asyncStorage from '@/helpers/asyncStorage';
import syncStorage from '@/helpers/syncStorage';

const state = {
  deleteVideoHistoryOnExit: false,
  privacyAgreement: undefined,
  displayLanguage: '',
  primaryLanguage: '',
  secondaryLanguage: '',
  singleCycle: false,
  lastWinSize: [],
};
const getters = {
  preferenceData: state => state,
  deleteVideoHistoryOnExit: state => state.deleteVideoHistoryOnExit,
  privacyAgreement: state => state.privacyAgreement,
  displayLanguage: state => state.displayLanguage,
  primaryLanguage: state => state.primaryLanguage,
  secondaryLanguage: state => state.secondaryLanguage,
  singleCycle: state => state.singleCycle,
  lastWinSize: state => state.lastWinSize,
};

const mutations = {
  displayLanguage(state, payload) {
    state.displayLanguage = payload;
  },
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
  singleCycle(state, payload) {
    state.singleCycle = payload;
  },
  lastWinSize(state, payload) {
    state.lastWinSize = payload;
  },
  setPreference(state, payload) {
    Object.assign(state, payload);
  },
  getLocalPreference(state) {
    const data = syncStorage.getSync('preferences');
    Object.assign(state, data);
  },
};
const actions = {
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
  deleteVideoHistoryOnExit({ commit, state }) {
    commit('deleteVideoHistoryOnExit', true);
    return asyncStorage.set('preferences', state);
  },
  notDeleteVideoHistoryOnExit({ commit, state }) {
    commit('deleteVideoHistoryOnExit', false);
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
  saveWinSize({ commit, getters }) {
    if (getters.winAngle === 90 || getters.winAngle === 270) {
      commit('lastWinSize', [getters.winHeight, getters.winWidth]);
    } else {
      commit('lastWinSize', getters.winSize);
    }
    return asyncStorage.set('preferences', state);
  },
  setPreference({ commit, state }, payload) {
    commit('setPreference', payload);
    return asyncStorage.set('preferences', state);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
