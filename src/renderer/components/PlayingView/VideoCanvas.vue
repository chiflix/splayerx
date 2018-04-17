<template>
  <div class="video">
    <video ref="videoCanvas"
      preload="metadata"
      @playing="onPlaying"
      @pause="onPause"
      @canplay="onCanPlay"
      @loadedmetadata="onMetaLoaded"
      @timeupdate="onTimeupdate"
      @durationchange="onDurationChange"
      @click=""
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
    onMetaLoaded() {
      console.log('loadedmetadata');

      const { videoHeight, videoWidth } = this.$refs.videoCanvas;

      const currentWindow = this.$electron.remote.getCurrentWindow();

      const [width, height] = currentWindow.getSize();

      const [MIN_WIDTH, MIN_HEIGHT] = currentWindow.getMinimumSize();

      let newWidth = width;
      let newHeight = height;

      if (width < MIN_WIDTH) {
        newWidth = MIN_WIDTH;
      }
      newHeight = newWidth * (videoHeight / videoWidth);
      if (newHeight < MIN_HEIGHT) {
        newHeight = MIN_HEIGHT;
        newWidth = newHeight * (videoWidth / videoHeight);
      }

      console.log(newWidth);

      currentWindow.setSize(newWidth, newHeight);
      currentWindow.setAspectRatio(newWidth / newHeight);
    },
    onCanPlay() {
      // the video is ready to start playing
      this.$store.commit('Volume', this.$refs.videoCanvas.volume);
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
