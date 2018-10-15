import { Video as mutationTypes } from '../mutation-types';
import { Video as actionTypes } from '../action-types';

const state = {
  // error state
  errorCode: 0,
  errorMessage: '',
  // network state
  src: '',
  currentSrc: '',
  networkState: '',
  buffered: '',
  canPlayType: [],
  crossOrigin: false,
  preload: '',
  // ready state
  readyState: 0,
  seeking: false,
  // playback state
  duration: 0,
  rate: 1,
  defaultPlaybackRate: 1,
  paused: false,
  ended: false,
  played: '',
  seekable: '',
  currentTime: 0,
  autoplay: false,
  loop: false,
  // controls
  controls: false,
  volume: 100,
  mute: false,
  defaultMuted: false,
  // tracks
  AudioTrackList: [],
  VideoTrackList: [],
  TextTrackList: [],
};

const getters = {
  src: state => `file://${state.src}`,
  duration: state => state.duration,
  currentTime: state => Math.round(state.currentTime),
  volume: state => state.volume / 100,
  mute: state => state.mute,
  rate: state => state.rate,
  paused: state => state.paused,
};

const mutations = {
  // error state
  [mutationTypes.ERRORCODE_UPDATE](s, p) {
    s.errorCode = p;
  },
  [mutationTypes.ERRORMESSAGE_UPDATE](s, p) {
    s.errorMessage = p;
  },
  // playback state
  [mutationTypes.DURATION_UPDATE](s, p) {
    s.duration = p;
  },
  [mutationTypes.CURRENTTIME_UPDATE](s, p) {
    s.currentTime = p;
  },
  [mutationTypes.PAUSED_UPDATE](s, p) {
    s.paused = p;
  },
  // network state
  [mutationTypes.SRC_UPDATE](s, p) {
    s.src = p;
  },
  [mutationTypes.VOLUME_UPDATE](s, p) {
    s.volume = p;
  },
  [mutationTypes.MUTE_UPDATE](s, p) {
    s.mute = p;
  },
  [mutationTypes.RATE_UPDATE](s, p) {
    s.rate = p;
  },
};

const actions = {
  [actionTypes.SRC_SET]({ commit }, src) {
    const srcRegexes = {
      unix: RegExp(/^[^\0]+$/),
      windows: RegExp(/^[a-zA-Z]:\/(((?![<>:"//|?*]).)+((?<![ .])\/)?)*$/),
    };
    Object.keys(srcRegexes).forEach((type) => {
      if (srcRegexes[type].test(src)) {
        commit(mutationTypes.SRC_UPDATE, src);
      }
    });
  },
  [actionTypes.INITIALIZE]({ commit }, config) {
    Object.keys(config).forEach((item) => {
      const mutation = `${item.toUpperCase()}_UPDATE`;
      if (mutationTypes[mutation]) commit(mutation, config[item]);
    });
  },
  [actionTypes.INCREASE_VOLUME]({ dispatch, commit, state }, delta) {
    if (state.mute) dispatch(actionTypes.TOGGLE_MUTE);
    const finalDelta = delta || 10;
    const finalVolume = state.volume + finalDelta;
    commit(mutationTypes.VOLUME_UPDATE, finalVolume > 100 ? 100 : finalVolume);
  },
  [actionTypes.DECREASE_VOLUME]({ dispatch, commit, state }, delta) {
    if (state.mute) dispatch(actionTypes.TOGGLE_MUTE);
    const finalDelta = delta || 10;
    const finalVolume = state.volume - finalDelta;
    commit(mutationTypes.VOLUME_UPDATE, finalVolume < 0 ? 0 : finalVolume);
    if (finalVolume <= 0) commit(mutationTypes.MUTE_UPDATE, true);
  },
  [actionTypes.TOGGLE_MUTE]({ commit, state }) {
    commit(mutationTypes.MUTE_UPDATE, !state.mute);
  },
  [actionTypes.INCREASE_RATE]({ commit, state }, delta) {
    const finalDelta = delta || 0.1;
    const finalRate = state.rate + finalDelta;
    commit(mutationTypes.RATE_UPDATE, finalRate > 100 ? 1 : finalRate);
  },
  [actionTypes.DECREASE_RATE]({ commit, state }, delta) {
    const finalDelta = delta || 0.1;
    const finalRate = state.rate - finalDelta;
    commit(mutationTypes.RATE_UPDATE, finalRate < 0 ? 0 : finalRate);
  },
  [actionTypes.PLAY_VIDEO]({ commit }) {
    commit(mutationTypes.PAUSED_UPDATE, false);
  },
  [actionTypes.PAUSE_VIDEO]({ commit }) {
    commit(mutationTypes.PAUSED_UPDATE, true);
  },
};

export const validators = {
  volume(v) {
    return typeof v === 'number'
    && !Number.isNaN(v)
    && v >= 0
    && v <= 100;
  },
  mute(v) {
    return typeof v === 'boolean';
  },
  rate(v) {
    return typeof v === 'number'
    && !Number.isNaN(v)
    && v >= 0
    && v <= 100;
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
