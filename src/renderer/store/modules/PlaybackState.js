
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  AccurateTime: 0.0, // current position (in ms) of the audio/video playback
  Duration: NaN,
  Volume: 20,
  Muted: false,
  SrcOfVideo: '',
  OriginSrcOfVideo: '',
  PlaybackRate: 1.0,
  isPlaying: false,
};

const getters = {
  isPlaying: state => state.isPlaying,
  Volume: state => state.Volume / 100,
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
  Volume(state, t) {
    state.Volume = t;
  },
  IncreaseVolume(state) {
    const volume = state.Volume += 10;
    state.Volume = volume > 100 ? 100 : volume;
  },
  DecreaseVolume(state) {
    const volume = state.Volume -= 10;
    state.Volume = volume < 0 ? 0 : volume;
  },
  ToggleMute(state) {
    state.Muted = !state.Muted;
  },
  isPlaying(state, isPlaying) {
    state.isPlaying = isPlaying;
  },
};

const actions = {
};

export const validators = {
  Volume(value) {
    return typeof value === 'number'
      && !Number.isNaN(value)
      && value >= 0
      && value <= 100;
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
