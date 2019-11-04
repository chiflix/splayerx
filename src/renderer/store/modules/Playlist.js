import fs from 'fs';
import path from 'path';
import helpers from '@/helpers/index';

const state = {
  source: '', // 'drop' or '', used on mas version
  id: NaN,
  items: [],
  playList: [],
  isFolderList: undefined,
};

const getters = {
  source: state => state.source,
  isFolderList: state => state.isFolderList,
  items: state => state.items,
  playListId: state => state.id,
  playingList: state => state.playList,
  playingIndex: (state, getters) => state.playList.findIndex(value => value === getters.originSrc),
  nextVideoId: (state, getters) => {
    const index = state.items.findIndex(value => value === getters.videoId);
    if (!getters.singleCycle) {
      if (getters.playlistLoop && state.items.length === 1) return NaN;
      if (getters.playlistLoop && index + 1 === state.items.length) return state.items[0];
      if (index !== -1) {
        return state.items[index + 1];
      }
      return state.items[0];
    }
    return NaN;
  },
  nextVideo: (state, getters) => {
    const list = state.playList;
    const index = list.findIndex(value => value === getters.originSrc);
    if (!getters.singleCycle) {
      if (getters.playlistLoop && list.length === 1) return '';
      if (getters.playlistLoop && index + 1 === list.length) return list[0];
      if (index !== -1) return list[index + 1];
      return list[0];
    }
    return '';
  },
  previousVideo: (state, getters) => {
    const list = state.playList;
    const index = list.findIndex(value => value === getters.originSrc);
    if (!getters.singleCycle) {
      if (getters.playlistLoop && list.length === 1) return '';
      if (getters.playlistLoop && index - 1 < 0) return list[list.length - 1];
      if (index !== -1) return list[index - 1];
      return list[0];
    }
    return '';
  },
  previousVideoId: (state, getters) => {
    const index = state.items.findIndex(value => value === getters.videoId);
    if (!getters.singleCycle) {
      if (getters.playlistLoop && state.items.length === 1) return NaN;
      if (getters.playlistLoop && index - 1 < 0) return state.items[state.items.length - 1];
      if (index !== -1) return state.items[index - 1];
      return state.items[0];
    }
    return NaN;
  },
};

const mutations = {
  Init(state) {
    state.id = NaN;
    state.items = [];
    state.playList = [];
    state.isFolderList = undefined;
  },
  source(state, type) {
    state.source = type;
  },
  id(state, id) {
    state.id = id;
  },
  isFolderList(state) {
    state.isFolderList = true;
  },
  isPlayingList(state) {
    state.isFolderList = false;
  },
  items(state, t) {
    state.items = t;
  },
  playList(state, t) {
    state.playList = t;
  },
  AddIdsToPlayingList(state, t) {
    state.items.push(...t);
  },
  AddItemsToPlayingList(state, t) {
    state.playList.push(...t);
  },
  RemoveItemFromPlayingListByPos(state, pos) {
    if (pos >= 0) {
      state.playList.splice(pos, 1);
      state.items.splice(pos, 1);
    }
  },
  InsertItemToPlayingList(state, item) {
    if (item.newPosition < 0) item.newPosition = 0;
    state.playList.splice(item.newPosition, 0, item.src);
    state.items.splice(item.newPosition, 0, item.id);
  },
};

const actions = {
  Init({ commit }) {
    commit('Init');
  },
  PlayingList({ commit }, payload) {
    commit('isPlayingList');
    if (payload.paths) commit('playList', payload.paths);
    if (payload.items) commit('items', payload.items);
    commit('id', payload.id ? payload.id : '');
  },
  FolderList({ commit }, payload) {
    commit('isFolderList');
    commit('playList', payload.paths);
    if (payload.items) commit('items', payload.items);
    commit('id', payload.id);
  },
  RemoveItemFromPlayingList({ state, commit }, item) {
    const pos = state.playList.indexOf(item);
    if (pos >= 0) commit('RemoveItemFromPlayingListByPos', pos);
  },
  /*
    item: {
      newPosition: Number,
      src: String,
    }
   */
  RepositionItemFromPlayingList({ state, commit }, item) {
    const pos = state.playList.indexOf(item.src);
    commit('RemoveItemFromPlayingListByPos', pos);
    commit('InsertItemToPlayingList', item);
  },
  AddItemsToPlayingList({ commit }, items) {
    commit('AddItemsToPlayingList', items.paths);
    commit('AddIdsToPlayingList', items.ids);
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
        if (process.mas && (err && err.code === 'EPERM')) {
          dispatch('FolderList', {
            id: state.id,
            paths: state.playList,
            items: state.items,
          });
        }
      });
    } else {
      for (let i = 0; i < state.playList.length; i += 1) {
        fs.access(state.playList[i], fs.constants.F_OK, (err) => {
          if (err && err.code === 'ENOENT') dispatch('RemoveItemFromPlayingList', state.playList[i]);
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
