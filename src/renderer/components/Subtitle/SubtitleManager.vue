<template>
  <div class="subtitle-manager"></div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import { dirname, extname, basename, join } from 'path';
import { createReadStream, readdir, readFile } from 'fs';
import MatroskaSubtitles from 'matroska-subtitles';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import uuidv4 from 'uuid/v4';

import { Subtitle as subtitleActions } from '@/store/actionTypes';

import SubtitleLoader from './SubtitleLoader';
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
    };
  },
  watch: {
    originSrc(newVal) {
      this.getSubtitlesList(newVal).then((result) => {
        this.subtitleList = result;
        this.addSubtitles(this.subtitleList);
      });
    },
  },
  methods: {
    async getSubtitlesList(videoSrc) {
      const embedded = await this.getEmbededSubtitlesList(videoSrc);
      const local = await this.getLocalSubtitlesList(videoSrc);
      const embeddedNormalizer = track => ({
        language: track.language,
        ext: track.type,
        type: 'embedded',
        name: track.number,
        id: uuidv4(),
      });
      const localNormalizer = track => ({
        path: track.path,
        ext: track.ext,
        type: 'local',
        name: track.name,
        id: uuidv4(),
      });

      const onlineNeeded = local.length === 0 && !embedded.tracks.length;
      const online = onlineNeeded ? await this.getOnlineSubtitlesList() : [];
      return onlineNeeded ? online : [
        ...embedded.tracks.map(embeddedNormalizer),
        ...local.map(localNormalizer),
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
    getEmbededSubtitlesList(videoSrc) {
      const loadEmbedded = new Promise((resolve) => {
        const parser = new MatroskaSubtitles();
        parser.once('tracks', (tracks) => {
          resolve({
            parser,
            tracks,
          });
        });
        createReadStream(videoSrc).pipe(parser);
      });
      const timeoutPromise = new Promise((resolve) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          resolve({
            parser: null,
            tracks: [],
          });
        }, 1000);
      });

      return Promise.race([loadEmbedded, timeoutPromise]);
    },
    ...mapActions({
      addSubtitles: subtitleActions.ADD_SUBTITLES,
      getOnlineSubtitlesList: subtitleActions.HAS_ONLINE_SUBTITLES,
    }),
    getLocalSubtitle(path) {
      return new Promise((resolve, reject) => {
        readFile(path, (err, data) => {
          if (err) reject(err);
          const encoding = chardet.detect(data.slice(0, 100));
          if (iconv.encodingExists(encoding)) {
            resolve(iconv.decode(data, encoding));
          }
          reject(new Error(`Unsupported encoding: ${encoding}.`));
        });
      });
    },
  },
  created() {
    this.getSubtitlesList(this.originSrc);
  },
};
</script>
