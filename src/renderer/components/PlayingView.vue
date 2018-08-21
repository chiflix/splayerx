<template>
  <div class="player"
  :style="{ cursor: cursorStyle }">
    <VideoCanvas :src="uri" ref="VideoCanvasRef"/>
    <div class="masking"
      v-show="showMask"></div>
    <div class="video-controller" id="video-controller"
      @mousedown.self="resetDraggingState"
      @mousedown.right.stop="handleRightClick"
      @mousedown.left.stop.prevent="handleLeftClick"
      @mouseup.left.prevent="handleMouseUp"
      @mousewheel="wheelVolumeControll"
      @mouseleave="mouseleaveHandler"
      @mousemove.self="throttledWakeUpCall"
      @mouseenter="mouseEnter">
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
import _ from 'lodash';
import Titlebar from './Titlebar.vue';
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TheTimeCodes from './PlayingView/TheTimeCodes.vue';
import TimeProgressBar from './PlayingView/TimeProgressBar.vue';
import VolumeControl from './PlayingView/VolumeControl.vue';
import AdvanceControl from './PlayingView/AdvanceControl.vue';
import SubtitleControl from './PlayingView/SubtitleControl.vue';
import PlayButton from './PlayingView/PlayButton.vue';
import UnfousedHelper from './PlayingView/helpers/macUnfocusHelper.js';

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
      leave: false,
      isDragging: false,
      showMask: false,
      cursorShow: true,
      popupShow: false,
      mouseDown: false,
      throttledWakeUpCall: null,
      timeoutIdOfAllWidgetsDisappearDelay: 0,
      // the following 3 properties are used for checking if an event is a click or an dblclick
      // during 200miliseconds, if a second click is detected, will toggle "FullScreen"
      delay: 200, // changable and should be discussed.
      clicks: 0,
      timer: null,
      mainWindow: null,
      unfocusedHelper: null,
      dragRadiusSquare: 25,
      dragTime: 200,
      mouseDownTime: null,
      mouseDownCursorPosition: null,
    };
  },
  created() {
    this.mainWindow = this.$electron.remote.getCurrentWindow();
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
    wakeUpAllWidgets() {
      if (!this.leave) {
        this.showMask = true;
        this.isDragging = true;
        this.cursorShow = true;
        this.$bus.$emit('volumecontroller-appear');
        this.$bus.$emit('progressbar-appear');
        this.$bus.$emit('timecode-appear');
        this.$bus.$emit('sub-ctrl-appear');
        this.$bus.$emit('titlebar-appear');
        if (this.timeoutIdOfAllWidgetsDisappearDelay !== 0) {
          clearTimeout(this.timeoutIdOfAllWidgetsDisappearDelay);
          this.timeoutIdOfAllWidgetsDisappearDelay
              = setTimeout(this.hideAllWidgets, 3000);
        } else {
          this.timeoutIdOfAllWidgetsDisappearDelay
              = setTimeout(this.hideAllWidgets, 3000);
        }
      }
      this.leave = false;
    },
    mouseEnter() {
      console.log(document.hidden);
      if (this.unfocusedHelper.needHandle()) {
        this.wakeUpAllWidgets();
      }
    },
    mouseleaveHandler() {
      if (!this.unfocusedHelper.needHandle()) return;
      this.leave = true;
      if (this.timeoutIdOfAllWidgetsDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfAllWidgetsDisappearDelay);
        this.timeoutIdOfAllWidgetsDisappearDelay
            = setTimeout(this.hideAllWidgets, 1500);
      } else {
        this.timeoutIdOfAllWidgetsDisappearDelay
            = setTimeout(this.hideAllWidgets, 1500);
      }
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
      this.cursorShow = false;
    },
    resetDraggingState() {
      this.isDragging = false;
    },
    togglePlayback() {
      this.$bus.$emit('toggle-playback');
    },
    wheelVolumeControll(e) {
      this.$bus.$emit('volumecontroller-appear-delay');
      this.$bus.$emit('volumeslider-appear');
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
    handleRightClick() {
      if (process.platform !== 'darwin') {
        const menu = this.$electron.remote.Menu.getApplicationMenu();
        menu.popup(this.$electron.remote.getCurrentWindow());
        this.popupShow = true;
      }
    },
    handleLeftClick() {
      this.mouseDownCursorPosition = this.$electron.screen.getCursorScreenPoint();
      this.mouseDownTime = new Date();
      const menu = this.$electron.remote.Menu.getApplicationMenu();
      if (this.popupShow === true) {
        menu.closePopup();
        this.popupShow = false;
      }
      // Handle dragging-related variables
      this.mouseDown = true;
      return false;
    },
    handleMouseMove() {
      if (!this.unfocusedHelper.needHandle()) return;
      this.wakeUpAllWidgets();
    },
    handleMouseUp() {
      this.mouseDown = false;
      this.clicks += 1; // one click(mouseUp) triggered, clicks + 1
      if (this.clicks === 1) { // if one click has been detected - clicks === 1
        const self = this; // define a constant "self" for the following scope to use
        if (this.isValidClick()) {
          this.timer = setTimeout(() => { // define timer as setTimeOut function
            self.togglePlayback(); // which is togglePlayback
            self.clicks = 0; // reset the "clicks" to zero for next event
          }, this.delay);
        } else {
          self.clicks = 0;
        }
      } else { // else, if a second click has been detected - clicks === 2
        clearTimeout(this.timer); // cancel the time out
        this.toggleFullScreenState();
        this.clicks = 0;// reset the "clicks" to zero
      }
    },
    isValidClick() { // this check will be at on mouse up
      const cp = this.$electron.screen.getCursorScreenPoint();
      if (new Date() - this.mouseDownTime > this.dragTime) {
        return false;
      }
      const radiusSquare = ((cp.x - this.mouseDownCursorPosition.x) ** 2) +
          ((cp.y - this.mouseDownCursorPosition.y) ** 2);
      if (radiusSquare - this.dragRadiusSquare > 0) {
        return false;
      }
      return true;
    },
  },
  beforeMount() {
    this.throttledWakeUpCall = _.throttle(this.handleMouseMove, 1000);
  },
  mounted() {
    this.unfocusedHelper = new (UnfousedHelper())(this.mainWindow, this);
    this.$bus.$emit('play');
    this.$electron.remote.getCurrentWindow().setResizable(true);
    this.$bus.$on('clear-all-widget-disappear-delay', () => {
      clearTimeout(this.timeoutIdOfAllWidgetsDisappearDelay);
    });
    this.$bus.$on('hide-all-widgets', this.hideAllWidgets);
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
