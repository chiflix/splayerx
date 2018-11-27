<template>
  <div class="subtitle-manager"></div>
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
import Sagi from '@/helpers/sagi';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import helpers from '@/helpers';
import SubtitleLoader from './SubtitleLoader';
import SubtitleWorker from './Subtitle.worker';

export default {
  name: 'subtitle-manager',
  components: {
    'subtitle-loader': SubtitleLoader,
  },
  computed: {
    ...mapGetters(['originSrc', 'subtitleList']),
  },
  data() {
    return {
      subtitleTypes: ['local', 'embedded', 'online'],
      currentSubtitleId: '',
      locale: '',
    };
  },
  watch: {
    originSrc(newVal) {
      this.resetSubtitles();
      this.getSubtitlesList(newVal).then((result) => {
        this.addSubtitles(result);
      });
    },
  },
  methods: {
    ...mapActions({
      addSubtitles: subtitleActions.ADD_SUBTITLES,
      resetSubtitles: subtitleActions.RESET_SUBTITLES,
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
          lang,
          id: uuidv4(),
        });
      };

      const onlineNeeded = local.length === 0;
      const online = onlineNeeded ? await this.getOnlineSubtitlesList() : [];
      return onlineNeeded ? online : [
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
      if (subtitleList.length === 1) {
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
      this.locale = locale.slice(0, 2);
      this.getSubtitlesList(this.originSrc).then((result) => {
        this.addSubtitles(result);
        this.currentSubtitleId = (this.chooseInitialSubtitle(this.subtitleList, this.locale)).id;
      });
    });
  },
};
</script>
