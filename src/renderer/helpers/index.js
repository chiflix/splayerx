import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import winston from 'winston';
import InfoDB from '@/helpers/infoDB';
import Sagi from './sagi';

const electron = require('electron');
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

      const baseName = path.basename(vidPath, path.extname(vidPath));
      const dirPath = path.dirname(vidPath);
      const filter = /\.(3g2|3gp|3gp2|3gpp|amv|asf|avi|bik|bin|crf|divx|drc|dv|dvr-ms|evo|f4v|flv|gvi|gxf|iso|m1v|m2v|m2t|m2ts|m4v|mkv|mov|mp2|mp2v|mp4|mp4v|mpe|mpeg|mpeg1|mpeg2|mpeg4|mpg|mpv2|mts|mtv|mxf|mxg|nsv|nuv|ogg|ogm|ogv|ogx|ps|rec|rm|rmvb|rpl|thp|tod|tp|ts|tts|txd|vob|vro|webm|wm|wmv|wtv|xesc)$/;

      if (!fs.existsSync(dirPath)) {
        return [];
      }

      // need more effective algorithm
      function isSimilar(primaryName, secondaryName) {
        // judget if the similarity is more than half of the primaryName's characters
        if (primaryName.length < secondaryName.length / 2) {
          return false;
        }

        let similarPart = 0;
        for (let i = 0; i < primaryName.length; i += 1) {
          if (primaryName.charAt(i) === secondaryName.charAt(i)) {
            similarPart += 1;
          }
        }

        if (similarPart >= primaryName.length / 2 && similarPart >= secondaryName.length / 2) {
          return true;
        }
        return false;
      }

      const similarVideos = [];
      const files = fs.readdirSync(dirPath);
      for (let i = 0; i < files.length; i += 1) {
        const filename = path.join(dirPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (!stat.isDirectory()) {
          if (filter.test(path.extname(files[i]))) {
            const fileBaseName = path.basename(filename, path.extname(files[i]));
            if (isSimilar(baseName, fileBaseName)) {
              similarVideos.push(filename);
            }
          }
        }
      }
      return similarVideos;
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
      this.infoDB().get('recent-played', this.mediaQuickHash(originPath))
        .then((value) => {
          if (value) {
            if (value.duration - value.lastPlayedTime > 10) {
              this.$bus.$emit('seek', value.lastPlayedTime);
            } else {
              this.$bus.$emit('seek', 0);
            }
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
    addLog(level, message) {
      const app = electron.remote.app || electron.app;
      const defaultPath = path.join(app.getPath('userData'), 'logs');
      function fsExistsSync(path) {
        try {
          fs.accessSync(path, fs.F_OK);
        } catch (e) {
          this.addLog('error', e);
          return false;
        }
        return true;
      }
      if (!fsExistsSync(defaultPath)) {
        try {
          fs.mkdirSync(defaultPath);
        } catch (err) {
          this.addLog('error', err);
        }
      }
      const date = new Date();
      const time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const logger = winston.createLogger({
        format: winston.format.combine(winston.format.printf((info) => {
          if (info.stack) {
            return `${info.time} - ${info.level}: ${info.message}-${info.stack}`;
          }
          return `${info.time} - ${info.level}: ${info.message}`;
        })),
        transports: [
          new winston.transports.File({ filename: `${defaultPath}/${time}.log` }),
        ],
      });
      if (message.stack) {
        logger.log({
          time: new Date().toISOString(),
          level,
          message: message.message,
          stack: message.stack,
        });
      } else {
        logger.log({
          time: new Date().toISOString(),
          level,
          message,
        });
        if (message.includes('Failed to open file')) {
          this.$store.dispatch('addMessages', {
            type: 'error', title: this.$t('errorFile.title'), content: this.$t('errorFile.content'), dismissAfter: 10000,
          });
        }
      }
    },
  },
};
