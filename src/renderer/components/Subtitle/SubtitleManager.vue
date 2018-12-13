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
import { mapGetters, mapActions } from 'vuex';
import { dirname, extname, basename, join } from 'path';
import { open, readSync, statSync, readdir, close } from 'fs';
import franc from 'franc';
import osLocale from 'os-locale';
import convert3To1 from 'iso-639-3-to-1';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import uuidv4 from 'uuid/v4';
import compose from 'lodash/fp/compose';
import Sagi from '@/helpers/sagi';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import helpers from '@/helpers';
import SubtitleLoader from './SubtitleLoader.vue';
import SubtitleWorker from './Subtitle.worker';

export default {
  name: 'subtitle-manager',
  components: {
    'subtitle-loader': SubtitleLoader,
  },
  computed: {
    ...mapGetters([
      'originSrc', 'subtitleList', 'currentSubtitleId', 'computedWidth', 'computedHeight',
      'currentTime', 'duration', 'paused', 'premiumSubtitles', 'mediaHash', 'duration', 'privacyAgreement',
    ]),
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
      subtitleTypes: ['local', 'embedded', 'online'],
      systemLocale: '',
      subtitleTime: {},
      localPremiumSubtitles: {},
    };
  },
  watch: {
    originSrc(newVal) {
      this.resetSubtitles();
      this.getSubtitlesList(newVal).then((result) => {
        this.addSubtitles(result);
        this.changeCurrentSubtitle((this.chooseInitialSubtitle(
          this.subtitleList,
          this.systemLocale,
        )).id);
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
  },
  methods: {
    ...mapActions({
      addSubtitles: subtitleActions.ADD_SUBTITLES,
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
      changeCurrentSubtitle: subtitleActions.SWITCH_CURRENT_SUBTITLE,
      refreshSubtitle: subtitleActions.REFRESH_SUBTITLES,
    }),
    async getSubtitlesList(videoSrc) {
      const local = await this.getLocalSubtitlesList(videoSrc);
      const localNormalizer = async (track) => {
        const lang = await this.getSubtitleLocale(track.path, this.getSubtitleCallback(track.ext));
        return ({
          path: track.path,
          ext: track.ext,
          type: 'local',
          name: track.name,
          lang: lang.name,
          langCode: lang.iso6393,
          id: uuidv4(),
        });
      };
      const onlineNormalizer = [];
      const onlineNeeded = local.length === 0;
      const online = onlineNeeded && this.privacyAgreement
        ? await this.getOnlineSubtitlesList(videoSrc) : [];
      if (onlineNeeded && this.privacyAgreement) {
        online.array[1].forEach((sub) => {
          if (typeof sub[0] === 'string' && sub[0].length) {
            onlineNormalizer.push({
              type: 'online',
              hash: sub[0],
              id: uuidv4(),
            });
          }
        });
      }
      return onlineNeeded ? onlineNormalizer : [
        ...(await Promise.all(local.map(localNormalizer))),
      ];
    },
    getLocalSubtitlesList(videoSrc) {
      const videoDir = dirname(videoSrc);
      const filename = basename(videoSrc, extname(videoSrc));
      const supportedExtensions = ['srt', 'ass', 'vtt'];
      const extensionRegex = new RegExp(`\\.(${supportedExtensions.join('|')})$`);
      let result = [];
      return new Promise((resolve, reject) => {
        readdir(videoDir, (err, files) => {
          if (err) reject(err);
          const subtitles = files.filter(file =>
            (file.includes(filename) && extensionRegex.test(file)));
          result = subtitles.map(subtitle => ({
            path: join(dirname(videoSrc), subtitle),
            name: subtitle
              .replace(filename, '').replace(extensionRegex, '').replace('.', '') || filename,
            ext: extname(subtitle).slice(1),
          }));
          resolve(result);
        });
      });
    },
    getOnlineSubtitlesList(videoSrc) {
      return Sagi.mediaTranslate(helpers.methods.mediaQuickHash(videoSrc));
    },
    getSubtitleCallback(type) {
      switch (type) {
        case 'ass':
        case 'ssa':
          return str => str.replace(/^(Dialogue:)(.*\d,)(((\d{0,2}:){2}\d{0,2}\d{0,2}([.]\d{0,3})?,)){2}(.*,)(\w*,)(\d+,){3}(\w*,)|(\\[nN])|([\\{\\]\\.*[\\}].*)/gm, '');
        case 'srt':
        case 'vtt':
          return str => str.replace(/^\d+.*/gm, '').replace(/\n.*\s{1,}/gm, '');
        default:
          return str => str.replace(/\d/gm, '');
      }
    },
    getSubtitleLocale(path, stringCallback) {
      /* eslint-disable */
      return new Promise((resolve, reject) => {
        open(path, 'r', async (err, fd) => {
          if (err) reject(err);
          const pos = Math.round(statSync(path).size / 2);
          const buf = Buffer.alloc(4096);
          readSync(fd, buf, 0, 4096, pos);
          close(fd, (err) => {
            if (err) reject(err);
          });
          const sampleStringEncoding = chardet.detect(buf);
          const sampleString = stringCallback ?
            stringCallback(iconv.decode(buf, sampleStringEncoding)) :
            iconv.decode(buf, sampleStringEncoding);
          resolve(await new SubtitleWorker().findISO6393Locale(franc(sampleString)));
        });
      });
    },
    chooseInitialSubtitle(subtitleList, iso6391SystemLocale) {
      if (subtitleList.length >= 1) {
        return subtitleList[0];
      } else {
        const fitSystemLocaleSubtitles = subtitleList.filter(subtitle => convert3To1(subtitle.lang) === iso6391SystemLocale);
        return fitSystemLocaleSubtitles.length ? fitSystemLocaleSubtitles[0] : subtitleList[0];
      }
    },
  },
  created() {
    this.resetSubtitles();
    osLocale().then((locale) => {
      this.systemLocale = locale.slice(0, 2);
      this.getSubtitlesList(this.originSrc).then((result) => {
        if (result.length > 0) {
          this.addSubtitles(result);
          this.changeCurrentSubtitle(this.chooseInitialSubtitle(this.subtitleList, this.systemLocale).id);
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
    this.$bus.$on('refresh-subtitle', async (hash) => {
      const online = await Sagi.mediaTranslate(hash);
      let onlineNormalizer = [];
      online.array[1].forEach((sub) => {
        if (typeof sub[0] === 'string' && sub[0].length) {
          onlineNormalizer.push({
            type: 'online',
            hash: sub[0],
            id: uuidv4(),
          });
        }
      });
      this.refreshSubtitle(onlineNormalizer);
      this.changeCurrentSubtitle(this.subtitleList[0].id);
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
