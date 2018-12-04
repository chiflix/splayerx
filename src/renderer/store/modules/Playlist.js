
const state = {
  PlayingList: [],
  FolderList: [],
};

const getters = {
  isFolderList: state => state.PlayingList.length === 0,
  nextVideo: (state, getters) => {
    const list = state.PlayingList.length > 0 ? state.PlayingList : state.FolderList;
    const index = list.findIndex(value => value === getters.originSrc);
    if (index !== -1 && index + 1 < list.length) {
      return list[index + 1];
    }
    return '';
  },
  playingList: (state, getters) => {
    if (getters.isFolderList) {
      return state.FolderList;
    }
    return state.PlayingList;
  },
  playingIndex: (state, getters) => {
    const list = state.PlayingList.length > 0 ? state.PlayingList : state.FolderList;
    return list.findIndex(value => value === getters.originSrc);
  },
};

const mutations = {
  PlayingList(state, t) {
    state.PlayingList = t;
  },
  AddPlayingList(state, t) {
    state.PlayingList.push(...t);
  },
  FolderList(state, t) {
    state.FolderList = t;
  },
  AddFolderList(state, t) {
    state.FolderList.push(...t);
  },
};

const actions = {};

export default {
  state,
  mutations,
  actions,
  getters,
};
