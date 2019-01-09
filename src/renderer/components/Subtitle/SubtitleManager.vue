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
import { dirname, extname, basename, join } from 'path';
import { readdir } from 'fs';
import osLocale from 'os-locale';
import romanize from 'romanize';
import Sagi from '@/helpers/sagi';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import helpers from '@/helpers';
import SubtitleRenderer from './SubtitleRenderer.vue';
import SubtitleLoader from './SubtitleLoader';
import { promisify } from './SubtitleLoader/utils';

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
      newOnlineSubtitles: [],
    };
  },
  computed: {
    ...mapGetters([
      'originSrc', 'subtitleList', 'currentSubtitleId', 'computedWidth', 'computedHeight',
      'duration', 'premiumSubtitles', 'mediaHash', 'duration', 'privacyAgreement',
    ]),
    ...mapState({
      loadingOnlineSubtitleIds: ({ Subtitle }) => {
        const { loadingStates, types } = Subtitle;
        return Object.keys(loadingStates).filter(id => types[id] === 'online' && loadingStates[id] === 'loading');
      },
    }),
    currentSubtitle() {
      return this.subtitleInstances[this.currentSubtitleId];
    },
  },
  watch: {
    originSrc(newVal) {
      this.resetSubtitles();
      this.addInitialSubtitles(newVal);
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
    async addInitialSubtitles(videoSrc) {
      const {
        addSubtitles,
        getLocalSubtitlesList, getOnlineSubtitlesList, getEmbeddedSubtitlesList,
        privacyAgreement,
      } = this;
      const localEmbeddedSubtitles = (await Promise.all([
        promisify(getLocalSubtitlesList.bind(null, videoSrc, SubtitleLoader.supportedFormats)),
        promisify(getEmbeddedSubtitlesList.bind(null, videoSrc, SubtitleLoader.supportedCodecs)),
      ]))
        .reduce((prev, curr) => prev.concat(curr));
      if (localEmbeddedSubtitles.length) addSubtitles(localEmbeddedSubtitles);
      else if (privacyAgreement) {
        const onlineSubtitles = await getOnlineSubtitlesList(videoSrc);
        addSubtitles(onlineSubtitles);
      }
    },
    // different subtitle getters
    getLocalSubtitlesList(videoSrc, supportedExtensions) {
      const videoDir = dirname(videoSrc);
      const filename = basename(videoSrc, extname(videoSrc));
      const extensionRegex = new RegExp(`\\.(${supportedExtensions.join('|')})$`);
      return new Promise((resolve, reject) => {
        readdir(videoDir, (err, files) => {
          if (err) reject(err);
          const subtitles = files.filter(file =>
            (file.includes(filename) && extensionRegex.test(file)));
          resolve(subtitles.map(subtitle => ({
            src: join(dirname(videoSrc), subtitle),
            type: 'local',
          })));
        });
      });
    },
    async getOnlineSubtitlesList(videoSrc) {
      const hash = await helpers.methods.mediaQuickHash(videoSrc);
      const onlineMetaInfo = (subtitle) => {
        const { language_code: code, transcript_identity: src, ranking } = subtitle;
        return ({
          src,
          type: 'online',
          options: {
            language: code,
            ranking,
          },
        });
      };
      return (await Promise.all([
        Sagi.mediaTranslate(hash, 'zh'),
        Sagi.mediaTranslate(hash, 'en'),
      ].map(promise => promise.catch(err => err))))
        .filter(result => !(result instanceof Error))
        .reduce((prev, curr) => prev.concat(curr), [])
        .map(onlineMetaInfo);
    },
    getEmbeddedSubtitlesList(videoSrc, supportedCodecs) {
      const { ipcRenderer } = this.$electron;
      ipcRenderer.send('mediaInfo', videoSrc);
      return new Promise((resolve, reject) => {
        setTimeout(() => { reject(new Error('Embedded Subtitles Retrieve Timeout!')); }, 20000);
        ipcRenderer.once(`mediaInfo-${videoSrc}-reply`, (event, info) => {
          try {
            const subtitleStreams = JSON.parse(info).streams
              .filter(stream => stream.codec_type === 'subtitle' && supportedCodecs.includes(stream.codec_name)); // eslint-disable-line camelcase;
            if (!subtitleStreams.length) resolve([]);
            resolve(...subtitleStreams.map(subtitle => ({
              src: subtitle.index,
              type: 'embedded',
              options: {
                videoSrc,
                streamIndex: subtitle.index,
                codec: subtitle.codec_name,
                language: subtitle.tags.language,
                name: subtitle.tags.name,
                isDefault: !!subtitle.disposition.default,
              }, // eslint-disable-line camelcase
            })));
          } catch (error) {
            reject(error);
          }
        });
      });
    },
    addSubtitle(subtitle, type, options) {
      const {
        metaInfoUpdate,
        addSubtitleWhenLoading, addSubtitleWhenReady, addSubtitleWhenLoaded,
        subtitleInstances,
      } = this;
      const sub = new SubtitleLoader(subtitle, type, options);
      sub.once('loading', (id) => {
        this.$set(subtitleInstances, id, sub);
        addSubtitleWhenLoading({ id, type });
        sub.meta();

        sub.on('meta-change', ({ field, value }) => {
          metaInfoUpdate(id, field, value);
        });
        sub.once('ready', ({ name, format, language }) => {
          if (!name) {
            if (language) {
              const subtitleRankIndex = this.subtitleList
                .filter(subtitle => subtitle.type === type && subtitle.language === language)
                .findIndex(subtitle => subtitle.id === id) + 1;
              sub.metaInfo.name = `${this.$t(`subtitle.language.${language}`)} ${romanize(subtitleRankIndex)}`;
            } else {
              const subtitleRankIndex = this.subtitleList
                .filter(subtitle => subtitle.type === type)
                .findIndex(subtitle => subtitle.id === id) + 1;
              sub.metaInfo.name = `${{ zh: '内嵌', en: 'embedded' }[this.systemLanguageCode]} ${romanize(subtitleRankIndex)}`;
            }
          }
          addSubtitleWhenReady({ id, format });
        });
        sub.once('parse', () => addSubtitleWhenLoaded({ id }));
      });
    },
    addSubtitles(subtitleList) {
      const processedSubtitleList = [];
      if (subtitleList instanceof Array) {
        processedSubtitleList
          .push(...subtitleList.filter(subtitle => !!subtitle.src && !!subtitle.type));
      } else if (typeof subtitleList === 'object') {
        const { src, type, options } = subtitleList;
        if (src && type) processedSubtitleList.push({ src, type, options: options || null });
      } else if (typeof subtitleList === 'string') {
        processedSubtitleList.push({ src: subtitleList, type: 'local' });
      }

      processedSubtitleList
        .forEach(subtitle => this.addSubtitle(
          subtitle.src,
          subtitle.type,
          subtitle.options,
        ));
    },
    async refreshOnlineSubtitles() {
      this.resetOnlineSubtitles();
      const { getOnlineSubtitlesList, originSrc: videoSrc } = this;
      this.newOnlineSubtitles = await getOnlineSubtitlesList(videoSrc);
      this.$bus.$emit('refresh-finished');
    },
    metaInfoUpdate(id, field, value) {
      this.updateMetaInfo({ id, type: field, value });
    },
  },
  created() {
    this.resetSubtitles();
    this.systemLanguageCode = osLocale.sync().slice(0, 2);
    this.$bus.$on('add-subtitles', this.addSubtitles);
    this.$bus.$on('refresh-subtitles', this.refreshOnlineSubtitles);
    this.$bus.$on('change-subtitle', this.changeCurrentSubtitle);
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);
    this.$bus.$on('finished-add-subtitles', () => {
      this.addSubtitles(this.newOnlineSubtitles);
    });
    this.addInitialSubtitles(this.originSrc);
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
