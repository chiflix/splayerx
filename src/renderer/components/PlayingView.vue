<template>
  <div :data-component-name="$options.name" class="player">
    <the-video-canvas />
    <the-video-controller />
  </div>
</template>

<script>
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TheVideoController from './PlayingView/TheVideoController';

export default {
  name: 'playing-view',
  components: {
    'the-video-controller': TheVideoController,
    'the-video-canvas': VideoCanvas,
  },

  methods: {
  },
  mounted() {
    this.$electron.remote.getCurrentWindow().setMinimumSize(320, 180);
  },
};
</script>

<style lang="scss">
.player {
  width: 100%;
  height: 100%;
  background-color: black;
}
</style>
