/* eslint-disable @typescript-eslint/no-explicit-any */
import { UIStates as m } from '@/store/mutationTypes';
import { UIStates as a } from '@/store/actionTypes';

type UIStates = {
  showSidebar: boolean,
};

const state: UIStates = {
  showSidebar: false,
};

const getters = {
  showSidebar: (state: UIStates) => state.showSidebar,
};

const mutations = {
  [m.UPDATE_SHOW_SIDEBAR](state: UIStates, showSidebar: boolean) {
    state.showSidebar = showSidebar;
  },
};

const actions = {
  [a.UPDATE_SHOW_SIDEBAR]({ commit }: any, showSidebar: boolean) {
    commit(m.UPDATE_SHOW_SIDEBAR, showSidebar);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
