import { EntityGenerator, Entity, Parser, Type, Format } from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { storeSubtitle } from '@/services/storage/SubtitleStorage';
import { newSubtitle as m } from '@/store/mutationTypes';
import { newSubtitle as a } from '@/store/actionTypes';
import { getParser } from '@/services/subtitle/utils';

type SubtitleState = {
  source: any;
  type: Type | undefined;
  format: Format | undefined;
  language: LanguageCode;
  delay: number;
  playedTime: number;
  hash: string;
};

let entity: Entity = {} as Entity;
let loader: () => Promise<any>;
let parser: Parser;

const state = {
  source: '',
  type: undefined,
  format: Format.Unknown,
  language: LanguageCode.Default,
  delay: 0,
  hash: '',
} as SubtitleState;
const getters = {};
const mutations = {
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
  async [a.add]({ commit }: any, generator: EntityGenerator) {
    loader = generator.getPayload.bind(generator);
    await Promise.all([
      generator.getSource().then(src => {
        entity.source = src;
        commit(m.setSource, src);
      }),
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
  },
  async [a.load]() {
    if (loader) {
      entity.payload = await loader();
      // Object.freeze(entity);
    }
  },
  async [a.getDialogues](context: any, time: number) {
    parser = getParser(entity);
    await parser.parse(entity);
    return await parser.getDialogues(time);
  },
  async [a.store]() {
    await storeSubtitle(entity);
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
