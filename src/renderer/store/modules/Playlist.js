import fs from 'fs';
import path from 'path';
import helpers from '@/helpers/index';

const state = {
  hash: '',
  playList: [],
  isFolderList: undefined,
};

const getters = {
  playListHash: state => state.hash,
  isFolderList: state => state.isFolderList,
  nextVideo: (state, getters) => {
    const list = state.playList;
    const index = list.findIndex(value => value === getters.originSrc);
    if (!getters.singleCycle) {
      if (index !== -1 && index + 1 < list.length) {
        return list[index + 1];
      } else if (index + 1 >= list.length) {
        return list[0];
      }
    }
    return '';
  },
  playingList: state => state.playList,
  playingIndex: (state, getters) => state.playList.findIndex(value => value === getters.originSrc),
};

const mutations = {
  hash(state, h) {
    state.hash = h;
  },
  isFolderList(state) {
    state.isFolderList = true;
  },
  isPlayingList(state) {
    state.isFolderList = false;
  },
  playList(state, t) {
    state.playList = t;
  },
  AddItemsToPlayingList(state, t) {
    state.playList.push(...t);
  },
  RemoveItemFromPlayingListByPos(state, pos) {
    if (pos >= 0) {
      state.playList.splice(pos, 1);
    }
  },
  InsertItemToPlayingList(state, item) {
    if (item.newPosition >= 0) {
      state.playList.splice(item.newPosition, 0, item.src);
    }
  },
};

const actions = {
  PlayingList({ commit }, payload) {
    commit('isPlayingList');
    commit('playList', payload.paths);
    commit('hash', payload.hash);
  },
  FolderList({ commit }, payload) {
    commit('isFolderList');
    commit('playList', payload);
  },
  RemoveItemFromPlayingList({ state, commit }, item) {
    commit('isPlayingList');
    const pos = state.playList.indexOf(item);
    if (pos >= 0) commit('RemoveItemFromPlayingListByPos', pos);
  },
  RepositionItemFromPlayingList({ state, commit }, item) {
    commit('isPlayingList');
    const pos = state.playList.indexOf(item.src);
    commit('RemoveItemFromPlayingListByPos', pos);
    commit('InsertItemToPlayingList', item);
  },
  AddItemsToPlayingList({ commit, dispatch }, items) {
    commit('isPlayingList');
    if (items.length) {
      items.forEach((item) => {
        dispatch('RemoveItemFromPlayingList', item);
      });
    } else {
      dispatch('RemoveItemFromPlayingList', items);
    }
    commit('AddItemsToPlayingList', items);
  },
  UpdatePlayingList({ dispatch, commit, state }) {
    const dirPath = path.dirname(state.playList[0]);

    if (!fs.existsSync(dirPath)) {
      commit('playList', []);
    } else if (state.isFolderList) {
      /*
        Currently not judging whether app is mas version
        Until detecting same directory be abandoned on mas version
       */
      helpers.methods.findSimilarVideoByVidPath(state.playList[0]).then((videoFiles) => {
        commit('playList', videoFiles);
      }, (err) => {
        if (process.mas && err?.code === 'EPERM') {
          dispatch('FolderList', state.playList);
        }
      });
    } else {
      for (let i = 0; i < state.playList.length; i += 1) {
        fs.access(state.playList[i], fs.constants.F_OK, (err) => {
          if (err?.code === 'ENOENT') dispatch('RemoveItemFromPlayingList', state.playList[i]);
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
