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
  </div>
</template>;

<script>
// https://www.w3schools.com/tags/ref_av_dom.asp

export default {
  data() {
    return {
      videoExisted: false,
      newWidthOfWindow: 0,
      newHeightOfWindow: 0,
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
    onPause() {
      console.log('onpause');
    },
    onPlaying() {
      console.log('onplaying');
    },
    onCanPlay() {
      // the video is ready to start playing
      this.$store.commit('Volume', this.$refs.videoCanvas.volume);
    },
    onMetaLoaded() {
      console.log('loadedmetadata');
      this.$bus.$emit('play');
      const { videoHeight, videoWidth } = this.$refs.videoCanvas;
      if (this.videoExisted) {
        this.$_calculateWindowSizeInConditionOfVideoExisted(videoWidth, videoHeight);
        this.$_controlWindowSize(this.newWidthOfWindow, this.newHeightOfWindow);
      } else {
        this.$_calculateWindowSizeAtTheFirstTime(videoWidth, videoHeight);
        this.$_controlWindowSize(this.newWidthOfWindow, this.newHeightOfWindow);
        this.videoExisted = true;
      }
    },
    onTimeupdate() {
      console.log('ontimeupdate');
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
    $_controlWindowSize(newWidth, newHeight) {
      this.currentWindow.setBounds({
        x: 0, y: 0, width: parseInt(newWidth, 10), height: parseInt(newHeight, 10),
      });
      this.currentWindow.setAspectRatio(newWidth / newHeight);
    },

    $_calculateWindowSizeAtTheFirstTime(videoWidth, videoHeight) {
      const { width: screenWidth, height: screenHeight } = this.currentScreen.workAreaSize;
      const [minWidth, minHeight] = this.currentWindow.getMinimumSize();
      const screenRatio = screenWidth / screenHeight;
      const videoRatio = videoWidth / videoHeight;
      const minWindowRatio = minWidth / minHeight;

      if (videoWidth > screenWidth || videoHeight > screenHeight) {
        if (videoRatio > screenRatio) {
          this.newWidthOfWindow = screenWidth;
          this.newHeightOfWindow =
          this.$_calculateHeightByWidth(videoWidth, videoHeight, this.newWidthOfWindow);
        } else if (videoRatio < screenRatio) {
          this.newHeightOfWindow = screenHeight;
          this.newWidthOfWindow =
          this.$_calculateWidthByHeight(videoWidth, videoHeight, this.newHeightOfWindow);
        } else if (videoRatio === screenRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow] = [screenWidth, screenHeight];
        }
      } else if (videoWidth < minWidth || videoHeight < minHeight) {
        if (videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow =
          this.$_calculateWidthByHeight(videoWidth, videoHeight, this.newHeightOfWindow);
        } else if (videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow =
          this.$_calculateHeightByWidth(videoWidth, videoHeight, this.newWidthOfWindow);
        } else if (videoRatio === minWindowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow] =
          [videoWidth, videoHeight];
        }
      } else {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [videoWidth, videoHeight];
      }
    },

    $_calculateWindowSizeInConditionOfVideoExisted(videoWidth, videoHeight) {
      const [windowWidth, windowHeight] = this.currentWindow.getSize();
      const [minWidth, minHeight] = this.currentWindow.getMinimumSize();

      const videoRatio = videoWidth / videoHeight;
      const windowRatio = windowWidth / windowHeight;
      const minWindowRatio = minWidth / minHeight;

      if (videoWidth < windowWidth && videoHeight < windowHeight) {
        [this.newWidthOfWindow, this.newHeightOfWindow] = [videoWidth, videoHeight];
      } else if (videoWidth > windowWidth || videoHeight > windowHeight) {
        if (videoRatio > windowRatio) {
          this.newWidthOfWindow = windowWidth;
          this.newHeightOfWindow =
          this.$_calculateHeightByWidth(videoWidth, videoHeight, this.newWidthOfWindow);
        } else if (videoRatio < windowRatio) {
          this.newHeightOfWindow = windowHeight;
          this.newWidthOfWindow =
          this.$_calculateWidthByHeight(videoWidth, videoHeight, this.newHeightOfWindow);
        } else if (videoRatio === windowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow] =
          [windowWidth, windowHeight];
        }
      }

      if (this.newWidthOfWindow < minWidth || this.newHeightOfWindow < minHeight) {
        if (videoRatio > minWindowRatio) {
          this.newHeightOfWindow = minHeight;
          this.newWidthOfWindow =
          this.$_calculateWidthByHeight(videoWidth, videoHeight, this.newHeightOfWindow);
        } else if (videoRatio < minWindowRatio) {
          this.newWidthOfWindow = minWidth;
          this.newHeightOfWindow =
          this.$_calculateHeightByWidth(videoWidth, videoHeight, this.newWidthOfWindow);
        } else if (videoRatio === minWindowRatio) {
          [this.newWidthOfWindow, this.newHeightOfWindow] =
          [videoWidth, videoHeight];
        }
      }
    },

    $_calculateHeightByWidth(videoWidth, videoHeight, newWidth) {
      return newWidth / (videoWidth / videoHeight);
    },

    $_calculateWidthByHeight(videoWidth, videoHeight, newHeight) {
      return newHeight * (videoWidth / videoHeight);
    },
  },
  computed: {
    volume() {
      return this.$store.state.PlaybackState.Volume;
    },
    currentWindow() {
      return this.$electron.remote.getCurrentWindow();
    },
    currentScreen() {
      return this.$electron.screen.getPrimaryDisplay();
    },
  },
  watch: {
    volume(newVolume) {
      console.log(`set video volume ${newVolume}`);
      this.$refs.videoCanvas.volume = newVolume;
    },
  },
  created() {
    this.$bus.$on('reset-windowsize', () => {
      this.$_controlWindowSize(this.newWidthOfWindow, this.newHeightOfWindow);
    });
    this.$bus.$on('toggle-playback', () => {
      console.log('toggle-playback event has been triggered');
      if (this.$refs.videoCanvas.paused) {
        this.$bus.$emit('play');
      } else {
        this.$bus.$emit('pause');
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
    });
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
}
.video video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
