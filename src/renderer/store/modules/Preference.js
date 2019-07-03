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
  reverseScrolling: false,
};
const getters = {
  preferenceData: state => state,
  deleteVideoHistoryOnExit: state => state.deleteVideoHistoryOnExit,
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
  lastWinSize: state => state.lastWinSize,
};

const mutations = {
  displayLanguage(state, payload) {
    state.displayLanguage = payload;
  },
  deleteVideoHistoryOnExit(state, payload) {
    state.deleteVideoHistoryOnExit = payload;
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
  reverseScrolling({ commit, state }) {
    commit('reverseScrolling', true);
    return asyncStorage.set('preferences', state);
  },
  notReverseScrolling({ commit, state }) {
    commit('reverseScrolling', false);
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
  saveWinSize({ commit }, payload) {
    if (payload.angle === 90 || payload.angle === 270) {
      commit('lastWinSize', [payload.size[1], payload.size[0]]);
    } else {
      commit('lastWinSize', payload.size);
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
