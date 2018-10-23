
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  AccurateTime: 0.0, // current position (in ms) of the audio/video playback
  Duration: NaN,
  Volume: 20,
  Muted: false,
  videoMeta: {
    width: 0,
    height: 0,
  },
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
    return '';
  },
  finalPartStartTime: state => state.Duration * 0.7,
  currentTime: state => state.CurrentTime,
  Volume: state => state.Volume / 100,
};

const mutations = {
  PlayingList(state, t) {
    state.PlayingList.push(...t);
  },
  PlaybackRate(state, t) {
    state.PlaybackRate = t;
  },
  OriginSrcOfVideo(state, t) {
    state.OriginSrcOfVideo = t;
  },
  videoMeta(state, t) {
    state.videoMeta = t;
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
  IncreaseVolume(state, t) {
    if (state.Muted) {
      state.Muted = false;
    }
    const deltaVolume = t || 10;
    const volume = state.Volume += deltaVolume;
    state.Volume = volume > 100 ? 100 : volume;
  },
  DecreaseVolume(state, t) {
    if (state.Muted) {
      state.Muted = false;
    }
    const deltaVolume = t || 10;
    const volume = state.Volume -= deltaVolume;
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
