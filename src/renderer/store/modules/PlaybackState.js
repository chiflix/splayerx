
const state = {
  CurrentTime: 0, // current position (in seconds) of the audio/video playback
  AccurateTime: 0.0, // current position (in ms) of the audio/video playback
  Duration: NaN,
  Volume: 0.2,
  SrcOfVideo: '',
  PlaybackRate: 1.0,

  SubtitleNameArr: [],
};

const getters = {
  firstSubIndex: state => state.SubtitleNameArr.findIndex(subName => subName.status === 'first'),
  SubtitleNameArrSize: state => state.SubtitleNameArr.length,
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

  SubtitleNameArr(state, arr) {
    state.SubtitleNameArr = arr;
  },
  AddSubtitle(state, subName) {
    for (let i = 0; i < subName.length; i += 1) {
      state.SubtitleNameArr.push({ title: subName[i], status: null });
    }
  },
  // 需要对subtitle array的状态进行判断，有无数组，是否超出
  SubtitleOn(state, obj) {
    state.SubtitleNameArr[obj.index].status = obj.status === 'first' ? 'first' : 'second';
  },
  SubtitleOff(state, index) {
    if (index < state.SubtitleNameArr.length) {
      console.log(state.SubtitleNameArr);
      state.SubtitleNameArr[index].status = null;
    }
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
