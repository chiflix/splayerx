<template>
  <div
    :data-component-name="$options.name"
    class="video">
    <transition name="fade" mode="out-in">
    <base-video-player
      ref="videoCanvas"
      :key="originSrc"
      :needtimeupdate=true
      :events="['loadedmetadata', 'audiotrack']"
      :styles="{objectFit: 'contain', width: 'calc(100% - 0.1px)', height: '100%'}"
      @loadedmetadata="onMetaLoaded"
      @audiotrack="onAudioTrack"
      :loop="loop"
      :src="convertedSrc"
      :playbackRate="rate"
      :volume="volume"
      :muted="muted"
      :paused="paused"
      :currentTime="seekTime"
      :currentAudioTrackId="currentAudioTrackId.toString()" />
      <!-- calc(100% - 0.1px) fix for mac book pro 15 full screen after video controller fade-out video will shake -->
    </transition>
    <div class="mask"
      :style="{
        backgroundColor: maskBackground
      }"/>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
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
  name: 'video-canvas',
  components: {
    'base-video-player': BaseVideoPlayer,
  },
  data() {
    return {
      videoExisted: false,
      videoElement: null,
      seekTime: [0],
      lastPlayedTime: 0,
      lastCoverDetectingTime: 0,
      maskBackground: 'rgba(255, 255, 255, 0)', // drag and drop related var
      asyncTasksDone: false, // window should not be closed until asyncTasks Done (only use
      nowRate: 1,
      quit: false,
    };
  },
  methods: {
    ...mapActions({
      videoConfigInitialize: videoActions.INITIALIZE,
      play: videoActions.PLAY_VIDEO,
      pause: videoActions.PAUSE_VIDEO,
      updateMetaInfo: videoActions.META_INFO,
      toggleMute: videoActions.TOGGLE_MUTED,
      addAudioTrack: videoActions.ADD_AUDIO_TRACK,
      removeAudioTrack: videoActions.REMOVE_AUDIO_TRACK,
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
      const generationInterval = Math.round(event.target.duration / (window.screen.width / 4)) || 1;
      const maxThumbnailCount = Math.floor(event.target.duration / generationInterval);
      this.$bus.$emit('generate-thumbnails', maxThumbnailCount);
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
        newSize = this.calculateWindowSize(
          [320, 180],
          this.winSize,
          [this.videoWidth, this.videoHeight],
          true,
          getWindowRect().slice(2, 4),
        );
      } else {
        newSize = this.calculateWindowSize(
          [320, 180],
          getWindowRect().slice(2, 4),
          [this.videoWidth, this.videoHeight],
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
    async saveScreenshot(videoPath) {
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

      const val = await this.infoDB.get('recent-played', 'path', videoPath);
      if (val) {
        const mergedData = Object.assign(val, data);
        await this.infoDB.add('recent-played', mergedData);
        this.$bus.$emit('database-saved');
      }
    },
    saveSubtitleStyle() {
      return asyncStorage.set('subtitle-style', { chosenStyle: this.chosenStyle, chosenSize: this.chosenSize, enabledSecondarySub: this.enabledSecondarySub });
    },
    savePlaybackStates() {
      return asyncStorage.set('playback-states', { volume: this.volume, muted: this.muted });
    },
  },
  computed: {
    ...mapGetters([
      'originSrc', 'convertedSrc', 'volume', 'muted', 'rate', 'paused', 'duration', 'ratio', 'currentAudioTrackId', 'enabledSecondarySub',
      'winSize', 'winPos', 'isFullScreen', 'winHeight', 'chosenStyle', 'chosenSize', 'nextVideo', 'loop', 'playinglistRate', 'playingList']),
    ...mapGetters({
      videoWidth: 'intrinsicWidth',
      videoHeight: 'intrinsicHeight',
      videoRatio: 'ratio',
    }),
  },
  created() {
    this.updatePlayinglistRate({ oldDir: '', newDir: path.dirname(this.originSrc), playingList: this.playingList });
  },
  watch: {
    originSrc(val, oldVal) {
      this.saveScreenshot(oldVal);
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
  mounted() {
    this.$electron.ipcRenderer.on('quit', () => {
      this.quit = true;
    });
    this.videoElement = this.$refs.videoCanvas.videoElement();
    this.$bus.$on('toggle-fullscreen', () => {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [!this.isFullScreen]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [this.ratio]);
      this.$ga.event('app', 'toggle-fullscreen');
    });
    this.$bus.$on('toggle-muted', () => {
      this.toggleMute();
    });
    this.$bus.$on('send-lastplayedtime', (e) => {
      this.lastPlayedTime = e;
    });
    this.$bus.$on('toggle-playback', () => {
      this[this.paused ? 'play' : 'pause']();
      this.$ga.event('app', 'toggle-playback');
    });
    this.$bus.$on('next-video', () => {
      videodata.paused = false;
      if (this.nextVideo) {
        this.playFile(this.nextVideo);
      }
    });
    this.$bus.$on('seek', (e) => {
      this.seekTime = [e];
      // todo: use vuex get video element src
      const filePath = decodeURI(this.src);
      const indexOfLastDot = filePath.lastIndexOf('.');
      const ext = filePath.substring(indexOfLastDot + 1);
      if (ext === 'mkv') {
        this.$bus.$emit('seek-subtitle', e);
      }
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
    window.onbeforeunload = (e) => {
      if (!this.asyncTasksDone) {
        this.saveScreenshot(this.originSrc)
          .then(this.saveSubtitleStyle)
          .then(this.savePlaybackStates)
          .then(() => {
            this.asyncTasksDone = true;
            window.close();
          })
          .catch(() => {
            this.asyncTasksDone = true;
            window.close();
          });
        e.returnValue = false;
      } else if (!this.quit) {
        e.returnValue = false;
        this.$bus.$off(); // remove all listeners before back to landing view
        this.$router.push({
          name: 'landing-view',
        });
        if (this.isFullScreen) this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [!this.isFullScreen]);
        const x = (window.screen.width / 2) - 360;
        const y = (window.screen.height / 2) - 200;
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [720, 405]);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', [x, y]);
      }
    };
  },
  beforeDestroy() {
    window.onbeforeunload = null;
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
