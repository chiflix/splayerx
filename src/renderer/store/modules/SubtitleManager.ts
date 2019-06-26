import uuidv4 from 'uuid/v4';
import store from '@/store';
import { SubtitleManager as m } from '@/store/mutationTypes';
import { SubtitleManager as a, newSubtitle as subActions } from '@/store/actionTypes';
import { SubtitleControlListItem } from '@/interfaces/ISubtitle';
import { ISubtitleStream, TranscriptInfo, searchForLocalList, retrieveEmbeddedList, fetchOnlineList, OnlineGenerator } from '@/services/subtitle';
import { generateHints } from '@/libs/utils';
import { LanguageCode } from '@/libs/language';
import { log } from '@/libs/Log';
import subtitle from './Subtitle';

let unwatch: Function;

type SubtitleManagerState = {
  list: SubtitleControlListItem[],
  primarySubtitleId: string,
  secondarySubtitleId: string,
}
const state = {
  list: [],
  primarySubtitleId: '',
  secondarySubtitleId: '',
};
const getters = {
  subtitleNewList(state: SubtitleManagerState): SubtitleControlListItem[] { return state.list },
};
const mutations = {
  [m.addSubtitle](state: SubtitleManagerState, source: SubtitleControlListItem) {
    state.list.push(source);
  },
  [m.setPrimarySubtitleId](state: SubtitleManagerState, id: string) {
    state.primarySubtitleId = id;
  }
};
const actions = {
  async [a.refreshSubtitlesInitially]({ dispatch, getters }: any) {
    try {
      const hints = generateHints(getters.originSrc);
      let localList = await searchForLocalList(getters.originSrc);
      dispatch(a.addLocalSubtitles, localList);
      let embeddedList = await retrieveEmbeddedList(getters.originSrc);
      dispatch(a.addEmbeddedSubtitles, embeddedList)
      let onlineList = await fetchOnlineList(getters.originSrc, LanguageCode["zh-CN"], hints);
      dispatch(a.addOnlineSubtitles, onlineList);
      dispatch(a.startAISelection);
    } catch (error) {
      log.error('SubtitleManager', error);
    }
  },
  async [a.refreshSubtitles]() { },
  async [a.addLocalSubtitles](context: any, paths: string[]) { },
  async [a.addEmbeddedSubtitles](context: any, subtitleStreams: ISubtitleStream[]) { },
  async [a.addOnlineSubtitles]({ commit, dispatch }: any, transcriptInfoList: TranscriptInfo[]) {
    // remove all type online item from list
    transcriptInfoList.forEach(async (transcriptInfo: TranscriptInfo) => {
      const id = uuidv4();
      const transcript = new OnlineGenerator(transcriptInfo);
      const language = await transcript.getLanguage();
      const type = await transcript.getType();
      const item: SubtitleControlListItem = {
        id,
        language,
        type,
      }
      store.registerModule(['Subtitle', id], { ...subtitle, name: `${id}` });
      commit(m.addSubtitle, item);
      dispatch(`${id}/${subActions.add}`, transcript);
    })
  },
  async [a.changePrimarySubtitle]({ dispatch, commit }: any, id: string) {
    commit(m.setPrimarySubtitleId, id);
    await dispatch(`${id}/${subActions.load}`);
  },
  async [a.changeSecondarySubtitle](context: any, id: string) { },
  async [a.storeSubtitle](context: any, id: string) { },
  async [a.uploadSubtitle](context: any, id: string) { },
  async [a.startAISelection]({ dispatch }: any) {
    unwatch = store.watch((state: any, getters: any) => getters.subtitleNewList, (value: SubtitleControlListItem[], oldValue: SubtitleControlListItem[]) => {
      // AI select
      if (value.length > 0) {
        dispatch(a.changePrimarySubtitle, value[0].id);
        dispatch(a.stopAISelection);
      }
    });
  },
  async [a.stopAISelection]() {
    unwatch();
  },
  async [a.getCues]({ dispatch, state }: any, time?: number) {
    if (state.primarySubtitleId) {
      try {
        let dialogues = await dispatch(`${state.primarySubtitleId}/${subActions.getDialogues}`, time);
        return dialogues;
      } catch (error) {
        log.error('SubtitleManager', error);
      }
    }
    return [];
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
