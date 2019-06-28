import { EntityGenerator, Entity, Parser, Type, Format, Origin } from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { storeSubtitle, removeSubtitle } from '@/services/storage/SubtitleStorage';
import { newSubtitle as m } from '@/store/mutationTypes';
import { newSubtitle as a } from '@/store/actionTypes';
import { getParser } from '@/services/subtitle/utils';

type SubtitleState = {
  moduleId: string;
  source: any;
  type: Type | undefined;
  format: Format | undefined;
  language: LanguageCode;
  delay: number;
  playedTime: number;
  hash: string;
};

const subtitleMap: Map<string, {
  entity: Entity;
  loader: () => Promise<any>;
  parser: Parser;
}> = new Map();

const state = () => ({
  moduleId: '',
  source: '',
  type: undefined,
  format: Format.Unknown,
  language: LanguageCode.Default,
  delay: 0,
  hash: '',
}) as SubtitleState;
const getters = {};
const mutations = {
  [m.setModuleId](state: SubtitleState, id: string) {
    state.moduleId = id;
  },
  [m.setSource](state: SubtitleState, source: any) {
    state.source = source;
  },
  [m.setType](state: SubtitleState, type: Type) {
    state.type = type;
  },
  [m.setFormat](state: SubtitleState, format: Format) {
    state.format = format;
  },
  [m.setLanguage](state: SubtitleState, languageCode: LanguageCode) {
    state.language = languageCode;
  },
  [m.setDelay](state: SubtitleState, delay: number) {
    state.delay = delay;
  },
  [m.setPlayedTime](state: SubtitleState, playedTime: number) {
    state.playedTime = playedTime;
  },
  [m.setHash](state: SubtitleState, hash: string) {
    state.hash = hash;
  },
};
const actions = {
  [a.initialize]({ commit }: any, moduleId: string) {
    subtitleMap.set(moduleId, {
      entity: {} as Entity,
      loader: () => Promise.resolve(),
      parser: {} as Parser,
    });
    commit(m.setModuleId, moduleId);
  },
  async [a.add]({ commit, state }: any, generator: EntityGenerator) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      subtitle.loader = generator.getPayload.bind(generator);
      const { entity } = subtitle;
      await Promise.all([
        generator.getStoredSource
          ? generator.getStoredSource().then((src: Origin) => entity.source = src)
          : generator.getSource().then((src: Origin) => entity.source = src),
        generator.getFormat().then(format => {
          entity.format = format;
          commit(m.setFormat, format);
        }),
        generator.getLanguage().then(language => {
          entity.language = language;
          commit(m.setLanguage, language);
        }),
        generator.getType().then(type => {
          entity.type = type;
          commit(m.setType, type);
        }),
        generator.getHash().then(hash => {
          entity.hash = hash;
          commit(m.setHash, hash);
        }),
      ]);
      return entity;
    }
  },
  async [a.load]({ state }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      const { entity, loader } = subtitle;
      entity.payload = await loader();
    }
  },
  async [a.getDialogues]({ state, rootGetters }: any, time: number) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      const { entity, parser } = subtitle;
      if (!entity.payload) return [];
      else if (entity.payload && !parser.getDialogues) {
        subtitle.parser = getParser(entity);
        await subtitle.parser.parse();
      }
      if (entity.payload && parser.getDialogues && parser.payload) {
        return subtitle.parser.getDialogues(time - rootGetters.globalDelay);
      }
    }
    return [];
  },
  async [a.store]({ state }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) await storeSubtitle(subtitle.entity);
  },
  async [a.delete]({ state }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      subtitleMap.delete(state.moduleId);
      await removeSubtitle(subtitle.entity);
    }
  },
  [a.upload]() {
    // directly invoke from @/services/subtitle/upload
    // resolve when succeeded, and reject if not
  },
  // played time actions
  [a.updatePlayedTime](context: any, time: number) {
    // use generatePlayedTime in @/services/subtitle/utils
    // commit the played time
  },
  [a.startWatchPlayedTime]() {
    // set the video segments if not have
    // register the played time watcher
  },
  [a.pauseWatchPlayedTime]() {
    // unsubscribe the watcher if have one
  },
  [a.stopWatchPlayedTime]() {
    // set mannual flag to true, and cannot be uploaded again
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
