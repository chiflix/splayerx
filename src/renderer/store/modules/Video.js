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
  mute: false,
  defaultMuted: false,
  // tracks
  AudioTrackList: [],
  VideoTrackList: [],
  TextTrackList: [],
  // meta info
  intrinsicWidth: 0,
  intrinsicHeight: 0,
  computedWidth: 0,
  computedHeight: 0,
  ratio: 0,
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
  finalPartTime: state => state.duration - 140,
  currentTime: state => state.currentTime,
  paused: state => state.paused,
  roundedCurrentTime: state => Math.round(state.currentTime),
  // controls
  volume: state => state.volume / 100,
  mute: state => state.mute,
  rate: state => state.rate,
  // meta info
  intrinsicWidth: state => state.intrinsicWidth,
  intrinsicHeight: state => state.intrinsicHeight,
  computedWidth: state => state.computedWidth,
  computedHeight: state => state.computedHeight,
  ratio: state => state.ratio,
};

function stateToMutation(stateType) {
  return stateType.replace(/\.?([A-Z])/g, y => `_${y.toLowerCase()}`).replace(/^_/, '').toUpperCase().concat('_UPDATE');
}

function mutationToState(mutationType) {
  return mutationType.toLowerCase().replace(/_UPDATE$/i, '').replace(/(_\w)/g, y => y[1].toUpperCase());
}

function mutationer(mutationType) {
  const stateType = mutationToState(mutationType);
  return (state, p) => {
    state[stateType] = p;
  };
}

function mutationsGenerator(mutationTypes) {
  const mutations = {};
  Object.keys(mutationTypes).forEach((type) => {
    mutations[type] = mutationer(type);
  });
  return mutations;
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
};

export default {
  state,
  getters,
  mutations,
  actions,
};
