<template>
  <div
    class="video"
  >
    <transition
      name="fade"
      mode="out-in"
    >
      <base-video-player
        ref="videoCanvas"
        :key="videoId"
        :needtimeupdate="true"
        :last-audio-track-id="lastAudioTrackId"
        :events="['loadedmetadata', 'audiotrack']"
        :styles="{objectFit: 'contain', width: 'calc(100% - 0.1px)', height: '100%'}"
        :loop="loop"
        :src="convertedSrc"
        :playback-rate="rate"
        :volume="volume"
        :muted="muted"
        :paused="paused"
        :current-time="seekTime"
        :current-audio-track-id="currentAudioTrackId.toString()"
        @loadedmetadata="onMetaLoaded"
        @audiotrack="onAudioTrack"
      />
      <!-- calc(100% - 0.1px) fix for mac book pro 15 full screen after
      video controller fade-out video will shake -->
    </transition>
    <div
      class="mask"
      :style="{
        backgroundColor: maskBackground
      }"
    />
    <canvas
      ref="thumbnailCanvas"
      class="canvas"
    />
  </div>
</template>;

<script>
import asyncStorage from '@/helpers/asyncStorage';
import { mapGetters, mapActions } from 'vuex';
import path from 'path';
import { Video as videoActions } from '@/store/actionTypes';
import BaseVideoPlayer from './BaseVideoPlayer.vue';
import { videodata } from '../../store/video';

export default {
  name: 'VideoCanvas',
  components: {
    'base-video-player': BaseVideoPlayer,
  },
  data() {
    return {
      videoExisted: false,
      videoElement: null,
      seekTime: [0],
      lastPlayedTime: 0,
      lastAudioTrackId: 0,
      lastCoverDetectingTime: 0,
      maskBackground: 'rgba(255, 255, 255, 0)', // drag and drop related var
      asyncTasksDone: false, // window should not be closed until asyncTasks Done (only use
      nowRate: 1,
      quit: false,
      needToRestore: false,
      winAngleBeforeFullScreen: 0, // winAngel before full screen
      winSizeBeforeFullScreen: [], // winSize before full screen
    };
  },
  computed: {
    ...mapGetters([
      'videoId', 'nextVideoId', 'originSrc', 'convertedSrc', 'volume', 'muted', 'rate', 'paused', 'duration', 'ratio', 'currentAudioTrackId', 'enabledSecondarySub', 'lastWinSize', 'lastChosenSize', 'subToTop',
      'winSize', 'winPos', 'winAngle', 'isFullScreen', 'winWidth', 'winHeight', 'chosenStyle', 'chosenSize', 'nextVideo', 'loop', 'playinglistRate', 'isFolderList', 'playingList', 'playingIndex', 'playListId', 'items']),
    ...mapGetters({
      videoWidth: 'intrinsicWidth',
      videoHeight: 'intrinsicHeight',
      videoRatio: 'ratio',
    }),
  },
  watch: {
    winAngle(val) {
      this.changeWindowRotate(val);
    },
    videoId(val, oldVal) {
      if (oldVal) this.saveScreenshot(oldVal);
    },
    originSrc(val, oldVal) {
      if (process.mas && oldVal) {
        this.$bus.$emit(`stop-accessing-${oldVal}`, oldVal);
      }
      this.$bus.$emit('show-speedlabel');
      this.videoConfigInitialize({
        audioTrackList: [],
      });
      this.play();
      this.updatePlayinglistRate({
        oldDir: path.dirname(oldVal), newDir: path.dirname(val), playingList: this.playingList,
      });
      this.playinglistRate.forEach((item) => {
        if (item.dirPath === path.dirname(val)) {
          this.$store.dispatch(videoActions.CHANGE_RATE, item.rate);
          this.nowRate = item.rate;
        }
      });
    },
  },
  created() {
    this.updatePlayinglistRate({ oldDir: '', newDir: path.dirname(this.originSrc), playingList: this.playingList });
  },
  mounted() {
    this.$electron.ipcRenderer.on('quit', (needToRestore) => {
      if (needToRestore) this.needToRestore = needToRestore;
      this.quit = true;
    });
    this.videoElement = this.$refs.videoCanvas.videoElement();
    this.$bus.$on('toggle-fullscreen', () => {
      if (!this.isFullScreen) {
        this.toFullScreen();
      } else {
        this.offFullScreen();
      }
      this.$ga.event('app', 'toggle-fullscreen');
    });
    this.$bus.$on('to-fullscreen', () => {
      this.toFullScreen();
    });
    this.$bus.$on('off-fullscreen', () => {
      this.offFullScreen();
    });
    this.$bus.$on('toggle-muted', () => {
      this.toggleMute();
    });
    this.$bus.$on('send-lastplayedtime', (e) => {
      this.lastPlayedTime = e;
    });
    this.$bus.$on('send-audiotrackid', (id) => {
      this.lastAudioTrackId = id;
    });
    this.$bus.$on('toggle-playback', () => {
      this[this.paused ? 'play' : 'pause']();
      this.$ga.event('app', 'toggle-playback');
    });
    this.$bus.$on('next-video', () => {
      videodata.paused = false;
      if (this.nextVideo) {
        this.$store.commit('LOOP_UPDATE', false);
        if (this.isFolderList) this.openVideoFile(this.nextVideo);
        else this.playFile(this.nextVideo, this.nextVideoId);
      } else {
        this.$store.commit('LOOP_UPDATE', true);
      }
    });
    this.$bus.$on('seek', (e) => { this.seekTime = [e]; });
    this.$bus.$on('seek-forward', delta => this.$bus.$emit('seek', videodata.time + Math.abs(delta)));
    this.$bus.$on('seek-backward', (delta) => {
      const finalSeekTime = videodata.time - Math.abs(delta);
      // find a way to stop wheel event until next begin
      // if (finalSeekTime <= 0)
      this.$bus.$emit('seek', finalSeekTime);
    });
    this.$bus.$on('drag-over', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0.18)';
    });
    this.$bus.$on('drag-leave', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0)';
    });
    this.$bus.$on('drop', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0)';
      this.$ga.event('app', 'drop');
    });
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  },
  beforeDestroy() {
    if (process.mas) this.$bus.$emit(`stop-accessing-${this.originSrc}`, this.originSrc);
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  },
  methods: {
    ...mapActions({
      videoConfigInitialize: videoActions.INITIALIZE,
      play: videoActions.PLAY_VIDEO,
      pause: videoActions.PAUSE_VIDEO,
      updateMetaInfo: videoActions.META_INFO,
      toggleMute: videoActions.TOGGLE_MUTED,
      addAudioTrack: videoActions.ADD_AUDIO_TRACK,
      switchAudioTrack: videoActions.SWITCH_AUDIO_TRACK,
      removeAllAudioTrack: videoActions.REMOVE_ALL_AUDIO_TRACK,
      updatePlayinglistRate: videoActions.UPDATE_PLAYINGLIST_RATE,
    }),
    onMetaLoaded(event) {
      this.videoElement = event.target;
      this.videoConfigInitialize({
        paused: false,
        volume: this.volume * 100,
        muted: this.muted,
        rate: this.nowRate,
        duration: event.target.duration,
        currentTime: 0,
      });
      if (event.target.duration && Number.isFinite(event.target.duration)) {
        const generationInterval = Math.round(event.target.duration /
          (window.screen.width / 4)) || 1;
        const maxThumbnailCount = Math.floor(event.target.duration / generationInterval);
        this.$bus.$emit('generate-thumbnails', maxThumbnailCount);
      }
      this.updateMetaInfo({
        intrinsicWidth: event.target.videoWidth,
        intrinsicHeight: event.target.videoHeight,
        ratio: event.target.videoWidth / event.target.videoHeight,
      });
      if (event.target.duration - this.lastPlayedTime > 10) {
        this.$bus.$emit('seek', this.lastPlayedTime);
      } else {
        this.$bus.$emit('seek', 0);
      }
      this.lastPlayedTime = 0;
      this.$bus.$emit('video-loaded');
      this.changeWindowRotate(this.winAngle);
      this.changeWindowSize();
    },
    onAudioTrack(event) {
      const { type, track } = event;
      this[`${type}AudioTrack`](track);
    },
    changeWindowSize() {
      let newSize = [];
      const getWindowRect = () => [
        window.screen.availLeft, window.screen.availTop,
        window.screen.availWidth, window.screen.availHeight,
      ];
      if (this.videoExisted) {
        const videoSize = this.winAngle === 0 || this.winAngle === 180 ?
          [this.videoWidth, this.videoHeight] : [this.videoHeight, this.videoWidth];
        newSize = this.calculateWindowSize(
          [320, 180],
          this.winSize,
          videoSize,
          true,
          getWindowRect().slice(2, 4),
        );
      } else {
        newSize = this.calculateWindowSize(
          [320, 180],
          this.lastWinSize,
          [this.videoWidth, this.videoHeight],
          true,
          getWindowRect().slice(2, 4),
        );
        this.videoExisted = true;
      }
      const newPosition = this.calculateWindowPosition(
        this.winPos.concat(this.winSize),
        getWindowRect(),
        newSize,
      );
      this.controlWindowRect(newPosition.concat(newSize));
    },
    controlWindowRect(rect) {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', rect.slice(2, 4));
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', rect.slice(0, 2));
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [rect.slice(2, 4)[0] / rect.slice(2, 4)[1]]);
    },
    changeWindowRotate(val) {
      switch (val) {
        case 90:
        case 270:
          if (!this.isFullScreen) {
            requestAnimationFrame(() => {
              // 非全屏状态下，竖状视频，需要放大
              const scale = this.ratio < 1 ? 1 / this.ratio : this.ratio;
              this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg) scale(${scale}, ${scale})`);
            });
          } else {
            requestAnimationFrame(() => {
              // 在全屏情况下，显示器如果是竖着的话，需要根据视频的ratio反向缩放
              const winRatio = window.screen.width / window.screen.height;
              const scale = winRatio < 1 ? this.ratio : 1 / this.ratio;
              this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg) scale(${scale}, ${scale})`);
            });
          }
          break;
        case 0:
        case 180:
          requestAnimationFrame(() => {
            this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg)`);
          });
          break;
        default: break;
      }
    },
    toFullScreen() {
      this.winSizeBeforeFullScreen = this.winSize;
      this.winAngleBeforeFullScreen = this.winAngle;
      if (this.winAngle === 90 || this.winAngle === 270) {
        requestAnimationFrame(() => {
          // 逻辑可以参考changeWindowRotate里的
          const winRatio = window.screen.width / window.screen.height;
          const scale = winRatio < 1 ? this.ratio : 1 / this.ratio;
          this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg) scale(${scale}, ${scale})`);
        });
      }
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [true]);
    },
    offFullScreen() { // eslint-disable-line
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [false]);
      let newSize = [];
      const windowRect = [
        window.screen.availLeft, window.screen.availTop,
        window.screen.availWidth, window.screen.availHeight,
      ];
      if (this.winAngle === 90 || this.winAngle === 270) {
        // 逻辑可以参考changeWindowRotate里的
        const scale = this.ratio < 1 ? 1 / this.ratio : this.ratio;
        this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg) scale(${scale}, ${scale})`);
        if (this.winAngleBeforeFullScreen === 0 || this.winAngleBeforeFullScreen === 180) {
          newSize = this.calculateWindowSize(
            [320, 180],
            windowRect.slice(2, 4),
            [this.winSizeBeforeFullScreen[1], this.winSizeBeforeFullScreen[0]],
          );
        }
      } else {
        this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg)`);
        if (this.winAngleBeforeFullScreen === 90 || this.winAngleBeforeFullScreen === 270) {
          newSize = this.calculateWindowSize(
            [320, 180],
            windowRect.slice(2, 4),
            [this.winSizeBeforeFullScreen[1], this.winSizeBeforeFullScreen[0]],
          );
        }
      }
      if (newSize.length > 0) {
        // 退出全屏，计算pos依赖旧窗口大小，现在设置旧窗口大小为新大小的反转，
        // 这样在那里全屏，退出全屏后窗口还在那个位置。
        const newPosition = this.calculateWindowPosition(
          this.winPos.concat([newSize[1], newSize[0]]),
          windowRect,
          newSize,
        );
        this.controlWindowRect(newPosition.concat(newSize));
      }
    },
    async saveScreenshot(videoId) {
      const { videoElement } = this;
      const canvas = this.$refs.thumbnailCanvas;
      const canvasCTX = canvas.getContext('2d');
      // todo: use metaloaded to get videoHeight and videoWidth
      const { videoHeight, videoWidth } = this;
      // cannot delete
      [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 1080, 1080];
      canvasCTX.drawImage(
        videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, (videoWidth / videoHeight) * 1080, 1080,
      );
      const imagePath = canvas.toDataURL('image/jpeg', 0.8);
      // 用于测试截图的代码，以后可能还会用到
      // const img = imagePath.replace(/^data:image\/\w+;base64,/, '');
      // fs.writeFileSync('/Users/jinnaide/Desktop/screenshot.png', img, 'base64');
      [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 122.6, 122.6];
      canvasCTX.drawImage(
        videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, (videoWidth / videoHeight) * 122.6, 122.6,
      );
      const smallImagePath = canvas.toDataURL('image/jpeg', 0.8);
      const data = {
        shortCut: imagePath,
        smallShortCut: smallImagePath,
        lastPlayedTime: videodata.time,
        duration: this.duration,
        audioTrackId: this.currentAudioTrackId,
      };

      const val = await this.infoDB.get('media-item', videoId);
      if (val) {
        await this.infoDB.update('media-item', { ...val, ...data });
        this.$bus.$emit('database-saved');
      }
      const playlist = await this.infoDB.get('recent-played', this.playListId);
      await this.infoDB.update('recent-played', {
        ...playlist,
        items: this.isFolderList ? [videoId] : this.items,
        playedIndex: this.isFolderList ? 0 : this.playingIndex,
        lastOpened: Date.now(),
      });
    },
    saveSubtitleStyle() {
      return asyncStorage.set('subtitle-style', { chosenStyle: this.chosenStyle, chosenSize: this.subToTop ? this.lastChosenSize : this.chosenSize, enabledSecondarySub: this.enabledSecondarySub });
    },
    savePlaybackStates() {
      return asyncStorage.set('playback-states', { volume: this.volume, muted: this.muted });
    },
    beforeUnloadHandler(e) {
      this.removeAllAudioTrack();
      if (!this.asyncTasksDone && !this.needToRestore) {
        let savePromise = this.saveScreenshot(this.videoId);
        if (process.mas && this.$store.getters.source === 'drop') {
          savePromise = savePromise.then(async () => {
            await this.infoDB.deletePlaylist(this.playListId);
          });
        }
        savePromise
          .then(this.saveSubtitleStyle)
          .then(this.savePlaybackStates)
          .then(this.$store.dispatch('saveWinSize', this.isFullScreen ? { size: this.winSizeBeforeFullScreen, angle: this.winAngleBeforeFullScreen } : { size: this.winSize, angle: this.winAngle }))
          .finally(() => {
            this.$store.dispatch('SRC_SET', { src: '', mediaHash: '', id: NaN });
            this.asyncTasksDone = true;
            window.close();
          });
        e.returnValue = false;
      } else if (!this.quit) {
        e.returnValue = false;
        this.$bus.$off(); // remove all listeners before back to landing view
        // need to init Vuex States
        this.$router.push({
          name: 'landing-view',
        });
        if (this.isFullScreen) this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [!this.isFullScreen]);
        const x = (window.screen.width / 2) - 360;
        const y = (window.screen.height / 2) - 200;
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [720, 405]);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', [x, y]);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.video {
  position: relative;
  height: 0;
  z-index: auto;
}
.mask {
  position: absolute;
  width: 100vw;
  height: 100vh;
  transition: background-color 120ms linear;
}
.base-video-player {
  width: 100%;
  height: 100%;
  position: fixed;
}
.canvas {
  visibility: hidden;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 200ms ease-in;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
