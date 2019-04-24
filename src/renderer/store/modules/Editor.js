
import { Editor as editorMutations } from '../mutationTypes';

const state = {
  isEditable: false, // 字幕编辑模式
  isDragableInProfessional: false, // 在字幕高级模式下，是不是拖拽激活模式
  isSpaceDownInProfessional: false, // 在字幕高级模式下，是不是按了空格键
  isProfessional: false, // 字幕高级编辑模式
  editHistoryLen: 0, // 编辑模式下操作历史记录的长度
  currentEditHistoryIndex: -1, // 编辑模式下当前undo\redo所在历史记录的索引
  isCreateSubtitleMode: false, // 是否是创建字幕模式
  storedBeforeProfessionalInfo: null, // 字幕高级模式下需要存储windowSize、windowMinimumSize、windowPosition
  subtitleEditMenuPrevEnable: false, // 监听字幕高级模式下菜单上一条是否可以使用
  subtitleEditMenuNextEnable: false, // 监听字幕高级模式下菜单下一条是否可以使用
  subtitleEditMenuEnterEnable: false, // 监听字幕高级模式下菜单enter是否可以使用
  currentEditedSubtitleId: null, // 当前编辑的字幕ID
  referenceSubtitleId: null, // 参考字幕的ID
  chooseIndex: -2, // 编辑模式下选中的字幕
  isClickFirstSub: true, // 快速编辑，是不是编辑第一字幕
};

const getters = {
  isEditable: state => state.isEditable,
  isDragableInProfessional: state => state.isDragableInProfessional,
  isSpaceDownInProfessional: state => state.isSpaceDownInProfessional,
  isProfessional: state => state.isProfessional,
  isCreateSubtitleMode: state => state.isCreateSubtitleMode,
  editHistoryLen: state => state.editHistoryLen,
  currentEditHistoryIndex: state => state.currentEditHistoryIndex,
  storedBeforeProfessionalInfo: state => state.storedBeforeProfessionalInfo,
  subtitleEditMenuPrevEnable: state => state.subtitleEditMenuPrevEnable,
  subtitleEditMenuNextEnable: state => state.subtitleEditMenuNextEnable,
  subtitleEditMenuEnterEnable: state => state.subtitleEditMenuEnterEnable,
  currentEditedSubtitleId: state => state.currentEditedSubtitleId,
  referenceSubtitleId: state => state.referenceSubtitleId,
  chooseIndex: state => state.chooseIndex,
  isClickFirstSub: state => state.isClickFirstSub,
};

const mutations = {
  [editorMutations.TOGGLE_EDITABLE](state, payload) {
    state.isEditable = payload;
  },
  [editorMutations.TOGGLE_DRAGABLE_IN_PROFESSIONAL](state, payload) {
    state.isDragableInProfessional = payload;
  },
  [editorMutations.TOGGLE_SPACE_DOWN_IN_PROFESSIONAL](state, payload) {
    state.isSpaceDownInProfessional = payload;
  },
  [editorMutations.TOGGLE_PROFESSIONAL](state, payload) {
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
  [editorMutations.SET_CREATE_MODE](state, payload) {
    state.isCreateSubtitleMode = payload;
  },
  [editorMutations.UPDATE_EDIT_HISTORY_LEN](state, payload) {
    state.editHistoryLen = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_HISTORY_INDEX](state, payload) {
    state.currentEditHistoryIndex = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_PREV_ENABLE](state, payload) {
    state.subtitleEditMenuPrevEnable = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_NEXT_ENABLE](state, payload) {
    state.subtitleEditMenuNextEnable = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_ENTER_ENABLE](state, payload) {
    state.subtitleEditMenuEnterEnable = payload;
  },
  [editorMutations.SWITCH_REFERENCE_SUBTITLE](state, payload) {
    state.referenceSubtitleId = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE](state, payload) {
    state.currentEditedSubtitleId = payload;
  },
  [editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX](state, payload) {
    state.chooseIndex = payload;
  },
  [editorMutations.UPDATE_IS_CLICK_FIRST_SUBTITLE](state, payload) {
    state.isClickFirstSub = payload;
  },
};

const actions = {
};

export default {
  state,
  mutations,
  actions,
  getters,
};
