import { Browsing as browsingMutations } from '../mutationTypes';
import { Browsing as browsingActions } from '../actionTypes';

const state = {
  initialUrl: '',
};
const getters = {
  initialUrl: state => state.initialUrl,
};

const mutations = {
  [browsingMutations.INITIAL_URL_UPDATE](state, payload) {
    state.initialUrl = payload;
  },
};
const actions = {
  [browsingActions.UPDATE_INITIAL_URL]({ commit }, delta) {
    commit(browsingMutations.INITIAL_URL_UPDATE, delta);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
