<template>
  <transition name="fade" appear>
  <div class="progress"
    @mouseover.stop="appearProgressSlider"
    @mouseout.stop="hideProgressSlider"
    @mousemove="onProgresssBarMove"
    v-show="showProgressBar">
    <div class="fool-proof-bar" ref="foolProofBar"
      @mousedown.left.stop="videoRestart">
      <div class="button"></div>
    </div>
    <div class="progress-container" ref="sliderContainer"
      @mousedown.left.stop="onProgresssBarClick">
      <div class="screenshot-background"
        v-show="showScreenshot"
        :style="{ left: positionOfScreenshot +'px', width: widthOfThumbnail + 'px', height: heightofScreenshot +'px' }">
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
      </div>
      <div class="progress-backward" ref="backwardSlider"
        v-show="showProgressBackward"
        :style="{ left: cursorPosition + 0.1 + 'px', width: backwardWidth + 'px' }">
        <div class="line"></div>
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
 * 2. seek 后快进的不正常显示 -- done
 * 3. 由于mouseover于mouseout而产生的多次调用问题
 * 4. 重做回退进度条 -- done
*/

import {
  SCREENSHOT_SIDE_MARGIN_WIDTH,
  PROGRESS_BAR_HEIGHT,
  PROGRESS_BAR_HIDE_HEIGHT,
  PROGRESS_BAR_SLIDER_HIDE_HEIGHT,
  FOOL_PROOFING_BAR_WIDTH,
} from '@/constants';

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
      console.log('appear progress slider');
      this.$refs.playedSlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.readySlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.foolProofBar.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.backwardSlider.style.height = PROGRESS_BAR_HEIGHT;
    },
    hideProgressSlider() {
      if (!this.onProgressSliderMousedown) {
        console.log('hide progress slider');
        this.$refs.playedSlider.style.height = PROGRESS_BAR_SLIDER_HIDE_HEIGHT;
        this.$refs.foolProofBar.style.height = PROGRESS_BAR_SLIDER_HIDE_HEIGHT;
        this.$refs.readySlider.style.height = PROGRESS_BAR_HIDE_HEIGHT;
        this.$refs.backwardSlider.style.height = PROGRESS_BAR_HIDE_HEIGHT;
      }
    },
    appearProgressBar() {
      this.$_clearTimeoutDelay();
      this.showProgressBar = true;
    },
    hideProgressBar() {
      if (!this.onProgressSliderMousedown) {
        this.showProgressBar = false;
        this.hideProgressSlider();
      }
    },
    videoRestart() {
      this.showProgressBackward = false;
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
        document.onmousemove = null;
        this.onProgressSliderMousedown = false;
        this.showScreenshot = false;
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
      return width > 0 ? width : 0;
    },
    widthOfThumbnail() {
      if (this.widthOfWindow < 845) {
        return 136;
      } else if (this.widthOfWindow < 1920) {
        return 170;
      }
      return 240;
    },
    heightofScreenshot() {
      return this.widthOfThumbnail / this.videoRatio;
    },
    positionOfScreenshot() {
      const progressBarWidth = this.currentWindow.getSize()[0] - FOOL_PROOFING_BAR_WIDTH;
      const halfWidthOfScreenshot = this.widthOfThumbnail / 2;
      const minWidth = this.widthOfThumbnail + SCREENSHOT_SIDE_MARGIN_WIDTH;
      const maxWidth = progressBarWidth - SCREENSHOT_SIDE_MARGIN_WIDTH;
      if (this.widthOfReadyToPlay < minWidth) {
        return SCREENSHOT_SIDE_MARGIN_WIDTH - FOOL_PROOFING_BAR_WIDTH;
      } else if (this.widthOfReadyToPlay + halfWidthOfScreenshot > maxWidth) {
        return maxWidth - this.widthOfThumbnail;
      }
      return this.widthOfReadyToPlay - halfWidthOfScreenshot;
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
      this.showProgressBackward = false;
      this.widthOfReadyToPlay = 0;
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
}

.video-controller .progress-backward {
  position: absolute;
  bottom: 0;
  height: 0px;
  transition: height 150ms;

  .line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(150, 150, 150, 0.9);
    z-index: 100;
    // background: rgb(0, 0, 0);
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
