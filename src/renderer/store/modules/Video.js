import Vue from 'vue';

import Helpers from '@/helpers';
import romanize from 'romanize';
import { Video as videoMutations } from '../mutationTypes';
import { Video as videoActions, Subtitle as subtitleActions } from '../actionTypes';

const state = {
  // error state
  errorCode: 0,
  errorMessage: '',
  // network state
  src: process.env.NODE_ENV === 'testing' ? './test/assets/test.avi' : '',
  mediaHash: process.env.NODE_ENV === 'testing'
    ? '84f0e9e5e05f04b58f53e2617cc9c866-'
      + 'f54d6eb31bef84839c3ce4fc2f57991c-'
      + 'b1f0696aec64577228d93eabcc8eb69b-'
      + 'f497c6684c4c6e50d0856b5328a4bedc'
    : '',
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
  ratio: 0,
  AudioDelay: 0,
};

const getters = {
  // network state
  originSrc: state => state.src,
  convertedSrc: (state) => {
    const converted = process.platform === 'win32' ? encodeURIComponent(state.src).replace(/%3A/g, ':').replace(/(%5C)|(%2F)/g, '/') :
      encodeURIComponent(state.src).replace(/%3A/g, ':').replace(/%2F/g, '/');
    return process.platform === 'win32' ? converted : `file://${converted}`;
  },
  // playback state
  loop: state => state.loop,
  duration: state => state.duration,
  nextVideoPreviewTime: (state) => {
    const time = state.duration > 3000 ? 60 : state.duration * 0.02;
    return state.duration - time;
  },
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
  computedWidth: (state, getters) => Math
    .round(getters.winRatio > getters.ratio ? getters.winHeight * getters.ratio : getters.winWidth),
  computedHeight: (state, getters) => Math
    .round(getters.winRatio < getters.ratio ? getters.winWidth / getters.ratio : getters.winHeight),
  ratio: state => state.ratio,
  AudioDelay: state => state.AudioDelay,
  mediaHash: state => state.mediaHash,
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

function mutationsGenerator(videoMutations) {
  const mutations = {};
  Object.keys(videoMutations).forEach((type) => {
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
const mutations = mutationsGenerator(videoMutations);

const actions = {
  [videoActions.SRC_SET]({ commit, dispatch }, { src, mediaHash }) {
    const srcRegexes = {
      unix: RegExp(/^[^\0]+$/),
      windows: RegExp(/^[a-zA-Z]:\/(((?![<>:"//|?*]).)+((?<![ .])\/)?)*$/),
    };
    Object.keys(srcRegexes).forEach(async (type) => {
      if (srcRegexes[type].test(src)) {
        commit(videoMutations.SRC_UPDATE, src);
        commit(
          videoMutations.MEDIA_HASH_UPDATE,
          mediaHash || await Helpers.methods.mediaQuickHash(src),
        );
        dispatch(subtitleActions.INITIALIZE_VIDEO_SUBTITLE_MAP, { videoSrc: src });
      }
    });
  },
  [videoActions.INITIALIZE]({ commit }, config) {
    Object.keys(config).forEach((item) => {
      const mutation = stateToMutation(item);
      if (videoMutations[mutation]) commit(mutation, config[item]);
    });
  },
  [videoActions.INCREASE_VOLUME]({ dispatch, commit, state }, delta) {
    if (state.muted) dispatch(videoActions.TOGGLE_MUTED);
    const finalDelta = delta || 10;
    const finalVolume = state.volume + finalDelta;
    commit(videoMutations.VOLUME_UPDATE, finalVolume > 100 ? 100 : finalVolume);
  },
  [videoActions.DECREASE_VOLUME]({ dispatch, commit, state }, delta) {
    if (state.muted) dispatch(videoActions.TOGGLE_MUTED);
    const finalDelta = delta || 10;
    const finalVolume = state.volume - finalDelta;
    commit(videoMutations.VOLUME_UPDATE, finalVolume < 0 ? 0 : finalVolume);
    if (finalVolume <= 0) commit(videoMutations.MUTED_UPDATE, true);
  },
  [videoActions.TOGGLE_MUTED]({ commit, state }) {
    commit(videoMutations.MUTED_UPDATE, !state.muted);
  },
  [videoActions.INCREASE_RATE]({ commit, state }) {
    const rateArr = [0.5, 1, 1.2, 1.5, 2];
    const finalRate = rateArr[rateArr.indexOf(state.rate) + 1];
    commit(videoMutations.RATE_UPDATE, finalRate || state.rate);
  },
  [videoActions.DECREASE_RATE]({ commit, state }) {
    const rateArr = [0.5, 1, 1.2, 1.5, 2];
    const finalRate = rateArr[rateArr.indexOf(state.rate) - 1];
    commit(videoMutations.RATE_UPDATE, finalRate || state.rate);
  },
  [videoActions.CHANGE_RATE]({ commit }, delta) {
    commit(videoMutations.RATE_UPDATE, delta);
  },
  [videoActions.PLAY_VIDEO]({ commit }) {
    commit(videoMutations.PAUSED_UPDATE, false);
  },
  [videoActions.PAUSE_VIDEO]({ commit }) {
    commit(videoMutations.PAUSED_UPDATE, true);
  },
  [videoActions.META_INFO]({ commit }, metaInfo) {
    const validMetaInfo = [
      'intrinsicWidth',
      'intrinsicHeight',
      'ratio',
    ];
    Object.keys(metaInfo).forEach((item) => {
      const mutation = stateToMutation(item);
      if (validMetaInfo.includes(item) && videoMutations[mutation]) {
        commit(mutation, metaInfo[item]);
      }
    });
  },
  [videoActions.UPDATE_DELAY]({ commit }, delta) {
    const finalDelay = state.AudioDelay + delta;
    commit(videoMutations.DELAY_UPDATE, finalDelay);
  },
  [videoActions.ADD_AUDIO_TRACK]({ commit, state }, trackToAdd) {
    let times = 1;
    state.audioTrackList.forEach((item) => {
      if (item.language === trackToAdd.language) {
        times += 1;
      }
    });
    trackToAdd = Object.assign(trackToAdd, { name: `${trackToAdd.language} ${romanize(times)}` });
    const newAudioTracks = generateTracks('add', trackToAdd, state.audioTrackList);
    commit(videoMutations.AUDIO_TRACK_LIST_UPDATE, newAudioTracks);
  },
  [videoActions.SWITCH_AUDIO_TRACK]({ commit, state }, trackToSwitch) {
    const newAudioTracks = generateTracks('switch', trackToSwitch, state.audioTrackList);
    commit(videoMutations.AUDIO_TRACK_LIST_UPDATE, newAudioTracks);
  },
  [videoActions.REMOVE_ALL_AUDIO_TRACK]({ commit, state }) {
    const newAudioTracks = generateTracks('removeAll', null, state.audioTrackList);
    commit(videoMutations.AUDIO_TRACK_LIST_UPDATE, newAudioTracks);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
