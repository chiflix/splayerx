<template>
  <div class="video">
    <video ref="videoCanvas"
      preload="metadata"
      v-on:playing="onPlaying"
      v-on:pause="onPause"
      v-on:canplay="onCanPlay"
      v-on:timeupdate="onTimeupdate"
      v-on:loadedmetadata="onMetaLoaded"
      v-on:durationchange="onDurationChange"
      v-on:click=""
      :src="src">
    </video>
  </div>
</template>;

<script>
// https://www.w3schools.com/tags/ref_av_dom.asp

export default {
  data() {
    return {
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
      const { videoHeight, videoWidth } = this.$refs.videoCanvas;

      this.$_calculateWindowSizeInConditionOfVideoExisted(videoWidth, videoHeight);
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
    $_calculateWindowSizeInConditionOfVideoExisted(videoWidth, videoHeight) {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      const [windowWidth, windowHeight] = currentWindow.getSize();
      const [minWidth, minHeight] = currentWindow.getMinimumSize();

      const videoRatio = videoWidth / videoHeight;
      const windowRatio = windowWidth / windowHeight;
      const minWindowRatio = minWidth / minHeight;

      let newWidth;
      let newHeight;

      if (videoWidth < windowWidth && videoHeight < windowHeight) {
        [newWidth, newHeight] = [videoWidth, videoHeight];
      } else if (videoWidth > windowWidth || videoHeight > windowHeight) {
        if (videoRatio > windowRatio) {
          newWidth = windowWidth;
          newHeight = this.$_calculateHeightByWidth(videoWidth, videoHeight, newWidth);
        } else if (videoRatio < windowRatio) {
          newHeight = windowHeight;
          newWidth = this.$_calculateWidthByHeight(videoWidth, videoHeight, newHeight);
        } else if (videoRatio === windowRatio) {
          [newWidth, newHeight] = [windowWidth, windowHeight];
        }
      }

      if (newWidth < minWidth || newHeight < minHeight) {
        if (videoRatio > minWindowRatio) {
          newHeight = minHeight;
          newWidth = this.$_calculateWidthByHeight(videoWidth, videoHeight, newHeight);
        } else if (videoRatio < minWindowRatio) {
          newWidth = minWidth;
          newHeight = this.$_calculateHeightByWidth(videoWidth, videoHeight, newWidth);
        } else if (videoRatio === minWindowRatio) {
          [newWidth, newHeight] = [videoWidth, videoHeight];
        }
      }

      currentWindow.setSize(parseInt(newWidth, 10), parseInt(newHeight, 10));
      currentWindow.setAspectRatio(videoWidth / videoHeight);
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
  },
  watch: {
    volume(newVolume) {
      console.log(`set video volume ${newVolume}`);
      this.$refs.videoCanvas.volume = newVolume;
    },
  },
  created() {
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
