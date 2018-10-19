<template>
  <div
    :data-component-name="$options.name"
    class="video">
    <base-video-player
      ref="videoCanvas"
      :events="['loadedmetadata']"
      :styles="{objectFit: 'contain', width: '100%', height: '100%'}"
      @loadedmetadata="onMetaLoaded"
      :src="convertedSrc"
      :playbackRate="rate"
      :volume="volume"
      :muted="mute"
      :paused="paused"
      :updateCurrentTime="true"
      :currentTime.sync="seekTime"
      @update:currentTime="updateCurrentTime" />
    <BaseSubtitle/>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
  </div>
</template>;

<script>
import asyncStorage from '@/helpers/asyncStorage';
import syncStorage from '@/helpers/syncStorage';
import WindowSizeHelper from '@/helpers/WindowSizeHelper.js';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import { Video as videoMutations } from '@/store/mutationTypes';
import { Video as videoActions } from '@/store/actionTypes';
import BaseSubtitle from './BaseSubtitle.vue';
import BaseVideoPlayer from './BaseVideoPlayer';

export default {
  name: 'video-canvas',
  components: {
    BaseSubtitle,
    'base-video-player': BaseVideoPlayer,
  },
  data() {
    return {
      videoExisted: false,
      shownTextTrack: false,
      newWidthOfWindow: 0,
      newHeightOfWindow: 0,
      duration: 0,
      videoWidth: 0,
      videoHeight: 0,
      timeUpdateIntervalID: null,
      windowSizeHelper: null,
      videoElement: null,
      seekTime: 0,
    };
  },
  methods: {
    ...mapActions({
      videoConfigInitialize: videoActions.INITIALIZE,
      play: videoActions.PLAY_VIDEO,
      pause: videoActions.PAUSE_VIDEO,
    }),
    ...mapMutations({ updateCurrentTime: videoMutations.CURRENTTIME_UPDATE }),
    onMetaLoaded(event) {
      [this.duration, this.videoWidth, this.videoHeight] =
        [event.target.duration, event.target.videoWidth, event.target.videoHeight];
      this.videoConfigInitialize({
        volume: 100,
        mute: false,
        rate: 1,
        duration: this.duration,
      });
      this.$bus.$emit('play');
      this.$bus.$emit('seek', this.currentTime);
      this.$bus.$emit('screenshot-sizeset', this.videoWidth / this.videoHeight);
      this.$bus.$emit('video-loaded');
    },
    onVideoSizeChange() {
      if (this.videoExisted) {
        this.$_calculateWindowSizeWhenVideoExisted();
        this.$_controlWindowSizeAtNewVideo();
      } else {
        this.$_calculateWindowSizeAtTheFirstTime();
        this.$_controlWindowSize();
        this.videoExisted = true;
      }
      this.$bus.$emit('screenshot-sizeset', this.videoWidth / this.videoHeight);
      this.windowSizeHelper.setNewWindowSize();
    },
    $_controlWindowSize() {
      const landingViewRectangle = this.windowBounds;

      const [windowX, windowY] = this.windowPosition;
      const windowPosition = { x: windowX, y: windowY };
      const currentDisplay = this.$electron.screen.getDisplayNearestPoint(windowPosition);

      const windowXY = this.calcNewWindowXY(currentDisplay, landingViewRectangle);

      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setSize', [
        parseInt(this.newWidthOfWindow, 10),
        parseInt(this.newHeightOfWindow, 10),
      ]);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setPosition', [
        windowXY.windowX,
        windowXY.windowY,
      ]);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [
        this.newWidthOfWindow / this.newHeightOfWindow,
      ]);
    },
    $_controlWindowSizeAtNewVideo() {
      const [windowX, windowY] = this.windowPosition;
      const windowPosition = { x: windowX, y: windowY };
      const currentDisplay = this.$electron.screen.getDisplayNearestPoint(windowPosition);

      const windowXY = this.avoidBeyondDisplayBorder(currentDisplay, windowX, windowY);

      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setSize', [
        parseInt(this.newWidthOfWindow, 10),
        parseInt(this.newHeightOfWindow, 10),
      ]);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setPosition', [
        windowXY.windowX,
        windowXY.windowY,
      ]);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [
        this.newWidthOfWindow / this.newHeightOfWindow,
      ]);
    },
    $_calculateWindowSizeAtTheFirstTime() {
      const [windowX, windowY] = this.windowPosition;
      const windowPosition = { x: windowX, y: windowY };
      const currentScreen = this.$electron.screen.getDisplayNearestPoint(windowPosition);
      const { width: screenWidth, height: screenHeight } = currentScreen.workAreaSize;
      const [minWidth, minHeight] = this.windowMinimumSize;
      const screenRatio = screenWidth / screenHeight;
      const minWindowRatio = minWidth / minHeight;

      if (this.videoWidth > screenWidth || this.videoHeight > screenHeight) {
        if (this.videoRatio > screenRatio) {
          this.newWidthOfWindow = screenWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (this.videoRatio < screenRatio) {
          this.newHeightOfWindow = screenHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else {
          [this.newWidthOfWindow, this.newHeightOfWindow] = [screenWidth, screenHeight];
        }
      } else if (this.videoWidth < minWidth || this.videoHeight < minHeight) {
        if (this.videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (this.videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [minWidth, minHeight];
        }
      } else {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [this.videoWidth, this.videoHeight];
      }
    },
    $_calculateWindowSizeWhenVideoExisted() {
      const [windowWidth, windowHeight] = this.windowSize;
      const [minWidth, minHeight] = this.windowMinimumSize;
      const windowRatio = windowWidth / windowHeight;
      const minWindowRatio = minWidth / minHeight;
      [this.newWidthOfWindow, this.newHeightOfWindow] = [this.videoWidth, this.videoHeight];
      if (this.videoWidth > windowWidth || this.videoHeight > windowHeight) {
        if (this.videoRatio > windowRatio) {
          this.newWidthOfWindow = windowWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (this.videoRatio < windowRatio) {
          this.newHeightOfWindow = windowHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        }
      }
      if (this.newWidthOfWindow < minWidth || this.newHeightOfWindow < minHeight) {
        if (this.videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (this.videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [this.videoWidth, this.videoHeight];
        }
      }
    },
    $_saveScreenshot() {
      const canvas = this.$refs.thumbnailCanvas;
      const canvasCTX = canvas.getContext('2d');
      // todo: use metaloaded to get videoHeight and videoWidth
      const { videoHeight, videoWidth } = this;
      // cannot delete
      [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 1080, 1080];
      canvasCTX.drawImage(
        this.videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, (videoWidth / videoHeight) * 1080, 1080,
      );
      const imagePath = canvas.toDataURL('image/png');
      [canvas.width, canvas.height] = [211.3, 122.6];
      canvasCTX.drawImage(
        this.videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, 211.3, 122.6,
      );
      const smallImagePath = canvas.toDataURL('image/png');
      const data = {
        shortCut: imagePath,
        smallShortCut: smallImagePath,
        lastPlayedTime: this.currentTime,
        duration: this.$store.state.Video.duration,
      };
      syncStorage.setSync('recent-played', data);
    },
    // responsible for calculating window position and size relative to LandingView's Center
    calcNewWindowXY(currentDisplay, landingViewRectangle) {
      let x = landingViewRectangle.x + (landingViewRectangle.width / 2);
      let y = landingViewRectangle.y + (landingViewRectangle.height / 2);
      x = Math.round(x - (this.newWidthOfWindow / 2));
      y = Math.round(y - (this.newHeightOfWindow / 2));

      return this.avoidBeyondDisplayBorder(currentDisplay, x, y);
    },
    // if the given (x, y) beyond the border of the given display, then adjust the x, y
    avoidBeyondDisplayBorder(display, x, y) {
      const {
        width: displayWidth,
        height: displayHeight,
        x: displayX, // the x axis of display's upper-left
        y: displayY, // the y axis of display's upper-left
      } = display.workArea;

      if (x < displayX) x = displayX;
      if (y < displayY) y = displayY;

      const right = x + this.newWidthOfWindow; // the x axis of window's right side
      if (right > displayX + displayWidth) {
        x = Math.round((displayX + displayWidth) - this.newWidthOfWindow);
      }
      const bottom = y + this.newHeightOfWindow; // the y axis of window's bottom side
      if (bottom > displayY + displayHeight) {
        y = Math.round((displayY + displayHeight) - this.newHeightOfWindow);
      }
      return { windowX: x, windowY: y };
    },
  },
  computed: {
    ...mapGetters(['originSrc', 'convertedSrc', 'volume', 'mute', 'rate', 'paused', 'currentTime']),
    calculateHeightByWidth() {
      return this.newWidthOfWindow / (this.videoWidth / this.videoHeight);
    },
    calculateWidthByHeight() {
      return this.newHeightOfWindow * (this.videoWidth / this.videoHeight);
    },
    videoRatio() {
      if (!this.videoHeight) return 0;
      return this.videoWidth / this.videoHeight;
    },
    isFullScreen() {
      return this.$store.state.Window.isFullScreen;
    },
    windowSize() {
      return this.$store.state.Window.windowSize;
    },
    windowMinimumSize() {
      return this.$store.state.Window.windowMinimumSize;
    },
    windowPosition() {
      return this.$store.state.Window.windowPosition;
    },
    windowBounds() {
      return this.$store.state.Window.windowBounds;
    },
  },
  watch: {
    originSrc(val, oldVal) {
      this.$store.commit('currentPlaying', val);
      this.$_saveScreenshot();
      asyncStorage.get('recent-played')
        .then(async (data) => {
          const val = await this.infoDB().get('recent-played', 'path', oldVal);
          if (val && data) {
            const mergedData = Object.assign(val, data);
            this.infoDB().add('recent-played', mergedData);
          }
        });
    },
    videoRatio() {
      this.onVideoSizeChange();
    },
  },
  mounted() {
    this.$store.commit('currentPlaying', this.originSrc);
    this.videoElement = this.$refs.videoCanvas.videoElement();
    this.$bus.$on('toggle-fullscreen', () => {
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setFullScreen', [!this.isFullScreen]);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [this.newWidthOfWindow / this.newHeightOfWindow]);
    });
    this.$bus.$on('toggle-playback', () => {
      this[this.paused ? 'play' : 'pause']();
    });
    this.$bus.$on('seek', (e) => {
      this.seekTime = e;
      // todo: use vuex get video element src
      const filePath = decodeURI(this.src);
      const indexOfLastDot = filePath.lastIndexOf('.');
      const ext = filePath.substring(indexOfLastDot + 1);
      if (ext === 'mkv') {
        this.$bus.$emit('seek-subtitle', e);
      }
    });
    this.windowSizeHelper = new WindowSizeHelper(this);
    window.onbeforeunload = () => {
      this.$_saveScreenshot();
    };
  },
};
</script>
<style lang="scss" scoped>
.video {
  height: 0;
}
.base-video-player {
  width: 100%;
  height: 100%;
  position: fixed;
}
.canvas {
  visibility: hidden;
}
</style>
