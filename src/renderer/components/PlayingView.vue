<template>
  <div class="player">
    <VideoCanvas :src="uri" />
    <div class="video-controller" id="video-controller"
      v-on:click.stop="togglePlayback">
			<TimeProgressBar/>
      <TheTimeCodes/>
			<VolumeControl/>
			<AdvanceControl/>
		</div>
  </div>
</template>

<script>
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TheTimeCodes from './PlayingView/TheTimeCodes.vue';
import TimeProgressBar from './PlayingView/TimeProgressBar.vue';
import VolumeControl from './PlayingView/VolumeControl.vue';
import AdvanceControl from './PlayingView/AdvanceControl.vue';

export default {
  name: 'playing-view',
  components: {
    VideoCanvas,
    TheTimeCodes,
    TimeProgressBar,
    VolumeControl,
    AdvanceControl,
  },
  methods: {
    togglePlayback() {
      this.$bus.$emit('toggle-playback');
    },
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
  transition: opacity 400ms;
}

.video-controller:not(:hover){
  opacity: 0;
}

</style>
