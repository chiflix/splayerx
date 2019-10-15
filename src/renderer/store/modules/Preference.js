import path from 'path';
import { remote, ipcRenderer } from 'electron';
import fs from 'fs';
import asyncStorage from '@/helpers/asyncStorage';
import syncStorage from '@/helpers/syncStorage';

const state = {
  nsfwProcessDone: false,
  protectPrivacy: false,
  hideNSFW: true,
  privacyAgreement: undefined,
  displayLanguage: '',
  primaryLanguage: undefined,
  secondaryLanguage: undefined,
  singleCycle: false,
  reverseScrolling: false,
  subtitleOff: false,
  showFullTimeCode: false,
};
const getters = {
  nsfwProcessDone: state => state.nsfwProcessDone,
  preferenceData: state => state,
  protectPrivacy: state => state.protectPrivacy,
  channels: state => state.channels,
  hideNSFW: state => state.hideNSFW,
  smartMode: state => state.protectPrivacy && state.hideNSFW,
  incognitoMode: state => state.protectPrivacy && !state.hideNSFW,
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
  showFullTimeCode: state => state.showFullTimeCode,
};

const mutations = {
  nsfwProcessDone(state) {
    state.nsfwProcessDone = true;
  },
  repositionChannels(state, { from, to }) {
    const item = state.channels.splice(from, 1)[0];
    state.channels.splice(to, 0, item);
  },
  displayLanguage(state, payload) {
    state.displayLanguage = payload;
  },
  hideNSFW(state, payload) {
    state.hideNSFW = payload;
  },
  protectPrivacy(state, payload) {
    state.protectPrivacy = payload;
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
  },
  showFullTimeCode(state, payload) {
    state.showFullTimeCode = payload;
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
  repositionChannels(
    { commit, state },
    { from, to },
  ) {
    commit('repositionChannels', { from, to });
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
  hideNSFW({ commit, state }, payload) {
    commit('hideNSFW', !!payload);
    if (payload) ipcRenderer.send('labor-task-add', 'nsfw-warmup');
    return asyncStorage.set('preferences', state);
  },
  protectPrivacy({ commit, state }) {
    commit('protectPrivacy', true);
    return asyncStorage.set('preferences', state);
  },
  notprotectPrivacy({ commit, state }) {
    commit('protectPrivacy', false);
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
  showFullTimeCode({ commit, state }, payload) {
    commit('showFullTimeCode', payload);
    return asyncStorage.set('preferences', state);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
