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
  props: ['src'],
  created() {
    const self = this;
    self.state = '';
    this.$bus.$on('toggle-playback', ($event) => {
      console.log('toggle-playback event has been triggered', $event);
      if (self.state === 'pause') {
        self.$bus.$emit('play');
      } else {
        self.$bus.$emit('pause');
      }
    });
    this.$bus.$on('play', ($event) => {
      console.log('play event has been triggered', $event);
      self.state = 'play';
      self.$refs.videoCanvas.play();
    });
    this.$bus.$on('pause', ($event) => {
      console.log('pause event has been triggered', $event);
      self.state = 'pause';
      self.$refs.videoCanvas.pause();
    });
  },
  watch: {
  },
};
</script>

<style>
</style>
