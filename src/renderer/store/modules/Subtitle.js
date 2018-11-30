import { Subtitle as subtitleMutations } from '../mutationTypes';
import { Subtitle as subtitleActions } from '../actionTypes';
const state = {
  subtitleList: [],
  currentSubtitleId: '',
  // legacy subtitle state
  SubtitleNames: [],
  curStyle: {
    fontFamily: process.platform === 'win32' ? 'Microsoft YaHei' : 'PingFang SC',
    fontSize: '11px',
    letterSpacing: 1,
    opacity: 1,
    color: 'white',
    fontWeight: '400',
    transform: 'scale(1)',
    transformOrigin: 'bottom',
    webkitFontSmoothing: 'antialiased',
  },
  curBorderStyle: {
    fontFamily: process.platform === 'win32' ? 'Microsoft YaHei' : 'PingFang SC',
    fontSize: '11px',
    letterSpacing: 1,
    padding: '0px',
    textFillColor: 'transparent',
    textStroke: '0.5px #777',
    fontWeight: '400',
    backgroundColor: 'transparent',
    transform: 'scale(1)',
    transformOrigin: 'bottom',
    textShadow: '0px 0.7px 0.5px rgba(0,0,0,.5)',
    webkitFontSmoothing: 'antialiased',
  },
  chosenStyle: '',
  chosenSize: 1,
  SubtitleDelay: 0,
  scaleNum: 1,
};

const getters = {
  currentSubtitleId: state => state.currentSubtitleId,
  subtitleList: state => state.subtitleList,
  // legacy subtitle getters
  subtitleNames: state => state.SubtitleNames,
  firstSubtitleIndex: state => state.SubtitleNames.findIndex(subtitle => subtitle.status === 'first'),
  subtitleCount: state => state.SubtitleNames.length,
  curStyle: state => state.curStyle,
  SubtitleDelay: state => state.SubtitleDelay,
  curBorderStyle: state => state.curBorderStyle,
  chosenStyle: state => state.chosenStyle,
  chosenSize: state => state.chosenSize,
  scaleNum: state => state.scaleNum,
};

const mutations = {
  [subtitleMutations.CURRENT_SUBTITLE_ID_UPDATE](state, subtitleId) {
    state.currentSubtitleId = subtitleId;
  },
  [subtitleMutations.ADD_SUBTITLE](state, subtitle) {
    state.subtitleList = [...state.subtitleList, subtitle];
  },
  [subtitleMutations.REMOVE_SUBTITLE](state, subtitle) {
    state.subtitleList = state.subtitleList.slice().splice(state.subtitleList.indexOf(subtitle), 1);
  },
  [subtitleMutations.SUBTITLE_UPDATE](state, subtitleList) {
    state.subtitleList = subtitleList;
  },
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
  UpdateStyle(state, payload) {
    Object.assign(state.curStyle, payload);
  },
  UpdateBorderStyle(state, payload) {
    Object.assign(state.curBorderStyle, payload);
  },
  UpdateDelay(state, payload) {
    if (payload === 0) {
      state.SubtitleDelay = 0;
    } else {
      state.SubtitleDelay += payload;
    }
  },
  UpdateScale(state, payload) {
    state.scaleNum = payload;
    state.curStyle.transform = `scale(${payload})`;
    state.curBorderStyle.transform = `scale(${payload})`;
  },
  UpdateChosenStyle(state, payload) {
    state.chosenStyle = payload;
  },
  UpdateChosenSize(state, payload) {
    state.chosenSize = payload;
  },
};

const actions = {
  updateStyle({ commit }, delta) {
    commit('UpdateStyle', delta);
  },
  updateBorderStyle({ commit }, delta) {
    commit('UpdateBorderStyle', delta);
  },
  updateSubDelay({ commit }, delta) {
    commit('UpdateDelay', delta);
  },
  updateScale({ commit }, delta) {
    commit('UpdateScale', delta);
  },
  updateChosenStyle({ commit }, delta) {
    commit('UpdateChosenStyle', delta);
  },
  [subtitleActions.ADD_SUBTITLES]({ commit }, subtitles) {
    subtitles.forEach((subtitle) => {
      commit(subtitleMutations.ADD_SUBTITLE, subtitle);
    });
  },
  [subtitleActions.RESET_SUBTITLES]({ commit }) {
    commit(subtitleMutations.CURRENT_SUBTITLE_ID_UPDATE, '');
    commit(subtitleMutations.SUBTITLE_UPDATE, []);
  },
  updateChosenSize({ commit }, delta) {
    commit('UpdateChosenSize', delta);
  },
  [subtitleActions.SWITCH_CURRENT_SUBTITLE]({ commit, state }, subtitleId) {
    const { currentSubtitleId, subtitleList } = state;
    if (
      subtitleId !== currentSubtitleId &&
      subtitleList.filter(subtitle => subtitle.id === subtitleId).length
    ) {
      commit(subtitleMutations.CURRENT_SUBTITLE_ID_UPDATE, subtitleId);
    }
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
