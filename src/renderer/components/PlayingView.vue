<template>
  <div class="player">
    <VideoCanvas :src="uri" />
    <div class="video-controller" id="video-controller"
      @mousedown.stop="togglePlayback"
      @mouseup.stop="sendMouseupMessage"
      @mousewheel="wheelVolumeControll"
      @mousemove="wakeUpAllWidgets"
      @dblclick="toggleFullScreenState">
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
    toggleFullScreenState() {
      if (this.currentWindow.isFullScreen()) {
        this.currentWindow.setFullScreen(false);
        this.$bus.$emit('reset-windowsize');
      } else {
        this.currentWindow.setAspectRatio(0);
        this.currentWindow.setFullScreen(true);
      }
    },
    wakeUpAllWidgets() {
      this.$bus.$emit('volumecontroller-appear');
    },
    togglePlayback() {
      this.$bus.$emit('toggle-playback');
    },
    sendMouseupMessage() {
      this.$bus.$emit('volume-mouseup');
      this.$bus.$emit('progressbar-mouseup');
    },
    wheelVolumeControll(e) {
      this.$bus.$emit('volumecontroller-appear');
      this.$bus.$emit('volumeslider-appear');
      if (e.deltaY < 0) {
        if (this.$store.state.PlaybackState.Volume + 0.1 < 1) {
          this.$store.commit('Volume', this.$store.state.PlaybackState.Volume + 0.1);
        } else {
          this.$store.commit('Volume', 1);
        }
      } else if (e.deltaY > 0) {
        if (this.$store.state.PlaybackState.Volume - 0.1 > 0) {
          this.$store.commit('Volume', this.$store.state.PlaybackState.Volume - 0.1);
        } else {
          this.$store.commit('Volume', 0);
        }
      }
    },
  },
  mounted() {
    this.$bus.$emit('play');
  },
  computed: {
    uri() {
      return this.$store.state.PlaybackState.SrcOfVideo;
    },
    currentWindow() {
      return this.$electron.remote.getCurrentWindow();
    },
  },
};
</script>

<style lang="scss">
.player {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: black;
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
