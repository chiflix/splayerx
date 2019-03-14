import fs from 'fs';
import path from 'path';
import helpers from '@/helpers/index';

const state = {
  PlayList: [],
  isFolderList: undefined,
};

const getters = {
  isFolderList: state => state.isFolderList,
  nextVideo: (state, getters) => {
    const list = state.PlayList;
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
  playingList: state => state.PlayList,
  playingIndex: (state, getters) => state.PlayList.findIndex(value => value === getters.originSrc),
};

const mutations = {
  isFolderList(state) {
    state.isFolderList = true;
  },
  isPlayingList(state) {
    state.isFolderList = false;
  },
  PlayList(state, t) {
    state.PlayList = t;
  },
  AddItemsToPlayingList(state, t) {
    state.PlayList.push(...t);
  },
  RemoveItemFromPlayingListByPos(state, pos) {
    if (pos >= 0) {
      state.PlayList.splice(pos, 1);
    }
  },
  InsertItemToPlayingListByPos(state, item) {
    if (item.newPosition >= 0) {
      state.PlayList.splice(item.newPosition, 0, item.src);
    }
  },
};

const actions = {
  PlayingList({ commit }, payload) {
    commit('isPlayingList');
    commit('PlayList', payload);
  },
  FolderList({ commit }, payload) {
    commit('isFolderList');
    commit('PlayList', payload);
  },
  RemoveItemFromPlayingList({ state, commit }, item) {
    commit('isPlayingList');
    const pos = state.PlayList.indexOf(item);
    if (pos >= 0) commit('RemoveItemFromPlayingListByPos', pos);
  },
  RepositionItemFromPlayingList({ state, commit }, item) {
    commit('isPlayingList');
    const pos = state.PlayList.indexOf(item.src);
    commit('RemoveItemFromPlayingListByPos', pos);
    commit('InsertItemToPlayingListByPos', item);
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
    const dirPath = path.dirname(state.PlayList[0]);

    if (!fs.existsSync(dirPath)) {
      commit('PlayList', []);
    } else if (state.isFolderList) {
      /*
        Currently not judging whether app is mas version
        Until detecting same directory be abandoned on mas version
       */
      helpers.methods.findSimilarVideoByVidPath(state.PlayList[0]).then((videoFiles) => {
        commit('PlayList', videoFiles);
      }, (err) => {
        if (process.mas && err?.code === 'EPERM') {
          dispatch('FolderList', state.PlayList);
        }
      });
    } else {
      for (let i = 0; i < state.PlayList.length; i += 1) {
        fs.access(state.PlayList[i], fs.constants.F_OK, (err) => {
          if (err?.code === 'ENOENT') dispatch('RemoveItemFromPlayingList', state.PlayList[i]);
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
