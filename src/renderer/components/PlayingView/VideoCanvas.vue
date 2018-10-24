<template>
  <div
    :data-component-name="$options.name"
    class="video">
    <base-video-player
      ref="videoCanvas"
      :events="['loadedmetadata', 'resize']"
      :styles="{objectFit: 'contain', width: '100%', height: '100%'}"
      @loadedmetadata="onMetaLoaded"
      :src="convertedSrc"
      :playbackRate="rate"
      :volume="volume"
      :muted="mute"
      :paused="paused"
      :updateCurrentTime="true"
      :currentTime="seekTime"
      @update:currentTime="updateCurrentTime" />
    <BaseSubtitle/>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
  </div>
</template>;

<script>
import _ from 'lodash';
import asyncStorage from '@/helpers/asyncStorage';
import syncStorage from '@/helpers/syncStorage';
import WindowSizeHelper from '@/helpers/WindowSizeHelper.js';
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
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
      currentWindowWidth: 0,
      currentWindowHeight: 0,
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
      updateMetaInfo: videoActions.META_INFO,
    }),
    ...mapMutations({
      updateCurrentTime: videoMutations.CURRENT_TIME_UPDATE,
    }),
    onMetaLoaded(event) {
      this.videoConfigInitialize({
        volume: 100,
        mute: false,
        rate: 1,
        duration: event.target.duration,
      });
      this.updateMetaInfo({
        intrinsicWidth: event.target.videoWidth,
        intrinsicHeight: event.target.videoHeight,
        ratio: event.target.videoWidth / event.target.videoHeight,
      });
      this.$bus.$emit('seek', this.currentTime);
      this.$bus.$emit('video-loaded');
    },
    onVideoSizeChange() {
      if (this.videoExisted) {
        const newSize = this.$_calculateWindowSize(
          [320, 180],
          [this.currentWindowWidth, this.currentWindowHeight],
          [this.videoWidth, this.videoHeight],
        );
        // tempoary code
        [this.currentWindowWidth, this.currentWindowHeight] = newSize;
        this.$_controlWindowSizeAtNewVideo(newSize);
      } else {
        const newSize = this.$_calculateWindowSizeAtTheFirstTime()([
          this.videoWidth,
          this.videoHeight,
        ]);
        // tempoary code
        [this.currentWindowWidth, this.currentWindowHeight] = newSize;
        this.$_controlWindowSize(newSize);
        this.videoExisted = true;
      }
      this.windowSizeHelper.setNewWindowSize();
    },
    $_controlWindowSize(newWindowSize) {
      const landingViewRectangle = this.windowBounds;

      const [windowX, windowY] = this.winPos;
      const winPos = { x: windowX, y: windowY };
      const currentDisplay = this.$electron.screen.getDisplayNearestPoint(winPos);

      const windowXY = this.calcNewWindowXY(currentDisplay, landingViewRectangle);

      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setSize', newWindowSize);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setPosition', [
        windowXY.windowX,
        windowXY.windowY,
      ]);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [
        newWindowSize[0] / newWindowSize[1],
      ]);
    },
    $_controlWindowSizeAtNewVideo(newWindowSize) {
      const [windowX, windowY] = this.winPos;
      const winPos = { x: windowX, y: windowY };
      const currentDisplay = this.$electron.screen.getDisplayNearestPoint(winPos);

      const windowXY = this.avoidBeyondDisplayBorder(currentDisplay, windowX, windowY);

      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setSize', newWindowSize);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setPosition', [
        windowXY.windowX,
        windowXY.windowY,
      ]);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [
        newWindowSize[0] / newWindowSize[1],
      ]);
    },
    $_calculateWindowSize(minSize, maxSize, videoSize) {
      const getRatio = size => size[0] / size[1];
      const setWidthByHeight = size => [size[1] * getRatio(videoSize), size[1]];
      const setHeightByWidth = size => [size[0], size[0] / getRatio(videoSize)];
      const diffSize = (overOrNot, size, diffedSize) => size.some((value, index) => // eslint-disable-line
        overOrNot ? value >= diffedSize[index] : value < diffedSize[index]);
      const biggerRatio = (size1, size2) => getRatio(size1) > getRatio(size2);
      if (diffSize(true, videoSize, maxSize)) {
        return biggerRatio(videoSize, maxSize) ?
          setHeightByWidth(maxSize) : setWidthByHeight(maxSize);
      } else if (diffSize(false, videoSize, minSize)) {
        return biggerRatio(minSize, videoSize) ?
          setWidthByHeight(minSize) : setHeightByWidth(videoSize);
      }
      return videoSize;
    },
    $_calculateWindowPosition(currentRect, windowRect, newSize) {
      const tempRect = currentRect.slice(0, 2)
        .map((value, index) => Math.round(value + (currentRect.slice(2, 4)[index] / 2)))
        .map((value, index) => Math.round(value - (newSize[index] / 2))).concat(newSize);
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
    $_calculateWindowSizeAtTheFirstTime() {
      return _.partial(
        this.$_calculateWindowSize,
        [320, 180],
        [window.screen.availWidth, window.screen.availHeight],
      );
    },
    getWindowRect() {
      return [
        window.screen.availLeft, window.screen.availTop,
        window.screen.availWidth, window.screen.availHeight,
      ];
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
      x = Math.round(x - (this.currentWindowWidth / 2));
      y = Math.round(y - (this.currentWindowHeight / 2));

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

      const right = x + this.currentWindowWidth; // the x axis of window's right side
      if (right > displayX + displayWidth) {
        x = Math.round((displayX + displayWidth) - this.currentWindowWidth);
      }
      const bottom = y + this.currentWindowHeight; // the y axis of window's bottom side
      if (bottom > displayY + displayHeight) {
        y = Math.round((displayY + displayHeight) - this.currentWindowHeight);
      }
      return { windowX: x, windowY: y };
    },
  },
  computed: {
    ...mapState({
      windowMinimumSize: state => state.Window.windowMinimumSize,
      windowBounds: state => state.Window.windowBounds,
    }),
    ...mapGetters([
      'originSrc', 'convertedSrc', 'volume', 'mute', 'rate', 'paused', 'currentTime', 'duration',
      'winSize', 'winPos', 'isFullscreen']),
    ...mapGetters({
      videoWidth: 'intrinsicWidth',
      videoHeight: 'intrinsicHeight',
      videoRatio: 'ratio',
    }),
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
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [this.currentWindowWidth / this.currentWindowHeight]);
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
