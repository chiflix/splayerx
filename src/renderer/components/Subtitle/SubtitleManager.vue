<template>
  <div
    :style="{ width: computedWidth + 'px', height: computedHeight + 'px' }"
    class="subtitle-manager"
  >
    <subtitle-renderer
      ref="subtitleRenderer"
      :key="originSrc"
      :first-instance="firstSubtitleInstance"
      :secondary-instance="secondSubtitleInstance"
    />
  </div>
</template>
<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import romanize from 'romanize';
import { existsSync } from 'fs';
import { sep } from 'path';
import {
  flatten,
  isEqual,
  sortBy,
  differenceWith,
  isFunction,
  partial,
  pick,
  values,
  keyBy,
  merge,
  castArray,
  get,
} from 'lodash';
import { codeToLanguageName } from '@/libs/language';
import {
  searchForLocalList, fetchOnlineList, retrieveEmbeddedList,
  storeLanguagePreference,
  updateSubtitle,
  updateSubtitleList,
  retrieveLanguagePreference,
  retrieveSubtitleList,
  deleteSubtitles,
  retrieveSubtitle,
  updateSelectedSubtitleId,
  retrieveSelectedSubtitleId,
} from '@/helpers/subtitle';
import transcriptQueue from '@/helpers/subtitle/push';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import SubtitleRenderer from './SubtitleRenderer.vue';
import {
  LOCAL_SUBTITLE_REMOVED, REQUEST_TIMEOUT, SUBTITLE_UPLOAD, UPLOAD_SUCCESS, UPLOAD_FAILED,
} from '../../../shared/notificationcodes';

class SubtitleLoader {
  static supportedFormats = [];

  static supportedCodecs = [];
}
const localLanguageLoader = () => {};
export default {
  name: 'SubtitleManager',
  components: {
    'subtitle-renderer': SubtitleRenderer,
  },
  data() {
    return {
      subtitleInstances: {},
      selectionComplete: false,
      selectionSecondaryComplete: false,
      isInitial: false,
      linesNum: 1,
      firstLinesNum: 1,
      tags: {},
      firstTags: {},
      lastFirstSubtitleId: '',
      lastSecondSubtitleId: '',
    };
  },
  computed: {
    ...mapGetters([
      'originSrc', // use to find proper subtitles and clear subtitle upon change
      'mediaHash', // use to provide subtitle with videoIdentity
      'subtitleList', 'currentFirstSubtitleId', 'currentSecondSubtitleId', // use to get current subtitle info and auto selection subtitles
      'computedWidth', 'computedHeight', // to determine the subtitle renderer's container size
      'duration', // do not load subtitle renderer when video(duration) is not available(todo: global variable to tell if video is totally available)
      'getVideoSrcById', 'allSubtitleList', // serve allSubtitleListWatcher
      'subtitleDelay', // subtitle's delay
      'isFirstSubtitle',
      'enabledSecondarySub',
    ]),
    ...mapState({
      preferredLanguages: ({ Preference }) => (
        [Preference.primaryLanguage, Preference.secondaryLanguage].filter(language => !!language)
      ),
      qualifiedSubtitles: ({ Subtitle, Video }) => {
        const { loadingStates, types, durations } = Subtitle;
        const { duration } = Video;
        return Object.keys(loadingStates)
          .filter(id => loadingStates[id] === 'loaded' && durations[id] >= duration * 0.6)
          .map(id => ({ id, type: types[id], duration: durations[id] }));
      },
    }),
    firstSubtitleInstance() { return this.subtitleInstances[this.currentFirstSubtitleId]; },
    secondSubtitleInstance() { return this.subtitleInstances[this.currentSecondSubtitleId]; },
  },
  watch: {
    originSrc(newVal) {
      if (newVal) {
        this.lastFirstSubtitleId = '';
        this.lastSecondSubtitleId = '';
        this.resetSubtitles();
        Object.keys(this.subtitleInstances)
          .filter(({ videoSrc }) => newVal !== videoSrc)
          .forEach(id => delete this.subtitleInstances[id]);
        this.selectionComplete = false;
        this.selectionSecondaryComplete = false;
        const hasOnlineSubtitles = !!this.$store.state.Subtitle.videoSubtitleMap[this.originSrc]
          .map((id) => {
            const { type, language } = this.subtitleInstances[id];
            return { type, language };
          })
          .filter(({ type }) => type === 'online')
          .length;
        this.$bus.$emit('subtitle-refresh-from-src-change', hasOnlineSubtitles);
        this.updateNoSubtitle(true);
      }
    },
    qualifiedSubtitles(newVal, oldVal) {
      const newQualified = differenceWith(newVal, oldVal, isEqual);
      if (newQualified.length) {
        const subtitles = newQualified.map(this.makeSubtitleUploadParameter);
        transcriptQueue.addAll(subtitles);
      }
    },
    allSubtitleList(newVal, oldVal) {
      this.allSubtitleListWatcher(newVal, oldVal);
    },
    currentFirstSubtitleId(newVal, oldVal) {
      if (this.selectionComplete || newVal) {
        this.lastFirstSubtitleId = oldVal;
        updateSelectedSubtitleId(this.originSrc, {
          firstId: newVal, secondaryId: this.currentSecondSubtitleId,
        });
      }
    },
    currentSecondSubtitleId(newVal, oldVal) {
      if (this.selectionSecondaryComplete || newVal) {
        this.lastSecondSubtitleId = oldVal;
        updateSelectedSubtitleId(this.originSrc, {
          firstId: this.currentFirstSubtitleId, secondaryId: newVal,
        });
      }
      if (!newVal) {
        this.linesNum = 0;
      }
    },
  },
  created() {
    this.$bus.$on('add-subtitles', (subs) => {
      Promise.all(subs
        .map(this.normalizeSubtitle)
        .filter(sub => !!sub)
        .map(sub => this.addSubtitle(sub, this.originSrc)))
        .then((subtitleInstances) => {
          this.changeCurrentFirstSubtitle(subtitleInstances[subtitleInstances.length - 1].id);
          this.selectionComplete = true;
          this.selectionSecondaryComplete = true;
        });
    });
    this.$bus.$on('refresh-subtitles', ({ types, isInitial }) => {
      this.refreshSubtitles(types, this.originSrc, isInitial);
      this.isInitial = isInitial;
    });
    this.$bus.$on('change-subtitle', (id) => {
      if (this.isFirstSubtitle) {
        this.changeCurrentFirstSubtitle(id);
      } else {
        this.changeCurrentSecondSubtitle(id);
      }
    });
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);
    this.$bus.$on('upload-current-subtitle', () => {
      this.addLog('info', {
        message: 'Upload current subtitle .',
        code: SUBTITLE_UPLOAD,
      });
      this.$addBubble(SUBTITLE_UPLOAD);
      const qualifiedSubtitles = [];
      if (this.currentFirstSubtitleId) {
        qualifiedSubtitles.push({
          id: this.currentFirstSubtitleId,
          duration: this.$store.state.Subtitle.durations[this.currentFirstSubtitleId],
        });
      }
      if (this.currentSecondSubtitleId && this.enabledSecondarySub) {
        qualifiedSubtitles.push({
          id: this.currentSecondSubtitleId,
          duration: this.$store.state.Subtitle.durations[this.currentSecondSubtitleId],
        });
      }
      if (qualifiedSubtitles.length) {
        const parameters = qualifiedSubtitles.map(this.makeSubtitleUploadParameter);
        transcriptQueue.addAllManual(parameters)
          .then((res) => {
            if (res.failure.length) {
              this.addLog('error', {
                message: 'Upload failed !',
                errcode: UPLOAD_FAILED,
              });
              this.$addBubble(UPLOAD_FAILED);
              res.failure.forEach((i) => {
                console.log(`Uploading subtitle No.${i.src} failed!`);
              });
            } else {
              this.addLog('info', {
                message: 'Upload successfully !',
                code: UPLOAD_SUCCESS,
              });
              this.$addBubble(UPLOAD_SUCCESS);
            }
            if (res.success.length) {
              res.success.forEach((i) => {
                console.log(`Uploading subtitle No.${i.src} succeeded!`);
              });
            }
          });
      }
    });

    // when set immediate on watcher, it may run before the created hook
    this.resetSubtitles();
    this.$bus.$emit('subtitle-refresh-from-src-change');
    this.updateNoSubtitle(true);
  },
  methods: {
    ...mapActions({
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
      resetOnlineSubtitles: subtitleActions.RESET_ONLINE_SUBTITLES,
      changeCurrentFirstSubtitle: subtitleActions.CHANGE_CURRENT_FIRST_SUBTITLE,
      changeCurrentSecondSubtitle: subtitleActions.CHANGE_CURRENT_SECOND_SUBTITLE,
      offCurrentSubtitle: subtitleActions.OFF_SUBTITLES,
      addSubtitleWhenLoading: subtitleActions.ADD_SUBTITLE_WHEN_LOADING,
      addSubtitleWhenReady: subtitleActions.ADD_SUBTITLE_WHEN_READY,
      addSubtitleWhenLoaded: subtitleActions.ADD_SUBTITLE_WHEN_LOADED,
      addSubtitleWhenFailed: subtitleActions.ADD_SUBTITLE_WHEN_FAILED,
      updateMetaInfo: subtitleActions.UPDATE_METAINFO,
      updateNoSubtitle: subtitleActions.UPDATE_NO_SUBTITLE,
    }),
    async refreshSubtitles(types, videoSrc) {
      const supportedTypes = ['local', 'embedded', 'online'];
      const {
        getLocalSubtitlesList,
        getOnlineSubtitlesList,
        getEmbeddedSubtitlesList,
        resetOnlineSubtitles,
        preferredLanguages,
      } = this;
      const requestedTypes = types
        .map(type => type.toLowerCase())
        .filter(type => supportedTypes.includes(type));
      if (!requestedTypes.length) throw new Error('No valid subtitle type provided.');
      const subtitleRequests = [];

      const storedLanguagePreference = await retrieveLanguagePreference(videoSrc);
      const storedSubtitles = await retrieveSubtitleList(videoSrc);
      const ids = await retrieveSelectedSubtitleId(videoSrc);

      if (requestedTypes.includes('local')) {
        const storedLocalSubtitles = storedSubtitles.filter(({ type }) => type === 'local');
        subtitleRequests.push(getLocalSubtitlesList(videoSrc, storedLocalSubtitles, ids));
      }
      if (requestedTypes.includes('embedded')) {
        const storedEmbeddedSubtitles = storedSubtitles
          .filter(({ type }) => type === 'embedded');
        subtitleRequests.push(getEmbeddedSubtitlesList(videoSrc, storedEmbeddedSubtitles, ids));
      }
      if (requestedTypes.includes('online')) {
        const storedOnlineSubtitleIds = storedSubtitles
          .filter(({ type }) => type === 'online')
          .map(({ id }) => id);
        const clearOnline = !isEqual(
          sortBy(storedLanguagePreference),
          sortBy(preferredLanguages),
        ) || !storedOnlineSubtitleIds.length;
        resetOnlineSubtitles();
        const isFetching = !this.isInitial || clearOnline;
        subtitleRequests.push(getOnlineSubtitlesList(
          videoSrc,
          isFetching,
          storedOnlineSubtitleIds,
          preferredLanguages,
          ids,
        ));
      }
      if (!this.isInitial) {
        this.selectionComplete = false;
        this.selectionSecondaryComplete = false;
        this.checkCurrentSubtitleList();
      }

      return Promise.all(subtitleRequests)
        .then(async () => {
          this.$bus.$emit('refresh-finished');
          if (this.isInitial) {
            const switchLanguage = storedLanguagePreference[0] === preferredLanguages[1]
              && storedLanguagePreference[1] === preferredLanguages[0];
            const selectedSubtitles = storedSubtitles
              .filter(({ id }) => [ids.firstId, ids.secondaryId].includes(id));
            const shiftFirstId = get(selectedSubtitles.find(({ language }) => language === preferredLanguages[0]), 'id');
            const shiftSecondaryId = get(selectedSubtitles.find(({ language }) => language === preferredLanguages[1]), 'id');
            const firstId = switchLanguage ? shiftFirstId : ids.firstId;
            const secondaryId = switchLanguage ? shiftSecondaryId : ids.secondaryId;
            if (firstId) {
              this.changeCurrentFirstSubtitle(firstId);
              this.selectionComplete = true;
            }
            if (secondaryId) {
              this.changeCurrentSecondSubtitle(secondaryId);
              this.selectionSecondaryComplete = true;
            }
            this.isInitial = false;
          }
          this.checkCurrentSubtitleList();
          return storeLanguagePreference(videoSrc, preferredLanguages);
        });
    },
    async getLocalSubtitlesList(videoSrc, storedSubs, ids) {
      const newLocalSubs = await searchForLocalList(videoSrc, SubtitleLoader.supportedFormats)
        .catch(() => []);
      return values(merge(
        keyBy(storedSubs.map(({ src, id }) => ({ src, type: 'local', options: { id, selectedIds: ids } })), 'src'),
        keyBy(newLocalSubs, 'src'),
      ))
        .map(this.normalizeSubtitle)
        .map(sub => this.addSubtitle(sub, videoSrc));
    },
    async getOnlineSubtitlesList(videoSrc, isFetching, storedSubIds, languages, ids) {
      if (!isFetching) {
        const retrieveSub = id => retrieveSubtitle(id)
          .then(({ src, data, language }) => ({
            src,
            type: 'online',
            options: {
              language, data, id, selectedIds: ids,
            },
          }))
          .then(sub => this.addSubtitle(this.normalizeSubtitle(sub), videoSrc))
          .catch(err => (err instanceof Error ? new Error(err) : err));
        const storedSubs = await Promise.all(storedSubIds.map(retrieveSub))
          .then(subtitleResults => subtitleResults.filter((result) => {
            if (result instanceof Error) {
              this.addLog('error', {
                message: 'Request Timeout .',
                errcode: REQUEST_TIMEOUT,
              });
              this.$addBubble(REQUEST_TIMEOUT);
              return [];
            }
            return result;
          }))
          .then(flatten);
        if (storedSubs.length) return storedSubs;
      }
      const hints = this.generateHints(videoSrc);
      const fetchSubs = lang => fetchOnlineList(videoSrc, lang, hints)
        .then((results) => {
          this.$bus.$emit('online-subtitle-found');
          return Promise.all(results
            .map(this.normalizeSubtitle)
            .map(sub => this.addSubtitle(sub, videoSrc)));
        }).catch(() => []);
      const newSubs = await Promise.all(languages.map(fetchSubs)).then(flatten);
      await deleteSubtitles(storedSubIds, videoSrc);
      return newSubs;
    },
    async getEmbeddedSubtitlesList(videoSrc, storedSubs, ids) {
      const newEmbeddedSubs = await retrieveEmbeddedList(
        videoSrc,
        SubtitleLoader.supportedCodecs,
      ).catch(() => []).then(castArray);
      return values(merge(
        keyBy(storedSubs.map(({ src, id }) => ({ src, type: 'embedded', options: { id, selectedIds: ids } })), 'src'),
        keyBy(newEmbeddedSubs, 'src'),
      )).map(this.normalizeSubtitle)
        .map(sub => this.addSubtitle(sub, videoSrc));
    },
    async addSubtitle({ src, type, options }, videoSrc) {
      const sameSrcSubtitle = Object.values(this.subtitleInstances)
        .find(sub => sub.src === src);
      if (sameSrcSubtitle instanceof SubtitleLoader) {
        const { id } = sameSrcSubtitle;
        // different id indicates that this sub is new and need to delete the old
        if (id !== options.id) this.failedCallback(sameSrcSubtitle);
        // same id from options indicates that this sub is already loaded
        else {
          if (existsSync(src) || type !== 'local') return sameSrcSubtitle;
          return this.failedCallback(sameSrcSubtitle, {
            error: { message: `Local subtitle ${src} removed!` },
            bubble: LOCAL_SUBTITLE_REMOVED,
          });
        }
      }
      const subtitleInstance = new SubtitleLoader(src, type, { ...options, videoSrc });
      try {
        return this.setupListeners(subtitleInstance, {
          metaChange: this.metaChangeCallback,
          loading: partial(this.loadingCallback, videoSrc),
          ready: this.readyCallback,
          loaded: this.addSubtitleWhenLoaded,
          failed: this.failedCallback,
        });
      } catch (err) {
        this.failedCallback(subtitleInstance);
      }
      return 'failed'; // slient errors temporarily
    },
    normalizeSubtitle(subtitle) {
      if (typeof subtitle === 'object') {
        const { src, type, options } = subtitle;
        if (src && type) return { src, type, options: options || {} };
      } else if (typeof subtitle === 'string') {
        return { src: subtitle, type: 'local', options: {} };
      }
      return null;
    },
    metaInfoUpdate(id, field, value) {
      this.updateMetaInfo({ id, type: field, value });
    },
    findSubtitleByWith(rank, withParameter, byParameter, subtitleList, expected) {
      const listSortedByParameter = sortBy(
        subtitleList,
        sub => rank.lastIndexOf(sub[withParameter]),
      );
      return listSortedByParameter.find(sub => sub[byParameter] === expected);
    },
    findSubtitleByLanguageWithTypeRank(subtitleList, language) {
      return this.findSubtitleByWith(
        ['local', 'embedded', 'online'],
        'type', 'language',
        subtitleList,
        language,
      );
    },
    async computeSubtitleName(type, id, options, subtitleList) {
      if (type === 'local') return '';
      subtitleList = sortBy([...subtitleList], ['id']);
      const computedIndex = subtitleList
        .filter((subtitle) => {
          if (type === 'online' && subtitle.language && options.language) {
            return subtitle.type === type && subtitle.language === options.language;
          }
          return subtitle.type === type;
        })
        .findIndex(subtitle => id === subtitle.id)
        + 1;
      switch (type) {
        default:
          return '';
        case 'embedded': {
          let { language } = options;
          const { src, format } = options;
          if (!language && !src) {
            throw (new TypeError('Expected at least language or src for calculate embedded subtitle\'s name.'));
          } else if (!language) {
            language = await localLanguageLoader(src, format);
          }
          return `${romanize(computedIndex)} - ${codeToLanguageName(language)}`;
        }
        case 'online': {
          const { language } = options;
          if (!language) {
            throw (new TypeError('Expected language from option for online subtitle'));
          }
          return `${codeToLanguageName(language)} ${romanize(computedIndex)}`;
        }
      }
    },
    setupListeners(subtitleInstance, listeners) {
      return new Promise((resolve, reject) => {
        if (subtitleInstance instanceof SubtitleLoader) {
          const {
            loading, ready, loaded, failed,
            metaChange,
          } = listeners;
          if (isFunction(loading)) {
            subtitleInstance.once('loading', () => {
              loading(subtitleInstance);
              resolve(subtitleInstance);
              subtitleInstance.meta();
              if (isFunction(metaChange)) subtitleInstance.on('meta-change', partial(metaChange, subtitleInstance));
              if (isFunction(ready)) subtitleInstance.once('ready', partial(ready, subtitleInstance));
              if (isFunction(failed)) subtitleInstance.once('failed', partial(failed, subtitleInstance));
              if (isFunction(loaded)) subtitleInstance.once('parse', partial(loaded, subtitleInstance));
            });
          } else reject(new TypeError(`${loading} is not a function!`));
        } else reject(new TypeError(`Expected a SubtitleLoader instance, but ${subtitleInstance} provided.`));
      });
    },
    metaChangeCallback({ id }, { field, value }) {
      this.metaInfoUpdate(id, field, value);
    },
    loadingCallback(videoSrc, subtitleInstance) {
      const { id, type, src } = subtitleInstance;
      this.$set(this.subtitleInstances, id, subtitleInstance);
      this.addSubtitleWhenLoading({ id, type, videoSrc });
      if (type === 'local' && !existsSync(src)) {
        this.failedCallback(subtitleInstance, {
          error: { message: `Local subtitle ${src} removed!` },
          bubble: LOCAL_SUBTITLE_REMOVED,
        });
      }
    },
    async readyCallback(subtitleInstance, metaInfo) {
      const {
        type, id, src, options,
      } = subtitleInstance;
      const { format, language, name } = metaInfo;
      metaInfo.name = await this.computeSubtitleName(
        type,
        id,
        { format, language, src },
        this.subtitleList,
      ) || name;
      this.addSubtitleWhenReady({ id, format });
      updateSubtitle(id, { language });
      this.checkCurrentSubtitleList(options.selectedIds);
    },
    async loadedCallback(subtitleInstance) {
      const {
        id, type, metaInfo, data,
      } = subtitleInstance;
      this.addSubtitleWhenLoaded({ id });
      const result = { language: metaInfo.language };
      if (type === 'online') result.data = data;
      return updateSubtitle(id, result);
    },
    failedCallback({ id, videoSrc }, { error, bubble } = {}) {
      if (bubble) this.addLog('error', { errcode: bubble, message: error.message });
      if (this.currentFirstSubtitleId === id) {
        this.changeCurrentFirstSubtitle(this.lastFirstSubtitleId);
      }
      if (this.currentSecondSubtitleId === id) {
        this.changeCurrentSecondSubtitle(this.lastSecondSubtitleId);
      }
      this.$delete(this.subtitleInstances, id);
      deleteSubtitles([id], videoSrc);
      this.addSubtitleWhenFailed({ id });
    },
    checkCurrentSubtitleList(ids) {
      const {
        selectionComplete,
        selectionSecondaryComplete,
        subtitleList,
        preferredLanguages,
      } = this;
      const validSubtitleList = subtitleList.filter(({ name }) => !!name);
      if (ids && !selectionComplete && !selectionSecondaryComplete) {
        this.changeCurrentFirstSubtitle(ids.firstId);
        this.changeCurrentSecondSubtitle(ids.secondaryId);
        this.selectionComplete = true;
        this.selectionSecondaryComplete = true;
      } else if (!selectionComplete || !selectionSecondaryComplete) {
        const hasPrimaryLanguage = validSubtitleList
          .find(({ language }) => language === preferredLanguages[0]);
        const hasSecondaryLanguage = validSubtitleList
          .find(({ language }) => language === preferredLanguages[1]);
        if (hasPrimaryLanguage) {
          this.changeCurrentFirstSubtitle(hasPrimaryLanguage.id);
          this.selectionComplete = true;
          if (hasSecondaryLanguage) {
            this.changeCurrentSecondSubtitle(hasSecondaryLanguage.id);
            this.selectionSecondaryComplete = true;
          }
        } else if (hasSecondaryLanguage) {
          if (selectionComplete) {
            this.changeCurrentSecondSubtitle(hasSecondaryLanguage.id);
            this.selectionSecondaryComplete = true;
          } else {
            this.changeCurrentFirstSubtitle(hasSecondaryLanguage.id);
            this.changeCurrentSecondSubtitle('');
            this.selectionComplete = true;
            this.selectionSecondaryComplete = true;
          }
        } else {
          this.changeCurrentFirstSubtitle('');
          this.changeCurrentSecondSubtitle('');
        }
      }
    },
    /**
     * generate a valid subtitle from the given id
     * valid subtitle is from both this.subtitleList and this.subtitleInstances
     * @param {string} id - the valid subtitle id
     * @returns an object with src, id, type, format, language and data(maybe)
     */
    async generateValidSubtitle(id) {
      const subtitleInstance = this.subtitleInstances[id];
      const subtitleInfo = this.subtitleList.find(({ id: subtitleId }) => id === subtitleId);
      if (!subtitleInstance || !subtitleInfo) throw new Error(`No subtitle instance ${id}!`);
      const { type, src, data } = subtitleInstance;
      const { language, format } = subtitleInfo;
      return ({
        id,
        src,
        type,
        format,
        data: type === 'online' ? data : undefined, // only store online subtitle's data
        language,
      });
    },
    /**
     * generate a valid subtitle list of info for the given videoSrc
     * valid subtitle info is from this.subtitleList and this.$refs.subtitleRenderer
     * @param {string} videoSrc - valid videoSrc
     * @returns a list of subtitle info(with id, type, name, rank and videoSegments(maybe))
     */
    async generateValidSubtitleList(videoSrc) {
      const finalList = [];
      const { currentFirstSubtitleId } = this;
      const currentVideoSegments = this.$refs.subtitleRenderer.videoSegments;
      // generate valid subtitle list members
      this.subtitleList.forEach((subtitleInfo) => {
        const {
          id, type, name, rank,
        } = subtitleInfo;
        if (id !== currentFirstSubtitleId) {
          finalList.push({
            id, type, name, rank,
          });
        } else {
          finalList.push({
            id,
            type,
            name,
            rank,
            videoSegments: currentVideoSegments,
          });
        }
      });

      return {
        videoSrc,
        subtitles: finalList,
      };
    },
    async allSubtitleListWatcher(newVal, oldVal) {
      const pickValidProperties = val => pick(val, 'id', 'type', 'language', 'rank');
      const extractReadySubtitles = subtitles => subtitles
        .filter(({ loading }) => loading === 'ready' || loading === 'loaded')
        .map((subtitleInfo) => {
          const result = pickValidProperties(subtitleInfo);
          if (result.id === this.currentFirstSubtitleId && this.$refs.subtitleRenderer) {
            result.videoSegments = this.$refs.subtitleRenderer.videoSegments;
          }
          if (this.subtitleInstances[result.id] && this.subtitleInstances[result.id].src) {
            result.src = this.subtitleInstances[result.id].src;
          }
          return result;
        });
      const newSubtitles = differenceWith(
        extractReadySubtitles(newVal),
        extractReadySubtitles(oldVal),
        isEqual,
      );
      const subtitleMap = newSubtitles
        .reduce((finalMap, currentSubtitleInfo) => {
          const { id } = currentSubtitleInfo;
          const videoSrc = this.getVideoSrcById(id);
          const subtitles = finalMap[videoSrc];
          if (subtitles) {
            finalMap[videoSrc] = [...subtitles, currentSubtitleInfo];
          } else {
            finalMap[videoSrc] = [currentSubtitleInfo];
          }
          return finalMap;
        }, {});
      const updateSubtitleListPromises = Object.keys(subtitleMap)
        .map(videoSrc => updateSubtitleList(videoSrc, subtitleMap[videoSrc]));
      return Promise.all(updateSubtitleListPromises);
    },
    makeSubtitleUploadParameter({ id, duration: playedTime }) {
      const result = {
        playedTime,
        mediaIdentity: this.mediaHash,
        totalTime: this.duration,
        delay: this.subtitleDelay,
        src: id,
        hints: this.generateHints(this.originSrc),
      };
      const instance = this.subtitleInstances[id];
      if (instance) {
        const {
          src, type, data, metaInfo,
        } = instance;
        const {
          language: languageCode,
          format,
        } = metaInfo;
        if (languageCode) result.languageCode = languageCode;
        switch (type) {
          default:
            break;
          case 'online':
            result.format = 'online';
            result.transcriptIdentity = src;
            break;
          case 'embedded':
          case 'local':
            result.format = format;
            if (data) result.payload = Buffer.from(data);
            break;
        }
      }
      return result;
    },
    generateHints(videoSrc) {
      let result;
      videoSrc.split(sep).reverse().some((dirOrFileName, index) => {
        if (index === 0) {
          result = dirOrFileName;
          return false;
        }
        if (index <= 2) {
          result = `${dirOrFileName}${sep}${result}`;
          return false;
        }
        result = `${sep}${result}`;
        return true;
      });
      return result;
    },
  },
};
</script>
<style lang="scss" scoped>
.subtitle-manager {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}
</style>
