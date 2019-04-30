import path from 'path';
import fs, { promises as fsPromises } from 'fs';
import crypto from 'crypto';
import lolex from 'lolex';
import { times } from 'lodash';
import bookmark from '@/helpers/bookmark';
import syncStorage from '@/helpers/syncStorage';
import infoDB from '@/helpers/infoDB';
import { getValidVideoExtensions, getValidVideoRegex } from '@/../shared/utils';
import { FILE_NON_EXIST, EMPTY_FOLDER, OPEN_FAILED, ADD_NO_VIDEO, SNAPSHOT_FAILED, SNAPSHOT_SUCCESS } from '@/../shared/notificationcodes';
import Sentry from '@/../shared/sentry';
import Sagi from './sagi';
import { addBubble } from '../../shared/notificationControl';

import { ipcRenderer, remote } from 'electron'; // eslint-disable-line

const clock = lolex.createClock();

export default {
  data() {
    return {
      clock,
      infoDB,
      sagi: Sagi,
      showingPopupDialog: false,
      access: [],
    };
  },
  methods: {
    calculateWindowSize(minSize, maxSize, videoSize, videoExisted, screenSize) {
      let result = videoSize;
      const getRatio = size => size[0] / size[1];
      const setWidthByHeight = size => [size[1] * getRatio(videoSize), size[1]];
      const setHeightByWidth = size => [size[0], size[0] / getRatio(videoSize)];
      const biggerSize = (size, diffedSize) =>
        size.some((value, index) => value >= diffedSize[index]);
      const biggerWidth = (size, diffedSize) => size[0] >= diffedSize[0];
      const biggerRatio = (size1, size2) => getRatio(size1) > getRatio(size2);
      if (videoExisted && biggerWidth(result, maxSize)) {
        result = setHeightByWidth(maxSize);
      }
      const realMaxSize = videoExisted ? screenSize : maxSize;
      if (biggerSize(result, realMaxSize)) {
        result = biggerRatio(result, realMaxSize) ?
          setHeightByWidth(realMaxSize) : setWidthByHeight(realMaxSize);
      }
      if (biggerSize(minSize, result)) {
        result = biggerRatio(minSize, result) ?
          setHeightByWidth(minSize) : setWidthByHeight(minSize);
      }
      return result.map(Math.round);
    },
    calculateWindowPosition(currentRect, windowRect, newSize) {
      const tempRect = currentRect.slice(0, 2)
        .map((value, index) => Math.floor(value + (currentRect.slice(2, 4)[index] / 2)))
        .map((value, index) => Math.floor(value - (newSize[index] / 2))).concat(newSize);
      return ((windowRect, tempRect) => {
        const alterPos = (boundX, boundLength, videoX, videoLength) => {
          if (videoX < boundX) return boundX;
          if (videoX + videoLength > boundX + boundLength) {
            return (boundX + boundLength) - videoLength;
          }
          return videoX;
        };
        return [
          alterPos(windowRect[0], windowRect[2], tempRect[0], tempRect[2]),
          alterPos(windowRect[1], windowRect[3], tempRect[1], tempRect[3]),
        ];
      })(windowRect, tempRect);
    },
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
          const fileBaseName = path.basename(filename);
          if (!stat.isDirectory() && !fileBaseName.startsWith('.')) {
            if (getValidVideoRegex().test(path.extname(fileBaseName))) {
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
          bookmark.resolveBookmarks(files, bookmarks);
        }
        if (files) {
          // if selected files contain folders only, then call openFolder()
          this.$store.commit('source', '');
          const onlyFolders = files.every(file => fs.statSync(file).isDirectory());
          files.forEach(file => remote.app.addRecentDocument(file));
          if (onlyFolders) {
            this.openFolder(...files);
          } else {
            this.openFile(...files);
          }
        }
      });
    },
    addFilesByDialog({ defaultPath } = {}) {
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
          bookmark.resolveBookmarks(files, bookmarks);
        }
        if (files) {
          this.addFiles(...files);
        }
      });
    },
    chooseSnapshotFolder(defaultName, data) {
      if (this.showingPopupDialog) return;
      this.showingPopupDialog = true;
      process.env.NODE_ENV === 'testing' ? '' : remote.dialog.showOpenDialog({
        title: 'Snapshot Save',
        defaultPath: data.defaultFolder ? data.defaultFolder : remote.app.getPath('desktop'),
        filters: [{
          name: 'Snapshot',
        }, {
          name: 'All Files',
        }],
        properties: ['openDirectory'],
        securityScopedBookmarks: process.mas,
      }, (files, bookmarks) => {
        if (files) {
          fs.writeFile(path.join(files[0], data.name), data.buffer, (error) => {
            if (error) {
              addBubble(SNAPSHOT_FAILED, this.$i18n);
            } else {
              this.$store.dispatch('UPDATE_SNAPSHOT_SAVED_PATH', files[0]);
              addBubble(SNAPSHOT_SUCCESS, this.$i18n);
            }
          });
        }
        this.showingPopupDialog = false;
        if (process.mas && bookmarks?.length > 0) {
          // TODO: put bookmarks to database
          bookmark.resolveBookmarks(files, bookmarks);
        }
      });
    },
    addFiles(...files) {
      const videoFiles = [];

      for (let i = 0; i < files.length; i += 1) {
        if (fs.statSync(files[i]).isDirectory()) {
          const dirPath = files[i];
          const dirFiles = fs.readdirSync(dirPath).map(file => path.join(dirPath, file));
          files.push(...dirFiles);
        }
      }

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (!path.basename(file).startsWith('.') && getValidVideoRegex().test(path.extname(file))) {
          videoFiles.push(file);
        }
      }
      if (videoFiles.length !== 0) {
        this.$store.dispatch('AddItemsToPlayingList', videoFiles);
      } else {
        this.addLog('error', {
          errcode: ADD_NO_VIDEO,
          message: 'Didn\'t add any playable file in this folder.',
        });
        addBubble(ADD_NO_VIDEO, this.$i18n);
      }
    },
    // the difference between openFolder and openFile function
    // is the way they treat the situation of empty folders and error files
    openFolder(...folders) {
      const files = [];
      let containsSubFiles = false;
      const subtitleFiles = [];
      const subRegex = new RegExp('^\\.(srt|ass|vtt)$', 'i');
      const videoFiles = [];

      folders.forEach((dirPath) => {
        if (fs.statSync(dirPath).isDirectory()) {
          const dirFiles = fs.readdirSync(dirPath).map(file => path.join(dirPath, file));
          files.push(...dirFiles);
        }
      });

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (!path.basename(file).startsWith('.')) {
          if (subRegex.test(path.extname(file))) {
            subtitleFiles.push({ src: file, type: 'local' });
            containsSubFiles = true;
          } else if (getValidVideoRegex().test(path.extname(file))) {
            videoFiles.push(file);
          }
        }
      }
      if (videoFiles.length !== 0) {
        this.openVideoFile(...videoFiles);
      } else {
        // TODO: no videoFiles in folders error catch
        this.addLog('error', {
          errcode: EMPTY_FOLDER,
          message: 'There is no playable file in this folder.',
        });
        addBubble(EMPTY_FOLDER, this.$i18n);
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
      const subRegex = new RegExp('\\.(srt|ass|vtt)$', 'i');
      const videoFiles = [];

      for (let i = 0; i < files.length; i += 1) {
        if (fs.statSync(files[i]).isDirectory()) {
          const dirPath = files[i];
          const dirFiles = fs.readdirSync(dirPath).map(file => path.join(dirPath, file));
          files.push(...dirFiles);
        }
      }

      for (let i = 0; i < files.length; i += 1) {
        let tempFilePath = files[i];
        let baseName = path.basename(tempFilePath);
        if (baseName.startsWith('.') || fs.statSync(tempFilePath).isDirectory()) {
          continue;
        }
        if (subRegex.test(path.extname(tempFilePath))) {
          subtitleFiles.push({ src: tempFilePath, type: 'local' });
          containsSubFiles = true;
        } else if (getValidVideoRegex().test(path.extname(tempFilePath))) {
          videoFiles.push(tempFilePath);
        } else {
          this.addLog('error', {
            errcode: OPEN_FAILED,
            message: `Failed to open file : ${tempFilePath}`,
          });
          addBubble(OPEN_FAILED, this.$i18n);
        }
      }
      if (videoFiles.length !== 0) {
        this.openVideoFile(...videoFiles);
      }
      if (containsSubFiles) {
        this.$bus.$emit('add-subtitles', subtitleFiles);
      }
    },
    async openPlaylist(playListHash) {
      const value = await this.infoDB.get('recent-played', playListHash);
      if (value.type === 'playlist') {
        this.playFile(value.currentVideo).then(() => {
          this.$bus.$emit('open-playlist');
        });
        this.$store.dispatch('PlayingList', {
          hash: value.quickHash,
          paths: value.paths,
        });
        this.infoDB.add('recent-played', { ...value, lastOpened: Date.now() });
      }
    },
    /* eslint-disable */
    // generate playlist
    openVideoFile(...videoFiles) {
      if (videoFiles.length > 1) {
        const playListHash = videoFiles.reduce((hash, src) => `${hash}-${src}`);
        this.$store.dispatch('PlayingList', {
          hash: playListHash,
          paths: videoFiles,
        });
        let dbPromise;
        if (!process.mas || (process.mas && this.$store.getters.source !== 'drop')) {
          dbPromise = this.infoDB.add('recent-played', {
            quickHash: playListHash,
            currentVideo: videoFiles[0],
            type: 'playlist',
            paths: videoFiles,
            lastOpened: Date.now(),
          });
        }
        if (dbPromise) {
          dbPromise.then(() => {
            this.playFile(videoFiles[0]);
          });
        } else {
          this.playFile(videoFiles[0]);
        }
      } else {
        this.playFile(videoFiles[0]);
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
      if (process.mas) {
        const bookmarkObj = syncStorage.getSync('bookmark');
        if (bookmarkObj.hasOwnProperty(vidPath)) {
          const { app } = remote;
          const bookmark = bookmarkObj[vidPath];
          const stopAccessing = app.startAccessingSecurityScopedResource(bookmark);
          this.access.push({
            src: vidPath,
            stopAccessing
          });
          this.$bus.$once(`stop-accessing-${vidPath}`, (e) => {
            this.access.find(item => item.src === e)?.stopAccessing();
            const index = this.access.findIndex(item => item.src === e);
            if (index >= 0) this.access.splice(index, 1);
          });
        }
      }
      try {
        mediaQuickHash = await this.mediaQuickHash(originPath);
      } catch (err) {
        if (err?.code === 'ENOENT') {
          this.addLog('error', {
            errcode: FILE_NON_EXIST,
            message: 'Failed to open file, it will be removed from list.'
          });
          addBubble(FILE_NON_EXIST, this.$i18n);
          this.$bus.$emit('file-not-existed', originPath);
        }
        if (process.mas && err?.code === 'EPERM') {
          this.openFilesByDialog({ defaultPath: originPath });
        }

        return;
      }
      this.$router.push({ name: 'playing-view' });

      if (this.$store.getters.isFolderList) {
        const value = await this.infoDB.get('recent-played', mediaQuickHash);
        if (value) {
          this.$bus.$emit('send-lastplayedtime', value.lastPlayedTime);
          await this.infoDB.add('recent-played', { ...value, path: originPath, lastOpened: Date.now() });
        } else {
          await this.infoDB.add('recent-played', {
            quickHash: mediaQuickHash,
            path: originPath,
            lastOpened: Date.now(),
          });
        }
      } else if (!process.mas || (process.mas && this.$store.getters.source !== 'drop')) {
        let playlist = await this.infoDB.get('recent-played', this.$store.getters.playListHash);
        if (!playlist) {
          const playListHash = this.$store.getters.playingList.reduce((hash, src) => `${hash}-${src}`);
          playlist = {
            quickHash: playListHash,
            currentVideo: vidPath,
            paths: this.$store.getters.playingList,
            type: 'playlist',
            lastOpened: Date.now(),
            infos: [{
              quickHash: mediaQuickHash,
              path: originPath,
            }],
          };
          this.$store.commit('hash', playListHash);
        } else if (!playlist.infos) {
          playlist.infos = [{
            quickHash: mediaQuickHash,
            path: originPath,
          }];
        } else {
          const videoInfo = playlist.infos.find(info => info.path === originPath);
          if (videoInfo) {
            this.$bus.$emit('send-lastplayedtime', videoInfo.lastPlayedTime);
            const videoIndex = playlist.infos?.findIndex(info => info.path === originPath);
            playlist.infos.splice(videoIndex, 1, { ...videoInfo, path: originPath, quickHash: mediaQuickHash });
          } else {
            playlist.infos.push({
              quickHash: mediaQuickHash,
              path: originPath,
            });
          }
        }
        await this.infoDB.add('recent-played', playlist);
      }
      this.$bus.$emit('new-file-open');
      this.$store.dispatch('SRC_SET', { src: originPath, mediaHash: mediaQuickHash });
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
          if (log && process.env.NODE_ENV !== 'development') {
            this.$ga && this.$ga.exception(log.message || log);
            Sentry.captureException(log);
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
        const { errcode, code, message, stack } = log;
        normalizedLog = { errcode, code, message, stack };
      }
      ipcRenderer.send('writeLog', level, normalizedLog);
    },
    getTextWidth(fontSize, fontFamily, text) {
      const span = document.createElement('span');
      let result = span.offsetWidth;
      span.style.visibility = 'hidden';
      span.style.fontSize = fontSize;
      span.style.fontFamily = fontFamily;
      span.style.display = 'inline-block';
      span.style.fontWeight = '700';
      span.style.letterSpacing = '0.2px';
      document.body.appendChild(span);
      if (typeof span.textContent !== 'undefined') {
        span.textContent = text;
      } else {
        span.innerText = text;
      }
      result = parseFloat(window.getComputedStyle(span).width) - result;
      span.parentNode.removeChild(span);
      return result;
    },
  },
};
