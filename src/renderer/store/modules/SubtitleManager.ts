import { SubtitleManager as m } from '@/store/mutationTypes';
import { SubtitleManager as a } from '@/store/actionTypes';
import { SubtitleControlListItem } from '@/interfaces/ISubtitle';
import { SagiSubtitlePayload, ISubtitleStream } from '@/services/subtitle';

const state = {
  primarySubtitleId: '',
  secondarySubtitleId: '',
};
const getters = {
  list(): SubtitleControlListItem[] { return [] },
};
const mutations = {};
const actions = {
  async [a.refreshSubtitlesInitially]() {},
  async [a.refreshSubtitles]() {},
  async [a.addLocalSubtitles](context: any, paths: string[]) {},
  async [a.addEmbeddedSubtitles](context: any, subtitleStreams: ISubtitleStream[]) {},
  async [a.addOnlineSubtitles](context: any, transcriptInfoList: SagiSubtitlePayload[]) {},
  async [a.changePrimarySubtitle](context: any, id: string) {},
  async [a.changeSecondarySubtitle](context: any, id: string) {},
  async [a.storeSubtitle](context: any, id: string) {},
  async [a.uploadSubtitle](context: any, id: string) {},
  async [a.startAISelection]() {},
  async [a.stopAISelection]() {},
  async [a.getCues](context: any, time?: number) {},
};

export default {
  state,
  getters,
  mutations,
  actions,
};
