import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import InfoDB from '@/helpers/infoDB';
import Sagi from './sagi';

export default {
  methods: {
    infoDB() {
      return InfoDB;
    },
    sagi() { return Sagi; },

    timecodeFromSeconds(s) {
      const dt = new Date(Math.abs(s) * 1000);
      let hours = dt.getUTCHours();
      let minutes = dt.getUTCMinutes();
      let seconds = dt.getUTCSeconds();

      // the above dt.get...() functions return a single digit
      // so I prepend the zero here when needed
      if (minutes < 10) {
        minutes = `0${minutes}`;
      }
      if (seconds < 10) {
        seconds = `0${seconds}`;
      }
      if (hours > 0) {
        if (hours < 10) {
          hours = `${hours}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      return `${minutes}:${seconds}`;
    },
    findSubtitleFilesByVidPath(vidPath, callback) {
      vidPath = decodeURI(vidPath);
      if (process.platform === 'win32') {
        vidPath = vidPath.replace(/^file:\/\/\//, '');
      } else {
        vidPath = vidPath.replace(/^file:\/\//, '');
      }

      const baseName = path.basename(vidPath, path.extname(vidPath));
      const dirPath = path.dirname(vidPath);
      const filter = /\.(srt|vtt|ass)$/;

      if (!fs.existsSync(dirPath)) {
        console.log(`no dir ${dirPath}`);
        return;
      }

      const files = fs.readdirSync(dirPath);
      for (let i = 0; i < files.length; i += 1) {
        const filename = path.join(dirPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (!stat.isDirectory()) {
          if (files[i].startsWith(baseName) && filter.test(files[i])) {
            console.log(`found subtitle file: ${files[i]}`);
            callback(filename);
          }
        }
      }
    },
    openFile(path) {
      const originPath = path;
      const convertedPath = encodeURIComponent(originPath).replace(/%3A/g, ':').replace(/(%5C)|(%2F)/g, '/');
      this.infoDB().get('recent-played', this.mediaQuickHash(originPath))
        .then((value) => {
          if (value) {
            this.$bus.$emit('seek', value.lastPlayedTime);
            this.infoDB().add('recent-played', Object.assign(value, { lastOpened: Date.now() }));
          } else {
            this.infoDB().add('recent-played', {
              quickHash: this.mediaQuickHash(originPath),
              path: originPath,
              lastOpened: Date.now(),
            });
          }
          this.$bus.$emit('new-file-open');
        });
      this.$store.commit(
        'SrcOfVideo',
        process.platform === 'win32' ? convertedPath : `file://${convertedPath}`,
      );
      this.$store.commit('OriginSrcOfVideo', originPath);
      this.$bus.$emit('new-video-opened');
      this.$router.push({
        name: 'playing-view',
      });
    },
    mediaQuickHash(filePath) {
      function md5Hex(text) {
        return crypto.createHash('md5').update(text).digest('hex');
      }
      const fd = fs.openSync(filePath, 'r');
      const len = fs.statSync(filePath).size;
      const position = [
        4096,
        Math.floor(len / 3),
        Math.floor(len / 3) * 2,
        len - 8192,
      ];
      const res = [];
      const buf = Buffer.alloc(4096);
      for (let i = 0; i < 4; i += 1) {
        const bufLen = fs.readSync(fd, buf, 0, 4096, position[i]);
        res[i] = md5Hex(buf.slice(0, bufLen));
      }
      fs.closeSync(fd);
      return res.join('-');
    },
  },
};
