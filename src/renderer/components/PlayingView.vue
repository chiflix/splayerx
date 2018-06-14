<template>
  <div class="player">
    <VideoCanvas :src="uri" />
    <div class="masking"
      v-show="showMask"></div>
    <div class="video-controller" id="video-controller"
      @mousedown.self="resetDraggingState"
      @mouseup="togglePlayback"
      @mousewheel="wheelVolumeControll"
      @mousemove="wakeUpAllWidgets"
      @mouseout="hideAllWidgets"
      @dblclick.self="toggleFullScreenState">
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
  data() {
    return {
      showMask: false,
      isDragging: false,
    };
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
      this.showMask = true;
      this.isDragging = true;
      this.$bus.$emit('volumecontroller-appear');
      this.$bus.$emit('progressbar-appear');
      this.$bus.$emit('timecode-appear');
    },
    hideAllWidgets() {
      this.showMask = false;
      this.$bus.$emit('volumecontroller-hide');
      this.$bus.$emit('progressbar-hide');
      this.$bus.$emit('timecode-hide');
    },
    resetDraggingState() {
      this.isDragging = false;
    },
    togglePlayback() {
      if (!this.isDragging) {
        this.$bus.$emit('toggle-playback');
      }
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
.masking {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 50%;
  opacity: 0.3;
  background-image: linear-gradient(-180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.19) 62%, rgba(0,0,0,0.29) 100%);
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

</style>
