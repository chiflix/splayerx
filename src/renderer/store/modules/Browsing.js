import { Browsing as browsingMutations } from '../mutationTypes';
import { Browsing as browsingActions } from '../actionTypes';

const state = {
  initialUrl: '',
  youtubeId: '',
};
const getters = {
  initialUrl: state => state.initialUrl,
  youtubeId: state => state.youtubeId,
};

const mutations = {
  [browsingMutations.INITIAL_URL_UPDATE](state, payload) {
    state.initialUrl = payload;
  },
  [browsingMutations.YOUTUBE_ID_UPDATE](state, payload) {
    state.youtubeId = payload;
  },
};
const actions = {
  [browsingActions.UPDATE_INITIAL_URL]({ commit }, delta) {
    commit(browsingMutations.INITIAL_URL_UPDATE, delta);
  },
  [browsingActions.UPDATE_YOUTUBE_ID]({ commit }, delta) {
    commit(browsingMutations.YOUTUBE_ID_UPDATE, delta);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
