<template>
  <div class="player"
  :style="{ cursor: cursorStyle }">
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
      <TimeProgressBar :src="uri" />
      <TheTimeCodes/>
      <VolumeControl/>
      <SubtitleButton/>
      <!-- <AdvanceControl/> -->
    </div>
  </div>
</template>

<script>
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TheTimeCodes from './PlayingView/TheTimeCodes.vue';
import TimeProgressBar from './PlayingView/TimeProgressBar.vue';
import VolumeControl from './PlayingView/VolumeControl.vue';
import AdvanceControl from './PlayingView/AdvanceControl.vue';
import SubtitleButton from './PlayingView/SubtitleButton.vue';

export default {
  name: 'playing-view',
  components: {
    VideoCanvas,
    TheTimeCodes,
    TimeProgressBar,
    VolumeControl,
    AdvanceControl,
    SubtitleButton,
  },
  data() {
    return {
      isDragging: false,
      showMask: false,
      cursorShow: true,
      cursorDelay: null,
    };
  },
  methods: {
    toggleFullScreenState() {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      if (currentWindow.isFullScreen()) {
        currentWindow.setFullScreen(false);
        this.$bus.$emit('reset-windowsize');
      } else {
        currentWindow.setAspectRatio(0);
        currentWindow.setFullScreen(true);
      }
    },
    /**
     * When the cursor shows, add a timeout function
     * to hide the cursor. Each time the cursor moves,
     * clear the timeout function and add a new one.
     */
    cursorDisplayControl() {
      this.cursorShow = true;
      clearTimeout(this.cursorDelay);
      this.cursorDelay = setTimeout(() => {
        this.cursorShow = false;
      }, 3000);
    },
    wakeUpAllWidgets() {
      this.showMask = true;
      this.isDragging = true;
      this.cursorDisplayControl();
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
    this.$electron.remote.getCurrentWindow().setResizable(true);
  },
  computed: {
    uri() {
      return this.$store.state.PlaybackState.SrcOfVideo;
    },
    cursorStyle() {
      return this.cursorShow ? 'default' : 'none';
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
