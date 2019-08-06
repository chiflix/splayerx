import { Browsing as browsingMutations } from '../mutationTypes';
import { Browsing as browsingActions } from '../actionTypes';

const state = {
  barrageOpen: false,
  isPip: false,
  tabGroup: [],
};
const getters = {
  recordUrl: state => state.recordUrl,
  barrageOpen: state => state.barrageOpen,
  isPip: state => state.isPip,
  tabGroup: state => state.tabGroup,
  activeTab: state => state.tabGroup.find(tab => tab.active),
};

const mutations = {
  [browsingMutations.BARRAGE_OPEN_UPDATE](state, payload) {
    state.barrageOpen = payload;
  },
  [browsingMutations.IS_PIP_UPDATE](state, payload) {
    state.isPip = payload;
  },
  [browsingMutations.TAB_GROUP_ADD](state, payload) {
    state.tabGroup.push(payload);
  },
  [browsingMutations.TAB_ACTIVE_SET](state, payload) {
    state.tabGroup.map((tab) => {
      tab.active = tab.id === payload;
      return tab;
    });
  },
  [browsingMutations.TAB_URL_UPDATE](state, payload) {
    state.tabGroup.find(tab => tab.id === payload.id).url = payload.url;
  },
};
const actions = {
  [browsingActions.UPDATE_BARRAGE_OPEN]({ commit }, delta) {
    commit(browsingMutations.BARRAGE_OPEN_UPDATE, delta);
  },
  [browsingActions.UPDATE_IS_PIP]({ commit }, delta) {
    commit(browsingMutations.IS_PIP_UPDATE, delta);
  },
  [browsingActions.ADD_TAB_GROUP]({ commit, getters }, delta) {
    const index = getters.tabGroup.findIndex(tab => tab.id === delta.id);
    if (index === -1) {
      commit(browsingMutations.TAB_GROUP_ADD, delta);
    } else if (delta.reopen) {
      commit(browsingMutations.TAB_URL_UPDATE, delta);
    }
    commit(browsingMutations.TAB_ACTIVE_SET, delta.id);
  },
  [browsingActions.SET_TAB_ACTIVE]({ commit }, delta) {
    commit(browsingMutations.TAB_ACTIVE_SET, delta);
  },
  [browsingActions.UPDATE_TAB_URL]({ commit }, delta) {
    commit(browsingMutations.TAB_URL_UPDATE, delta);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
