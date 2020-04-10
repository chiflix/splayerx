import { Browsing as browsingMutations } from '../mutationTypes';
import { Browsing as browsingActions } from '../actionTypes';

const state = {
  initialUrl: '',
  recordUrl: {},
  barrageOpen: false,
  isPip: false,
  pipMode: 'Enter',
  isHomePage: false,
  isError: false,
  currentChannel: '',
  pipChannel: '',
  currentPage: '',
  currentCategory: '',
  bookmarkSelectedIndex: 0,
  gettingTemporaryViewInfo: false,
};
const getters = {
  initialUrl: state => state.initialUrl,
  recordUrl: state => state.recordUrl,
  barrageOpen: state => state.barrageOpen,
  isPip: state => state.isPip,
  pipMode: state => state.pipMode,
  isHomePage: state => state.isHomePage,
  isError: state => state.isError,
  currentChannel: state => state.currentChannel,
  pipChannel: state => state.pipChannel,
  currentPage: state => state.currentPage,
  currentCategory: state => state.currentCategory,
  bookmarkSelectedIndex: state => state.bookmarkSelectedIndex,
  gettingTemporaryViewInfo: state => state.gettingTemporaryViewInfo,
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
  [browsingMutations.PIP_MODE_UPDATE](state, payload) {
    state.pipMode = payload;
  },
  [browsingMutations.IS_HOME_PAGE_UPDATE](state, payload) {
    state.isHomePage = payload;
  },
  [browsingMutations.IS_ERROR_UPDATE](state, payload) {
    state.isError = payload;
  },
  [browsingMutations.CURRENT_CHANNEL_UPDATE](state, payload) {
    state.currentChannel = payload;
  },
  [browsingMutations.PIP_CHANNEL_UPDATE](state, payload) {
    state.pipChannel = payload;
  },
  [browsingMutations.CURRENT_PAGE_UPDATE](state, payload) {
    state.currentPage = payload;
  },
  [browsingMutations.CURRENT_CATEGORY_UPDATE](state, payload) {
    state.currentCategory = payload;
  },
  [browsingMutations.BOOKMARK_SELECTED_INDEX_UPDATE](state, payload) {
    state.bookmarkSelectedIndex = payload;
  },
  [browsingMutations.GETTING_TEMPORARY_VIEW_INFO_UPDATE](state, payload) {
    state.gettingTemporaryViewInfo = payload;
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
  [browsingActions.UPDATE_PIP_MODE]({ commit }, delta) {
    commit(browsingMutations.PIP_MODE_UPDATE, delta);
  },
  [browsingActions.UPDATE_IS_HOME_PAGE]({ commit }, delta) {
    commit(browsingMutations.IS_HOME_PAGE_UPDATE, delta);
  },
  [browsingActions.UPDATE_IS_ERROR]({ commit }, delta) {
    commit(browsingMutations.IS_ERROR_UPDATE, delta);
  },
  [browsingActions.UPDATE_CURRENT_CHANNEL]({ commit }, delta) {
    commit(browsingMutations.CURRENT_CHANNEL_UPDATE, delta);
  },
  [browsingActions.UPDATE_PIP_CHANNEL]({ commit }, delta) {
    commit(browsingMutations.PIP_CHANNEL_UPDATE, delta);
  },
  [browsingActions.UPDATE_CURRENT_PAGE]({ commit }, delta) {
    commit(browsingMutations.CURRENT_PAGE_UPDATE, delta);
  },
  [browsingActions.UPDATE_CURRENT_CATEGORY]({ commit }, delta) {
    commit(browsingMutations.CURRENT_CATEGORY_UPDATE, delta);
  },
  [browsingActions.UPDATE_BOOKMARK_SELECTED_INDEX]({ commit }, delta) {
    commit(browsingMutations.BOOKMARK_SELECTED_INDEX_UPDATE, delta);
  },
  [browsingActions.UPDATE_GETTING_TEMPORARY_VIEW_INFO]({ commit }, delta) {
    commit(browsingMutations.GETTING_TEMPORARY_VIEW_INFO_UPDATE, delta);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
