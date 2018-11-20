import Vue from 'vue';

import { Video as mutationTypes } from '../mutationTypes';
import { Video as actionTypes } from '../actionTypes';

const state = {
  // error state
  errorCode: 0,
  errorMessage: '',
  // network state
  src: process.env.NODE_ENV === 'testing' ? './test/assets/test.avi' : '',
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
  duration: NaN,
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
  muted: false,
  defaultMuted: false,
  // tracks
  audioTrackList: [],
  videoTrackList: [],
  textTrackList: [],
  // meta info
  intrinsicWidth: 0,
  intrinsicHeight: 0,
  computedWidth: 0,
  computedHeight: 0,
  ratio: 0,
  AudioDelay: 0,
};

const getters = {
  // network state
  originSrc: state => state.src,
  convertedSrc: (state) => {
    const converted = encodeURIComponent(state.src).replace(/%3A/g, ':').replace(/(%5C)|(%2F)/g, '/');
    return process.platform === 'win32' ? converted : `file://${converted}`;
  },
  // playback state
  duration: state => state.duration,
  finalPartTime: state => state.duration - 30,
  currentTime: state => state.currentTime,
  paused: state => state.paused,
  roundedCurrentTime: state => Math.round(state.currentTime),
  // controls
  volume: state => state.volume / 100,
  muted: state => state.muted,
  rate: state => state.rate,
  // tracks
  audioTrackList: state => state.audioTrackList,
  currentAudioTrackId: (state) => {
    const track = state.audioTrackList.filter(track => track.enabled)[0];
    if (track && track.id) return track.id;
    return -1;
  },
  // meta info
  intrinsicWidth: state => state.intrinsicWidth,
  intrinsicHeight: state => state.intrinsicHeight,
  computedWidth: state => state.computedWidth,
  computedHeight: state => state.computedHeight,
  ratio: state => state.ratio,
  AudioDelay: state => state.AudioDelay,
};

function stateToMutation(stateType) {
  return stateType.replace(/\.?([A-Z])/g, y => `_${y.toLowerCase()}`).replace(/^_/, '').toUpperCase().concat('_UPDATE');
}

function mutationToState(mutationType) {
  return mutationType.toLowerCase().replace(/_UPDATE$/i, '').replace(/(_\w)/g, y => y[1].toUpperCase());
}

function mutationer(mutationType) {
  const stateType = mutationToState(mutationType);
  if (typeof state[stateType] !== 'object') {
    return (state, p) => {
      state[stateType] = p;
    };
  }
  return (state, p) => {
    Vue.set(state, stateType, p);
  };
}

function mutationsGenerator(mutationTypes) {
  const mutations = {};
  Object.keys(mutationTypes).forEach((type) => {
    mutations[type] = mutationer(type);
  });
  return mutations;
}

function generateTracks(actionType, newTrack, oldTracks) {
  const newTracks = [...oldTracks];
  switch (actionType) {
    case 'add':
      if (!newTracks.includes(newTrack)) {
        newTracks.push(newTrack);
      }
      break;
    case 'switch':
      if (newTracks.includes(newTrack)) {
        newTracks.splice(0, newTracks.length, ...newTracks.map((track) => {
          const tempTrack = Object.assign({}, track);
          if (tempTrack.id === newTrack.id) {
            tempTrack.enabled = true;
          } else {
            tempTrack.enabled = false;
          }
          return tempTrack;
        }));
      }
      break;
    case 'removeAll':
      newTracks.splice(0, newTracks.length);
      break;
    default:
      break;
  }
  return newTracks;
}
const mutations = mutationsGenerator(mutationTypes);

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
      const mutation = stateToMutation(item);
      if (mutationTypes[mutation]) commit(mutation, config[item]);
    });
  },
  [actionTypes.INCREASE_VOLUME]({ dispatch, commit, state }, delta) {
    if (state.muted) dispatch(actionTypes.TOGGLE_MUTED);
    const finalDelta = delta || 10;
    const finalVolume = state.volume + finalDelta;
    commit(mutationTypes.VOLUME_UPDATE, finalVolume > 100 ? 100 : finalVolume);
  },
  [actionTypes.DECREASE_VOLUME]({ dispatch, commit, state }, delta) {
    if (state.muted) dispatch(actionTypes.TOGGLE_MUTED);
    const finalDelta = delta || 10;
    const finalVolume = state.volume - finalDelta;
    commit(mutationTypes.VOLUME_UPDATE, finalVolume < 0 ? 0 : finalVolume);
    if (finalVolume <= 0) commit(mutationTypes.MUTED_UPDATE, true);
  },
  [actionTypes.TOGGLE_MUTED]({ commit, state }) {
    commit(mutationTypes.MUTED_UPDATE, !state.muted);
  },
  [actionTypes.INCREASE_RATE]({ commit, state }) {
    const rateArr = [0.5, 1, 1.2, 1.5, 2];
    const finalRate = rateArr[rateArr.indexOf(state.rate) + 1];
    commit(mutationTypes.RATE_UPDATE, finalRate || state.rate);
  },
  [actionTypes.DECREASE_RATE]({ commit, state }) {
    const rateArr = [0.5, 1, 1.2, 1.5, 2];
    const finalRate = rateArr[rateArr.indexOf(state.rate) - 1];
    commit(mutationTypes.RATE_UPDATE, finalRate || state.rate);
  },
  [actionTypes.CHANGE_RATE]({ commit }, delta) {
    commit(mutationTypes.RATE_UPDATE, delta);
  },
  [actionTypes.PLAY_VIDEO]({ commit }) {
    commit(mutationTypes.PAUSED_UPDATE, false);
  },
  [actionTypes.PAUSE_VIDEO]({ commit }) {
    commit(mutationTypes.PAUSED_UPDATE, true);
  },
  [actionTypes.META_INFO]({ commit }, metaInfo) {
    const validMetaInfo = [
      'intrinsicWidth',
      'intrinsicHeight',
      'computedWidth',
      'computedHeight',
      'ratio',
    ];
    Object.keys(metaInfo).forEach((item) => {
      const mutation = stateToMutation(item);
      if (validMetaInfo.includes(item) && mutationTypes[mutation]) commit(mutation, metaInfo[item]);
    });
  },
  [actionTypes.UPDATE_DELAY]({ commit }, delta) {
    const finalDelay = state.AudioDelay + delta;
    commit(mutationTypes.DELAY_UPDATE, finalDelay);
  },
  [actionTypes.ADD_AUDIO_TRACK]({ commit, state }, trackToAdd) {
    const newAudioTracks = generateTracks('add', trackToAdd, state.audioTrackList);
    commit(mutationTypes.AUDIO_TRACK_LIST_UPDATE, newAudioTracks);
  },
  [actionTypes.SWITCH_AUDIO_TRACK]({ commit, state }, trackToSwitch) {
    const newAudioTracks = generateTracks('switch', trackToSwitch, state.audioTrackList);
    commit(mutationTypes.AUDIO_TRACK_LIST_UPDATE, newAudioTracks);
  },
  [actionTypes.REMOVE_ALL_AUDIO_TRACK]({ commit, state }) {
    const newAudioTracks = generateTracks('removeAll', null, state.audioTrackList);
    commit(mutationTypes.AUDIO_TRACK_LIST_UPDATE, newAudioTracks);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
