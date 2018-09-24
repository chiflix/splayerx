
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  AccurateTime: 0.0, // current position (in ms) of the audio/video playback
  Duration: NaN,
  Volume: 0.2,
  SrcOfVideo: '',
  OriginSrcOfVideo: '',
  PlaybackRate: 1.0,
  isPlaying: false,
};

const getters = {
  isPlaying: state => state.isPlaying,
};

const mutations = {
  PlaybackRate(state, t) {
    state.PlaybackRate = t;
  },
  SrcOfVideo(state, t) {
    state.SrcOfVideo = t;
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
