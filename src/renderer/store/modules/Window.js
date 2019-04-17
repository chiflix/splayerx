
import { Window as windowMutations } from '../mutationTypes';

const state = {
  windowSize: [0, 0],
  windowMinimumSize: [0, 0],
  windowPosition: [0, 0],
  windowAngle: 0,
  isFullScreen: false,
  isFocused: true,
  isMaximized: false,
  isMinimized: false,
  isEditable: false, // 字幕编辑模式
  isProfessional: false, // 字幕高级编辑模式
  editHistoryLen: 0, // 编辑模式下操作历史记录的长度
  currentEditHistoryIndex: -1, // 编辑模式下当前undo\redo所在历史记录的索引
  isCreateSubtitleMode: false, // 是否是创建字幕模式
  storedBeforeProfessionalInfo: null, // 字幕高级模式下需要存储windowSize、windowMinimumSize、windowPosition
  sizePercent: 0,
  subtitleEditMenuPrevEnable: false, // 监听字幕高级模式下菜单上一条是否可以使用
  subtitleEditMenuNextEnable: false, // 监听字幕高级模式下菜单下一条是否可以使用
  subtitleEditMenuEnterEnable: false, // 监听字幕高级模式下菜单enter是否可以使用
};

const getters = {
  winWidth: state => state.windowSize[0],
  winHeight: state => state.windowSize[1],
  winSize: state => state.windowSize,
  winRatio: state => state.windowSize[0] / state.windowSize[1],
  winPosX: state => state.windowPosition[0],
  winPosY: state => state.windowPosition[1],
  winPos: state => state.windowPosition,
  winAngle: state => state.windowAngle,
  isFullScreen: state => state.isFullScreen,
  isFocused: state => state.isFocused,
  isMaximized: state => state.isMaximized,
  isMinimized: state => state.isMinimized,
  isEditable: state => state.isEditable,
  isProfessional: state => state.isProfessional,
  isCreateSubtitleMode: state => state.isCreateSubtitleMode,
  editHistoryLen: state => state.editHistoryLen,
  currentEditHistoryIndex: state => state.currentEditHistoryIndex,
  storedBeforeProfessionalInfo: state => state.storedBeforeProfessionalInfo,
  sizePercent: state => state.sizePercent,
  subtitleEditMenuPrevEnable: state => state.subtitleEditMenuPrevEnable,
  subtitleEditMenuNextEnable: state => state.subtitleEditMenuNextEnable,
  subtitleEditMenuEnterEnable: state => state.subtitleEditMenuEnterEnable,
};

const mutations = {
  windowSize(state, payload) {
    state.windowSize = payload;
    state.sizePercent = 0;
  },
  windowMinimumSize(state, payload) {
    state.windowMinimumSize = payload;
  },
  windowPosition(state, payload) {
    state.windowPosition = payload;
  },
  isFullScreen(state, payload) {
    state.isFullScreen = payload;
  },
  isFocused(state, payload) {
    state.isFocused = payload;
  },
  isMaximized(state, payload) {
    state.isMaximized = payload;
  },
  isMinimized(state, payload) {
    state.isMinimized = payload;
  },
  [windowMutations.TOGGLE_EDITABLE](state, payload) {
    state.isEditable = payload;
  },
  [windowMutations.TOGGLE_PROFESSIONAL](state, payload) {
    // state.isEditable = payload;
    // 如果payload===true,就是准备进入高级编辑模式，这个时候，需要存储当前window信息
    // 保证退出高级编辑模式，可以恢复原来的window尺寸
    state.storedBeforeProfessionalInfo = {
      size: state.windowSize,
      minimumSize: state.windowMinimumSize,
      position: state.windowPosition,
    };
    state.isProfessional = payload;
    state.isCreateSubtitleMode = !payload ? false : state.isCreateSubtitleMode;
    state.editHistoryLen = !payload ? 0 : state.editHistoryLen;
    state.currentEditHistoryIndex = !payload ? -1 : state.currentEditHistoryIndex;
  },
  [windowMutations.SET_CREATE_MODE](state, payload) {
    state.isCreateSubtitleMode = payload;
  },
  [windowMutations.UPDATE_EDIT_HISTORY_LEN](state, payload) {
    state.editHistoryLen = payload;
  },
  [windowMutations.UPDATE_CURRENT_EDIT_HISTORY_INDEX](state, payload) {
    state.currentEditHistoryIndex = payload;
  },
  [windowMutations.UPDATE_CURRENT_EDIT_MENU_PREV_ENABLE](state, payload) {
    state.subtitleEditMenuPrevEnable = payload;
  },
  [windowMutations.UPDATE_CURRENT_EDIT_MENU_NEXT_ENABLE](state, payload) {
    state.subtitleEditMenuNextEnable = payload;
  },
  [windowMutations.UPDATE_CURRENT_EDIT_MENU_ENTER_ENABLE](state, payload) {
    state.subtitleEditMenuEnterEnable = payload;
  },
  sizePercentUpdate(state, payload) {
    state.sizePercent = payload;
  },
  windowAngle(state, payload) {
    state.windowAngle = payload;
  },
};

const actions = {
  updateSizePercent({ commit }, delta) {
    commit('sizePercentUpdate', delta);
  },
  windowRotate90Deg({ commit, state }) {
    (state.windowAngle + 90) === 360 ? commit('windowAngle', 0) : commit('windowAngle', state.windowAngle + 90);
  },
  initWindowRotate({ commit }) {
    commit('windowAngle', 0);
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
