<template>
  <transition name="fade" appear>
    <!-- 用mouseout监听会在经过两个div的分界处触发事件 -->
  <div class="progress"
    @mouseover.stop.capture="appearProgressSlider"
    @mouseleave="hideProgressSlider"
    @mousemove="onProgressBarMove"
    v-show="showProgressBar">
    <div class="fool-proof-bar" ref="foolProofBar"
      @mousedown.stop="videoRestart"
      :style="{cursor: cursorStyle}">
      <div class="fake-button"
        v-show="isOnProgress"
        @mousedown="handleFakeBtnClick"
        @mousemove.stop="handleFakeBtnMove"
        :style="{height: heightOfThumbnail + 11 + 'px'}"></div>
      <div class="line"
        v-show="!isShaking"></div>
      <div class="button"
        v-show="isShaking"
        :class="{shake: isShaking}"
        :style="{borderTopRightRadius: buttonRadius + 'px', borderBottomRightRadius: buttonRadius + 'px', width: buttonWidth + 'px', cursor: cursorStyle}"></div>
    </div>
    <div class="progress-container" ref="sliderContainer"
      :style="{width: this.winWidth - 20 + 'px'}"
      @mousedown.stop.capture="onProgressBarClick">
      <Thumbnail
        v-show="showScreenshot"
        :src=src
        :positionOfScreenshot="positionOfScreenshot"
        :widthOfThumbnail="widthOfThumbnail"
        :heightOfThumbnail="heightOfThumbnail"
        :screenshotContent="screenshotContent"
        :currentTime="thumbnailCurrentTime"/>
        <!-- translate优化 -->
      <div class="progress-ready" ref="readySlider">
        <div class="background-line"></div>
        <div class="line"
        :style="{ left: curProgressBarEdge + 'px', width: readyBarWidth +'px' }"></div>
      </div>
      <div ref="playedSlider"
        :class="{hidePlayedSlider: !isCursorLeft, progressPlayed: isCursorLeft}"
        :style="{ width: curProgressBarEdge +'px', opacity: progressOpacity }">
        <div class="line"></div>
      </div>
      <div class="progress-back" ref="backSlider"
        :style="{ width: backBarWidth + 'px' }">
        <div class="line"></div>
      </div>
    </div>
  </div>
</transition>
</template>;

<script>

import {
  PROGRESS_BAR_HEIGHT,
  PROGRESS_BAR_HIDE_HEIGHT,
  PROGRESS_BAR_SLIDER_HIDE_HEIGHT,
  FOOL_PROOFING_BAR_WIDTH,
} from '@/constants';
import Thumbnail from './Thumbnail.vue';

export default {
  components: {
    Thumbnail,
  },
  props: {
    src: {
      type: String,
      required: true,
      validator(value) {
        // TODO: check if its a file or url
        if (value.length <= 0) {
          return false;
        }
        return true;
      },
    },
  },
  data() {
    return {
      showScreenshot: false,
      showProgressBar: true,
      onProgressSliderMousedown: false,
      flagProgressBarDraged: false,
      isCursorLeft: false,
      isOnProgress: false,
      isShaking: false,
      isRestartClicked: false,
      timeoutIdOfProgressBarDisappearDelay: 0,
      timeoutIdOfBackBarDisapppearDelay: 0,
      timeoutIdOfHideProgressSlider: 0,
      timeoutIdOfHideAllWidgets: 0,
      percentageOfReadyToPlay: 0,
      cursorPosition: 0,
      videoRatio: 0,
      percentageVideoDraged: 0,
      widthOfThumbnail: 0,
      thumbnailCurrentTime: 0,
      buttonWidth: 20,
      buttonRadius: 0,
      cursorStyle: 'pointer',
    };
  },
  methods: {
    appearProgressSlider() {
      this.isOnProgress = true;
      this.$bus.$emit('clear-all-widget-disappear-delay');
      this.$refs.playedSlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.readySlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.foolProofBar.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.backSlider.style.height = PROGRESS_BAR_HEIGHT;
    },
    hideProgressSlider() {
      if (!this.onProgressSliderMousedown) {
        this.isOnProgress = false;
        this.showScreenshot = false;
        this.buttonRadius = 0;

        this.$refs.playedSlider.style.height = PROGRESS_BAR_SLIDER_HIDE_HEIGHT;
        this.$refs.foolProofBar.style.height = PROGRESS_BAR_SLIDER_HIDE_HEIGHT;
        this.$refs.readySlider.style.height = PROGRESS_BAR_HIDE_HEIGHT;
        this.$refs.backSlider.style.height = PROGRESS_BAR_SLIDER_HIDE_HEIGHT;
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
      this.buttonRadius = 0;
      this.showScreenshot = false;
      this.$bus.$emit('seek', 0);
      this.isRestartClicked = true;
      this.cursorStyle = 'default';
    },
    onProgressBarClick(e) {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      this.onProgressSliderMousedown = true;
      const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
      const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
      this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
      this.$_documentProgressDragClear();
      this.$_documentProgressDragEvent();
    },
    /**
     * @param e mousemove event
     * This mousemove event only works when the cursor
     * is not at mouse down event.
     */
    onProgressBarMove(e) {
      this.isRestartClicked = false;
      this.cursorStyle = 'pointer';
      if (this.timeoutIdOfHideAllWidgets) {
        clearTimeout(this.timeoutIdOfHideAllWidgets);
      }
      if (this.timeoutIdOfHideProgressSlider) {
        clearTimeout(this.timeoutIdOfHideProgressSlider);
      }

      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      if (!this.onProgressSliderMousedown) {
        this.$_effectProgressBarDraged(e);
      }
    },
    $_clearTimeoutDelay() {
      if (this.timeoutIdOfProgressBarDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfProgressBarDisappearDelay);
      }
    },
    /**
     * @param e mousemove event
     */
    $_effectProgressBarDraged(e) {
      const cursorPosition = e.clientX - FOOL_PROOFING_BAR_WIDTH;
      this.cursorPosition = cursorPosition;
      if (cursorPosition <= this.curProgressBarEdge) {
        this.isCursorLeft = true;
      } else {
        this.isCursorLeft = false;
      }
      const progress = cursorPosition
        / this.$refs.sliderContainer.clientWidth;
      if (progress >= 1) {
        this.percentageOfReadyToPlay = 1;
      } else if (progress <= 0) {
        this.percentageOfReadyToPlay = 0;
      } else {
        this.percentageOfReadyToPlay = progress;
        this.thumbnailCurrentTime
          = progress * this.$store.state.PlaybackState.Duration;
      }
      this.showScreenshot = true;
    },
    /**
     * $_documentProgressDragEvent fuction help to set a
     * mouse move event to seek the video when the
     * cursor is at mouse down event and is moved in
     * the screen.
     */
    $_documentProgressDragEvent() {
      document.onmousemove = (e) => {
        this.$_effectProgressBarDraged(e);
        const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
        this.percentageVideoDraged = (e.clientX - sliderOffsetLeft)
         / this.$refs.sliderContainer.clientWidth;
        this.flagProgressBarDraged = true;
      };
    },
    /**
     * $_documentProgressDragClear function is an event to
     * clear the document mouse move event and clear
     * mouse down status
     */
    $_documentProgressDragClear() {
      document.onmouseup = () => {
        document.onmousemove = null;
        this.onProgressSliderMousedown = false;
        // 可以考虑其他的方案
        if (this.flagProgressBarDraged) {
          this.buttonRadius = 0;
          this.$bus.$emit('seek', this.percentageVideoDraged
           * this.$store.state.PlaybackState.Duration);
          this.flagProgressBarDraged = false;
        }
      };
    },

    handleFakeBtnClick() {
      this.timeoutIdOfHideProgressSlider = setTimeout(() => {
        this.hideProgressSlider();
        this.$_hideAllWidgets();
      }, 3000);
    },
    handleFakeBtnMove(e) {
      if (this.isRestartClicked) {
        this.hideProgressSlider();
      } else {
        this.onProgressBarMove(e);
      }
    },
    $_hideAllWidgets() {
      this.timeoutIdOfHideAllWidgets = setTimeout(() => {
        this.$bus.$emit('hide-all-widgets');
      }, 3000);
    },
  },
  computed: {
    curProgressBarEdge() {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return 0;
      }
      const progressBarWidth = this.winWidth - FOOL_PROOFING_BAR_WIDTH;
      return (this.$store.state.PlaybackState.AccurateTime
        / this.$store.state.PlaybackState.Duration) * progressBarWidth;
    },
    /**
     * when cursor is not on progress bar, the cursor position
     * should be the current progress bar edge to ensure the
     * progress bar display correctly.
     */
    cursorState() {
      if (this.isOnProgress) {
        return this.cursorPosition;
      }
      return this.curProgressBarEdge;
    },
    readyBarWidth() {
      return this.isCursorLeft ? 0 : Math.abs(this.curProgressBarEdge - this.cursorState);
    },
    backBarWidth() {
      if (this.cursorPosition <= 0) {
        return 0;
      }
      return this.isCursorLeft ? this.cursorPosition : 0;
    },
    progressOpacity() {
      if (this.isRestartClicked) {
        return 0.9;
      }
      if (this.isOnProgress) {
        return this.isCursorLeft ? 0.3 : 0.9;
      }
      return 0.9;
    },
    heightOfThumbnail() {
      return this.widthOfThumbnail / this.videoRatio;
    },
    positionOfScreenshot() {
      const progressBarWidth = this.winWidth - 20;
      const halfWidthOfScreenshot = this.widthOfThumbnail / 2;
      const minWidth = (this.widthOfThumbnail / 2) + 16;
      const maxWidth = progressBarWidth - 16;
      if (this.cursorPosition < minWidth) {
        return 16 - FOOL_PROOFING_BAR_WIDTH;
      } else if (this.cursorPosition + halfWidthOfScreenshot > maxWidth) {
        return maxWidth - this.widthOfThumbnail;
      }
      return this.cursorPosition - halfWidthOfScreenshot;
    },
    screenshotContent() {
      return this.timecodeFromSeconds(this.percentageOfReadyToPlay
        * this.$store.state.PlaybackState.Duration);
    },
    winWidth() {
      return this.$store.getters.winWidth;
    },
  },
  watch: {
    cursorPosition(newVal) {
      if (this.isOnProgress && newVal <= 0) {
        this.buttonRadius = 20;
        this.isShaking = true;
      } else {
        this.isShaking = false;
        this.buttonRadius = 0;
      }
    },
    isOnProgress(newVal) {
      if (newVal) {
        if (this.timeoutIdOfBackBarDisapppearDelay !== 0) {
          clearTimeout(this.timeoutIdOfBackBarDisapppearDelay);
        }
      } else {
        // 通过设置延时函数，回避backSlider突变到0产生的视觉问题
        this.timeoutIdOfBackBarDisapppearDelay =
         setTimeout(() => { this.cursorPosition = 0; }, 300);
      }
    },
  },
  created() {
    this.$electron.ipcRenderer.on('main-resize', () => {
      const widthOfWindow = this.winWidth;
      if (widthOfWindow < 845) {
        this.widthOfThumbnail = 136;
      } else if (widthOfWindow < 1920) {
        this.widthOfThumbnail = 170;
      } else {
        this.widthOfThumbnail = 240;
      }
      console.log('Size', this.widthOfThumbnail, this.heightOfThumbnail);
    });
    this.$bus.$on('progressslider-appear', () => {
      this.showScreenshot = false;
      this.appearProgressSlider();
      this.isOnProgress = false;
      if (this.timeoutIdOfProgressBarDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfProgressBarDisappearDelay);
        this.timeoutIdOfProgressBarDisappearDelay
          = setTimeout(this.hideProgressBar, 3000);
      } else {
        this.timeoutIdOfProgressBarDisappearDelay
          = setTimeout(this.hideProgressBar, 3000);
      }
    });
    this.$bus.$on('progressbar-appear-delay', () => {
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
    this.$bus.$on('progressbar-appear', this.appearProgressBar);
    this.$bus.$on('progressbar-hide', this.hideProgressBar);
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
    background: rgba(255, 255, 255, 0.38);

    .fake-button {
      position: absolute;
      left: 0;
      bottom: 10px;
      width: 20px;
      background: transparent;
      z-index: 100;
    }

    .button {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
      transition: border-radius 500ms;
      border-bottom-left-radius: 0;
      border-top-left-radius: 0;
    }

    .line {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 100%;
      width: 100%;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
    }
  }

  // .fool-proof-bar:hover {
  //   cursor: pointer;
  // }

  .progress-container {
   position: absolute;
   left: 20px;
   bottom: 0;
   height: 100%;
  }
 /* Progress bar's responsive trigger area. */
  @media screen and (max-width: 854px) {
    height: 20px;
    .progress-container {
      .screenshot-background {
        bottom: 20px;
        .screenshot {
          .time {
            font-size: 20px;
          }
        }
      }
    }
  }
  @media screen and (min-width: 854px) and (max-width: 1920px) {
    height: 20px;
    .progress-container {
      .screenshot-background {
        bottom: 20px;
        .screenshot {
          .time {
            font-size: 24px;
          }
        }
      }
    }
  }
  @media screen and (min-width: 1920px) {
    height: 20px;
    .progress-container {
      .screenshot-background {
        bottom: 20px;
        .screenshot {
          .time {
            font-size: 40px;
          }
        }
      }
    }
  }
}

.video-controller .hidePlayedSlider {
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
    background: rgb(255, 255, 255);
    box-shadow: rgba(255, 255, 255, 0.5);
  }
}

.video-controller .progressPlayed {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 4px;
  transition: height 150ms, opacity 300ms;

  .line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgb(255, 255, 255);
    box-shadow: rgba(255, 255, 255, 0.5);
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

.video-controller .progress-back {
  position: absolute;
  bottom: 0;
  left: 0;
  transition: height 150ms;

  .line {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: rgba(255, 255, 255, 0.9);
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

.shake {
  // transform-origin: left center;
  // animation-name: shake;
  // animation-duration: 180ms;
  // animation-timing-function: ease-in-out;
  // animation-iteration-count: infinite;
}

@keyframes shake {
  25% {
    transform: rotate(4deg);
  }
  75% {
    transform: rotate(-4deg);
  }
  0%, 100% {
    transform: rotate(0deg);
  }

}

</style>
