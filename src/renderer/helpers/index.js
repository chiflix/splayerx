import path from 'path';
import fs, { promises as fsPromises } from 'fs';
import crypto from 'crypto';
import lolex from 'lolex';
import { times } from 'lodash';
import InfoDB from '@/helpers/infoDB';
import { getValidVideoExtensions, getValidVideoRegex } from '@/../shared/utils';
import Sagi from './sagi';

import { ipcRenderer, remote } from 'electron'; // eslint-disable-line

const clock = lolex.createClock();
const infoDB = new InfoDB();

export default {
  data() {
    return { clock, infoDB, sagi: Sagi };
  },
  methods: {
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
    async findSimilarVideoByVidPath(vidPath) {
      vidPath = decodeURI(vidPath);

      if (process.platform === 'win32') {
        vidPath = vidPath.replace(/^file:\/\/\//, '');
      } else {
        vidPath = vidPath.replace(/^file:\/\//, '');
      }

      const dirPath = path.dirname(vidPath);

      const videoFiles = [];
      const files = await fsPromises.readdir(dirPath);
      const tasks = [];
      for (let i = 0; i < files.length; i += 1) {
        const filename = path.join(dirPath, files[i]);
        tasks.push(fsPromises.lstat(filename).then((stat) => {
          if (!stat.isDirectory()) {
            if (getValidVideoRegex().test(path.extname(files[i]))) {
              const fileBaseName = path.basename(filename);
              videoFiles.push(fileBaseName);
            }
          }
        }));
      }
      await Promise.all(tasks);
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
    openFilesByDialog({ defaultPath } = {}) {
      if (this.showingPopupDialog) return;
      this.showingPopupDialog = true;
      const opts = ['openFile', 'multiSelections'];
      if (process.platform === 'darwin') {
        opts.push('openDirectory');
      }
      process.env.NODE_ENV === 'testing' ? '' : remote.dialog.showOpenDialog({
        title: 'Open Dialog',
        defaultPath,
        filters: [{
          name: 'Video Files',
          extensions: getValidVideoExtensions(),
        }, {
          name: 'All Files',
          extensions: ['*'],
        }],
        properties: opts,
        securityScopedBookmarks: process.mas,
      }, (files, bookmarks) => {
        this.showingPopupDialog = false;
        if (process.mas && bookmarks?.length > 0) {
          // TODO: put bookmarks to database
          console.log(bookmarks);
        }
        if (files) {
          // if selected files just contain folders, then call openFolder()
          let onlyFolders = false;
          for (let i = 0; i < files.length; i += 1) {
            const file = files[i];
            if (fs.statSync(file).isDirectory()) {
              onlyFolders = true;
            } else if (onlyFolders === true) {
              // if seleted files is a combination of files and folders, then call openFile()
              onlyFolders = false;
              break;
            }
          }
          if (onlyFolders) {
            this.openFolder(...files);
          } else {
            this.openFile(...files);
          }
        }
      });
    },
    openFolder(...folders) {
      const files = [];
      let containsSubFiles = false;
      const subtitleFiles = [];
      const subRegex = new RegExp('^\\.(srt|ass|vtt)$');
      const videoFiles = [];

      folders.forEach((dirPath) => {
        if (fs.statSync(dirPath).isDirectory()) {
          const dirFiles = fs.readdirSync(dirPath).map(file => path.join(dirPath, file));
          files.push(...dirFiles);
        }
      });

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (subRegex.test(path.extname(file))) {
          subtitleFiles.push({ src: file, type: 'local' });
          containsSubFiles = true;
        } else if (getValidVideoRegex().test(path.extname(file))) {
          videoFiles.push(file);
        }
      }
      if (videoFiles.length !== 0) {
        if (!videoFiles[0].includes('\\') || process.platform === 'win32') {
          this.openVideoFile(...videoFiles);
        }
      } else {
        // TODO: no videoFiles in folders error catch
        // this.addLog('error', `Failed to open file : ${videoFiles[0]}`);
      }
      if (containsSubFiles) {
        this.$bus.$emit('add-subtitles', subtitleFiles);
      }
    },
    /* eslint-disable */
    // filter video and sub files
    openFile(...files) {
      let containsSubFiles = false;
      const subtitleFiles = [];
      const subRegex = new RegExp('^\\.(srt|ass|vtt)$');
      const videoFiles = [];
      const dirFiles = files;

      for (let i = 0; i < dirFiles.length; i += 1) {
        if (fs.statSync(dirFiles[i]).isDirectory()) {
          const dirPath = dirFiles[i];
          const files = fs.readdirSync(dirPath);
          for (let i = 0; i < files.length; i += 1) {
            files[i] = path.join(dirPath, files[i]);
          }
          dirFiles.push(...files);
        }
      }

      for (let i = 0; i < files.length; i += 1) {
        let tempFilePath = files[i];
        if (subRegex.test(path.extname(tempFilePath))) {
          subtitleFiles.push({ src: tempFilePath, type: 'local' });
          containsSubFiles = true;
        } else if (getValidVideoRegex().test(path.extname(tempFilePath))) {
          videoFiles.push(tempFilePath);
        } else {
          this.addLog('error', `Failed to open file : ${tempFilePath}`);
        }
      }
      if (videoFiles.length !== 0) {
        this.openVideoFile(...videoFiles);
      }
      if (containsSubFiles) {
        this.$bus.$emit('add-subtitles', subtitleFiles);
      }
    },
    /* eslint-disable */
    // generate playlist
    openVideoFile(...videoFiles) {
      this.playFile(videoFiles[0]);
      if (videoFiles.length > 1) {
        this.$store.dispatch('PlayingList', videoFiles);
      } else {
        this.findSimilarVideoByVidPath(videoFiles[0]).then((similarVideos) => {
          this.$store.dispatch('FolderList', similarVideos);
        }, (err) => {
          if (process.mas && err?.code === 'EPERM') {
            // TODO: maybe this.openFolderByDialog(videoFiles[0]) ?
            this.$store.dispatch('FolderList', [videoFiles[0]]);
          }
        });
      }
    },
    // openFile and db operation
    async playFile(vidPath) {
      const originPath = vidPath;
      let mediaQuickHash;
      try {
        mediaQuickHash = await this.mediaQuickHash(originPath);
      } catch (err) {
        if (err?.code === 'ENOENT') {
          this.addLog('error', 'Failed to open file, it will be removed from list.');
          this.$bus.$emit('file-not-existed', originPath);
        }
        if (process.mas && err?.code === 'EPERM') {
          this.openFilesByDialog({ defaultPath: originPath });
        }

        return;
      }
      this.$bus.$emit('new-file-open');
      this.$store.dispatch('SRC_SET', { src: originPath, mediaHash: mediaQuickHash });
      remote.app.addRecentDocument(originPath);
      this.$bus.$emit('new-video-opened');
      this.$router.push({
        name: 'playing-view',
      });
      const value = await this.infoDB.get('recent-played', mediaQuickHash);
      if (value) {
        this.$bus.$emit('send-lastplayedtime', value.lastPlayedTime);
        this.infoDB.add('recent-played', Object.assign(value, { path: originPath, lastOpened: Date.now() }));
      } else {
        this.infoDB.add('recent-played', {
          quickHash: mediaQuickHash,
          path: originPath,
          lastOpened: Date.now(),
        });
      }
    },
    async mediaQuickHash(filePath) {
      function md5Hex(text) {
        return crypto.createHash('md5').update(text).digest('hex');
      }
      const fileHandler = await fsPromises.open(filePath, 'r');
      const len = (await fsPromises.stat(filePath)).size;
      const position = [
        4096,
        Math.floor(len / 3),
        Math.floor(len / 3) * 2,
        len - 8192,
      ];
      const res = await Promise.all(times(4).map(async (i) => {
        const buf = Buffer.alloc(4096);
        const { bytesRead } = await fileHandler.read(buf, 0, 4096, position[i]);
        return md5Hex(buf.slice(0, bytesRead));
      }));
      fileHandler.close();
      return res.join('-');
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
