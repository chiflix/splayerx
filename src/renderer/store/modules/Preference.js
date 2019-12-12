import path from 'path';
import { remote } from 'electron';
import fs from 'fs';
import asyncStorage from '@/helpers/asyncStorage';
import syncStorage from '@/helpers/syncStorage';

const state = {
  nsfwProcessDone: false,
  incognitoMode: false,
  privacyAgreement: undefined,
  disableQuickEdit: false,
  displayLanguage: '',
  primaryLanguage: undefined,
  secondaryLanguage: undefined,
  singleCycle: false,
  playlistLoop: false,
  reverseScrolling: false,
  subtitleOff: false,
  showFullTimeCode: false,
  hwhevc: true, // 默认开启硬解
};
const getters = {
  nsfwProcessDone: state => state.nsfwProcessDone,
  preferenceData: state => state,
  incognitoMode: state => state.incognitoMode,
  reverseScrolling: state => state.reverseScrolling,
  privacyAgreement: state => state.privacyAgreement,
  disableQuickEdit: state => state.disableQuickEdit,
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
  playlistLoop: state => state.playlistLoop,
  subtitleOff: state => state.subtitleOff,
  showFullTimeCode: state => state.showFullTimeCode,
  hwhevc: state => state.hwhevc,
};

const mutations = {
  nsfwProcessDone(state) {
    state.nsfwProcessDone = true;
  },
  displayLanguage(state, payload) {
    state.displayLanguage = payload;
  },
  incognitoMode(state, payload) {
    state.incognitoMode = payload;
  },
  reverseScrolling(state, payload) {
    state.reverseScrolling = payload;
  },
  privacyAgreement(state, payload) {
    state.privacyAgreement = payload;
  },
  disableQuickEdit(state, payload) {
    state.disableQuickEdit = payload;
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
  playlistLoop(state, payload) {
    state.playlistLoop = payload;
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
  },
  showFullTimeCode(state, payload) {
    state.showFullTimeCode = payload;
  },
  hwhevc(state, payload) {
    state.hwhevc = payload;
  },
};
const actions = {
  nsfwProcessDone({ commit, state }) {
    commit('nsfwProcessDone');
    return asyncStorage.set('preferences', state);
  },
  welcomeProcess({ commit, state }, payload) {
    commit('privacyAgreement', payload.privacyAgreement);
    commit('primaryLanguage', payload.primaryLanguage);
    commit('secondaryLanguage', payload.secondaryLanguage);
    fs.closeSync(fs.openSync(path.join(remote.app.getPath('userData'), 'WELCOME_PROCESS_MARK'), 'w'));
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
  quickEditStatus({ commit, state }, payload) {
    commit('disableQuickEdit', payload);
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
  incognitoMode({ commit, state }, payload) {
    commit('incognitoMode', payload);
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
  playlistLoop({ commit }, payload) {
    commit('playlistLoop', payload);
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
  showFullTimeCode({ commit, state }, payload) {
    commit('showFullTimeCode', payload);
    return asyncStorage.set('preferences', state);
  },
  hwhevc({ commit, state }, payload) {
    commit('hwhevc', payload);
    return asyncStorage.set('preferences', state);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
