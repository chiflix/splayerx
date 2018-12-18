import Vue from 'vue';
import { Subtitle as subtitleMutations } from '../mutationTypes';
import { Subtitle as subtitleActions } from '../actionTypes';

const state = {
  subtitles: {},
  subtitleList: [],
  currentSubtitleId: '',
  chosenStyle: '',
  chosenSize: 1,
  SubtitleDelay: 0,
  scaleNum: 1,
};

const getters = {
  currentSubtitleId: state => state.currentSubtitleId,
  subtitleList: state => state.subtitleList,
  premiumSubtitles: (state, getters) => state.subtitleList
    .filter(subtitle => subtitle.duration && subtitle.duration >= 0.6 * getters.duration)
    .map(subtitle => ({ id: subtitle.id, played: subtitle.duration })),
  SubtitleDelay: state => state.SubtitleDelay,
  chosenStyle: state => state.chosenStyle,
  chosenSize: state => state.chosenSize,
  scaleNum: state => state.scaleNum,
};

const mutations = {
  [subtitleMutations.CURRENT_SUBTITLE_ID_UPDATE](state, subtitleId) {
    state.currentSubtitleId = subtitleId;
  },
  tempoaryUpdateSubtite(state, payload) {
    Vue.set(state.subtitles, payload.id, payload.state);
  },
  [subtitleMutations.ADD_SUBTITLE](state, subtitle) {
    let isExit = false;
    state.subtitleList.forEach((item, index) => {
      if (item.path && item.path === subtitle.path) {
        state.subtitleList.splice(index, 1);
        state.subtitleList.unshift(item);
        isExit = true;
      }
    });
    if (!isExit) {
      if (subtitle.type === 'local') {
        state.subtitleList = [subtitle, ...state.subtitleList];
      } else {
        state.subtitleList = [...state.subtitleList, subtitle];
      }
    }
  },
  [subtitleMutations.UPDATE_SUBTITLE](state, subtitle) {
    const { id } = subtitle;
    const subtitleList = [...state.subtitleList];
    const index = state.subtitleList.findIndex(subtitle => subtitle.id === id);
    if (index >= 0) {
      subtitleList[index] = subtitle;
      state.subtitleList = subtitleList;
    }
  },
  [subtitleMutations.REMOVE_SUBTITLE](state, subtitle) {
    state.subtitleList = state.subtitleList.slice().splice(state.subtitleList.indexOf(subtitle), 1);
  },
  [subtitleMutations.SUBTITLE_UPDATE](state, subtitleList) {
    state.subtitleList = subtitleList;
  },
  [subtitleMutations.OFF_SUBTITLE](state, subtitle) {
    state.currentSubtitleId = subtitle;
  },
  [subtitleMutations.REFRESH_SUBTITLE](state, subtitle) {
    let num = 0;
    state.subtitleList.forEach((sub, index) => {
      if (sub.type === 'local') {
        num = index + 1;
      }
    });
    state.subtitleList = state.subtitleList.slice(0, num).concat(...subtitle);
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
  [subtitleActions.UPDATE_SUBTITLE]({ commit }, subtitle) {
    commit('tempoaryUpdateSubtite', subtitle);
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
  [subtitleActions.SUBTITLE_DURATION_UPDATE]({ commit, state }, subtitleInfo) {
    const [subtitleId, duration] = subtitleInfo;
    const { subtitleList } = state;
    const subtitle = subtitleList.filter(subtitle => subtitle.id === subtitleId)[0];
    if (subtitle) {
      commit(subtitleMutations.UPDATE_SUBTITLE, { ...subtitle, duration });
    }
  },
  [subtitleActions.OFF_SUBTITLES]({ commit }) {
    commit(subtitleMutations.OFF_SUBTITLE, '');
  },
  [subtitleActions.REFRESH_SUBTITLES]({ commit }, subtitles) {
    commit(subtitleMutations.REFRESH_SUBTITLE, subtitles);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
