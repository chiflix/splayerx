
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  AccurateTime: 0.0, // current position (in ms) of the audio/video playback
  Duration: NaN,
  Volume: 0.2,
  SrcOfVideo: '',
  PlaybackRate: 1.0,

  FirstSubtitleState: false,
  SecondSubtitleState: false,
  StartIndex: 0,
  FirstSubIndex: 0,
  // SecondSubIndex的选择，当未选择字幕时该设置为何值
  SecondSubIndex: -1,
  SubtitleNameArr: [],
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

  FirstSubtitleOn(state) {
    state.FirstSubtitleState = true;
  },
  FirstSubtitleOff(state) {
    state.FirstSubtitleState = false;
  },
  SecondSubtitleOn(state) {
    state.SecondSubtitleState = true;
  },
  SecondSubtitleOff(state) {
    state.SecondSubtitleState = false;
  },
  StartIndex(state, index) {
    state.StartIndex = index;
  },
  FirstSubIndex(state, index) {
    state.FirstSubIndex = index;
  },
  SecondSubIndex(state, index) {
    state.SecondSubIndex = index;
  },
  SubtitleNameArr(state, arr) {
    state.SubtitleNameArr = arr;
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
