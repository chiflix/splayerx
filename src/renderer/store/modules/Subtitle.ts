import { EntityGenerator, Entity, Parser, Type, Format, Origin } from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { storeSubtitle, removeSubtitle, removeSubtitleItemsFromList, cacheSubtitle } from '@/services/storage/subtitle';
import { newSubtitle as m } from '@/store/mutationTypes';
import { newSubtitle as a, SubtitleManager as parentActions } from '@/store/actionTypes';
import { getParser, sourceToFormat, delayCalculator } from '@/services/subtitle/utils';
import { SubtitleUploadParameter } from '@/services/subtitle';
import { generateHints } from '@/libs/utils';
import upload from '@/services/subtitle/upload';
import { addBubble } from '../../helpers/notificationControl';
import { NOT_SUPPORTED_SUBTITLE } from '../../helpers/notificationcodes';
import store from '..';
import { isCachedSubtitle } from '@/services/storage/subtitle/file';

type SubtitleState = {
  moduleId: string;
  source: any;
  realSource: any;
  type: Type | undefined;
  format: Format | undefined;
  language: LanguageCode;
  delay: number;
  playedTime: number;
  hash: string;
};
enum CacheStatus {
  NOT_CACHED,
  CACHING,
  CACHED,
}
const subtitleMap: Map<string, {
  entity: Entity;
  loader: () => Promise<any>;
  parser: Parser;
  cached: CacheStatus;
}> = new Map();

let autoUpload = false;
const state = () => ({
  moduleId: '',
  source: '',
  realSource: '',
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
  [m.setRealSource](state: SubtitleState, source: any) {
    state.realSource = source;
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
  [m.setDelay](state: SubtitleState, delayInSeconds: number) {
    state.delay = delayInSeconds;
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
      cached: CacheStatus.NOT_CACHED,
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
          ? generator.getStoredSource()
              .then((src: Origin) => {
                entity.source = src;
                return generator.getSource();
              })
              .then((src: Origin) => commit(m.setRealSource, src))
          : generator.getSource().then((src: Origin) => {
            entity.source = src;
            commit(m.setRealSource, src);
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
        generator.getDelay ? generator.getDelay().then((delay) => {
          entity.delay = delay;
          commit(m.setDelay, delay);
        }) : () => {},
      ]);
      if (isCachedSubtitle(entity.source)) subtitle.cached = CacheStatus.CACHED;
      return entity;
    }
  },
  async [a.load]({ state, dispatch }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      const { entity, loader } = subtitle;
      entity.payload = await loader();
      await dispatch(a.cache);
    }
  },
  async [a.getDialogues]({ state, rootGetters, dispatch }: any, time: number) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      const { entity, parser } = subtitle;
      if (!entity.payload) return [];
      else if (entity.payload && !parser.getDialogues) {
        const realFormat = sourceToFormat(state.realSource);
        subtitle.parser = getParser(realFormat, entity.payload);
        try {
          await subtitle.parser.parse();
          await dispatch(a.startWatchPlayedTime);
        } catch(err) {
          addBubble(NOT_SUPPORTED_SUBTITLE);
          const subtitleToRemoveFromList = rootGetters.list.find((sub: any) => sub.id === state.moduleId);
          store.dispatch(parentActions.deleteSubtitlesByUuid, [subtitleToRemoveFromList]);
        }
      }
      if (entity.payload && parser.getDialogues && parser.payload) {
        return subtitle.parser.getDialogues(time - state.delay);
      }
    }
    return [];
  },
  async [a.store]({ state }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      await storeSubtitle(subtitle.entity);
    }
  },
  async [a.cache]({ state }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      if (subtitle.cached === CacheStatus.NOT_CACHED) {
        subtitle.cached = CacheStatus.CACHING;
        await cacheSubtitle(subtitle.entity);
        subtitle.cached = CacheStatus.CACHED;
      }
    }
  },
  async [a.delete]({ state, rootGetters }: any) {
    const subtitleToRemoveFromList = rootGetters.list.find((sub: any) => sub.id === state.moduleId);
    const { playlistId, mediaItemId } = store.state.SubtitleManager;
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      subtitleMap.delete(state.moduleId);
      await removeSubtitle(subtitle.entity);
    }
    removeSubtitleItemsFromList([subtitleToRemoveFromList], playlistId, mediaItemId);
  },
  async [a.upload]({ state, dispatch, rootGetters }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle && !autoUpload) {
      const uploadParam: SubtitleUploadParameter = {
        mediaIdentity: rootGetters.mediaHash,
        languageCode: state.language,
        format: state.format,
        playedTime: state.playedTime,
        totalTime: rootGetters.duration,
        delay: state.delay,
        hints: await generateHints(rootGetters.originSrc),
        transcriptIdentity: state.format === Format.Sagi ? state.hash : '',
        payload: state.format === Format.Sagi ? '' : Buffer.from(subtitle.entity.payload),
      };
      const result = await upload.add(uploadParam);
      dispatch(a.stopWatchPlayedTime);
      return result;
    }
  },
  async [a.manualUpload]({ state, rootGetters }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      const uploadParam: SubtitleUploadParameter = {
        mediaIdentity: rootGetters.mediaHash,
        languageCode: state.language,
        format: state.format,
        playedTime: state.playedTime,
        totalTime: rootGetters.duration,
        delay: state.delay,
        hints: await generateHints(rootGetters.originSrc),
        transcriptIdentity: state.format === Format.Sagi ? state.hash : '',
        payload: state.format === Format.Sagi ? '' : Buffer.from(subtitle.entity.payload),
      };
      return upload.addManually(uploadParam);
    }
  },
  // played time actions
  async [a.updatePlayedTime]({ state, commit }: any, times: { last: number, current: number }) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      const { entity, parser } = subtitle;
      if (entity.payload && parser.updateVideoSegments && parser.payload) {
        // @ts-ignore
        const playedTime = await subtitle.parser.updateVideoSegments(...Object.values(times));
        if (playedTime !== state.playedTime) commit(m.setPlayedTime, playedTime);
      }
    }
  },
  [a.startWatchPlayedTime]({ state, rootGetters, commit }: any) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle && !autoUpload) {
      const { entity, parser } = subtitle;
      if (entity.payload && parser.getVideoSegments && parser.payload) {
        parser.getVideoSegments(rootGetters.duration);
        commit(m.setPlayedTime, 0);
      }
    }
  },
  [a.stopWatchPlayedTime]() {
    autoUpload = true;
  },
  [a.alterDelay]({ state, commit }: any, deltaInSeconds: number) {
    const subtitle = subtitleMap.get(state.moduleId);
    if (subtitle) {
      const alfterAltered = delayCalculator(state.delay, deltaInSeconds);
      if (Math.abs(alfterAltered) < 10000) {
        commit(m.setDelay, alfterAltered);
        subtitle.entity.delay = alfterAltered;
      }
    }
    return state.delay;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
