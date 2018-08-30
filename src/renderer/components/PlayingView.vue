<template>
  <div :data-component-name="$options.name" class="player" @mousewheel="wheelVolumeControll">
    <the-video-canvas :src="uri" ref="VideoCanvasRef"/>
    <the-video-controller/>
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
    wheelVolumeControll(e) {
      if (e.deltaY < 0) {
        if (this.$store.state.PlaybackState.Volume + 0.1 < 1) {
          this.$bus.$emit(
            'volume',
            this.$store.state.PlaybackState.Volume + 0.1,
          );
        } else {
          this.$bus.$emit('volume', 1);
        }
      } else if (e.deltaY > 0) {
        if (this.$store.state.PlaybackState.Volume - 0.1 > 0) {
          this.$bus.$emit(
            'volume',
            this.$store.state.PlaybackState.Volume - 0.1,
          );
        } else {
          this.$bus.$emit('volume', 0);
        }
      }
    },
  },
  mounted() {
    this.$bus.$emit('play');
    this.$electron.remote.getCurrentWindow().setResizable(true);
  },
  computed: {
    uri() {
      return this.$store.state.PlaybackState.SrcOfVideo;
    },
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
