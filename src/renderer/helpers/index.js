import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import asyncStorage from '@/helpers/asyncStorage';
import Sagi from './sagi';

export default {
  methods: {
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
      vidPath = vidPath.replace(/^file:\/\//, '');
      const baseName = path.basename(vidPath, path.extname(vidPath));
      const dirPath = path.dirname(vidPath);
      const filter = /\.(srt|vtt)$/;

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
      // if new passed path exists in the storage
      function indexOfExistedFileIn(data, path) {
        for (let i = 0; i < data.length; i += 1) {
          const object = data[i];
          const iterator = Object.keys(object).indexOf('path');
          if (iterator !== -1) {
            if (object.path === path) {
              return i;
            }
          }
        }
        return -1;
      }

      asyncStorage.get('recent-played').then((data) => {
        const newElement = {
          path,
          shortCut: '',
          lastPlayedTime: 0,
          duration: 0,
        };
        if (Array.isArray(data)) {
          if (data.length < 4) {
            if (indexOfExistedFileIn(data, path) === -1) {
              data.unshift(newElement);
            } else {
              const item = data.splice(indexOfExistedFileIn(data, path), 1);
              if (item[0].lastPlayedTime !== 0) {
                this.$bus.$emit('seek', item[0].lastPlayedTime);
              }
              data.unshift(item[0]);
            }
          } else if (indexOfExistedFileIn(data, path) === -1) {
            data.pop();
            data.unshift(newElement);
          } else {
            const item = data.splice(indexOfExistedFileIn(data, path), 1);
            if (item[0].lastPlayedTime !== 0) {
              this.$bus.$emit('seek', item[0].lastPlayedTime);
            }
            data.unshift(item[0]);
          }
        } else {
          data = [newElement];
        }
        asyncStorage.set('recent-played', data);
        this.$bus.$emit('new-file-open');
      });
      this.$store.commit('SrcOfVideo', path);
      this.$router.push({
        name: 'playing-view',
      });
    },
    mediaQuickHash(file) {
      function md5Hex(text) {
        return crypto.createHash('md5').update(text).digest('hex');
      }
      const filePath = path.join(__dirname, file);
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
