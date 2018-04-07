<template>
  <div class="player">
    <div class="video">
      <VideoCanvas :src="uri" ref="videoCanvas">
      </VideoCanvas>
    </div>
    <div class="video-controller" id="video-controller">
			<div class="background"></div>
			<div class="playstate" id="playstate"></div>
			<TimeProgressBar/>
      <TimeStatus/>
			<div class="volume" id="volume">
				<div class="volume--bar volume--mouseover">
					<div class="volume--current">
					</div>
				</div>
				<div class="button" id="volume--button" >
					<embed src="assets/icon-volume.svg" type="image/svg+xml" wmode="transparent">
				</div>
			</div>
			<div class="advanced" id="advanced">
				<div class="button" id="advance--button">
					<embed src="assets/icon-advanced.svg" type="image/svg+xml">
				</div>
			</div>
		</div>
  </div>
</template>

<script>
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TimeStatus from './PlayingView/TimeStatus.vue';
import TimeProgressBar from './PlayingView/TimeProgressBar.vue';

export default {
  name: 'playing-view',
  components: {
    VideoCanvas,
    TimeStatus,
    TimeProgressBar,
  },
  methods: {
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

  .video-controller .volume {
    position: absolute;
    bottom: 25px;
    right: 75px;
    width: 30px;
    height: 150px; }
    .video-controller .volume .volume--bar {
      width: 15px;
      height: 80%;
      margin: 0 auto;
      background-color: white;
      opacity: 0; }
      .video-controller .volume .volume--bar.volume--mouseover {
        opacity: 1; }
  .video-controller .advanced {
    position: absolute;
    bottom: 25px;
    right: 30px;
    width: 30px;
    height: 120px; }
  .video-controller .button {
    position: absolute;
    bottom: 0px;
    width: 30px;
    height: 24px; }
    .video-controller .button embed {
      width: 30px;
      height: 24px;
      pointer-events: none; }
  .video-controller.video-controller--mouseout {
    opacity: 0; }

.video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden; }
  .video video {
    width: 100%;
    height: 100%;
    object-fit: contain; }
</style>
