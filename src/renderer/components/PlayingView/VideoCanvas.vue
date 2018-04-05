<template>
  <video ref="videoCanvas"
    preload="metadata"
    onplaying="onplaying"
    onpause="onpause"
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
    onpause(e) {
      console.log(e);
    },
    onplaying(e) {
      console.log(e);
    },
  },
  created() {
    const self = this;
    this.$bus.$on('toggle-playback', ($event) => {
      console.log('toggle-playback event has been triggered', $event);
      if (self.$refs.videoCanvas.paused) {
        self.$bus.$emit('play');
      } else {
        self.$bus.$emit('pause');
      }
    });
    this.$bus.$on('play', ($event) => {
      console.log('play event has been triggered', $event);
      self.$refs.videoCanvas.play();
    });
    this.$bus.$on('pause', ($event) => {
      console.log('pause event has been triggered', $event);
      self.$refs.videoCanvas.pause();
    });
  },
  watch: {
  },
};
</script>

<style>
</style>
