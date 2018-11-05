const state = {
  SubtitleNames: [],
  curStyle: {
    fontSize: 5,
    letterSpacing: 1,
    opacity: 1,
    color: '',
    border: '',
    background: '',
  },
};

const getters = {
  subtitleNames: state => state.SubtitleNames,
  firstSubtitleIndex: state => state.SubtitleNames.findIndex(subtitle => subtitle.status === 'first'),
  subtitleCount: state => state.SubtitleNames.length,
  curStyle: state => state.curStyle,
};

const mutations = {
  SubtitleNames(state, subtitles) {
    state.SubtitleNames = subtitles;
  },
  AddSubtitle(state, subtitles) {
    state.SubtitleNames.push(...subtitles);
  },
  AddServerSubtitle(state, subtitles) {
    state.SubtitleNames.push(...subtitles);
  },
  SubtitleOn(state, obj) {
    const index = state.SubtitleNames.findIndex(subtitle => subtitle.textTrackID === obj.index);
    state.SubtitleNames[index].status = obj.status === 'first' ? 'first' : 'second';
  },
  SubtitleOff(state) {
    const index = state.SubtitleNames.findIndex(subtitle => subtitle.status === 'first');
    if (index !== -1) {
      state.SubtitleNames[index].status = null;
    } else {
      throw new Error('Error in Subtitle Vuex.');
    }
  },
  UpdateFontSize(state, payload) {
    state.curStyle.fontSize = payload;
  },
  UpdateColor(state, payload) {
    state.curStyle.color = payload;
  },
};

const actions = {
  updateFontSize({ commit }, delta) {
    commit('UpdateFontSize', delta);
  },
  updateColor({ commit }, delta) {
    commit('UpdateColor', delta);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
