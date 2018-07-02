<template>
  <div class="player"
  :style="{ cursor: cursorStyle }">
    <img src="~@/assets/icon-pause.svg" type="image/svg+xml"
      ref="pauseIcon" class="icon"
      @animationiteration="pauseIconPause">
    <img src="~@/assets/icon-play.svg" type="image/svg+xml"
      ref="playIcon" class="icon"
      @animationiteration="playIconPause">
    <VideoCanvas :src="uri" />
    <div class="masking"
      v-show="showMask"></div>
    <div class="video-controller" id="video-controller"
      @mousedown.self="resetDraggingState"
      @mousedown.left.stop.prevent="handleLeftClick"
      @mouseup.left.stop.prevent="handleMouseUp"
      @mousewheel="wheelVolumeControll"
      @mousemove="handleMouseMove"
      @mouseout="hideAllWidgets"
      @dblclick.self="toggleFullScreenState">
      <TimeProgressBar :src="uri" />
      <TheTimeCodes/>
      <VolumeControl/>
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
    handleLeftClick(event) {
      // Handle dragging-related variables
      this.mouseDown = true;
      this.windowStartPosition = this.$electron.remote.getCurrentWindow().getPosition();
      this.mousedownPosition = [event.screenX, event.screenY];
    },
    handleMouseMove(event) {
      this.wakeUpAllWidgets();
      // Handle dragging-related variables and methods
      if (this.mouseDown) {
        if (this.windowStartPosition !== null) {
          const startPos = this.mousedownPosition;
          const offset = [event.screenX - startPos[0], event.screenY - startPos[1]];
          const winStartPos = this.windowStartPosition;
          this.$electron.remote.getCurrentWindow().setPosition(
            winStartPos[0] + offset[0],
            winStartPos[1] + offset[1],
          );
        }
      }
    },
    handleMouseUp() {
      this.mouseDown = false;
      this.togglePlayback();
    },
    pauseIconPause() {
      this.$refs.pauseIcon.style.animationPlayState = 'paused';
    },
    playIconPause() {
      this.$refs.playIcon.style.animationPlayState = 'paused';
    },
  },
  mounted() {
    this.$bus.$emit('play');
    this.$electron.remote.getCurrentWindow().setResizable(true);
    this.$bus.$on('twinkle-pause-icon', () => {
      this.$refs.pauseIcon.style.animationPlayState = 'running';
    });
    this.$bus.$on('twinkle-play-icon', () => {
      this.$refs.playIcon.style.animationPlayState = 'running';
    });
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


@keyframes twinkle {
  0% {opacity: 0; width: 85px; height: 85px;};
  3% {opacity: 0; width: 85px; height: 85px;};
  50% {opacity: 1; width: 185px; height: 185px;};
  100% {opacity: 0; width: 285px; height: 285px;};
}
.icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: twinkle 400ms;
  animation-iteration-count: infinite;
  animation-play-state: paused;
  z-index: 1;
}
</style>
