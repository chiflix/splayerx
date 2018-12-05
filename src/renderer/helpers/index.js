import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import InfoDB from '@/helpers/infoDB';
import Sagi from './sagi';

import { ipcRenderer } from 'electron'; // eslint-disable-line

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
    findSimilarVideoByVidPath(vidPath) {
      vidPath = decodeURI(vidPath);

      if (process.platform === 'win32') {
        vidPath = vidPath.replace(/^file:\/\/\//, '');
      } else {
        vidPath = vidPath.replace(/^file:\/\//, '');
      }

      const dirPath = path.dirname(vidPath);
      const filter = /\.(3g2|3gp|3gp2|3gpp|amv|asf|avi|bik|bin|crf|divx|drc|dv|dvr-ms|evo|f4v|flv|gvi|gxf|iso|m1v|m2v|m2t|m2ts|m4v|mkv|mov|mp2|mp2v|mp4|mp4v|mpe|mpeg|mpeg1|mpeg2|mpeg4|mpg|mpv2|mts|mtv|mxf|mxg|nsv|nuv|ogg|ogm|ogv|ogx|ps|rec|rm|rmvb|rpl|thp|tod|tp|ts|tts|txd|vob|vro|webm|wm|wmv|wtv|xesc)$/;

      if (!fs.existsSync(dirPath)) {
        return [];
      }

      const videoFiles = [];
      const files = fs.readdirSync(dirPath);
      for (let i = 0; i < files.length; i += 1) {
        const filename = path.join(dirPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (!stat.isDirectory()) {
          if (filter.test(path.extname(files[i]))) {
            const fileBaseName = path.basename(filename);
            videoFiles.push(fileBaseName);
          }
        }
      }
      videoFiles.sort();
      for (let i = 0; i < videoFiles.length; i += 1) {
        videoFiles[i] = path.join(dirPath, videoFiles[i]);
      }

      return videoFiles;
    },
    findSubtitleFilesByVidPath(vidPath, callback) {
      if (process.platform === 'win32') {
        vidPath = vidPath.replace(/^file:\/\/\//, '');
      } else {
        vidPath = vidPath.replace(/^file:\/\//, '');
      }

      const baseName = path.basename(vidPath, path.extname(vidPath));
      const dirPath = path.dirname(vidPath);
      const filter = /\.(srt|vtt|ass)$/;

      if (!fs.existsSync(dirPath)) {
        this.addLog('error', `no dir ${dirPath}`);
        return;
      }

      const files = fs.readdirSync(dirPath);
      for (let i = 0; i < files.length; i += 1) {
        const filename = path.join(dirPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (!stat.isDirectory()) {
          if (files[i].startsWith(baseName) && filter.test(files[i])) {
            this.addLog('info', `found subtitle file: ${files[i]}`);
            callback(filename);
          }
        }
      }
    },
    openFile(path) {
      const originPath = path;
      this.mediaQuickHash(originPath, (err, mediaQuickHash) => {
        if (err instanceof Error) {
          if (err.code === 'ENOENT') {
            this.addLog('error', `Failed to open file : ${path}`);
          }
        } else {
          this.infoDB().get('recent-played', mediaQuickHash)
            .then((value) => {
              if (value) {
                this.$bus.$emit('send-lastplayedtime', value.lastPlayedTime);
                this.infoDB().add('recent-played', Object.assign(value, { path: originPath, lastOpened: Date.now() }));
              } else {
                this.infoDB().add('recent-played', {
                  quickHash: mediaQuickHash,
                  path: originPath,
                  lastOpened: Date.now(),
                });
              }
              this.$bus.$emit('new-file-open');
            });
          this.$store.dispatch('SRC_SET', originPath);
          this.$bus.$emit('new-video-opened');
          this.$router.push({
            name: 'playing-view',
          });
        }
      });
    },
    mediaQuickHash(filePath, cb) {
      function md5Hex(text) {
        return crypto.createHash('md5').update(text).digest('hex');
      }
      let fd;
      try {
        fd = fs.openSync(filePath, 'r');
      } catch (error) {
        return cb(error);
      }
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
      return cb(undefined, res.join('-'));
    },
    addLog(level, log) {
      switch (level) {
        case 'error':
          console.error(log);
          if (this.$ga && log) {
            this.$ga.exception(log.message || log);
          }
          break;
        case 'warn':
          console.warn(log);
          break;
        default:
          console.log(log);
      }

      let normalizedLog;
      if (!log || typeof log === 'string') {
        normalizedLog = { message: log };
      } else {
        const { message, stack } = log;
        normalizedLog = { message, stack };
      }
      ipcRenderer.send('writeLog', level, normalizedLog);
    },
  },
};
