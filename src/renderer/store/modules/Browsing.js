import { Browsing as browsingMutations } from '../mutationTypes';
import { Browsing as browsingActions } from '../actionTypes';

const state = {
  initialUrl: '',
  browsingWinSize: [0, 0],
};
const getters = {
  browsingWinWidth: state => state.browsingWinSize[0],
  browsingWinHeight: state => state.browsingWinSize[1],
  browsingWinSize: state => state.browsingWinSize,
  initialUrl: state => state.initialUrl,
};

const mutations = {
  [browsingMutations.INITIAL_URL_UPDATE](state, payload) {
    state.initialUrl = payload;
  },
  [browsingMutations.BROWSING_SIZE_UPDATE](state, payload) {
    state.browsingWinSize = payload;
  },
};
const actions = {
  [browsingActions.UPDATE_INITIAL_URL]({ commit }, delta) {
    commit(browsingMutations.INITIAL_URL_UPDATE, delta);
  },
  [browsingActions.UPDATE_BROWSING_SIZE]({ commit }, delta) {
    commit(browsingMutations.BROWSING_SIZE_UPDATE, delta);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
