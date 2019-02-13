<template>
  <div class="subtitle-manager"
    :style="{ width: computedWidth + 'px', height: computedHeight + 'px' }">
    <subtitle-render
      v-if="currentSubtitleId && duration"
      :subtitle-instance="currentSubtitle"
      :key="currentSubtitleId"
    />
  </div>
</template>
<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import romanize from 'romanize';
import { flatten, isEqual, sortBy, differenceWith, isFunction, partial } from 'lodash';
import { codeToLanguageName } from '@/helpers/language';
import Sagi from '@/helpers/sagi';
import { searchForLocalList, fetchOnlineList, retrieveEmbeddedList } from '@/helpers/subtitle';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleLoader from './SubtitleLoader';
import { localLanguageLoader } from './SubtitleLoader/utils';

export default {
  name: 'subtitle-manager',
  components: {
    'subtitle-render': SubtitleRenderer,
  },
  data() {
    return {
      subtitleInstances: {},
      selectionComplete: false,
    };
  },
  computed: {
    ...mapGetters([
      'originSrc', // use to find proper subtitles and clear subtitle upon change
      'mediaHash', // use to provide subtitle with videoIdentity
      'subtitleList', 'currentSubtitleId', // use to get current subtitle info and auto selection subtitles
      'computedWidth', 'computedHeight', // to determine the subtitle renderer's container size
      'duration', // do not load subtitle renderer when video(duration) is not available(todo: global variable to tell if video is totally available)
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
        newQualified.forEach((subtitlePayload) => {
          Sagi.pushTranscript(this.makeSubtitleUploadParameter(subtitlePayload))
            .then(res => console.log(res))
            .catch(err => console.log(err));
        });
      }
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
      if (requestedTypes.includes('local')) {
        subtitleRequests.push(getLocalSubtitlesList(videoSrc));
      }
      if (requestedTypes.includes('embedded')) {
        subtitleRequests.push(getEmbeddedSubtitlesList(videoSrc));
      }
      if (requestedTypes.includes('online')) {
        resetOnlineSubtitles();
        subtitleRequests.push(getOnlineSubtitlesList(videoSrc, preferredLanguages));
      }

      this.selectionComplete = false;
      this.checkCurrentSubtitleList();

      return Promise.all(subtitleRequests)
        .then(subtitleLists => Promise.all(subtitleLists.map(normalizeSubtitleList)))
        .then(normalizedLists => flatten(normalizedLists))
        .then(allSubtitles => Promise.all(allSubtitles.map(sub => addSubtitle(sub, videoSrc))))
        .then(() => {
          this.$bus.$emit('refresh-finished');
          this.checkCurrentSubtitleList();
        });
    },
    getLocalSubtitlesList(videoSrc) {
      return searchForLocalList(videoSrc, SubtitleLoader.supportedFormats).catch(() => []);
    },
    async getOnlineSubtitlesList(videoSrc, languages) {
      if (!languages || !languages.length) return [];
      function getOnlineSubtitlesWithErrorHandling(language) {
        return fetchOnlineList(videoSrc, language).catch(() => []);
      }
      return Promise.all(languages.map(getOnlineSubtitlesWithErrorHandling))
        .then(subtitleLists => flatten(subtitleLists));
    },
    getEmbeddedSubtitlesList(videoSrc) {
      return retrieveEmbeddedList(videoSrc, SubtitleLoader.supportedCodecs).catch(() => []);
    },
    async addSubtitle({ src, type, options }, videoSrc) {
      const subtitleInstance = new SubtitleLoader(src, type, { ...options });
      try {
        return this.setupListeners(subtitleInstance, {
          metaChange: this.metaChangeCallback,
          loading: partial(this.loadingCallback, videoSrc),
          ready: this.readyCallback,
          loaded: this.loadedCallback,
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
    makeSubtitleUploadParameter(payload) {
      if (payload && payload.id) {
        const { id, type, duration: playedTime } = payload;
        const subtitleInstance = this.subtitleInstances[id];
        if (subtitleInstance) {
          const {
            metaInfo, src, data, options,
          } = subtitleInstance;
          if (
            (type === 'online' && src) ||
            (type !== 'online' && data)
          ) {
            return ({
              mediaIdentity: options.videoIdentity,
              languageCode: metaInfo.language,
              format: metaInfo.format,
              playedTime,
              totalTime: this.duration,
              [type === 'online' ? 'transcriptIdentity' : 'payload']:
                type === 'online' ? src : Buffer.from(data),
            });
          }
        }
      }
      return undefined;
    },
    async computeSubtitleName(type, id, options, subtitleList) {
      if (type === 'local') return '';
      const computedIndex = subtitleList
        .filter((subtitle) => {
          if (subtitle.language && options.language) {
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
      this.checkCurrentSubtitleList();
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
      if (!selectionComplete) {
        const hasPrimaryLanguage = subtitleList
          .find(({ language }) => language === preferredLanguages[0]);
        if (hasPrimaryLanguage) {
          this.changeCurrentSubtitle(hasPrimaryLanguage.id);
          this.selectionComplete = true;
        } else {
          const hasSecondaryLanguage = subtitleList
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
  },
  created() {
    this.resetSubtitles();
    this.$bus.$on('add-subtitles', (subs) => {
      Promise.all(this.normalizeSubtitleList(subs)
        .map(sub => this.addSubtitle(sub, this.originSrc)))
        .then((subtitleInstances) => {
          this.changeCurrentSubtitle(subtitleInstances[subtitleInstances.length - 1].id);
          this.selectionComplete = true;
        });
    });
    this.$bus.$on('refresh-subtitles', (types) => {
      this.refreshSubtitles(types, this.originSrc);
    });
    this.$bus.$on('change-subtitle', this.changeCurrentSubtitle);
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);

    // when set immediate on watcher, it may run before the created hook
    this.resetSubtitles();
    this.$bus.$emit('subtitle-refresh-from-src-change');
    this.$store.dispatch('ifNoSubtitle', true);

    function pushCurrentSubtitle() {
      if (this.currentSubtitleId) {
        console.log(`Find subtitle id: ${this.currentSubtitleId}, about to upload.`);
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
