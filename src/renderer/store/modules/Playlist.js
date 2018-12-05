
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
  PlayingList(state, t) {
    state.PlayingList = t;
  },
  AddPlayingList(state, t) {
    state.PlayingList.push(...t);
  },
  RemovePlayingList(state, pos) {
    state.PlayingList.splice(pos, 1);
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
};

export default {
  state,
  mutations,
  actions,
  getters,
};
