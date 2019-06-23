
import { SubtitleManager as a } from '@/store/actionTypes';

const state = {};
const actions = {
  async [a.refreshSubtitlesInitially]() {},
  async [a.refreshSubtitles]() {},
  async [a.addLocalSubtitles]() {},
  async [a.addEmbeddedSubtitles]() {},
  async [a.addOnlineSubtitles]() {},
  async [a.changeCurrentSubtitle]() {},
  async [a.storeCurrentSubtitle]() {},
  async [a.uploadCurrentSubtitle]() {},
  async [a.startAISelection] () {},
  async [a.stopAISelection] () {},
  async [a.getCurrentCues] () {},
};

export default {
  state,
  actions,
};
