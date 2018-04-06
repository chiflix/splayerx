<template>
  <video ref="videoCanvas"
    preload="metadata"
    v-on:playing="onplaying"
    v-on:pause="onpause"
    v-on:timeupdate="timeupdate"
    :src="src">
  </video>
</template>;

<script>
// https://www.w3schools.com/tags/ref_av_dom.asp

export default {
  data() {
    return {
    };
  },
  props: ['src'],
  methods: {
    onpause() {
      console.log('onpause');
    },
    onplaying() {
      console.log('onplaying');
    },
    timeupdate() {
      console.log('ontimeupdate');
      this.$store.commit('CurrentTime', this.$refs.videoCanvas.currentTime);
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

<style>
</style>
