<template>
  <div class="video">
    <video ref="videoCanvas"
      preload="metadata"
      @playing="onPlaying"
      @pause="onPause"
      @canplay="onCanPlay"
      @timeupdate="onTimeupdate"
      @loadedmetadata="onMetaLoaded"
      @durationchange="onDurationChange"
      :src="src">
    </video>
    <Subtitle/>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
  </div>
</template>;

<script>
// https://www.w3schools.com/tags/ref_av_dom.asp
import syncStorage from '@/helpers/syncStorage';
import Subtitle from './BaseSubtitle.vue';
import WindowSizeHelper from '../../helpers/WindowSizeHelper.js';
export default {
  components: {
    Subtitle,
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
      const { currentTime, duration } = this.$refs.videoCanvas;
      if (currentTime >= duration || this.$refs.videoCanvas.paused) {
        clearInterval(this.timeUpdateIntervalID);
      } else {
        this.$store.commit('AccurateTime', currentTime);
      }
    },
    onPause() {
      console.log('onpause');
    },
    onPlaying() {
      console.log('onplaying');
      // set interval to get update time
      const { duration } = this.$refs.videoCanvas;
      if (duration <= 240) {
        this.timeUpdateIntervalID = setInterval(this.accurateTimeUpdate, 10);
      }
    },
    onCanPlay() {
      // the video is ready to start playing
      this.$store.commit('Volume', this.$refs.videoCanvas.volume);
    },
    onMetaLoaded() {
      console.log('loadedmetadata');
      this.$bus.$emit('play');
      this.$bus.$emit('seek', this.currentTime);
      this.videoWidth = this.$refs.videoCanvas.videoWidth;
      this.videoHeight = this.$refs.videoCanvas.videoHeight;
      this.$bus.$emit('screenshot-sizeset', this.videoWidth / this.videoHeight);
      if (this.videoExisted) {
        this.$_calculateWindowSizeInConditionOfVideoExisted();
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
      console.log('ontimeupdate');
      this.$store.commit('AccurateTime', this.$refs.videoCanvas.currentTime);
      const t = Math.floor(this.$refs.videoCanvas.currentTime);
      if (t !== this.$store.state.PlaybackState.CurrentTime) {
        this.$store.commit('CurrentTime', t);
      }
    },
    onDurationChange() {
      console.log('durationchange');
      const t = Math.floor(this.$refs.videoCanvas.duration);
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
            = [this.videoWidth, this.videoHeight];
        }
      } else {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [this.videoWidth, this.videoHeight];
      }
    },
    $_calculateWindowSizeInConditionOfVideoExisted() {
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
      console.log(this.newWidthOfWindow);
    },
    $_saveScreenshot() {
      const canvas = this.$refs.thumbnailCanvas;
      const canvasCTX = canvas.getContext('2d');
      const { videoHeight, videoWidth } = this.$refs.videoCanvas;
      [canvas.width, canvas.height] = [videoWidth, videoHeight];
      canvasCTX.drawImage(
        this.$refs.videoCanvas, 0, 0, videoWidth, videoHeight,
        0, 0, videoWidth, videoHeight,
      );
      const imagePath = canvas.toDataURL('image/png');
      let data;
      try {
        data = syncStorage.getSync('recent-played');
      } catch (err) {
        console.error(err);
      }
      const object = data[0];
      const iterator = Object.keys(object).indexOf('path');
      if (iterator !== -1) {
        object.shortCut = imagePath;
        object.lastPlayedTime = this.currentTime;
        object.duration = this.$store.state.PlaybackState.Duration;
        data.splice(0, 1);
        data.unshift(object);
      }
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
    src() {
      const window = this.$electron.remote.getCurrentWindow();
      this.windowRectangleOld.x = window.getBounds().x;
      this.windowRectangleOld.y = window.getBounds().y;
      this.windowRectangleOld.height = window.getBounds().height;
      this.windowRectangleOld.width = window.getBounds().width;
      this.$_saveScreenshot();
    },
  },
  created() {
    this.$bus.$on('playback-rate', (newRate) => {
      console.log(`set video playbackRate ${newRate}`);
      this.$refs.videoCanvas.playbackRate = newRate;
      this.$store.commit('PlaybackRate', newRate);
    });
    this.$bus.$on('volume', (newVolume) => {
      console.log(`set video volume ${newVolume}`);
      this.$refs.videoCanvas.volume = newVolume;
      this.$store.commit('Volume', newVolume);
    });
    this.$bus.$on('reset-windowsize', () => {
      this.$_controlWindowSize(this.newWidthOfWindow, this.newHeightOfWindow);
    });
    this.$bus.$on('toggle-playback', () => {
      console.log('toggle-playback event has been triggered');
      if (this.$refs.videoCanvas.paused) {
        this.$bus.$emit('play');
        this.$bus.$emit('twinkle-play-icon');
      } else {
        this.$bus.$emit('pause');
        this.$bus.$emit('twinkle-pause-icon');
      }
    });
    this.$bus.$on('play', () => {
      console.log('play event has been triggered');
      this.$refs.videoCanvas.play();
    });
    this.$bus.$on('pause', () => {
      console.log('pause event has been triggered');
      this.$refs.videoCanvas.pause();
    });
    this.$bus.$on('seek', (e) => {
      console.log('seek event has been triggered', e);
      this.$refs.videoCanvas.currentTime = e;
      this.$store.commit('CurrentTime', e);
      this.$store.commit('AccurateTime', e);
    });
    this.windowSizeHelper = new WindowSizeHelper(this);
  },
  mounted() {
    window.onbeforeunload = () => {
      this.$_saveScreenshot();
    };
  },
};
</script>

<style lang="scss">
.video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
