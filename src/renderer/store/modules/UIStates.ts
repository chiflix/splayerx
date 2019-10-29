/* eslint-disable @typescript-eslint/no-explicit-any */
import { UIStates as m } from '@/store/mutationTypes';
import { UIStates as a } from '@/store/actionTypes';

type UIStates = {
  showSidebar: boolean,
  showAllWidgets: boolean,
  playlistState: boolean,
};

const state: UIStates = {
  showSidebar: false,
  showAllWidgets: false,
  playlistState: false,
};

const getters = {
  showSidebar: (state: UIStates) => state.showSidebar,
  showAllWidgets: (state: UIStates) => state.showAllWidgets,
  playlistState: (state: UIStates) => state.playlistState,
};

const mutations = {
  [m.UPDATE_SHOW_SIDEBAR](state: UIStates, showSidebar: boolean) {
    state.showSidebar = showSidebar;
  },
  [m.UPDATE_SHOW_ALLWIDGETS](state: UIStates, showAllWidgets: boolean) {
    state.showAllWidgets = showAllWidgets;
  },
  [m.UPDATE_PLAYLIST](state: UIStates, playlistState: boolean) {
    state.playlistState = playlistState;
  },
};

const actions = {
  [a.UPDATE_SHOW_SIDEBAR]({ commit }: any, showSidebar: boolean) {
    commit(m.UPDATE_SHOW_SIDEBAR, showSidebar);
  },
  [a.UPDATE_SHOW_ALLWIDGETS]({ commit }: any, showAllWidgets: boolean) {
    commit(m.UPDATE_SHOW_ALLWIDGETS, showAllWidgets);
  },
  [a.UPDATE_PLAYLIST]({ commit }: any, playlistState: boolean) {
    commit(m.UPDATE_PLAYLIST, playlistState);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
