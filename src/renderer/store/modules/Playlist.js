import fs from 'fs';
import path from 'path';
import { getValidVideoRegex } from '@/../shared/utils';

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
  AddPlayingList(state, t) {
    state.PlayingList.push(...t);
  },
  RemovePlayingList(state, pos) {
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
    commit('RemovePlayingList', pos);
  },
  UpdatePlayingList({ dispatch, commit, state }) {
    const dirPath = path.dirname(state.PlayingList[0]);

    if (!fs.existsSync(dirPath)) {
      commit('PlayingList', []);
    } else if (state.isFolderList) {
      const videoFiles = [];
      const files = fs.readdirSync(dirPath);
      for (let i = 0; i < files.length; i += 1) {
        const filename = path.join(dirPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (!stat.isDirectory()) {
          if (getValidVideoRegex().test(path.extname(files[i]))) {
            const fileBaseName = path.basename(filename);
            videoFiles.push(fileBaseName);
          }
        }
      }
      videoFiles.sort();
      for (let i = 0; i < videoFiles.length; i += 1) {
        videoFiles[i] = path.join(dirPath, videoFiles[i]);
      }
      commit('PlayingList', videoFiles);
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
