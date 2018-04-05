<template>
  <video ref="videoCanvas"
    preload="metadata" :src="src">
  </video>
</template>;

<script>
export default {
  data() {
    return {
    };
  },
  props: ['src', 'state'],
  created() {
    this.$on('play', ($event) => {
      console.log('My event has been triggered', $event);
      this.$refs.videoCanvas.play();
    });
    this.$on('pause', ($event) => {
      console.log('My event has been triggered', $event);
      this.$refs.videoCanvas.pause();
    });
  },
  watch: {
    state(cmd) {
      switch (cmd) {
        default:
        case 'play':
          this.$refs.videoCanvas.play();
          break;
        case 'pause':
          this.$refs.videoCanvas.pause();
          break;
      }
    },
  },
};
</script>

<style>
</style>
