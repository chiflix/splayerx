import {
  MutationTree, GetterTree, ActionTree,
  Module,
} from 'vuex';
import {
  IEntityGenerator, IParser, Format, IOrigin, ILoader, IEntity, Cue, IMetadata, TextCue, Type,
} from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { storeSubtitle } from '@/services/storage/subtitle';
import { newSubtitle as m } from '@/store/mutationTypes';
import { newSubtitle as a } from '@/store/actionTypes';
import { getParser, getLoader } from '@/services/subtitle/utils';
import { SubtitleUploadParameter, ModifiedParser } from '@/services/subtitle';
import { generateHints } from '@/libs/utils';
import upload from '@/services/subtitle/upload';
import { VideoTimeSegments } from '@/libs/TimeSegments';
import { log } from '@/libs/Log';
import { IEmbeddedOrigin, EmbeddedStreamLoader } from '@/services/subtitle/utils/loaders';

enum ErrorCodes {
  REAL_SOURCE_MISSING = 'REAL_SOURCE_MISSING',
  LOADER_MISSING = 'LOADER_MISSING',
  PARSER_MISSING = 'PARSER_MISSING',
  CANNOT_UPLOAD = 'CANNOT_UPLOAD',
}
interface ISubtitleState {
  mediaHash: string,
  id: string,
  displaySource?: IOrigin,
  realSource?: IOrigin,
  language: LanguageCode,
  hash: string,
  format: Format,
  delay: number,
  // loader reactive properties
  canCache: boolean,
  canUpload: boolean,
  fullyRead: boolean,
  // parser reactive properties
  autoUploaded: boolean,
  playedTime: number,
}
/**
 * map to store loader and parser for each subtitle
 * @summary
 * We still need map because:
 * - TypeScript's private properties are not really private.
 * - Vue will add reactive getter/setter to every property, which is really annoying.
 */
const subtitleLoaderParserMap: Map<string, { loader?: ILoader, parser?: IParser }> = new Map();

const state = (): ISubtitleState => ({
  mediaHash: '',
  id: '',
  hash: '',
  displaySource: undefined,
  realSource: undefined,
  format: Format.Unknown,
  language: LanguageCode.Default,
  delay: 0,
  canCache: false,
  canUpload: false,
  fullyRead: false,
  autoUploaded: false,
  playedTime: 0,
});
const getters: GetterTree<ISubtitleState, {}> = {
  entity(state): IEntity | undefined {
    return state.displaySource && state.realSource && {
      hash: state.hash,
      displaySource: state.displaySource,
      realSource: state.realSource,
      format: state.format,
      language: state.language,
      delay: state.delay,
    };
  },
  fullyRead(state): boolean {
    return !!state.realSource && state.fullyRead;
  },
  canCache(state): boolean {
    return !!state.realSource && state.canCache && state.fullyRead;
  },
  canUpload(state, getters): boolean {
    return !!state.realSource && state.canUpload && state.fullyRead && !getters.isImage;
  },
  isImage(state): boolean {
    return !!state.realSource && (state.format === Format.DvbSub
      || state.format === Format.HdmvPgs
      || state.format === Format.SagiImage
      || state.format === Format.VobSub
    );
  },
  canTryToUpload(state, getters): boolean {
    return !!state.realSource
      && ((state.canUpload && state.fullyRead && !getters.isImage) || getters.isImage);
  },
  canAutoUpload(state, getters, rootState, rootGetters): boolean {
    return (!state.autoUploaded && getters.canUpload)
      && (state.playedTime >= 0.5 * rootGetters.duration);
  },
  getUploadParam(
    state, getters, rootState, rootGetters,
  ): (payload?: Buffer) => SubtitleUploadParameter {
    return (payload?: Buffer) => ({
      mediaIdentity: state.mediaHash,
      languageCode: state.language,
      format: state.format,
      playedTime: state.playedTime,
      totalTime: rootGetters.duration,
      delay: state.delay * 1000,
      hints: generateHints(rootGetters.originSrc),
      transcriptIdentity: state.format === Format.SagiText ? state.hash : '',
      payload: state.format !== Format.SagiText ? payload || '' : '',
    });
  },
};
const mutations: MutationTree<ISubtitleState> = {
  [m.setMediaHash](state, hash: string) {
    state.mediaHash = hash;
  },
  [m.setId](state, id: string) {
    state.id = id;
  },
  [m.setHash](state, hash: string) {
    state.hash = hash;
  },
  [m.setDisplaySource](state, source: IOrigin) {
    state.displaySource = source;
  },
  [m.setRealSource](state, source: IOrigin) {
    state.realSource = source;
  },
  [m.setFormat](state, format: Format) {
    state.format = format;
  },
  [m.setLanguage](state, languageCode: LanguageCode) {
    state.language = languageCode;
  },
  [m.setDelay](state, delayInSeconds: number) {
    state.delay = delayInSeconds;
  },
  [m.setCanCache](state, canCache: boolean) {
    state.canCache = canCache;
  },
  [m.setCanUpload](state, canUpload: boolean) {
    state.canUpload = canUpload;
  },
  [m.setFullyRead](state, fullyRead: boolean) {
    state.fullyRead = fullyRead;
  },
  [m.setAutoUploaded](state, autoUploaded: boolean) {
    state.autoUploaded = autoUploaded;
  },
  [m.setPlayedTime](state, time: number) {
    state.playedTime = time;
  },
};
const actions: ActionTree<ISubtitleState, {}> = {
  [a.initialize]({ commit }, { id, mediaHash }: { id: string, mediaHash: string }) {
    commit(m.setId, id);
    commit(m.setMediaHash, mediaHash);
  },
  async [a.add]({ commit, getters, state }, generator: IEntityGenerator) {
    await Promise.all([
      generator.getHash().then((hash) => { commit(m.setHash, hash); }),
      generator.getDisplaySource().then((src) => { commit(m.setDisplaySource, src); }),
      generator.getRealSource().then((src) => { commit(m.setRealSource, src); }),
      generator.getFormat().then((format) => { commit(m.setFormat, format); }),
      generator.getLanguage().then((language) => { commit(m.setLanguage, language); }),
      generator.getDelay().then((delay) => { commit(m.setDelay, delay); }),
    ]);
    subtitleLoaderParserMap.set(state.hash, {});
    return getters.entity;
  },
  async [a.getDialogues]({
    state, rootGetters, commit, dispatch, getters,
  }, time?: number) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    const result: {
      metadata: IMetadata,
      dialogues: Cue[],
    } = { metadata: {}, dialogues: [] };
    if (state.realSource && subtitle) {
      if (!subtitle.loader) {
        subtitle.loader = getLoader(state.realSource, state.format);
        subtitle.loader.on('cache', async (result) => {
          commit(m.setCanCache, result);
          if (result) {
            const result = await dispatch(a.cache) as undefined | IOrigin;
            if (result) {
              commit(m.setRealSource, result);
              storeSubtitle(getters.entity);
            }
          }
        });
        subtitle.loader.on('upload', result => commit(m.setCanUpload, result));
        subtitle.loader.on('read', result => commit(m.setFullyRead, result));
      }
      if (subtitle.loader && !subtitle.parser) {
        const videoSegments = new VideoTimeSegments(rootGetters.duration);
        subtitle.parser = getParser(state.format, subtitle.loader, videoSegments);
      }
      try {
        if (subtitle.parser && time !== undefined) {
          result.metadata = await subtitle.parser.getMetadata();
          result.dialogues = await subtitle.parser.getDialogues(time - state.delay);
        } else if (subtitle.parser) {
          result.metadata = await subtitle.parser.getMetadata();
          result.dialogues = await subtitle.parser.getDialogues();
        }
      } catch (e) {
        if (state.realSource.type === Type.Embedded) {
          const { streamIndex } = (state.realSource as IEmbeddedOrigin).source;
          subtitle.loader = new EmbeddedStreamLoader(
            rootGetters.originSrc, streamIndex, state.format,
          );
          const videoSegments = new VideoTimeSegments(rootGetters.duration);
          subtitle.parser = getParser(state.format, subtitle.loader, videoSegments);
        }
        log.warn('Subtitle', e);
      }
    }
    return result;
  },
  async [a.store]({ getters }) { return storeSubtitle(getters.entity); },
  async [a.upload]({ state, getters, commit }) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    if (getters.canAutoUpload && subtitle && subtitle.loader) {
      if (state.format !== Format.SagiText) {
        const payload = Buffer.from(await subtitle.loader.getPayload() as string);
        return upload.add(getters.getUploadParam(payload))
          .then(() => commit(m.setAutoUploaded, true));
      }
      return upload.add(getters.getUploadParam())
        .then(() => commit(m.setAutoUploaded, true));
    }
    throw new Error(ErrorCodes.CANNOT_UPLOAD);
  },
  [a.pause]({ state }) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    if (subtitle && subtitle.loader) subtitle.loader.pause();
  },
  [a.resume]({ state }) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    if (subtitle && subtitle.loader) subtitle.loader.getPayload();
  },
  async [a.cache]({ state }) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    if (getters.canCache && subtitle && subtitle.loader) return subtitle.loader.cache();
    return undefined;
  },
  async [a.manualUpload]({ state, getters }) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    if (subtitle && subtitle.loader) {
      if (getters.canUpload) {
        if (state.format !== Format.SagiText) {
          const payload = Buffer.from(await subtitle.loader.getPayload() as string);
          return upload.addManually(getters.getUploadParam(payload));
        }
        return upload.addManually(getters.getUploadParam());
      }
      if (getters.isImage) return -1;
    }
    throw new Error(ErrorCodes.CANNOT_UPLOAD);
  },
  // played time actions
  async [a.updatePlayedTime]({ state, commit }, times: { start: number, end: number }) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    if (subtitle && subtitle.parser) {
      subtitle.parser.videoSegments.updatePlayed(times.end, times.start);
      commit(m.setPlayedTime, subtitle.parser.videoSegments.playedTime);
    }
  },
  // subtitle delay actions
  [a.alterDelay]({ state, commit }, deltaInSeconds: number) {
    const alfterAltered = +(state.delay + deltaInSeconds).toFixed(1);
    if (Math.abs(alfterAltered) < 10000) {
      commit(m.setDelay, alfterAltered);
    }
    return state.delay;
  },
  [a.resetDelay]({ commit }) {
    commit(m.setDelay, 0);
  },
  async [a.destroy]({ state }) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    if (subtitle && subtitle.loader) await subtitle.loader.destroy();
    subtitleLoaderParserMap.delete(state.id);
  },
  async [a.save]({ state }, dialogues: TextCue[]) {
    const subtitle = subtitleLoaderParserMap.get(state.hash);
    if (subtitle && subtitle.parser && subtitle.loader) {
      const parser = subtitle.parser as ModifiedParser;
      // update memory data
      parser.saveDialogues(dialogues);
    }
  },
};

const Subtitle: Module<ISubtitleState, {}> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};

export default Subtitle;
