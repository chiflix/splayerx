
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  AccurateTime: 0.0, // current position (in ms) of the audio/video playback
  Duration: NaN,
  Volume: 0.2,
  SrcOfVideo: '',
  PlaybackRate: 1.0,

  StartIndex: 0,
  FirstSubIndex: 0,
};

const getters = {
};

const mutations = {
  PlaybackRate(state, t) {
    state.PlaybackRate = t;
  },
  SrcOfVideo(state, t) {
    state.SrcOfVideo = t;
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

  StartIndex(state, index) {
    state.StartIndex = index;
  },
  FirstSubIndex(state, index) {
    state.FirstSubIndex = index;
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
