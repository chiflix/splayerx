<template>
  <div class="player">
    <div class="video">
      <video ref="videoCanvas"
        preload="metadata" :src="uri">
      </video>
    </div>
    <div  class="video-controller" id="video-controller">
			<div class="background"></div>
			<div class="playstate" id="playstate"></div>
			<div class="progress" id="progress">
				<div class="progress--played" id="progress--played">
					<div class="line" id="progress--line"></div>
					<!-- <div class="light"></div> -->
				</div>
			</div>
			<div class="timing" id="timing">
					<span class="time timing--current" id="timing--current"></span>
					<span class="time">/</span>
					<span class="time timing--total" id="timing--total"></span>
			</div>
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
import { mapGetters } from 'vuex';
import { PLAYBACKSTATE } from '../constants';

export default {
  name: 'playing-view',
  components: {
  },
  methods: {
    pause() {
      // change the playback state
      this.$store.dispatch('pausePlayback');
    },
  },
  watch: {
    playbackStat(val) {
      console.log(val);
      console.log(PLAYBACKSTATE.PAUSED);
      console.log(val === PLAYBACKSTATE.PAUSED);
      switch (val) {
        case PLAYBACKSTATE.PAUSED:
          console.log('pause');
          console.log(this.$refs.videoCanvas);
          this.$refs.videoCanvas.pause();
          break;
        case PLAYBACKSTATE.PLAYING:
          this.$refs.videoCanvas.play();
          break;
        default:
          break;
      }
    },
  },
  mounted() {
    console.log('PlayingView.playbackStat:');
    console.log(this.playbackStat);
    console.log('PlayingView.$route.params.uri');
    console.log(this.$route.params.uri);
    this.$store.dispatch('startPlayback');
  },
  computed: {
    ...mapGetters({
      playbackStat: 'getPlaybackStat',
    }),
    uri() {
      return this.$route.params.uri;
    },
  },
};
</script>

<style>
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
  .video-controller .progress {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30px; }
  .video-controller .progress--played {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0; }
    .video-controller .progress--played .line {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: #FFFFFF;
      box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
      transition: height 200ms; }
      .video-controller .progress--played .line.line--mouseover {
        height: 10px; }
    .video-controller .progress--played .light {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 300px;
      opacity: 0.1;
      background-image: linear-gradient(-180deg, rgba(255, 255, 255, 0) 76%, #FFFFFF 100%); }
  .video-controller .timing {
    position: absolute;
    bottom: 25px;
    left: 30px;
    height: 24px; }
    .video-controller .timing .time {
      display: inline-block;
      color: #FFFFFF;
      font: 600 18px 'Avenir';
      line-height: 24px;
      letter-spacing: 0.2px;
      user-select: none;
      opacity: .5; }
    .video-controller .timing .timing--current {
      opacity: 1; }
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
