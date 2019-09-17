import path from 'path';
import fs, { promises as fsPromises } from 'fs';
import lolex from 'lolex';
import { get } from 'lodash';
import urlParseLax from 'url-parse-lax';
import { mediaQuickHash } from '@/libs/utils';
import bookmark from '@/helpers/bookmark';
import syncStorage from '@/helpers/syncStorage';
import infoDB from '@/helpers/infoDB';
import { log } from '@/libs/Log';
import { getValidSubtitleRegex, getValidVideoExtensions, getValidVideoRegex } from '@/../shared/utils';
import {
  Video as videoActions,
  AudioTranslate as atActions,
} from '@/store/actionTypes';
import { videodata } from '@/store/video';
import { AudioTranslateBubbleOrigin } from '@/store/modules/AudioTranslate';
import {
  EMPTY_FOLDER, OPEN_FAILED, ADD_NO_VIDEO,
  SNAPSHOT_FAILED, SNAPSHOT_SUCCESS, FILE_NON_EXIST_IN_PLAYLIST, PLAYLIST_NON_EXIST,
} from '@/helpers/notificationcodes';
import { addBubble } from './notificationControl';

import { ipcRenderer, remote } from 'electron'; // eslint-disable-line
import sortVideoFile from '@/helpers/sort';

const clock = lolex.createClock();

export default {
  data() {
    return {
      clock,
      infoDB,
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
        }, (ex) => {
          log.warn('findSimilarVideoByVidPath', ex);
        }));
      }
      await Promise.all(tasks);
      videoFiles.sort();
      videoFiles.sort(sortVideoFile);
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
              addBubble(SNAPSHOT_FAILED);
            } else {
              this.$store.dispatch('UPDATE_SNAPSHOT_SAVED_PATH', files[0]);
              addBubble(SNAPSHOT_SUCCESS);
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
          const quickHash = await mediaQuickHash.try(videoPath);
          if (quickHash) {
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
        }
        this.$store.dispatch('AddItemsToPlayingList', {
          paths: addFiles,
          ids: addIds,
        });
        this.infoDB.update('recent-played', playlist, playlist.id);
        this.$store.dispatch('PlayingList', { id: playlist.id });
      } else {
        log.error('helpers/index.js', 'Didn\'t add any playable file in this folder.');
        addBubble(ADD_NO_VIDEO);
      }
    },
    // the difference between openFolder and openFile function
    // is the way they treat the situation of empty folders and error files
    async openFolder(...folders) {
      const files = [];
      let containsSubFiles = false;
      const subtitleFiles = [];
      const subRegex = getValidSubtitleRegex();
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
      videoFiles.sort();
      videoFiles.sort(sortVideoFile); 
      if (videoFiles.length !== 0) {
        // 如果有翻译任务就阻止
        if (this.translateFilter(() => { this.createPlayList(...videoFiles); })) {
          return;
        }
        await this.createPlayList(...videoFiles);
      } else {
        log.warn('helpers/index.js', 'There is no playable file in this folder.');
        addBubble(EMPTY_FOLDER);
      }
      if (containsSubFiles) {
        this.$bus.$emit('add-subtitles', subtitleFiles);
      }
    },
    // filter video and sub files
    async openFile(...files) {
      try {
        let containsSubFiles = false;
        const subtitleFiles = [];
        const subRegex = getValidSubtitleRegex();
        const videoFiles = [];

        for (let i = 0; i < files.length; i += 1) {
          if (fs.statSync(files[i]).isDirectory()) {
            const dirPath = files[i];
            const dirFiles = fs.readdirSync(dirPath).map(file => path.join(dirPath, file));
            files.push(...dirFiles);
          }
        }

        files.forEach((tempFilePath) => {
          const baseName = path.basename(tempFilePath);
          if (baseName.startsWith('.') || fs.statSync(tempFilePath).isDirectory()) return;
          if (subRegex.test(path.extname(tempFilePath))) {
            subtitleFiles.push({ src: tempFilePath, type: 'local' });
            containsSubFiles = true;
          } else if (getValidVideoRegex().test(path.extname(tempFilePath))) {
            videoFiles.push(tempFilePath);
          } else {
            log.warn('helpers/index.js', `Failed to open file : ${tempFilePath}`);
            addBubble(OPEN_FAILED);
          }
        });

        if (videoFiles.length > 1) {
          // 如果有翻译任务就阻止
          if (this.translateFilter(() => { this.createPlayList(...videoFiles); })) {
            return;
          }
          await this.createPlayList(...videoFiles);
        } else if (videoFiles.length === 1) {
          // 如果有翻译任务就阻止
          if (this.translateFilter(() => { this.openVideoFile(...videoFiles); })) {
            return;
          }
          await this.openVideoFile(...videoFiles);
        }
        if (containsSubFiles) {
          this.$bus.$emit('add-subtitles', subtitleFiles);
        }
      } catch (ex) {
        log.info('openFile', ex);
        addBubble(OPEN_FAILED);
      }
    },
    // open an existed play list
    async openPlayList(id) {
      const playlist = await this.infoDB.get('recent-played', id);
      if (!playlist) return;
      await this.infoDB.update('recent-played', { ...playlist, lastOpened: Date.now() }, playlist.id);
      if (playlist.items.length > 1) {
        let currentVideo = await this.infoDB.get('media-item', playlist.items[playlist.playedIndex]);

        const deleteItems = [];
        await Promise.all(playlist.items.map(async (item) => {
          const video = await this.infoDB.get('media-item', item);
          try {
            await fsPromises.access(video.path, fs.constants.F_OK);
          } catch (err) {
            deleteItems.push(item);
            // this.infoDB.delete('media-item', video.videoId);
          }
        }));
        if (deleteItems.length > 0) {
          deleteItems.forEach((id) => {
            const index = playlist.items.findIndex(videoId => videoId === id);
            playlist.items.splice(index, 1);
          });
          if (playlist.items.length > 0) {
            playlist.playedIndex = 0;
            await this.infoDB.update('recent-played', playlist, playlist.id);
            currentVideo = await this.infoDB.get('media-item', playlist.items[0]);
            addBubble(FILE_NON_EXIST_IN_PLAYLIST);
          } else {
            addBubble(PLAYLIST_NON_EXIST);
            return;
          }
        }

        await this.playFile(currentVideo.path, currentVideo.videoId);
        const paths = [];
        for (const videoId of playlist.items) {
          // TODO: find out why videoId is undefined
          if (!videoId) continue; // eslint-disable-line
          const mediaItem = await this.infoDB.get('media-item', videoId);
          paths.push(mediaItem.path);
        }
        this.$store.dispatch('PlayingList', {
          id,
          paths,
          items: playlist.items,
        });
        this.$bus.$emit('open-playlist');
      } else {
        const video = await this.infoDB.get('media-item', playlist.items[playlist.playedIndex]);
        try {
          await fsPromises.access(video.path, fs.constants.F_OK);
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
          this.playFile(video.path, video.videoId);
        } catch (err) {
          addBubble(PLAYLIST_NON_EXIST);
        }
      }
    },
    // create new play list record in recent-played and play the video
    async createPlayList(...videoFiles) {
      const hash = await mediaQuickHash.try(videoFiles[0]);
      if (!hash) return;
      const id = await this.infoDB.addPlaylist(videoFiles);
      const playlistItem = await this.infoDB.get('recent-played', id);
      this.$store.dispatch('PlayingList', { id, paths: videoFiles, items: playlistItem.items });

      const videoId = playlistItem.items[playlistItem.playedIndex];
      this.$store.dispatch('SRC_SET', { src: videoFiles[0], id: videoId, mediaHash: hash });
      if (this.$router.currentRoute.name !== 'playing-view') {
        this.$router.push({ name: 'playing-view' });
      }
      this.$bus.$emit('new-file-open');
      this.$bus.$emit('open-playlist');
    },
    async openUrlFile(url) {
      const id = await this.infoDB.addPlaylist([url]);
      const playlistItem = await this.infoDB.get('recent-played', id);
      this.playFile(url, playlistItem.items[playlistItem.playedIndex]);
      this.$store.dispatch('FolderList', {
        id,
        paths: [url],
        items: [id],
      });
    },
    // open single video
    async openVideoFile(videoFile) {
      if (!videoFile) return;
      // 如果有翻译任务就阻止
      if (this.translateFilter(() => {
        this.openVideoFile(videoFile);
      })) return;
      let id;
      let playlist;
      const quickHash = await mediaQuickHash.try(videoFile);
      playlist = await this.infoDB.get('recent-played', 'hpaths', [`${quickHash}-${videoFile}`]);
      if (quickHash && playlist) {
        id = playlist.id;
        playlist.lastOpened = Date.now();
        this.infoDB.update('recent-played', playlist, playlist.id);
      } else if (quickHash) {
        playlist = {
          items: [],
          hpaths: [],
          playedIndex: 0,
          lastOpened: Date.now(),
        };
        const data = {
          quickHash,
          type: 'video',
          path: videoFile,
          source: '',
        };
        const videoId = await this.infoDB.add('media-item', data);
        playlist.items.push(videoId);
        playlist.hpaths.push(`${quickHash}-${videoFile}`);
        id = await this.infoDB.add('recent-played', playlist);
      }

      try {
        const similarVideos = await this.findSimilarVideoByVidPath(videoFile);
        this.$store.dispatch('FolderList', {
          id,
          paths: similarVideos,
        });
      } catch (err) {
        if (process.mas && get(err, 'code') === 'EPERM') {
          // TODO: maybe this.openFolderByDialog(videoFiles[0]) ?
          const items = playlist ? playlist.items.slice(0, 1) : [];
          this.$store.dispatch('FolderList', {
            id,
            paths: [videoFile],
            items,
          });
        }
      }
      this.playFile(videoFile, playlist.items[0]);
    },
    bookmarkAccessing(vidPath) {
      const bookmarkObj = syncStorage.getSync('bookmark');
      if (Object.prototype.hasOwnProperty.call(bookmarkObj, vidPath)) {
        const { app } = remote;
        const bookmark = bookmarkObj[vidPath];
        let stopAccessing;
        try {
          stopAccessing = app.startAccessingSecurityScopedResource(bookmark);
        } catch (ex) {
          log.warn(`startAccessingSecurityScopedResource ${bookmark}`, ex);
          addBubble(OPEN_FAILED);
          return false;
        }
        this.access.push({
          src: vidPath,
          stopAccessing,
        });
        this.$bus.$once(`stop-accessing-${vidPath}`, (e) => {
          get(this.access.find(item => item.src === e), 'stopAccessing')();
          const index = this.access.findIndex(item => item.src === e);
          if (index >= 0) this.access.splice(index, 1);
        });
      }
      return true;
    },
    // openFile and db operation
    async playFile(vidPath, id) { // eslint-disable-line complexity
      let mediaHash;
      if (process.mas && this.$store.getters.source !== 'drop') {
        if (!this.bookmarkAccessing(vidPath)) return;
      }
      // 如果有翻译任务就阻止
      if (this.translateFilter(() => {
        this.playFile(vidPath, id);
      })) return;
      try {
        mediaHash = await mediaQuickHash(vidPath);
      } catch (err) {
        const errorCode = get(err, 'code');
        if (errorCode === 'ENOENT') {
          log.warn('helpers/index.js', 'Failed to open file, it will be removed from list.');
          addBubble(FILE_NON_EXIST_IN_PLAYLIST);
          this.$bus.$emit('delete-file', vidPath, id);
        }
        if (process.mas && errorCode === 'EPERM') {
          this.openFilesByDialog({ defaultPath: vidPath });
        }
        return;
      }
      this.$store.dispatch('SRC_SET', { src: vidPath, mediaHash, id });
      if (this.$router.currentRoute.name !== 'playing-view') {
        this.$router.push({ name: 'playing-view' });
      }
      this.$bus.$emit('new-file-open');
    },
    translateFilter(callback) {
      if (this.$store.getters.isTranslating) {
        // 如果正在进行智能翻译，就阻止切换视频,
        // 并且提示是否终止智能翻译
        if (Math.ceil(videodata.time) === Math.ceil(this.$store.getters.duration)) {
          this.$store.dispatch(atActions.AUDIO_TRANSLATE_SHOW_BUBBLE,
            AudioTranslateBubbleOrigin.NextVideoChange);
          this.$store.dispatch(videoActions.PAUSE_VIDEO);
          this.$store.dispatch(atActions.AUDIO_TRANSLATE_BUBBLE_CALLBACK, () => {
            this.$store.dispatch(videoActions.PLAY_VIDEO);
            callback();
          });
        } else {
          this.$store.dispatch(atActions.AUDIO_TRANSLATE_SHOW_BUBBLE,
            AudioTranslateBubbleOrigin.VideoChange);
          this.$store.dispatch(atActions.AUDIO_TRANSLATE_BUBBLE_CALLBACK, callback);
        }
        return true;
      }
      return false;
    },
    createIcon(iconPath) {
      const { nativeImage } = this.$electron.remote;
      return nativeImage.createFromPath(path.join(__static, iconPath)).resize({
        width: 25,
      });
    },
    openFileByPlayingView(url) {
      const protocol = urlParseLax(url).protocol;
      return !['https:', 'http:'].includes(protocol) || document.createElement('video').canPlayType(`video/${url.slice(url.lastIndexOf('.') + 1, url.length)}`);
    },
  },
};
