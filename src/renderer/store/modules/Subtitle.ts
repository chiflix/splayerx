import { EntityGenerator, Entity, Parser, Type, Format } from '@/interfaces/ISubtitle';
import { BaseParser } from '@/services/subtitle/parsers';
import { LanguageCode } from '@/libs/language';
import { storeSubtitle } from '@/services/storage/SubtitleStorage';
import helpers from '@/helpers';
import { newSubtitle as m } from '@/store/mutationTypes';
import { newSubtitle as a } from '@/store/actionTypes';

type SubtitleState = {
  source: any;
  type: Type | undefined;
  format: Format | undefined;
  language: LanguageCode;
  delay: number;
  playedTime: number;
};

let entity: Entity;
let loader: () => Promise<any>;
let parser: Parser;

const state = {
  source: '',
  type: undefined,
  format: undefined,
  language: LanguageCode.Default,
  delay: 0,
} as SubtitleState;
const getters = {
  hints: '',
};
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
};
const actions = {
  async [a.add]({ commit }: any, generator: EntityGenerator) {
    loader = generator.getPayload.bind(generator);
    await Promise.all([
      generator.getSource().then(src => {
        commit(m.setSource, src);
        entity.source = src;
      }),
      generator.getFormat().then(format => {
        commit(m.setFormat, format);
        entity.format = format;
      }),
      generator.getLanguage().then(language => {
        commit(m.setLanguage, language);
        entity.language = language;
      }),
      generator.getType().then(type => {
        commit(m.setType, type);
        entity.type = type;
      }),
    ]);
  },
  async [a.load]() {
    if (loader) {
      entity.payload = await loader();
      entity.hash = await helpers.methods.mediaQuickHash(entity.payload);
      Object.freeze(entity);
    }
  },
  async [a.getDialogues](context: any, time: number) {
    parser = BaseParser.from(entity);
    return parser.getDialogues(time);
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
  state,
  getters,
  mutations,
  actions,
};
