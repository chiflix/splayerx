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
import flatten from 'lodash/flatten';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import differenceWith from 'lodash/differenceWith';
import { codeToLanguageName } from '@/helpers/language';
import Sagi from '@/helpers/sagi';
import { getLocalSubtitles, getOnlineSubtitles, getEmbeddedSubtitles } from '@/helpers/subtitle';
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
      isAutoSelection: false,
      autoSelectionCompleted: false,
      addingSubtitlesCount: 0,
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
      languageLoadedSubtitleInfoList: ({ Subtitle }) => {
        const {
          loadingStates, languages, types, ranks,
        } = Subtitle;
        return Object.keys(loadingStates)
          .filter(id => loadingStates[id] !== 'failed' && languages[id])
          .sort((prevId, currId) => ranks[currId] - ranks[prevId])
          .map(id => ({ id, language: languages[id], type: types[id] }));
      },
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
    allLanguageLoaded() {
      return this.addingSubtitlesCount &&
        this.addingSubtitlesCount === this.languageLoadedSubtitleInfoList.length;
    },
  },
  watch: {
    originSrc(newVal) {
      if (newVal) {
        this.addingSubtitlesCount = 0;
        this.resetSubtitles();
        this.$bus.$emit('subtitle-refresh-from-src-change');
        this.$store.dispatch('ifNoSubtitle', true);
      }
    },
    languageLoadedSubtitleInfoList(newVal, oldVal) {
      if (!this.autoSelectionCompleted && !isEqual(oldVal, newVal)) {
        const {
          isAutoSelection: auto,
          findSubtitleByLanguageWithTypeRank: finder,
          preferredLanguages: langs,
          allLanguageLoaded: all,
          currentSubtitleId: curr,
        } = this;
        const subtitlesToFindFrom = auto ? newVal : differenceWith(newVal, oldVal, isEqual);
        let result = finder(subtitlesToFindFrom, langs[0]);
        if (!result && all) result = finder(newVal, langs[1]);
        this.changeCurrentSubtitle(result ? result.id : curr);
        if (result) this.autoSelectionCompleted = true;
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
    async refreshSubtitles(types, videoSrc, mediaIdentity) {
      const supportedTypes = ['local', 'embedded', 'online'];
      const {
        getLocalSubtitlesList,
        getOnlineSubtitlesList,
        getEmbeddedSubtitlesList,
        addSubtitles,
        resetOnlineSubtitles,
      } = this;
      const requestedTypes = types
        .map(type => type.toLowerCase())
        .filter(type => supportedTypes.includes(type));
      if (requestedTypes.includes('local')) getLocalSubtitlesList(videoSrc, mediaIdentity).then(addSubtitles);
      if (requestedTypes.includes('embedded')) getEmbeddedSubtitlesList(videoSrc, mediaIdentity).then(addSubtitles);
      if (requestedTypes.includes('online')) {
        resetOnlineSubtitles();
        getOnlineSubtitlesList(videoSrc, mediaIdentity, this.preferredLanguages).then(addSubtitles);
      }
    },
    getLocalSubtitlesList(videoSrc, mediaIdentity) {
      return new Promise((resolve) => {
        getLocalSubtitles(videoSrc, SubtitleLoader.supportedFormats)
          .then((subs) => {
            resolve(mediaIdentity === this.mediaHash ? subs : []);
          })
          .catch(() => resolve([]));
      });
    },
    getOnlineSubtitlesList(videoSrc, mediaIdentity, languages) {
      return new Promise((resolve) => {
        function getOnlineSubtitlesWithErrorHandling(language) {
          return getOnlineSubtitles(videoSrc, language).catch(() => []);
        }
        Promise.all(languages.map(getOnlineSubtitlesWithErrorHandling))
          .then(subtitlesArray => resolve(mediaIdentity === this.mediaHash ?
            flatten(subtitlesArray) : []));
      });
    },
    getEmbeddedSubtitlesList(videoSrc, mediaIdentity) {
      return new Promise((resolve) => {
        getEmbeddedSubtitles(videoSrc, SubtitleLoader.supportedCodecs)
          .then(subs => resolve(mediaIdentity === this.mediaHash ? subs : []))
          .catch(() => resolve([]));
      });
    },
    async addSubtitle(src, type, options) {
      const {
        metaInfoUpdate, computeSubtitleName,
        addSubtitleWhenLoading, addSubtitleWhenReady, addSubtitleWhenLoaded, addSubtitleWhenFailed,
        subtitleInstances,
      } = this;
      const sub = new SubtitleLoader(src, type, {
        ...options,
        videoSrc: this.originSrc,
        videoIdentity: this.mediaHash,
      });
      this.addingSubtitlesCount += 1;
      sub.once('loading', (id) => {
        this.$set(subtitleInstances, id, sub);
        addSubtitleWhenLoading({ id, type });
        sub.meta();

        sub.on('meta-change', ({ field, value }) => { metaInfoUpdate(id, field, value); });
        sub.on('failed', (id) => {
          this.addingSubtitlesCount -= 1;
          delete this.subtitleInstances[id];
          addSubtitleWhenFailed({ id });
        });
        sub.once('ready', async ({ format, language, name }) => {
          sub.metaInfo.name = await computeSubtitleName(
            type,
            id,
            { format, language, src: sub.src },
            this.subtitleList,
          ) || name;
          addSubtitleWhenReady({ id, format });
        });
        sub.once('parse', () => addSubtitleWhenLoaded({ id }));
      });
      return true;
    },
    addSubtitles(subtitleList, isAutoSelection = true) {
      if (!subtitleList || !Object.keys(subtitleList).length) return [];
      this.isAutoSelection = !!isAutoSelection;
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
      return processedSubtitleList
        .map(({ src, type, options }) => this.addSubtitle(src, type, options));
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
  },
  created() {
    this.resetSubtitles();
    this.$bus.$on('add-subtitles', (subs) => {
      this.autoSelectionCompleted = false;
      this.addSubtitles(subs, false);
    });
    this.$bus.$on('refresh-subtitles', (types) => {
      this.autoSelectionCompleted = false;
      this.refreshSubtitles(types, this.originSrc, this.mediaHash);
    });
    this.$bus.$on('change-subtitle', this.changeCurrentSubtitle);
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);

    // when set immediate on watcher, it may run before the created hook
    this.addingSubtitlesCount = 0;
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
