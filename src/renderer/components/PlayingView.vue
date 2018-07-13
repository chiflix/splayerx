<template>
  <div class="player"
  :style="{ cursor: cursorStyle }">
    <VideoCanvas :src="uri" />
    <div class="masking"
      v-show="showMask"></div>
    <div class="video-controller" id="video-controller"
      @mousedown.self="resetDraggingState"
      @mousedown.right.stop="handleRightClick"
      @mousedown.left.stop.prevent="handleLeftClick"
      @mouseup.left.prevent="handleMouseUp"
      @mousewheel="wheelVolumeControll"
      @mouseleave="hideAllWidgets"
      @mousemove="handleMouseMove"
      @dblclick.self="toggleFullScreenState">
      <titlebar currentView="Playingview"></titlebar>
      <TimeProgressBar :src="uri" />
      <TheTimeCodes/>
      <VolumeControl/>
      <SubtitleControl/>
      <PlayButton/>
      <!-- <AdvanceControl/> -->
    </div>
  </div>
</template>

<script>
import Titlebar from './Titlebar.vue';
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TheTimeCodes from './PlayingView/TheTimeCodes.vue';
import TimeProgressBar from './PlayingView/TimeProgressBar.vue';
import VolumeControl from './PlayingView/VolumeControl.vue';
import AdvanceControl from './PlayingView/AdvanceControl.vue';
import SubtitleControl from './PlayingView/SubtitleControl.vue';
import PlayButton from './PlayingView/PlayButton.vue';

export default {
  name: 'playing-view',
  components: {
    VideoCanvas,
    TheTimeCodes,
    TimeProgressBar,
    VolumeControl,
    AdvanceControl,
    SubtitleControl,
    Titlebar,
    PlayButton,
  },
  data() {
    return {
      isDragging: false,
      showMask: false,
      cursorShow: true,
      cursorDelay: null,
      popupShow: false,
      mouseDown: false,
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
      this.$bus.$emit('sub-ctrl-appear');
      this.$bus.$emit('titlebar-appear');
    },
    hideAllWidgets() {
      this.showMask = false;
      this.$bus.$emit('volumecontroller-hide');
      this.$bus.$emit('progressbar-hide');
      this.$bus.$emit('timecode-hide');
      if (process.platform !== 'win32') {
        this.$bus.$emit('titlebar-hide');
      }
      this.$bus.$emit('sub-ctrl-hide');
      this.$bus.$emit('titlebar-hide');
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
          this.$store.commit(
            'Volume',
            this.$store.state.PlaybackState.Volume + 0.1,
          );
        } else {
          this.$store.commit('Volume', 1);
        }
      } else if (e.deltaY > 0) {
        if (this.$store.state.PlaybackState.Volume - 0.1 > 0) {
          this.$store.commit(
            'Volume',
            this.$store.state.PlaybackState.Volume - 0.1,
          );
        } else {
          this.$store.commit('Volume', 0);
        }
      }
    },
    handleRightClick() {
      if (process.platform !== 'darwin') {
        const menu = this.$electron.remote.Menu.getApplicationMenu();
        menu.popup(this.$electron.remote.getCurrentWindow());
        this.popupShow = true;
      }
    },
    handleLeftClick() {
      const menu = this.$electron.remote.Menu.getApplicationMenu();
      if (this.popupShow === true) {
        menu.closePopup();
        this.popupShow = false;
      }
      // Handle dragging-related variables
      this.mouseDown = true;
    },
    handleMouseMove() {
      this.wakeUpAllWidgets();
    },
    handleMouseUp() {
      this.mouseDown = false;
      this.togglePlayback();
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
  background-image: linear-gradient(
    -180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.19) 62%,
    rgba(0, 0, 0, 0.29) 100%
  );
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
