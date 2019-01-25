<template>
  <div class="subtitle-manager"
    :style="{ width: computedWidth + 'px', height: computedHeight + 'px' }">
    <subtitle-render
      ref="currentSubtitle"
      v-if="currentSubtitleId && duration"
      :subtitle-instance="currentSubtitle"
      :key="currentSubtitleId"
    />
  </div>
</template>
<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import osLocale from 'os-locale';
import romanize from 'romanize';
import flatten from 'lodash/flatten';
import isEqual from 'lodash/isEqual';
import difference from 'lodash/difference';
import Sagi from '@/helpers/sagi';
import { codeToLanguageName } from '@/helpers/language';
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
      systemLanguageCode: '',
      subtitleInstances: {},
      localPremiumSubtitles: {},
      embeddedSubtitles: [],
    };
  },
  computed: {
    ...mapGetters([
      'originSrc', 'subtitleList', 'currentSubtitleId', 'computedWidth', 'computedHeight',
      'duration', 'premiumSubtitles', 'mediaHash', 'duration', 'privacyAgreement',
      'primaryLanguage', 'secondaryLanguage', 'getLanguageFromId', 'isExistedSubtitle',
    ]),
    ...mapState({
      loadingOnlineSubtitleIds: ({ Subtitle }) => {
        const { loadingStates, types } = Subtitle;
        return Object.keys(loadingStates).filter(id => types[id] === 'online' && loadingStates[id] === 'loading');
      },
      preferredLanguages: ({ Preference }) => (
        [Preference.primaryLanguage, Preference.secondaryLanguage].filter(language => !!language)
      ),
      allLanguageLoaded: ({ Subtitle }) => {
        const { loadingStates, languages } = Subtitle;
        const notFailedSubtitles = Object.keys(loadingStates)
          .filter(id => loadingStates[id] !== 'failed');
        return !!notFailedSubtitles.length && notFailedSubtitles.every(id => !!languages[id]);
      },
      loadedLanguageIds: ({ Subtitle }) => {
        const { loadingStates, languages } = Subtitle;
        return Object.keys(loadingStates)
          .filter(id => loadingStates[id] !== 'failed' && languages[id]);
      },
    }),
    currentSubtitle() {
      return this.subtitleInstances[this.currentSubtitleId];
    },
  },
  watch: {
    originSrc: {
      handler: function handler(newVal) {
        if (newVal) {
          this.resetSubtitles();
          this.$bus.$emit('subtitle-refresh-from-src-change');
          this.$store.dispatch('ifNoSubtitle', true);
        }
      },
      immediate: true,
    },
    premiumSubtitles(newVal) {
      if (this.privacyAgreement) {
        newVal.forEach((subtitle) => {
          const { id, played } = subtitle;
          if (id && !this.localPremiumSubtitles[id]) {
            const subtitleInfo = this.subtitleList.filter(subtitle => subtitle.id === id)[0];
            const { subtitle } = this.$refs.currentSubtitle;
            const payload = {
              media_identity: this.mediaHash,
              language_code: subtitleInfo.langCode,
              format: `.${subtitleInfo.ext}`,
              played_time: played,
              total_time: this.duration,
              delay: 0,
              payload: Buffer.from(subtitle.data),
            };
            Sagi.pushTranscript(payload).then((res) => {
              console.log(res);
            });
            this.localPremiumSubtitles[id] = { ...payload, status: 'loading' };
          }
        });
      }
    },
    loadedLanguageIds(newVal, oldVal) {
      if (!isEqual(oldVal, newVal)) {
        const extraSubtitles = difference(newVal, oldVal);
        let result = extraSubtitles
          .find(id => this.getLanguageFromId(id) === this.preferredLanguages[0]);
        if (!result && this.preferredLanguages[1]) {
          result = extraSubtitles
            .find(id => this.getLanguageFromId(id) === this.preferredLanguages[1]);
        }
        this.changeCurrentSubtitle(result);
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
    async refreshAllSubtitles(videoSrc) {
      const {
        addSubtitles,
        getLocalSubtitlesList, getEmbeddedSubtitlesList, getOnlineSubtitlesList,
      } = this;
      (await Promise.all([
        getLocalSubtitlesList(videoSrc),
        getEmbeddedSubtitlesList(videoSrc),
        getOnlineSubtitlesList(videoSrc),
      ].map(promise => promise.catch(err => err))))
        .map(list => (list instanceof Array ? list : [list]).filter(sub => !(sub instanceof Error)))
        .forEach(addSubtitles);
    },
    async refreshLocalAndOnlineSubtitles() {
      const {
        originSrc: videoSrc,
        addSubtitles,
        getLocalSubtitlesList, getOnlineSubtitlesList,
        resetOnlineSubtitles,
      } = this;
      resetOnlineSubtitles();
      (await Promise.all([
        getLocalSubtitlesList(videoSrc),
        getOnlineSubtitlesList(videoSrc),
      ].map(promise => promise.catch(err => err))))
        .map(list => (list instanceof Array ? list : [list]).filter(sub => !(sub instanceof Error)))
        .forEach(addSubtitles);
      this.$bus.$emit('refresh-finished');
    },
    getLocalSubtitlesList(videoSrc) {
      return getLocalSubtitles(videoSrc, SubtitleLoader.supportedCodecs);
    },
    async getOnlineSubtitlesList(videoSrc) {
      return flatten(await Promise.all(this.preferredLanguages
        .map(language => getOnlineSubtitles(videoSrc, language))));
    },
    getEmbeddedSubtitlesList(videoSrc) {
      return getEmbeddedSubtitles(videoSrc, SubtitleLoader.supportedCodecs);
    },
    addSubtitle(subtitle, type, options, chooseWhenReady) {
      const {
        changeCurrentSubtitle,
        metaInfoUpdate,
        addSubtitleWhenLoading, addSubtitleWhenReady, addSubtitleWhenLoaded, addSubtitleWhenFailed,
        subtitleInstances,
      } = this;
      const sub = new SubtitleLoader(subtitle, type, options);
      sub.once('loading', (id) => {
        if (this.isExistedSubtitle(id)) return;
        this.$set(subtitleInstances, id, sub);
        addSubtitleWhenLoading({ id, type });
        sub.meta();

        sub.on('meta-change', ({ field, value }) => {
          metaInfoUpdate(id, field, value);
        });
        sub.on('failed', (id) => {
          addSubtitleWhenFailed({ id });
        });
        sub.once('ready', ({ format, language }) => {
          const subtitleRankIndex = this.subtitleList
            .filter((subtitle) => {
              if (subtitle.language) {
                return subtitle.type === type && subtitle.language === language;
              }
              return subtitle.type === type;
            })
            .findIndex(subtitle => subtitle.id === id) + 1;
          switch (type) {
            default:
            case 'local':
              break;
            case 'embedded':
              if (language) sub.metaInfo.name = `${{ zh: '内嵌', en: 'Embedded' }[this.systemLanguageCode]} ${romanize(subtitleRankIndex)} (${this.$t(`subtitle.language.${language}`)})`;
              else {
                localLanguageLoader(sub.src, sub.format).then((language) => {
                  sub.metaInfo.name = `${{ zh: '内嵌', en: 'Embedded' }[this.systemLanguageCode]} ${romanize(subtitleRankIndex)} (${this.$t(`subtitle.language.${language}`)})`;
                });
              }
              break;
            case 'online':
              sub.metaInfo.name = `${codeToLanguageName(language)} ${romanize(subtitleRankIndex)}`;
              break;
          }
          addSubtitleWhenReady({ id, format });
          if (chooseWhenReady) changeCurrentSubtitle(id);
        });
        sub.once('parse', () => addSubtitleWhenLoaded({ id }));
      });
      return sub;
    },
    addSubtitles(subtitleList) {
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
      return processedSubtitleList
        .map(({ src, type, options }) => this.addSubtitle(src, type, options));
    },
    metaInfoUpdate(id, field, value) {
      this.updateMetaInfo({ id, type: field, value });
    },
  },
  created() {
    this.resetSubtitles();
    this.systemLanguageCode = osLocale.sync().slice(0, 2);
    this.$bus.$on('add-subtitles', this.addSubtitles);
    this.$bus.$on('refresh-subtitles', (result) => {
      this[result ? 'refreshAllSubtitles' : 'refreshLocalAndOnlineSubtitles']();
    });
    this.$bus.$on('change-subtitle', this.changeCurrentSubtitle);
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);
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
