
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  AccurateTime: 0.0, // current position (in ms) of the audio/video playback
  Duration: NaN,
  Volume: 0.2,
  PlaybackRate: 1.0,
  isPlaying: false,
  OriginSrcOfVideo: '',
  PlayingList: [],
};

const getters = {
  isPlaying: state => state.isPlaying,
  convertedSrcOfVideo: (state) => {
    const originPath = state.OriginSrcOfVideo;
    const convertedPath = encodeURIComponent(originPath).replace(/%3A/g, ':').replace(/(%5C)|(%2F)/g, '/');

    return process.platform === 'win32' ? convertedPath : `file://${convertedPath}`;
  },
  nextVideo: (state) => {
    const index = state.PlayingList.findIndex(value => value === state.OriginSrcOfVideo);
    if (index !== -1 && index + 1 < state.PlayingList.length) {
      return state.PlayingList[index + 1];
    }
    return false;
  },
};

const mutations = {
  PlayingList(state, t) {
    state.PlayingList = t;
  },
  PlaybackRate(state, t) {
    state.PlaybackRate = t;
  },
  OriginSrcOfVideo(state, t) {
    state.OriginSrcOfVideo = t;
  },
  CurrentTime(state, t) {
    state.CurrentTime = t;
  },
  AccurateTime(state, t) {
    state.AccurateTime = t;
  },
  Duration(state, t) {
    state.Duration = t;
  },
  Volume(state, v) {
    state.Volume = v;
  },
  isPlaying(state, isPlaying) {
    state.isPlaying = isPlaying;
  },
};

const actions = {
};

export default {
  state,
  mutations,
  actions,
  getters,
};
