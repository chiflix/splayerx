import fs from 'fs';
import path from 'path';
import helpers from '@/helpers/index';

const state = {
  PlayingList: [],
  isFolderList: undefined,
};

const getters = {
  isFolderList: state => state.isFolderList,
  nextVideo: (state, getters) => {
    const list = state.PlayingList;
    const index = list.findIndex(value => value === getters.originSrc);
    if (index !== -1 && index + 1 < list.length) {
      return list[index + 1];
    }
    return '';
  },
  playingList: state => state.PlayingList,
  playingIndex: (state, getters) => {
    const list = state.PlayingList;
    return list.findIndex(value => value === getters.originSrc);
  },
};

const mutations = {
  isFolderList(state, t) {
    state.isFolderList = t;
  },
  PlayingList(state, t) {
    state.PlayingList = t;
  },
  AddItemsToPlayingList(state, t) {
    state.PlayingList.push(...t);
  },
  RemoveItemFromPlayingListByPos(state, pos) {
    if (pos >= 0) {
      state.PlayingList.splice(pos, 1);
    }
  },
};

const actions = {
  PlayingList({ commit }, payload) {
    commit('isFolderList', false);
    commit('PlayingList', payload);
  },
  FolderList({ commit }, payload) {
    commit('isFolderList', true);
    commit('PlayingList', payload);
  },
  RemovePlayingList({ state, commit }, t) {
    const pos = state.PlayingList.indexOf(t);
    commit('RemoveItemFromPlayingListByPos', pos);
  },
  UpdatePlayingList({ dispatch, commit, state }) {
    const dirPath = path.dirname(state.PlayingList[0]);

    if (!fs.existsSync(dirPath)) {
      commit('PlayingList', []);
    } else if (state.isFolderList) {
      /*
        Currently not judging whether app is mas version
        Until the decision which auto search same directory functionality
        will be abandon on mas version has been confirmed.
       */
      helpers.methods.findSimilarVideoByVidPath(state.PlayingList[0]).then((videoFiles) => {
        commit('PlayingList', videoFiles);
      }, (err) => {
        if (process.mas && err?.code === 'EPERM') {
          // TODO: maybe this.openFolderByDialog(videoFiles[0]) ?
          this.$store.dispatch('FolderList', state.PlayingList);
        }
      });
    } else {
      for (let i = 0; i < state.PlayingList.length; i += 1) {
        fs.access(state.PlayingList[i], fs.constants.F_OK, (err) => {
          if (err?.code === 'ENOENT') dispatch('RemovePlayingList', state.PlayingList[i]);
        });
      }
    }
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
