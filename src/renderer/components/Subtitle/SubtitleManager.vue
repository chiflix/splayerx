<template>
  <div class="subtitle-manager"
    :style="{ width: computedWidth + 'px', height: computedHeight + 'px' }">
    <subtitle-loader
      ref="currentSubtitle"
      v-if="currentSubtitleId"
      :subtitleSrc="currentSubtitleSrc"
      :key="currentSubtitleId"
      :id="currentSubtitleId"
    />
  </div>
</template>
<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import { dirname, extname, basename, join } from 'path';
import { open, readSync, statSync, readdir, close } from 'fs';
import osLocale from 'os-locale';
import convert3To1 from 'iso-639-3-to-1';
import uuidv4 from 'uuid/v4';
import partialRight from 'lodash/partialRight';
import compose from 'lodash/fp/compose';
import Sagi from '@/helpers/sagi';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import helpers from '@/helpers';
import SubtitleLoader from './SubtitleLoader.vue';
import SubtitleLoader2 from './SubtitleLoader/index';
import SubtitleWorker from './Subtitle.worker';

export default {
  name: 'subtitle-manager',
  components: {
    'subtitle-loader': SubtitleLoader,
  },
  computed: {
    ...mapGetters([
      'originSrc', 'subtitleList', 'currentSubtitleId', 'computedWidth', 'computedHeight',
      'duration', 'paused', 'premiumSubtitles', 'mediaHash', 'duration', 'privacyAgreement',
    ]),
    ...mapState({
      vuexSubtitles: state => state.Subtitle.subtitles,
    }),
    currentSubtitleSrc() {
      const result = this.subtitleList
        .filter(subtitle => subtitle.id === this.currentSubtitleId)[0];
      if (result) {
        return result.type === 'online' ? result.hash : result.path;
      }
      return this.subtitleList[0].hash;
    },
  },
  data() {
    return {
      systemLocale: '',
      subtitles: {},
      localPremiumSubtitles: {},
      zhIndex: -1,
      enIndex: -1,
      twIndex: -1,
    };
  },
  watch: {
    originSrc(newVal) {
      this.zhIndex = -1;
      this.twIndex = -1;
      this.enIndex = -1;
      this.resetSubtitles();
      this.getSubtitlesList(newVal).then((result) => {
        if (result.length > 0) {
          this.addSubtitles(result);
          this.changeCurrentSubtitle((this.chooseInitialSubtitle(
            this.subtitleList,
            this.systemLocale,
          )).id);
        } else {
          this.$bus.$emit('find-no-subtitle');
        }
      });
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
    subtitleList() {
      this.$bus.$emit('finish-loading', 'online');
    },
    subtitles(newVal) {
      console.log(newVal);
    },
    vuexSubtitles(newVal) {
      console.log(newVal);
    },
  },
  methods: {
    ...mapActions({
      addSubtitles: subtitleActions.ADD_SUBTITLES,
      updateSubtitle: subtitleActions.UPDATE_SUBTITLE,
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
      changeCurrentSubtitle: subtitleActions.SWITCH_CURRENT_SUBTITLE,
      refreshSubtitle: subtitleActions.REFRESH_SUBTITLES,
    }),
    async getSubtitlesList(videoSrc) {
      const local = await this.getLocalSubtitlesList(videoSrc, SubtitleLoader2.supportedFormats);
      local.forEach(partialRight(this.addSubtitle, 'local'));
      const onlineNeeded = !local.length && this.privacyAgreement;
      const online = onlineNeeded ? await this.getOnlineSubtitlesList(videoSrc) : [];
      return local.concat(online);
    },
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
      return (await Promise.all([
        Sagi.mediaTranslate(hash, 'zh'),
        Sagi.mediaTranslate(hash, 'en'),
      ].map(promise => promise.catch(err => err))))
        .filter(result => !(result instanceof Error))
        .reduce((prev, curr) => prev.concat(curr), [])
        .map(subtitle => ({
          src: subtitle.transcript_identity,
          language: subtitle.language_code,
          name: this.getOnlineSubName(subtitle.language_code),
        }));
    },
    getOnlineSubName(code) {
      const romanNum = ['I', 'II', 'III']; // may use package romanize in the future
      if (code === 'en') {
        this.enIndex += 1;
        return `${this.$t(`subtitle.language.${code}`)} ${romanNum[this.enIndex]}`;
      } else if (code === 'zh-TW') {
        this.twIndex += 1;
        return `${this.$t(`subtitle.language.${code}`)} ${romanNum[this.twIndex]}`;
      }
      this.zhIndex += 1;
      return `${this.$t(`subtitle.language.${code}`)} ${romanNum[this.zhIndex]}`;
    },
    chooseInitialSubtitle(subtitleList, iso6391SystemLocale) {
      const fitSystemLocaleSubtitles = subtitleList.filter(subtitle => (subtitle.lang.length === 2 ?
        subtitle.lang : convert3To1(subtitle.lang)) === iso6391SystemLocale);
      return fitSystemLocaleSubtitles.length ? fitSystemLocaleSubtitles[0] : subtitleList[0];
    },
    addSubtitle(subtitle, type) {
      const sub = new SubtitleLoader2(subtitle, type);
      sub.on('ready', () => {
        this.updateSubtitle({
          id: sub.src,
          state: 'ready',
        });
      });
      this.$set(this.subtitles, `${sub.src}`, sub);
      this.updateSubtitle({ id: sub.src, state: 'initializing' });
      sub.meta();
    },
  },
  created() {
    this.resetSubtitles();
    osLocale().then((locale) => {
      this.systemLocale = locale.slice(0, 2);
      this.getSubtitlesList(this.originSrc).then((result) => {
        if (result.length > 0) {
          this.addSubtitles(result);
          // this.changeCurrentSubtitle(this.chooseInitialSubtitle(
          //   this.subtitleList,
          //   this.systemLocale,
          // ).id);
          this.$bus.$emit('change-current');
        } else {
          this.$bus.$emit('find-no-subtitle');
        }
      });
    });
    this.$bus.$on('add-subtitles', (subtitleList) => {
      const currentUuids = subtitleList.map(() => uuidv4());
      compose(
        this.addSubtitles,
        subtitleList => subtitleList.map((subtitle, index) => ({
          id: currentUuids[index],
          name: basename(subtitle),
          path: subtitle,
          ext: extname(subtitle).slice(1),
          type: 'local',
        })),
      )(subtitleList);
    });
    this.$bus.$on('refresh-subtitle', async (src) => {
      this.zhIndex = -1;
      this.twIndex = -1;
      this.enIndex = -1;
      const online2 = await this.getOnlineSubtitlesList(src);
      this.refreshSubtitle(online2);
      this.changeCurrentSubtitle(this.chooseInitialSubtitle(
        this.subtitleList,
        this.systemLocale,
      ).id);
      this.$bus.$emit('finish-refresh');
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
