<template>
  <div class="player">
    <VideoCanvas :src="uri" />
    <div class="video-controller" id="video-controller"
      v-on:click.capture="togglePlayback">
			<TimeProgressBar/>
      <TimeStatus/>
			<VolumeControl/>
			<AdvanceControl/>
		</div>
  </div>
</template>

<script>
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TimeStatus from './PlayingView/TimeStatus.vue';
import TimeProgressBar from './PlayingView/TimeProgressBar.vue';
import VolumeControl from './PlayingView/VolumeControl.vue';
import AdvanceControl from './PlayingView/AdvanceControl.vue';

export default {
  name: 'playing-view',
  components: {
    VideoCanvas,
    TimeStatus,
    TimeProgressBar,
    VolumeControl,
    AdvanceControl,
  },
  methods: {
    togglePlayback() {
      this.$bus.$emit('toggle-playback');
    },
  },
  watch: {
  },
  mounted() {
    this.$bus.$emit('play');
  },
  computed: {
    uri() {
      return this.$route.params.uri;
    },
  },
};
</script>

<style lang="scss">
.player {
	position: relative;
	width: 100%;
	height: 100%;
}

/*
 * Controller
 * 视频控制组件
 */
.video-controller {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  opacity: 1;
  transition: opacity 200ms; }
  .video-controller .background {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.3;
    background-image: linear-gradient(-180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.19) 62%, rgba(0, 0, 0, 0.29) 100%); }
  .video-controller .playstate {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%; }

  .video-controller.video-controller--mouseout {
    opacity: 0;
  }

</style>
