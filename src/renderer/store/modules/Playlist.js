import fs from 'fs';
import path from 'path';

const state = {
  PlayingList: [],
  isFolderList: undefined,
};

const getters = {
  isFolderList: state => state.isFolderList,
  nextVideo: (state, getters) => {
    const list = state.PlayingList;
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
  InsertItemToPlayingListByPos(state, item) {
    if (item.newPosition >= 0) {
      state.PlayingList.splice(item.newPosition, 0, item.src);
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
  RemoveItemFromPlayingList({ state, commit }, item) {
    const pos = state.PlayingList.indexOf(item);
    if (pos >= 0) commit('RemoveItemFromPlayingListByPos', pos);
  },
  RepositionItemFromPlayingList({ state, commit }, item) {
    const pos = state.PlayingList.indexOf(item.src);
    commit('RemoveItemFromPlayingListByPos', pos);
    commit('InsertItemToPlayingListByPos', item);
  },
  AddItemsToPlayingList({ commit, dispatch }, items) {
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
    const dirPath = path.dirname(state.PlayingList[0]);

    if (!fs.existsSync(dirPath)) {
      commit('PlayingList', []);
    } else {
      for (let i = 0; i < state.PlayingList.length; i += 1) {
        fs.access(state.PlayingList[i], fs.constants.F_OK, (err) => {
          if (err?.code === 'ENOENT') dispatch('RemoveItemFromPlayingList', state.PlayingList[i]);
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
