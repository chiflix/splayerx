<template>
  <transition name="fade" appear>
  <div class="progress"
    @mouseover="appearProgressSlider"
    @mouseout="hideProgressSlider"
    @mousemove="onProgresssBarMove"
    v-show="showProgressBar">
    <div class="fool-proof-bar" ref="foolProofBar"
      @mousedown.left="videoRestart">
      <div class="button"></div>
    </div>
    <div class="progress-container" ref="sliderContainer"
      @mousedown.left="onProgresssBarClick">
      <div class="screenshot-background"
        v-show="showScreenshot"
        :style="{ left: positionOfScreenshot +'px', height: heightofScreenshot +'px' }">
        <div class="screenshot">
          <div class="time">
            {{ screenshotContext }}
          </div>
        </div>
      </div>
      <div class="progress-ready" ref="readySlider">
        <div class="background-line"></div>
        <div class="line"
        :style="{ width: cursorPosition +'px' }"></div>
        <div class="playbackward-line"
        v-if="showProgressBackward"
        :style="{ left: cursorPosition + 'px', width: backwardWidth + 'px'}"></div>
      </div>
      <div class="progress-played" ref="playedSlider"
      :style="{ width: progress +'%' }">
        <div class="line"></div>
      </div>
    </div>
  </div>
</transition>
</template>;

<script>
/**
 * TODO:
 * 1. 常量变量放入常量组件
 * 2. seek进度条产生的问题
 * 3. seek 后backward line的left保持为0
*/

const WIDTH_OF_SCREENSHOT = 170;
const HALF_WIDTH_OF_SCREENSHOT = 85;
const SCREENSHOT_SIDE_MARGIN_WIDTH = 16;

const PROGRESS_BAR_HEIGHT = '10px';
const PROGRESS_BAR_SLIDER_HIDE_HEIGHT = '4px';
const PROGRESS_BAR_HIDE_HEIGHT = '0px';

const FOOL_PROOFING_BAR_WIDTH = 20;

export default {
  data() {
    return {
      showScreenshot: false,
      showProgressBar: true,
      showProgressBackward: false,
      onProgressSliderMousedown: false,
      timeoutIdOfProgressBarDisappearDelay: 0,
      percentageOfReadyToPlay: 0,
      widthOfReadyToPlay: 0,
      videoRatio: 0,
      percentageVideoDraged: 0,
      flagProgressBarDraged: false,
    };
  },
  methods: {
    appearProgressSlider() {
      this.$_clearTimeoutDelay();
      this.$refs.playedSlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.readySlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.foolProofBar.style.height = PROGRESS_BAR_HEIGHT;
    },
    hideProgressSlider() {
      if (!this.onProgressSliderMousedown) {
        this.showScreenshot = false;
        this.widthOfReadyToPlay = 0;
        this.$refs.playedSlider.style.height = PROGRESS_BAR_SLIDER_HIDE_HEIGHT;
        this.$refs.foolProofBar.style.height = PROGRESS_BAR_SLIDER_HIDE_HEIGHT;
        this.$refs.readySlider.style.height = PROGRESS_BAR_HIDE_HEIGHT;
      }
    },
    appearProgressBar() {
      this.showProgressBar = true;
    },
    hideProgressBar() {
      if (!this.onProgressSliderMousedown) {
        this.showProgressBar = false;
      }
    },
    videoRestart() {
      this.$bus.$emit('seek', 0);
    },
    onProgresssBarClick(e) {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      this.onProgressSliderMousedown = true;
      const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
      const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
      this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
      this.documentProgressDragClear();
      this.documentProgressDragEvent();
    },
    /**
     * @param e mousemove event
     */
    effectProgressBarDraged(e) {
      const progressBarWidth = this.currentWindow.getSize()[0] - FOOL_PROOFING_BAR_WIDTH;
      const curProgressBarWidth = (progressBarWidth * (this.progress / 100))
       + FOOL_PROOFING_BAR_WIDTH;
      const cursorPosition = e.clientX - FOOL_PROOFING_BAR_WIDTH;
      // console.log(curProgressBarWidth);
      // console.log(cursorPosition);
      if (cursorPosition < curProgressBarWidth) {
        if (cursorPosition >= 0 || (curProgressBarWidth > 0 && cursorPosition < 0)) {
          this.showProgressBackward = true;
        } else {
          this.showProgressBackward = false;
        }
      } else {
        this.showProgressBackward = false;
      }
      const progress = cursorPosition
        / this.$refs.sliderContainer.clientWidth;
      if (progress >= 1) {
        this.percentageOfReadyToPlay = 1;
      } else if (progress <= 0) {
        this.percentageOfReadyToPlay = 0;
      } else {
        this.percentageOfReadyToPlay = progress;
      }
      this.widthOfReadyToPlay = cursorPosition;
      this.showScreenshot = true;
    },
    /**
     * documentProgressDragEvent fuction help to set a
     * mouse move event to seek the video when the
     * cursor is at mouse down event and is moved in
     * the screen.
     */
    documentProgressDragEvent() {
      document.onmousemove = (e) => {
        this.effectProgressBarDraged(e);
        const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
        this.percentageVideoDraged = (e.clientX - sliderOffsetLeft)
         / this.$refs.sliderContainer.clientWidth;
        this.flagProgressBarDraged = true;
      };
    },
    /**
     * documentProgressDragClear function is an event to
     * clear the document mouse move event and clear
     * mouse down status
     */
    documentProgressDragClear() {
      document.onmouseup = () => {
        this.onProgressSliderMousedown = false;
        document.onmousemove = null;
        // 可以考虑其他的方案
        if (this.flagProgressBarDraged) {
          this.$bus.$emit('seek', this.percentageVideoDraged
           * this.$store.state.PlaybackState.Duration);
          this.flagProgressBarDraged = false;
        }
      };
    },
    /**
     * @param e mousemove event
     * This mousemove event only works when the cursor
     * is not at mouse down event.
     */
    onProgresssBarMove(e) {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      if (!this.onProgressSliderMousedown) {
        this.effectProgressBarDraged(e);
      }
    },
    $_clearTimeoutDelay() {
      if (this.timeoutIdOfProgressBarDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfProgressBarDisappearDelay);
      }
    },
  },
  computed: {
    progress() {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return 0;
      }
      return (100 * this.$store.state.PlaybackState.AccurateTime)
        / (this.$store.state.PlaybackState.Duration);
    },
    backwardWidth() {
      const progressBarWidth = this.currentWindow.getSize()[0];
      const width = (progressBarWidth * (this.progress / 100))
        - this.cursorPosition;
      // console.log(this.$store.state.PlaybackState.AccurateTime);
      // console.log(progressBarWidth);
      // console.log(`progressbarWidth ${progressBarWidth * (this.progress / 100)}`);
      // console.log(`cursorPosition ${this.cursorPosition}`);
      // console.log(`width ${width}`);
      return width > 0 ? width : 0;
    },
    heightofScreenshot() {
      return WIDTH_OF_SCREENSHOT / this.videoRatio;
    },
    positionOfScreenshot() {
      const progressBarWidth = this.currentWindow.getSize()[0] - FOOL_PROOFING_BAR_WIDTH;
      const minWidth = HALF_WIDTH_OF_SCREENSHOT + SCREENSHOT_SIDE_MARGIN_WIDTH;
      const maxWidth = progressBarWidth - SCREENSHOT_SIDE_MARGIN_WIDTH;
      if (this.widthOfReadyToPlay < minWidth) {
        return SCREENSHOT_SIDE_MARGIN_WIDTH - FOOL_PROOFING_BAR_WIDTH;
      } else if (this.widthOfReadyToPlay + HALF_WIDTH_OF_SCREENSHOT > maxWidth) {
        return maxWidth - WIDTH_OF_SCREENSHOT;
      }
      return this.widthOfReadyToPlay - HALF_WIDTH_OF_SCREENSHOT;
    },
    screenshotContext() {
      return this.timecodeFromSeconds(this.percentageOfReadyToPlay
        * this.$store.state.PlaybackState.Duration);
    },
    currentWindow() {
      return this.$electron.remote.getCurrentWindow();
    },
    cursorPosition() {
      return this.widthOfReadyToPlay;
    },
  },
  created() {
    this.$bus.$on('progressslider-appear', () => {
      this.appearProgressSlider();
      if (this.timeoutIdOfProgressBarDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfProgressBarDisappearDelay);
        this.timeoutIdOfProgressBarDisappearDelay
          = setTimeout(this.hideProgressBar, 3000);
      } else {
        this.timeoutIdOfProgressBarDisappearDelay
          = setTimeout(this.hideProgressBar, 3000);
      }
    });
    this.$bus.$on('progressbar-appear', () => {
      this.appearProgressBar();
      if (this.timeoutIdOfProgressBarDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfProgressBarDisappearDelay);
        this.timeoutIdOfProgressBarDisappearDelay
          = setTimeout(this.hideProgressBar, 3000);
      } else {
        this.timeoutIdOfProgressBarDisappearDelay
          = setTimeout(this.hideProgressBar, 3000);
      }
    });
    this.$bus.$on('progressbar-hide', () => {
      this.hideProgressBar();
    });
    this.$bus.$on('screenshot-sizeset', (e) => {
      this.videoRatio = e;
    });
  },
};

</script>

<style lang="scss">

.video-controller .progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px;
  -webkit-app-region: no-drag;
  z-index: 700;

  .progress-container:hover {
    cursor: pointer;
  }

  .fool-proof-bar {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 4px;
    width: 20px;
    transition: height 150ms;

    .button {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
    }
  }
  .progress-container {
   position: absolute;
   left: 20px;
   bottom: 0;
   width: 100%;
   height: 100%;

   .screenshot {
     position: relative;
     width: 170px;
     height: 100%;
     border: 1px solid transparent;
     border-radius: 1px;
     background-color: #000;
     background-clip: padding-box;
     display: flex;
     justify-content: center;
     align-items: center;

     .time {
       color: rgba(255, 255, 255, 0.7);
       font-size: 24px;
       letter-spacing: 0.2px;
       position: absolute;
       width: 100%;
       text-align: center;
     }
   }

   .screenshot-background {
     position: absolute;
     width: 170px;
     bottom: 26px;
     box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 5px;
     background-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5) 0%, rgba(84, 84, 84, 0.5) 100%);
     border-radius: 1px;
     z-index: 100;
   }
 }
}

.video-controller .progress-played {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 4px;
  transition: height 150ms;

  .line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
  }
}

.video-controller .progress-ready {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0px;
  transition: height 150ms;

  .line {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
  }
  .background-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
  }
  .playbackward-line {
    position: absolute;
    bottom: 0;
    height: 100%;
    background: rgba(151, 151, 151, 0.9);
    z-index: 23;
  }
}

.fade-enter-active {
 transition: opacity 100ms;
}

.fade-leave-active {
 transition: opacity 400ms;
}

.fade-enter-to, .fade-leave {
 opacity: 1;
}

.fade-enter, .fade-leave-to {
 opacity: 0;
}

</style>
