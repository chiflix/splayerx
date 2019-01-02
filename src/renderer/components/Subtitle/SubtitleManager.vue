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
            resolve(...JSON.parse(info).streams
              ?.filter(stream => stream?.codec_type === 'subtitle' && supportedCodecs.includes(stream?.codec_name)) // eslint-disable-line camelcase
              .map(subtitle => ({
                src: subtitle.index,
                type: 'embedded',
                options: { videoSrc, codec: subtitle.codec_name }, // eslint-disable-line camelcase
              })));
          } catch (error) {
            reject(error);
          }
        });
      });
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
    addSubtitles(subtitleList) {
      const { addSubtitle } = this;
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
    },
    async refreshOnlineSubtitles() {
      this.resetOnlineSubtitles();
      const { getOnlineSubtitlesList, originSrc: videoSrc } = this;
      this.newOnlineSubtitles = await getOnlineSubtitlesList(videoSrc);
      this.$bus.$emit('refresh-finished');
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
