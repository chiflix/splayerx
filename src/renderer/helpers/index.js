import path from 'path';
import fs, { promises as fsPromises } from 'fs';
import crypto from 'crypto';
import lolex from 'lolex';
import { times, get } from 'lodash';
import bookmark from '@/helpers/bookmark';
import syncStorage from '@/helpers/syncStorage';
import infoDB from '@/helpers/infoDB';
import { log } from '@/libs/Log';
import { getValidVideoExtensions, getValidVideoRegex } from '@/../shared/utils';
import {
  EMPTY_FOLDER, OPEN_FAILED, ADD_NO_VIDEO,
  SNAPSHOT_FAILED, SNAPSHOT_SUCCESS, FILE_NON_EXIST_IN_PLAYLIST, PLAYLIST_NON_EXIST,
} from '@/../shared/notificationcodes';
import Sagi from '@/libs/sagi';
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
        if (process.mas && get(bookmarks, 'length') > 0) {
          // TODO: put bookmarks to database
          bookmark.resolveBookmarks(files, bookmarks);
        }
        if (files) {
          this.$store.commit('source', '');
          // if selected files contain folders only, then call openFolder()
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
        if (process.mas && get(bookmarks, 'length') > 0) {
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
        if (process.mas && get(bookmarks, 'length') > 0) {
          // TODO: put bookmarks to database
          bookmark.resolveBookmarks(files, bookmarks);
        }
      });
    },
    async addFiles(...files) { // eslint-disable-line complexity
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
        const addFiles = videoFiles.filter(file => !this.$store.getters.playingList.includes(file));
        const playlist = await this.infoDB.get('recent-played', this.playListId);
        const addIds = [];
        for (const videoPath of addFiles) {
          const quickHash = await this.mediaQuickHash(videoPath);
          const data = {
            quickHash,
            type: 'video',
            path: videoPath,
            source: 'playlist',
          };
          const videoId = await this.infoDB.add('media-item', data);
          addIds.push(videoId);
          playlist.items.push(videoId);
          playlist.hpaths.push(`${quickHash}-${videoPath}`);
        }
        this.$store.dispatch('AddItemsToPlayingList', {
          paths: addFiles,
          ids: addIds,
        });
        this.infoDB.update('recent-played', playlist, playlist.id);
        this.$store.dispatch('PlayingList', { id: playlist.id });
      } else {
        log.error('helpers/index.js', 'Didn\'t add any playable file in this folder.');
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
        this.createPlayList(...videoFiles);
      } else {
        // TODO: no videoFiles in folders error catch
        log.error('helpers/index.js', 'There is no playable file in this folder.');
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
          log.error('helpers/index.js', `Failed to open file : ${tempFilePath}`);
          addBubble(OPEN_FAILED, this.$i18n);
        }
      }
      if (videoFiles.length > 1) {
        this.createPlayList(...videoFiles);
      } else if (videoFiles.length === 1) {
        this.openVideoFile(...videoFiles);
      }
      if (containsSubFiles) {
        this.$bus.$emit('add-subtitles', subtitleFiles);
      }
    },
    // open an existed play list
    async openPlayList(id) {
      const playlist = await this.infoDB.get('recent-played', id);
      await this.infoDB.update('recent-played', { ...playlist, lastOpened: Date.now() }, playlist.id);
      if (playlist.items.length > 1) {
        let currentVideo = await this.infoDB.get('media-item', playlist.items[playlist.playedIndex]);

        const deleteItems = [];
        for (const item of playlist.items) {
          const video = await this.infoDB.get('media-item', item);
          try {
            await fsPromises.access(video.path, fs.constants.F_OK);
          } catch (err) {
            deleteItems.push(item);
            this.infoDB.delete('media-item', video.videoId);
          }
        }
        if (deleteItems.length > 0) {
          deleteItems.forEach((id) => {
            const index = playlist.items.findIndex(videoId => videoId === id);
            playlist.items.splice(index, 1);
          });
          if (playlist.items.length > 0) {
            playlist.playedIndex = 0;
            await this.infoDB.update('recent-played', playlist, playlist.id);
            currentVideo = await this.infoDB.get('media-item', playlist.items[0]);
            addBubble(FILE_NON_EXIST_IN_PLAYLIST, this.$i18n);
          } else {
            this.infoDB.delete('recent-played', playlist.id);
            addBubble(PLAYLIST_NON_EXIST, this.$i18n);
            this.$bus.$emit('delete-file', id);
            return;
          }
        }

        await this.playFile(currentVideo.path, currentVideo.videoId);
        let paths = [];
        for (const videoId of playlist.items) {
          const mediaItem = await this.infoDB.get('media-item', videoId);
          paths.push(mediaItem.path);
        }
        this.$store.dispatch('PlayingList', {
          id,
          paths,
          items: playlist.items,
        });
      } else {
        const video = await this.infoDB.get('media-item', playlist.items[playlist.playedIndex]);
        try {
          await fsPromises.access(video.path, fs.constants.F_OK);
          this.playFile(video.path, video.videoId);
          let similarVideos;
          try {
            similarVideos = await this.findSimilarVideoByVidPath(video.path);
            this.$store.dispatch('FolderList', {
              id,
              paths: similarVideos,
            });
          } catch (err) {
            if (process.mas && get(err, 'code') === 'EPERM') {
              // TODO: maybe this.openFolderByDialog(videoFiles[0]) ?
              this.$store.dispatch('FolderList', {
                id,
                paths: [video.path],
                items: [playlist.items[0]],
              });
            }
          }
        } catch (err) {
          this.infoDB.delete('recent-played', id);
          addBubble(PLAYLIST_NON_EXIST, this.$i18n);
          this.$bus.$emit('delete-file', id);
        }
      }
    },
    // create new play list record in recent-played and play the video
    async createPlayList(...videoFiles) {
      const hash = await this.mediaQuickHash(videoFiles[0]);
      const id = await this.infoDB.addPlaylist(videoFiles);
      const playlistItem = await this.infoDB.get('recent-played', id);
      this.$store.dispatch('PlayingList', { id, paths: videoFiles, items: playlistItem.items });

      const videoId = playlistItem.items[playlistItem.playedIndex];
      this.$store.dispatch('SRC_SET', { src: videoFiles[0], id: videoId, mediaHash: hash });
      this.$router.push({ name: 'playing-view' });
      this.$bus.$emit('new-file-open');
      this.$bus.$emit('open-playlist');
    },
    // open single video
    async openVideoFile(videoFile) {
      const id = await this.infoDB.addPlaylist([videoFile]);
      const playlistItem = await this.infoDB.get('recent-played', id);
      this.playFile(videoFile, playlistItem.items[playlistItem.playedIndex]);
      let similarVideos;
      try {
        similarVideos = await this.findSimilarVideoByVidPath(videoFile);
        this.$store.dispatch('FolderList', {
          id,
          paths: similarVideos,
        });
      } catch (err) {
        if (process.mas && get(err, 'code') === 'EPERM') {
          // TODO: maybe this.openFolderByDialog(videoFiles[0]) ?
          this.$store.dispatch('FolderList', {
            id,
            paths: [videoFile],
            items: [playlistItem.items[0]],
          });
        }
      }
    },
    bookmarkAccessing(vidPath) {
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
          get(this.access.find(item => item.src === e), 'stopAccessing')();
          const index = this.access.findIndex(item => item.src === e);
          if (index >= 0) this.access.splice(index, 1);
        });
      }
    },
    // openFile and db operation
    async playFile(vidPath, id) {
      let mediaQuickHash;
      if (process.mas && this.$store.getters.source !== 'drop') this.bookmarkAccessing(vidPath);
      try {
        mediaQuickHash = await this.mediaQuickHash(vidPath);
      } catch (err) {
        if (get(err, 'code') === 'ENOENT') {
          log.error('helpers/index.js', 'Failed to open file, it will be removed from list.');
          addBubble(FILE_NON_EXIST_IN_PLAYLIST, this.$i18n);
          this.$bus.$emit('delete-file', vidPath, id);
        }
        if (process.mas && get(err, 'code') === 'EPERM') {
          this.openFilesByDialog({ defaultPath: vidPath });
        }
        return;
      }
      this.$store.dispatch('SRC_SET', { src: vidPath, mediaHash: mediaQuickHash, id });
      this.$router.push({ name: 'playing-view' });

      if (id) {
        const value = await this.infoDB.get('media-item', id);
        this.$bus.$emit('new-file-open');
        if (value.lastPlayedTime) {
          this.$bus.$emit('send-lastplayedtime', value.lastPlayedTime);
        }
        if (value.audioTrackId) {
          this.$bus.$emit('send-audiotrackid', value.audioTrackId);
        }
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
