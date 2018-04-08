<template>
  <div class="video">
    <video ref="videoCanvas"
      preload="metadata"
      v-on:playing="onplaying"
      v-on:pause="onpause"
      v-on:timeupdate="timeupdate"
      v-on:durationchange="durationchange"
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
    onpause() {
      console.log('onpause');
    },
    onplaying() {
      console.log('onplaying');
    },
    togglePlayback() {

    },
    timeupdate() {
      console.log('ontimeupdate');
      const t = Math.floor(this.$refs.videoCanvas.currentTime);
      if (t !== this.$store.state.PlaybackState.CurrentTime) {
        this.$store.commit('CurrentTime', t);
      }
    },
    durationchange() {
      console.log('durationchange');
      const t = Math.floor(this.$refs.videoCanvas.duration);
      if (t !== this.$store.state.PlaybackState.duration) {
        this.$store.commit('Duration', t);
      }
    },
  },
  created() {
    this.$bus.$on('toggle-playback', ($event) => {
      console.log('toggle-playback event has been triggered', $event);
      if (this.$refs.videoCanvas.paused) {
        this.$bus.$emit('play');
      } else {
        this.$bus.$emit('pause');
      }
    });
    this.$bus.$on('play', ($event) => {
      console.log('play event has been triggered', $event);
      this.$refs.videoCanvas.play();
    });
    this.$bus.$on('pause', ($event) => {
      console.log('pause event has been triggered', $event);
      this.$refs.videoCanvas.pause();
    });
  },
  watch: {
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
