/* eslint-disable @typescript-eslint/no-explicit-any */

import { cloneDeep } from 'lodash';
import { Editor as editorMutations } from '../mutationTypes';
import {
  ISubtitleControlListItem, Cue, ModifiedCues, Type, IEntity, IMetadata,
} from '@/interfaces/ISubtitle';
import {
  Editor as editorActions,
  newSubtitle as subActions,
  SubtitleManager as smActions,
} from '../actionTypes';
import {
  MODIFIED_SUBTITLE_TYPE,
} from '@/constants';
import {
  megreSameTime, generateTrack, storeModified, deleteCrossSubs,
} from '@/services/subtitle/utils';
import { log } from '@/libs/Log';
import { ModifiedGenerator } from '@/services/subtitle/loaders/modified';
import { addSubtitleItemsToList } from '@/services/storage/subtitle';

export type ModifiedSubtitle = {
  cue: Cue,
  type: MODIFIED_SUBTITLE_TYPE,
  index: number,
  selfIndex?: number,
};

type SubtitleEditorState = {
  isEditable: boolean, // 字幕编辑模式
  isDragableInProfessional: boolean, // 在字幕高级模式下，是不是拖拽激活模式
  isSpaceDownInProfessional: boolean, // 在字幕高级模式下，是不是按了空格键
  isProfessional: boolean, // 字幕高级编辑模式
  editHistoryLen: number, // 编辑模式下操作历史记录的长度
  currentEditHistoryIndex: number, // 编辑模式下当前undo\redo所在历史记录的索引
  isCreateSubtitleMode: boolean, // 是否是创建字幕模式
  storedBeforeProfessionalInfo: boolean, // 字幕高级模式下需要存储windowSize、windowMinimumSize、windowPosition
  subtitleEditMenuPrevEnable: boolean, // 监听字幕高级模式下菜单上一条是否可以使用
  subtitleEditMenuNextEnable: boolean, // 监听字幕高级模式下菜单下一条是否可以使用
  subtitleEditMenuEnterEnable: boolean, // 监听字幕高级模式下菜单enter是否可以使用
  chooseIndex: number, // 编辑模式下选中的字幕
  isClickFirstSub: boolean, // 快速编辑，是不是编辑第一字幕
  autoFocus: boolean,
  currentEditedSubtitle?: ISubtitleControlListItem, // 当前编辑的字幕
  referenceSubtitle?: ISubtitleControlListItem, // 参考字幕
  professionalDialogues: [],
  referenceDialogues: [],
  professionalMeta: IMetadata,
};

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
  currentEditedSubtitle: undefined, // 当前编辑的字幕ID
  referenceSubtitle: undefined, // 参考字幕的ID
  chooseIndex: -2, // 编辑模式下选中的字幕
  isClickFirstSub: true, // 快速编辑，是不是编辑第一字幕
  autoFocus: false,
  referenceDialogues: [],
  professionalDialogues: [],
  professionalMeta: {},
};

const getters = {
  isEditable: (state: SubtitleEditorState) => state.isEditable,
  isDragableInProfessional: (state: SubtitleEditorState) => state.isDragableInProfessional,
  isSpaceDownInProfessional: (state: SubtitleEditorState) => state.isSpaceDownInProfessional,
  isProfessional: (state: SubtitleEditorState) => state.isProfessional,
  isCreateSubtitleMode: (state: SubtitleEditorState) => state.isCreateSubtitleMode,
  editHistoryLen: (state: SubtitleEditorState) => state.editHistoryLen,
  currentEditHistoryIndex: (state: SubtitleEditorState) => state.currentEditHistoryIndex,
  storedBeforeProfessionalInfo: (state: SubtitleEditorState) => state.storedBeforeProfessionalInfo,
  subtitleEditMenuPrevEnable: (state: SubtitleEditorState) => state.subtitleEditMenuPrevEnable,
  subtitleEditMenuNextEnable: (state: SubtitleEditorState) => state.subtitleEditMenuNextEnable,
  subtitleEditMenuEnterEnable: (state: SubtitleEditorState) => state.subtitleEditMenuEnterEnable,
  currentEditedSubtitle: (state: SubtitleEditorState) => state.currentEditedSubtitle,
  referenceSubtitle: (state: SubtitleEditorState) => state.referenceSubtitle,
  chooseIndex: (state: SubtitleEditorState) => state.chooseIndex,
  isClickFirstSub: (state: SubtitleEditorState) => state.isClickFirstSub,
  autoFocus: (state: SubtitleEditorState) => state.autoFocus,
  professionalDialogues: (state: SubtitleEditorState) => state.professionalDialogues,
  professionalMeta: (state: SubtitleEditorState) => state.professionalMeta,
  referenceDialogues: (state: SubtitleEditorState) => state.referenceDialogues,
};

const mutations = {
  [editorMutations.TOGGLE_EDITABLE](state: SubtitleEditorState, payload: boolean) {
    state.isEditable = payload;
  },
  [editorMutations.TOGGLE_DRAGABLE_IN_PROFESSIONAL](state: SubtitleEditorState, payload: boolean) {
    state.isDragableInProfessional = payload;
  },
  [editorMutations.TOGGLE_SPACE_DOWN_IN_PROFESSIONAL](
    state: SubtitleEditorState,
    payload: boolean,
  ) {
    state.isSpaceDownInProfessional = payload;
  },
  [editorMutations.STORE_BEFORE_PROFESSIONAL](state: SubtitleEditorState, payload: any) {
    state.storedBeforeProfessionalInfo = payload;
  },
  [editorMutations.TOGGLE_PROFESSIONAL](state: SubtitleEditorState, payload: boolean) {
    // state.isEditable = payload;
    // 如果payload===true,就是准备进入高级编辑模式，这个时候，需要存储当前window信息
    // 保证退出高级编辑模式，可以恢复原来的window尺寸
    state.isProfessional = payload;
    state.isCreateSubtitleMode = !payload ? false : state.isCreateSubtitleMode;
    state.editHistoryLen = !payload ? 0 : state.editHistoryLen;
    state.currentEditHistoryIndex = !payload ? -1 : state.currentEditHistoryIndex;
  },
  [editorMutations.SET_CREATE_MODE](state: SubtitleEditorState, payload: boolean) {
    state.isCreateSubtitleMode = payload;
  },
  [editorMutations.UPDATE_EDIT_HISTORY_LEN](state: SubtitleEditorState, payload: number) {
    state.editHistoryLen = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_HISTORY_INDEX](state: SubtitleEditorState, payload: number) {
    state.currentEditHistoryIndex = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_PREV_ENABLE](
    state: SubtitleEditorState,
    payload: boolean,
  ) {
    state.subtitleEditMenuPrevEnable = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_NEXT_ENABLE](
    state: SubtitleEditorState,
    payload: boolean,
  ) {
    state.subtitleEditMenuNextEnable = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_ENTER_ENABLE](
    state: SubtitleEditorState,
    payload: boolean,
  ) {
    state.subtitleEditMenuEnterEnable = payload;
  },
  [editorMutations.SWITCH_REFERENCE_SUBTITLE](
    state: SubtitleEditorState, payload?: ISubtitleControlListItem,
  ) {
    state.referenceSubtitle = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE](
    state: SubtitleEditorState, payload?: ISubtitleControlListItem,
  ) {
    state.currentEditedSubtitle = payload;
  },
  [editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX](state: SubtitleEditorState, payload: number) {
    state.chooseIndex = payload;
  },
  [editorMutations.UPDATE_IS_CLICK_FIRST_SUBTITLE](state: SubtitleEditorState, payload: boolean) {
    state.isClickFirstSub = payload;
  },
  [editorMutations.UPDATE_AUTO_FOCUS](state: SubtitleEditorState, payload: boolean) {
    state.autoFocus = payload;
  },
  [editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES](state: SubtitleEditorState, cues: []) {
    state.professionalDialogues = cues;
  },
  [editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES](state: SubtitleEditorState, cues: []) {
    state.referenceDialogues = cues;
  },
  [editorMutations.UPDATE_CURRENT_PROFESSIONAL_META](state: SubtitleEditorState, meta: IMetadata) {
    state.professionalMeta = meta;
  },
};

const actions = {
  [editorActions.TOGGLE_PROFESSIONAL]({
    commit,
  }: any, payload: boolean) {
    if (!payload) {
      commit(editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE, undefined);
      commit(editorMutations.SWITCH_REFERENCE_SUBTITLE, undefined);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, []);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_META, {});
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, []);
    }
    commit(editorMutations.TOGGLE_PROFESSIONAL, payload);
  },
  async [editorActions.TRY_ENTER_PROFESSIONAL]({
    commit, getters, rootState, dispatch,
  }: any, item: ISubtitleControlListItem) {
    if (!(!rootState[item.id] || !rootState[item.id].fullyRead)) {
      let referenceHash = item.hash;
      let cues = {
        dialogues: [],
        metadata: {},
      };
      if (rootState[item.id].displaySource.type === Type.Modified) {
        referenceHash = rootState[item.id].displaySource.source.reference;
        commit(editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE, item);
        try {
          cues = await dispatch(`${item.id}/${subActions.getDialogues}`, undefined);
        } catch (error) {
          // empty
        }
      }
      // refresh cues
      const dialogues = megreSameTime(cues.dialogues);
      const generateDialogues = generateTrack(dialogues);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, generateDialogues);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_META, cues.metadata);

      const referenceSub: ISubtitleControlListItem = getters.list
        .find((e: ISubtitleControlListItem) => e.hash === referenceHash);
      if (referenceSub) {
        commit(editorMutations.SWITCH_REFERENCE_SUBTITLE, referenceSub);
        try {
          const cues = await dispatch(`${referenceSub.id}/${subActions.getDialogues}`, undefined);
          const referenceDialogues = deleteCrossSubs(cues.dialogues, dialogues);
          const generateDialogues = generateTrack(referenceDialogues);
          commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, generateDialogues);
        } catch (error) {
          // empty
        }
      }
      commit(editorMutations.TOGGLE_PROFESSIONAL, true);
      // save before enter
      commit(editorMutations.STORE_BEFORE_PROFESSIONAL, {
        size: getters.windowSize,
        minimumSize: getters.windowMinimumSize,
        position: getters.windowPosition,
      });
    }
  },
  // eslint-disable-next-line complexity
  async [editorActions.SUBTITLE_MODIFIED]({
    state, getters, dispatch, commit, rootState,
  }: any, payload: ModifiedSubtitle) {
    const subtitleId = state.currentEditedSubtitle ? state.currentEditedSubtitle.id : undefined;
    if (subtitleId) {
      if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE) {
        const dialogues = cloneDeep(state.professionalDialogues);
        const index = dialogues.findIndex((e: Cue) => e.start > payload.cue.start);
        const newCue = {
          start: payload.cue.start,
          end: payload.cue.end,
          text: payload.cue.text,
          tags: payload.cue.tags,
          format: payload.cue.format,
          track: payload.cue.track,
        };
        if (index > 0) {
          commit(editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX, index);
          dialogues.splice(index, 0, newCue);
        } else {
          commit(editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX, dialogues.length);
          dialogues.push(newCue);
        }
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
        dispatch(`${subtitleId}/${subActions.save}`, dialogues);
        const rDialogues = cloneDeep(state.referenceDialogues);
        rDialogues.splice(payload.cue.selfIndex, 1);
        commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, rDialogues);
      } else if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD) {
        const dialogues = cloneDeep(state.professionalDialogues);
        const index = dialogues.findIndex((e: Cue) => e.start > payload.cue.start);
        const newCue = {
          start: payload.cue.start,
          end: payload.cue.end,
          text: payload.cue.text,
          tags: payload.cue.tags,
          format: payload.cue.format,
          track: payload.cue.track,
        };
        if (index > 0) {
          dialogues.splice(index, 0, newCue);
        } else {
          dialogues.push(newCue);
        }
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
        dispatch(`${subtitleId}/${subActions.save}`, dialogues);
      } else if (payload.type === MODIFIED_SUBTITLE_TYPE.DELETE_FROM_REFERENCE) {
        const dialogues = cloneDeep(getters.referenceDialogues);
        dialogues.splice(payload.cue.selfIndex, 1);
        const generateDialogues = generateTrack(dialogues);
        commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, generateDialogues);
      } else if (payload.type === MODIFIED_SUBTITLE_TYPE.DELETE) {
        const dialogues = cloneDeep(getters.professionalDialogues);
        dialogues.splice(payload.cue.selfIndex, 1);
        dispatch(`${subtitleId}/${subActions.save}`, cloneDeep(dialogues));
        const generateDialogues = generateTrack(dialogues);
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, generateDialogues);
      } else if (payload.type === MODIFIED_SUBTITLE_TYPE.REPLACE) {
        const dialogues = cloneDeep(state.professionalDialogues);
        dialogues[payload.index].start = payload.cue.start;
        dialogues[payload.index].end = payload.cue.end;
        dialogues[payload.index].text = payload.cue.text;
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
        dispatch(`${subtitleId}/${subActions.save}`, dialogues);
      }
      return;
    }
    if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE) {
      const modified: ModifiedCues = {
        dialogues: [{
          start: payload.cue.start,
          end: payload.cue.end,
          text: payload.cue.text,
          tags: payload.cue.tags,
          format: payload.cue.format,
          track: payload.cue.track,
        }],
        meta: {
          PlayResX: '', PlayResY: '',
        },
        info: {
          hash: '',
          path: '',
        },
      };
      try {
        // save json data to local
        const { hash, path } = await storeModified(modified.dialogues, modified.meta);
        if (hash && path) {
          modified.info.hash = hash;
          modified.info.path = path;
          modified.info.reference = state.referenceSubtitle;
          const entry: IEntity = rootState[state.referenceSubtitle.id].entity;
          if (entry && entry.format) {
            modified.info.format = entry.format;
          }
          // dispatch add subtitle
          const subtitle = await dispatch(smActions.addSubtitle, {
            generator: new ModifiedGenerator(modified), mediaHash: getters.mediaHash,
          });
          // 保存本次字幕到数据库
          addSubtitleItemsToList([subtitle], getters.mediaHash);
          if (subtitle && subtitle.id) {
            // 选中当前翻译的字幕
            dispatch(smActions.manualChangePrimarySubtitle, subtitle.id);
            commit(editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE, subtitle);
          }
        }
      } catch (error) {
        // empty
        log.error('storeModified', error);
      }
      // refresh cues
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, modified.dialogues);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_META, modified.meta);
      const rDialogues = cloneDeep(state.referenceDialogues);
      rDialogues.splice(payload.cue.selfIndex, 1);
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, rDialogues);
    } else if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD) {
      const modified: ModifiedCues = {
        dialogues: [{
          start: payload.cue.start,
          end: payload.cue.end,
          text: payload.cue.text,
          tags: payload.cue.tags,
          format: payload.cue.format,
          track: payload.cue.track,
        }],
        meta: {
          PlayResX: '', PlayResY: '',
        },
        info: {
          hash: '',
          path: '',
        },
      };
      try {
        // save json data to local
        const { hash, path } = await storeModified(modified.dialogues, modified.meta);
        if (hash && path) {
          modified.info.hash = hash;
          modified.info.path = path;
          modified.info.reference = state.referenceSubtitle;
          const entry: IEntity = rootState[state.referenceSubtitle.id].entity;
          if (entry && entry.format) {
            modified.info.format = entry.format;
          }
          // dispatch add subtitle
          const subtitle = await dispatch(smActions.addSubtitle, {
            generator: new ModifiedGenerator(modified), mediaHash: getters.mediaHash,
          });
          // 保存本次字幕到数据库
          addSubtitleItemsToList([subtitle], getters.mediaHash);
          if (subtitle && subtitle.id) {
            // 选中当前翻译的字幕
            dispatch(smActions.manualChangePrimarySubtitle, subtitle.id);
            commit(editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE, subtitle);
          }
        }
      } catch (error) {
        // empty
        log.error('storeModified', error);
      }
      // refresh cues
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, modified.dialogues);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_META, modified.meta);
    } else if (payload.type === MODIFIED_SUBTITLE_TYPE.DELETE_FROM_REFERENCE) {
      const dialogues = cloneDeep(getters.referenceDialogues);
      dialogues.splice(payload.cue.selfIndex, 1);
      const generateDialogues = generateTrack(dialogues);
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, generateDialogues);
    }
  },
  // eslint-disable-next-line complexity
  async [editorActions.SUBTITLE_CONVERT_TO_MODIFIED]({
    rootState, getters, dispatch,
  }: any, payload: { cue: Cue, text: string, isFirstSub: boolean }) {
    const modified: ModifiedCues = {
      dialogues: [],
      meta: {},
      info: {
        hash: '',
        path: '',
      },
    };
    let subtitleId = '';
    if (payload.isFirstSub) {
      subtitleId = getters.primarySubtitleId;
    } else {
      subtitleId = getters.secondarySubtitleId;
    }
    const sub: ISubtitleControlListItem = getters.list
      .find((e: ISubtitleControlListItem) => e.id === subtitleId);
    if (!sub && !subtitleId) return;
    if (sub.source.type !== Type.Modified) {
      // getAllCues
      try {
        const tmpCues = await dispatch(`${subtitleId}/${subActions.getDialogues}`, undefined);
        if (payload.text !== '') {
          // replace cue with new text
          tmpCues.dialogues.forEach((e: Cue) => {
            if (e.start === payload.cue.start && e.end === payload.cue.end) {
              e.text = payload.text;
            }
          });
        } else {
          const index = tmpCues.dialogues
            .findIndex((e: Cue) => e.start === payload.cue.start && e.end === payload.cue.end);
          tmpCues.dialogues.splice(index, 1);
        }
        modified.dialogues = tmpCues.dialogues;
        modified.meta = tmpCues.metadata;
      } catch (error) {
        // empty
      }
      try {
        // save json data to local
        const { hash, path } = await storeModified(modified.dialogues, modified.meta);
        if (hash && path) {
          modified.info.hash = hash;
          modified.info.path = path;
          modified.info.reference = sub;
          const entry: IEntity = rootState[subtitleId].entity;
          if (entry && entry.format) {
            modified.info.format = entry.format;
          }
          // dispatch add subtitle
          const subtitle = await dispatch(smActions.addSubtitle, {
            generator: new ModifiedGenerator(modified), mediaHash: getters.mediaHash,
          });
          // 保存本次字幕到数据库
          addSubtitleItemsToList([subtitle], getters.mediaHash);
          if (subtitle && subtitle.id) {
            // 选中当前翻译的字幕
            dispatch(smActions.manualChangePrimarySubtitle, subtitle.id);
          }
        }
      } catch (error) {
        // empty
        log.error('storeModified', error);
      }
    } else {
      try {
        const tmpCues = await dispatch(`${subtitleId}/${subActions.getDialogues}`, undefined);
        if (payload.text !== '') {
          // replace cue with new text
          tmpCues.dialogues.forEach((e: Cue) => {
            if (e.start === payload.cue.start && e.end === payload.cue.end) {
              e.text = payload.text;
            }
          });
        } else {
          const index = tmpCues.dialogues
            .findIndex((e: Cue) => e.start === payload.cue.start && e.end === payload.cue.end);
          tmpCues.dialogues.splice(index, 1);
        }
        dispatch(`${subtitleId}/${subActions.save}`, tmpCues.dialogues);
      } catch (error) {
        // empty
      }
    }
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
