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
import partialRight from 'lodash/partialRight';
import Sagi from '@/helpers/sagi';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import helpers from '@/helpers';
import romanize from 'romanize';
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
      onlineRefreshingSubtitles: [],
      onlineRefreshingTimerId: 0,
      onlineRefreshingMaxTime: 20000,
      embeddedSubtitles: [],
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
              payload: Buffer.from(subtitle.rawData),
            };
            Sagi.pushTranscript(payload).then((res) => {
              console.log(res);
            });
            this.localPremiumSubtitles[id] = { ...payload, status: 'loading' };
          }
        });
      }
    },
    loadingOnlineSubtitleIds(newVal) {
      const { onlineRefreshingTimerId } = this;
      if (!newVal.length && onlineRefreshingTimerId) {
        clearTimeout(onlineRefreshingTimerId);
        this.onlineRefreshingTimerId = 0;
        this.$bus.$emit('refresh-finished');
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
    }),
    async addInitialSubtitles(videoSrc) {
      const {
        addSubtitles,
        getLocalSubtitlesList, getOnlineSubtitlesList,
        privacyAgreement,
      } = this;
      const localEmbeddedSubtitles = (await Promise.all([
        promisify(getLocalSubtitlesList.bind(null, videoSrc, SubtitleLoader.supportedFormats)),
      ]))
        .map((subtitles, index) => subtitles.map(subtitle => ({ src: subtitle, type: index ? 'embedded' : 'local' })))
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
          resolve(subtitles.map(subtitle => join(dirname(videoSrc), subtitle)));
        });
      });
    },
    async getOnlineSubtitlesList(videoSrc) {
      const hash = await helpers.methods.mediaQuickHash(videoSrc);
      let enIndex = 0;
      let twIndex = 0;
      let zhIndex = 0;
      let subName;
      const onlineMetaInfo = (subtitle) => {
        const { language_code: code, transcript_identity: src, ranking } = subtitle;
        if (code === 'en') {
          enIndex += 1;
          subName = `${this.$t(`subtitle.language.${code}`)} ${romanize(enIndex)}`;
        } else if (code === 'zh-TW') {
          twIndex += 1;
          subName = `${this.$t(`subtitle.language.${code}`)} ${romanize(twIndex)}`;
        } else {
          zhIndex += 1;
          subName = `${this.$t(`subtitle.language.${code}`)} ${romanize(zhIndex)}`;
        }
        return ({
          src,
          type: 'online',
          options: {
            language: code,
            name: subName,
            ranking,
            isDefault: null,
            streamIndex: null,
          },
        });
      };
      this.onlineRefreshingTimerId = setTimeout(() => {
        this.onlineRefreshingTimerId = 0;
        this.$bus.$emit('refresh-finished');
      }, this.onlineRefreshingMaxTime);
      return (await Promise.all([
        Sagi.mediaTranslate(hash, 'zh'),
        Sagi.mediaTranslate(hash, 'en'),
      ].map(promise => promise.catch(err => err))))
        .filter(result => !(result instanceof Error))
        .reduce((prev, curr) => prev.concat(curr), [])
        .map(onlineMetaInfo);
    },
    languageCallback(subtitleId, systemLanguageCode) {
      const subtitle = this.subtitleList.find(subtitle => subtitle.id === subtitleId);
      if (new RegExp(`${systemLanguageCode}`).test(subtitle ? subtitle.language : '')) return true;
      return false;
    },
    getFirstSubtitle(subtitleList, subtitleCallback) {
      if (!subtitleList.length) return '';
      const validatedCallback = subtitleCallback && typeof subtitleCallback === 'function' ?
        subtitleCallback : (subtitle, index) => index === 0;
      const result = subtitleList.map(subtitle => subtitle.src).filter(validatedCallback);
      return result[0] || subtitleList[0];
    },
    addSubtitle(subtitle, type, options, externalId) {
      const {
        addSubtitleWhenLoading, addSubtitleWhenReady, addSubtitleWhenLoaded, subtitleInstances,
      } = this;
      const {
        language, isDefault, ranking, streamIndex,
      } = options;
      const sub = new SubtitleLoader(subtitle, type, options);
      const id = externalId || sub.src;
      this.$set(subtitleInstances, id, sub);
      sub.on('ready', (metaInfo) => {
        const {
          name, format, language, isDefault, ranking, streamIndex,
        } = metaInfo;
        addSubtitleWhenReady({
          id, name, format, type, language, isDefault, ranking, streamIndex,
        });
      });
      sub.on('parse', () => addSubtitleWhenLoaded({ id }));
      addSubtitleWhenLoading({
        id, type, language, isDefault, ranking, streamIndex,
      });
      sub.meta();
    },
    addSubtitles(subtitleList, firstSubtitleCallback) {
      const {
        addSubtitle, getFirstSubtitle, languageCallback, systemLanguageCode, changeCurrentSubtitle,
      } = this;
      const defaultOptions = {
        language: null, isDefault: null, ranking: null, streamIndex: null,
      };
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
        .forEach(subtitle => addSubtitle(
          subtitle.src,
          subtitle.type,
          subtitle.options || defaultOptions,
        ));
      changeCurrentSubtitle(getFirstSubtitle(
        subtitleList,
        firstSubtitleCallback || partialRight(languageCallback, systemLanguageCode),
      ).src);
    },
    async refreshOnlineSubtitles() {
      this.resetOnlineSubtitles();
      const { getOnlineSubtitlesList, originSrc: videoSrc, addSubtitles } = this;
      const newOnlineSubtitles = await getOnlineSubtitlesList(videoSrc);
      addSubtitles(newOnlineSubtitles);
    },
  },
  created() {
    this.resetSubtitles();
    this.systemLanguageCode = osLocale.sync().slice(0, 2);
    this.$bus.$on('add-subtitles', this.addSubtitles);
    this.$bus.$on('refresh-subtitles', this.refreshOnlineSubtitles);
    this.$bus.$on('change-subtitle', this.changeCurrentSubtitle);
    this.$bus.$on('off-subtitle', this.offCurrentSubtitle);
    this.addInitialSubtitles(this.originSrc);

    const { ipcRenderer } = this.$electron;
    const {
      embeddedSubtitles, mediaHash, originSrc, addSubtitle, addSubtitleWhenLoading,
    } = this;
    const { supportedCodecs, codecToFormat } = SubtitleLoader;
    ipcRenderer.on(`mediaInfo-${originSrc}-reply`, (event, info) => {
      const { streams } = JSON.parse(info);
      embeddedSubtitles.push(...streams
        ?.filter(stream => stream?.codec_type === 'subtitle' && supportedCodecs.includes(stream?.codec_name)) // eslint-disable-line camelcase
        .map(subtitle => ({
          streamIndex: subtitle.index,
          codec: subtitle.codec_name, // eslint-disable-line camelcase
          isDefault: subtitle.disposition.default === 1,
          name: subtitle.tags.title,
          language: subtitle.tags.language,
          ranking: null,
        })));
      embeddedSubtitles.forEach(({
        codec, language, isDefault, ranking, streamIndex,
      }) => {
        addSubtitleWhenLoading({
          id: `${mediaHash}-${streamIndex}`, type: 'embedded', language, isDefault, ranking, streamIndex,
        });
        ipcRenderer.send('extract-subtitle-request', originSrc, streamIndex, codecToFormat(codec), mediaHash);
      });
    });
    ipcRenderer.on('extract-subtitle-response', (event, { error, index, path }) => {
      const subtitleToUpdate = embeddedSubtitles.find(subtitle => subtitle.streamIndex === index);
      const subtitleIndex = embeddedSubtitles.findIndex(subtitle => subtitle.streamIndex === index);
      this.$set(embeddedSubtitles, subtitleIndex, { ...subtitleToUpdate, path: error ? 'error' : path });
      if (!error) {
        addSubtitle(
          path,
          'embedded',
          { name: subtitleToUpdate.name || `embedded-${index}` },
          `${mediaHash}-${index}`,
        );
      }
    });
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
