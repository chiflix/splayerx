<template>
  <div class="subtitle-manager"
    :style="{ width: computedWidth + 'px', height: computedHeight + 'px' }">
    <subtitle-renderer
      ref="subtitleRenderer"
      v-if="currentSubtitleId && duration"
      :subtitle-instance="currentSubtitle"
      :key="currentSubtitleId"
    />
  </div>
</template>
<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import romanize from 'romanize';
import { flatten, isEqual, sortBy, differenceWith, isFunction, partial, pick, values, keyBy, mergeWith, castArray } from 'lodash';
import { codeToLanguageName } from '@/helpers/language';
import Sagi from '@/helpers/sagi';
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
import SubtitleLoader from './SubtitleLoader';
import { localLanguageLoader } from './SubtitleLoader/utils';

export default {
  name: 'subtitle-manager',
  components: {
    'subtitle-renderer': SubtitleRenderer,
  },
  data() {
    return {
      subtitleInstances: {},
      selectionComplete: false,
      isInitial: false,
    };
  },
  computed: {
    ...mapGetters([
      'originSrc', // use to find proper subtitles and clear subtitle upon change
      'mediaHash', // use to provide subtitle with videoIdentity
      'subtitleList', 'currentSubtitleId', // use to get current subtitle info and auto selection subtitles
      'computedWidth', 'computedHeight', // to determine the subtitle renderer's container size
      'duration', // do not load subtitle renderer when video(duration) is not available(todo: global variable to tell if video is totally available)
      'getVideoSrcById', 'allSubtitleList', // serve allSubtitleListWatcher
      'subtitleDelay', // subtitle's delay
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
    currentSubtitle() {
      return this.subtitleInstances[this.currentSubtitleId];
    },
  },
  watch: {
    originSrc(newVal) {
      if (newVal) {
        this.resetSubtitles();
        this.selectionComplete = false;
        const hasOnlineSubtitles =
          !!this.$store.state.Subtitle.videoSubtitleMap[this.originSrc]
            .map((id) => {
              const { type, language } = this.subtitleInstances[id];
              return { type, language };
            })
            .filter(({ type }) => type === 'online')
            .length;
        this.$bus.$emit('subtitle-refresh-from-src-change', hasOnlineSubtitles);
        this.$store.dispatch('ifNoSubtitle', true);
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
    currentSubtitleId(newVal) {
      if (this.selectionComplete || newVal) updateSelectedSubtitleId(this.originSrc, newVal);
    },
  },
  methods: {
    ...mapActions({
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
      resetOnlineSubtitles: subtitleActions.RESET_ONLINE_SUBTITLES,
      changeCurrentSubtitle: subtitleActions.CHANGE_CURRENT_SUBTITLE,
      offCurrentSubtitle: subtitleActions.OFF_SUBTITLES,
      addSubtitleWhenLoading: subtitleActions.ADD_SUBTITLE_WHEN_LOADING,
      addSubtitleWhenReady: subtitleActions.ADD_SUBTITLE_WHEN_READY,
      addSubtitleWhenLoaded: subtitleActions.ADD_SUBTITLE_WHEN_LOADED,
      addSubtitleWhenFailed: subtitleActions.ADD_SUBTITLE_WHEN_FAILED,
      updateMetaInfo: subtitleActions.UPDATE_METAINFO,
    }),
    async refreshSubtitles(types, videoSrc) {
      const supportedTypes = ['local', 'embedded', 'online'];
      const {
        getLocalSubtitlesList,
        getOnlineSubtitlesList,
        getEmbeddedSubtitlesList,
        normalizeSubtitleList,
        addSubtitle,
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

      if (requestedTypes.includes('local')) {
        const storedLocalSubtitles = storedSubtitles.filter(({ type }) => type === 'local');
        subtitleRequests.push(getLocalSubtitlesList(videoSrc, storedLocalSubtitles));
      }
      if (requestedTypes.includes('embedded')) {
        const storedEmbeddedSubtitles = storedSubtitles
          .filter(({ type }) => type === 'embedded');
        subtitleRequests.push(getEmbeddedSubtitlesList(videoSrc, storedEmbeddedSubtitles));
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
        ));
      }

      if (!this.isInitial) {
        this.selectionComplete = false;
        this.checkCurrentSubtitleList();
      }

      return Promise.all(subtitleRequests)
        .then(subtitleLists => Promise.all(subtitleLists.map(normalizeSubtitleList)))
        .then(normalizedLists => flatten(normalizedLists))
        .then(allSubtitles => Promise.all(allSubtitles.map(sub => addSubtitle(sub, videoSrc))))
        .then(async () => {
          this.$bus.$emit('refresh-finished');
          if (this.isInitial) {
            const id = await retrieveSelectedSubtitleId(videoSrc);
            if (id) {
              this.changeCurrentSubtitle(id);
              this.selectionComplete = true;
            }
            this.isInitial = false;
          }
          this.checkCurrentSubtitleList();
          return storeLanguagePreference(videoSrc, preferredLanguages);
        });
    },
    async getLocalSubtitlesList(videoSrc, storedSubs) {
      const newLocalSubs = await searchForLocalList(videoSrc, SubtitleLoader.supportedFormats)
        .catch(() => []);
      return values(mergeWith(
        keyBy(storedSubs.map(({ src, id }) => ({ src, type: 'local', options: { id } })), 'src'),
        keyBy(newLocalSubs, 'src'),
      ));
    },
    async getOnlineSubtitlesList(videoSrc, isFetching, storedSubIds, languages) {
      if (!isFetching) {
        const retrieveSub = id => retrieveSubtitle(id)
          .then(({ src, data, language }) => ({
            src,
            type: 'online',
            options: { language, data, id },
          }))
          .catch(() => []);
        const storedSubs = await Promise.all(storedSubIds.map(retrieveSub)).then(flatten);
        if (storedSubs.length) {
          return storedSubs;
        }
      }
      const fetchSubs = lang => fetchOnlineList(videoSrc, lang).catch(() => []);
      const newSubs = await Promise.all(languages.map(fetchSubs)).then(flatten);
      deleteSubtitles(storedSubIds);
      return newSubs;
    },
    async getEmbeddedSubtitlesList(videoSrc, storedSubs) {
      const newEmbeddedSubs = await retrieveEmbeddedList(
        videoSrc,
        SubtitleLoader.supportedCodecs,
      ).catch(() => []).then(castArray);
      return values(mergeWith(
        keyBy(storedSubs.map(({ src, id }) => ({ src, type: 'embedded', options: { id } })), 'src'),
        keyBy(newEmbeddedSubs, 'src'),
      ));
    },
    async addSubtitle({ src, type, options }, videoSrc) {
      if (options.id) {
        const existedInList = !!this.subtitleList.find(({ id }) => id === options.id);
        const existedInInstances = !!this.subtitleInstances[options.id];
        if (existedInList && existedInInstances) return 'success';
      }
      const subtitleInstance = new SubtitleLoader(src, type, { ...options });
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
    normalizeSubtitleList(subtitleList) {
      if (!subtitleList || !Object.keys(subtitleList).length) return [];
      const processedSubtitleList = [];
      if (subtitleList instanceof Array) {
        processedSubtitleList
          .push(...subtitleList
            .filter(subtitle => !!subtitle.src && !!subtitle.type)
            .map(subtitle => ({ ...subtitle, options: subtitle.options || {} })));
      } else if (typeof subtitleList === 'object') {
        const { src, type, options } = subtitleList;
        if (src && type) processedSubtitleList.push({ src, type, options: options || {} });
      } else if (typeof subtitleList === 'string') {
        processedSubtitleList.push({ src: subtitleList, type: 'local', options: {} });
      }
      if (processedSubtitleList.length) {
        this.$store.dispatch('ifNoSubtitle', false);
      } else {
        this.$store.dispatch('ifNoSubtitle', true);
      }
      return processedSubtitleList;
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
          return `${this.$t('subtitle.embedded')} ${romanize(computedIndex)} - ${codeToLanguageName(language)}`;
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
      const { id, type } = subtitleInstance;
      this.$set(this.subtitleInstances, id, subtitleInstance);
      this.addSubtitleWhenLoading({ id, type, videoSrc });
    },
    async readyCallback(subtitleInstance, metaInfo) {
      const { type, id, src } = subtitleInstance;
      const { format, language, name } = metaInfo;
      metaInfo.name = await this.computeSubtitleName(
        type,
        id,
        { format, language, src },
        this.subtitleList,
      ) || name;
      this.addSubtitleWhenReady({ id, format });
      updateSubtitle(id, { language });
      this.checkCurrentSubtitleList();
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
    failedCallback({ id }) {
      this.$delete(this.subtitleInstances, id);
      this.addSubtitleWhenFailed({ id });
    },
    checkCurrentSubtitleList() {
      const {
        selectionComplete,
        subtitleList,
        preferredLanguages,
      } = this;
      const validSubtitleList = subtitleList.filter(({ name }) => !!name);
      if (!selectionComplete) {
        const hasPrimaryLanguage = validSubtitleList
          .find(({ language }) => language === preferredLanguages[0]);
        if (hasPrimaryLanguage) {
          this.changeCurrentSubtitle(hasPrimaryLanguage.id);
          this.selectionComplete = true;
        } else {
          const hasSecondaryLanguage = validSubtitleList
            .find(({ language }) => language === preferredLanguages[1]);
          if (hasSecondaryLanguage) {
            this.changeCurrentSubtitle(hasSecondaryLanguage.id);
            this.selectionComplete = true;
          } else {
            this.changeCurrentSubtitle('');
          }
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
      const { currentSubtitleId } = this;
      const currentVideoSegments = this.$refs.subtitleRenderer.videoSegments;
      // generate valid subtitle list members
      this.subtitleList.forEach((subtitleInfo) => {
        const {
          id, type, name, rank,
        } = subtitleInfo;
        if (id !== currentSubtitleId) {
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
          if (result.id === this.currentSubtitleId && this.$refs.subtitleRenderer) {
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
            result.payload = Buffer.from(data);
            break;
        }
      }
      return result;
    },
  },
  created() {
    this.$bus.$on('add-subtitles', (subs) => {
      Promise.all(this.normalizeSubtitleList(subs)
        .map(sub => this.addSubtitle(sub, this.originSrc)))
        .then((subtitleInstances) => {
          this.changeCurrentSubtitle(subtitleInstances[subtitleInstances.length - 1].id);
          this.selectionComplete = true;
        });
    });
    this.$bus.$on('refresh-subtitles', ({ types, isInitial }) => {
      this.refreshSubtitles(types, this.originSrc, isInitial);
      this.isInitial = isInitial;
    });
    this.$bus.$on('change-subtitle', this.changeCurrentSubtitle);
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);

    // when set immediate on watcher, it may run before the created hook
    this.resetSubtitles();
    this.$bus.$emit('subtitle-refresh-from-src-change');
    this.$store.dispatch('ifNoSubtitle', true);

    function pushCurrentSubtitle() {
      if (this.currentSubtitleId) {
        const currentSubtitleInfo = {
          ...this.subtitleList
            .find(({ id }) => id === this.currentSubtitleId),
          duration: this.$store.state.Subtitle.durations[this.currentSubtitleId],
        };
        const subtitleInfo = this.makeSubtitleUploadParameter(currentSubtitleInfo);
        console.log('Subtitle info retrieved,', subtitleInfo, 'ready to upload.');
        Sagi.pushTranscript(subtitleInfo)
          .then(() => console.log('Horay! Subtitle uploaded.'))
          .catch(err => console.error('Opps, subtitle upload failed.', err));
      } else {
        console.error('Current subtitle not found. Do this again when you choose a subtitle.');
      }
    }
    window.pushCurrentSubtitle = pushCurrentSubtitle.bind(this);
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
