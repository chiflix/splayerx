<template>
  <div
    :data-component-name="$options.name"
    class="video">
    <base-video-player
      ref="videoCanvas"
      :defaultEvents="['playing', 'canplay', 'timeupdate', 'loadedmetadata', 'durationchange']"
      :styleObject="{objectFit: 'contain', width: '100%', height: '100%'}"

      @playing="onPlaying"
      @canplay="onCanPlay"
      @timeupdate="onTimeupdate"
      @loadedmetadata="onMetaLoaded"
      @durationchange="onDurationChange"
      :src="src" />
    <BaseSubtitle/>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
  </div>
</template>;

<script>
import asyncStorage from '@/helpers/asyncStorage';
import syncStorage from '@/helpers/syncStorage';
import WindowSizeHelper from '@/helpers/WindowSizeHelper.js';
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
      windowRectangleOld: {},
      videoExisted: false,
      shownTextTrack: false,
      newWidthOfWindow: 0,
      newHeightOfWindow: 0,
      videoWidth: 0,
      videoHeight: 0,
      timeUpdateIntervalID: null,
      windowSizeHelper: null,
      videoElement: null,
    };
  },
  props: {
    src: {
      type: String,
      required: true,
      validator(value) {
        // TODO: check if its a file or url
        if (value.length <= 0) {
          return false;
        }
        return true;
      },
    },
  },
  methods: {
    accurateTimeUpdate() {
      const { currentTime, duration } = this.videoElement;
      if (currentTime >= duration || this.videoElement.paused) {
        clearInterval(this.timeUpdateIntervalID);
      } else {
        this.$store.commit('AccurateTime', currentTime);
      }
    },
    onPlaying() {
      // set interval to get update time
      const { duration } = this.videoElement;
      if (duration <= 240) {
        this.timeUpdateIntervalID = setInterval(this.accurateTimeUpdate, 10);
      }
    },
    onCanPlay() {
      // the video is ready to start playing
      this.$store.commit('Volume', this.videoElement.volume);
    },
    onMetaLoaded() {
      this.$bus.$emit('play');
      this.$bus.$emit('seek', this.currentTime);
      this.videoWidth = this.videoElement.videoWidth;
      this.videoHeight = this.videoElement.videoHeight;
      this.$bus.$emit('screenshot-sizeset', this.videoWidth / this.videoHeight);
      if (this.videoExisted) {
        this.$_calculateWindowSizeWhenVideoExisted();
        this.$_controlWindowSizeAtNewVideo();
      } else {
        this.$_calculateWindowSizeAtTheFirstTime();
        this.$_controlWindowSize();
        this.videoExisted = true;
      }
      this.$bus.$emit('video-loaded');
      this.windowSizeHelper.setNewWindowSize();
      // this.loadTextTracks();
    },
    onTimeupdate() {
      this.$store.commit('AccurateTime', this.videoElement.currentTime);
      const t = Math.floor(this.videoElement.currentTime);
      if (t !== this.$store.state.PlaybackState.CurrentTime) {
        this.$store.commit('CurrentTime', t);
      }
    },
    onDurationChange() {
      const t = Math.floor(this.$refs.videoCanvas.videoElement().duration);
      if (t !== this.$store.state.PlaybackState.duration) {
        this.$store.commit('Duration', t);
      }
    },
    $_controlWindowSize() {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      currentWindow.setBounds({
        x: 0,
        y: 0,
        width: parseInt(this.newWidthOfWindow, 10),
        height: parseInt(this.newHeightOfWindow, 10),
      });
      currentWindow.setAspectRatio(this.newWidthOfWindow / this.newHeightOfWindow);
    },
    $_controlWindowSizeAtNewVideo() {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      const windowXY = this.calcNewWindowXY();
      currentWindow.setBounds({
        x: windowXY.windowX,
        y: windowXY.windowY,
        width: parseInt(this.newWidthOfWindow, 10),
        height: parseInt(this.newHeightOfWindow, 10),
      });
      currentWindow.setAspectRatio(this.newWidthOfWindow / this.newHeightOfWindow);
    },
    $_calculateWindowSizeAtTheFirstTime() {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      const currentScreen = this.$electron.screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = currentScreen.workAreaSize;
      const [minWidth, minHeight] = currentWindow.getMinimumSize();
      const screenRatio = screenWidth / screenHeight;
      const minWindowRatio = minWidth / minHeight;
      const videoRatio = this.videoWidth / this.videoHeight;
      if (this.videoWidth > screenWidth || this.videoHeight > screenHeight) {
        if (videoRatio > screenRatio) {
          this.newWidthOfWindow = screenWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (videoRatio < screenRatio) {
          this.newHeightOfWindow = screenHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (videoRatio === screenRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow] = [screenWidth, screenHeight];
        }
      } else if (this.videoWidth < minWidth || this.videoHeight < minHeight) {
        if (videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (videoRatio === minWindowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [minWidth, minHeight];
        }
      } else {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [this.videoWidth, this.videoHeight];
      }
    },
    $_calculateWindowSizeWhenVideoExisted() {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      const [windowWidth, windowHeight] = currentWindow.getSize();
      const [minWidth, minHeight] = currentWindow.getMinimumSize();
      const windowRatio = windowWidth / windowHeight;
      const minWindowRatio = minWidth / minHeight;
      const videoRatio = this.videoWidth / this.videoHeight;
      if (this.videoWidth < windowWidth && this.videoHeight < windowHeight) {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [this.videoWidth, this.videoHeight];
      } else if (this.videoWidth > windowWidth || this.videoHeight > windowHeight) {
        if (videoRatio > windowRatio) {
          this.newWidthOfWindow = windowWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (videoRatio < windowRatio) {
          this.newHeightOfWindow = windowHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (videoRatio === windowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [windowWidth, windowHeight];
        }
      }
      if (this.newWidthOfWindow < minWidth || this.newHeightOfWindow < minHeight) {
        if (videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow = this.calculateWidthByHeight;
        } else if (videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow = this.calculateHeightByWidth;
        } else if (videoRatio === minWindowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow]
            = [this.videoWidth, this.videoHeight];
        }
      }
    },
    $_saveScreenshot() {
      const canvas = this.$refs.thumbnailCanvas;
      const canvasCTX = canvas.getContext('2d');
      const { videoHeight, videoWidth } = this.videoElement;
      [canvas.width, canvas.height] = [videoWidth, videoHeight];
      canvasCTX.drawImage(
        this.videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, videoWidth, videoHeight,
      );
      const imagePath = canvas.toDataURL('image/png');
      const data = {
        shortCut: imagePath,
        lastPlayedTime: this.currentTime,
        duration: this.$store.state.PlaybackState.Duration,
      };
      syncStorage.setSync('recent-played', data);
    },
    calcNewWindowXY() {
      if (Object.keys(this.windowRectangleOld).length === 0) {
        return { windowX: 0, windowY: 0 };
      }
      let x = this.windowRectangleOld.x + (this.windowRectangleOld.width / 2);
      let y = this.windowRectangleOld.y + (this.windowRectangleOld.height / 2);
      x = Math.round(x - (this.newWidthOfWindow / 2));
      y = Math.round(y - (this.newHeightOfWindow / 2));
      return { windowX: x, windowY: y };
    },
  },
  computed: {
    calculateHeightByWidth() {
      return this.newWidthOfWindow / (this.videoWidth / this.videoHeight);
    },
    calculateWidthByHeight() {
      return this.newHeightOfWindow * (this.videoWidth / this.videoHeight);
    },
    currentTime() {
      return this.$store.state.PlaybackState.CurrentTime;
    },
  },
  watch: {
    src(val, oldVal) {
      const window = this.$electron.remote.getCurrentWindow();
      this.windowRectangleOld.x = window.getBounds().x;
      this.windowRectangleOld.y = window.getBounds().y;
      this.windowRectangleOld.height = window.getBounds().height;
      this.windowRectangleOld.width = window.getBounds().width;
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
  },
  mounted() {
    this.videoElement = this.$refs.videoCanvas.videoElement();

    this.$bus.$on('playback-rate', (newRate) => {
      this.videoElement.playbackRate = newRate;
      this.$store.commit('PlaybackRate', newRate);
    });
    this.$bus.$on('volume', (newVolume) => {
      this.videoElement.volume = newVolume;
      this.$store.commit('Volume', newVolume);
    });
    this.$bus.$on('reset-windowsize', () => {
      this.$_controlWindowSize(this.newWidthOfWindow, this.newHeightOfWindow);
    });
    this.$bus.$on('toggle-playback', () => {
      if (this.videoElement.paused) {
        this.$bus.$emit('play');
        this.$bus.$emit('twinkle-play-icon');
      } else {
        this.$bus.$emit('pause');
        this.$bus.$emit('twinkle-pause-icon');
      }
    });
    this.$bus.$on('play', () => {
      this.videoElement.play();
    });
    this.$bus.$on('pause', () => {
      this.videoElement.pause();
    });
    this.$bus.$on('seek', (e) => {
      this.videoElement.currentTime = e;
      this.$store.commit('CurrentTime', e);
      this.$store.commit('AccurateTime', e);
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
