
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  AccurateTime: 0.0, // current position (in ms) of the audio/video playback
  Duration: NaN,
  Volume: 0.2,
  SrcOfVideo: '',
  OriginSrcOfVideo: '',
  PlaybackRate: 1.0,
  SubtitleNameArr: [],
  isPlaying: false,
};

const getters = {
  subtitleNameArr: state => state.SubtitleNameArr,
  firstSubIndex: state => state.SubtitleNameArr.findIndex(subName => subName.status === 'first'),
  subtitleNameArrSize: state => state.SubtitleNameArr.length,
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

  SubtitleNameArr(state, subtitles) {
    state.SubtitleNameArr = subtitles;
  },
  AddSubtitle(state, subtitles) {
    for (let i = 0; i < subtitles.length; i += 1) {
      state.SubtitleNameArr.push(subtitles[i]);
    }
    console.log('PUSHED');
    console.log(state.SubtitleNameArr);
  },
  AddServerSubtitle(state, subtitles) {
    state.SubtitleNameArr.unshift(...subtitles);
  },
  SubtitleOn(state, obj) {
    const index = state.SubtitleNameArr.findIndex(subName => subName.textTrackID === obj.index);
    state.SubtitleNameArr[index].status = obj.status === 'first' ? 'first' : 'second';
  },
  SubtitleOff(state) {
    const index = state.SubtitleNameArr.findIndex(subName => subName.status === 'first');
    if (index !== -1) {
      state.SubtitleNameArr[index].status = null;
    } else {
      console.log('Error in PlaybackStates');
    }
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
