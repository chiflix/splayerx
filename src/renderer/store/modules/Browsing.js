import { Browsing as browsingMutations } from '../mutationTypes';
import { Browsing as browsingActions } from '../actionTypes';

const state = {
  initialUrl: '',
  recordUrl: {},
  barrageOpen: false,
  isPip: false,
  pipAlwaysOnTop: false,
};
const getters = {
  initialUrl: state => state.initialUrl,
  recordUrl: state => state.recordUrl,
  barrageOpen: state => state.barrageOpen,
  isPip: state => state.isPip,
  pipAlwaysOnTop: state => state.pipAlwaysOnTop,
};

const mutations = {
  [browsingMutations.INITIAL_URL_UPDATE](state, payload) {
    state.initialUrl = payload;
  },
  [browsingMutations.RECORD_URL_UPDATE](state, payload) {
    state.recordUrl = Object.assign(state.recordUrl, payload);
  },
  [browsingMutations.BARRAGE_OPEN_UPDATE](state, payload) {
    state.barrageOpen = payload;
  },
  [browsingMutations.IS_PIP_UPDATE](state, payload) {
    state.isPip = payload;
  },
  [browsingMutations.PIP_ALWAYS_ON_TOP_UPDATE](state, payload) {
    state.pipAlwaysOnTop = payload;
  },
};
const actions = {
  [browsingActions.UPDATE_INITIAL_URL]({ commit }, delta) {
    commit(browsingMutations.INITIAL_URL_UPDATE, delta);
  },
  [browsingActions.UPDATE_RECORD_URL]({ commit }, delta) {
    commit(browsingMutations.RECORD_URL_UPDATE, delta);
  },
  [browsingActions.UPDATE_BARRAGE_OPEN]({ commit }, delta) {
    commit(browsingMutations.BARRAGE_OPEN_UPDATE, delta);
  },
  [browsingActions.UPDATE_IS_PIP]({ commit }, delta) {
    commit(browsingMutations.IS_PIP_UPDATE, delta);
  },
  [browsingActions.UPDATE_PIP_ALWAYS_ON_TOP]({ commit }, delta) {
    commit(browsingMutations.PIP_ALWAYS_ON_TOP_UPDATE, delta);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
