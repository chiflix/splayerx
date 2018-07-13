<template>
  <transition name="fade" appear>
    <!-- 用mouseout监听会在经过两个div的分界处触发事件 -->
  <div class="progress"
    @mouseover.stop.capture="appearProgressSlider"
    @mouseleave="hideProgressSlider"
    @mousemove="onProgresssBarMove"
    v-show="showProgressBar">
    <div class="fool-proof-bar" ref="foolProofBar"
      @mousedown.left.stop="videoRestart">
      <div class="line"
        v-show="!isShaking"></div>
      <div class="button"
        v-show="isShaking"
        :class="{shake: isShaking}"
        :style="{borderTopRightRadius: buttonRadius + 'px', borderBottomRightRadius: buttonRadius + 'px', width: buttonWidth + 'px'}"></div>
    </div>
    <div class="progress-container" ref="sliderContainer"
      :style="{width: this.$electron.remote.getCurrentWindow().getSize()[0] - 20 + 'px'}"
      @mousedown.left="onProgresssBarClick">
      <Thumbnail
        v-if="showScreenshot"
        :src=src
        :positionOfScreenshot="positionOfScreenshot"
        :widthOfThumbnail="widthOfThumbnail"
        :heightofScreenshot="heightofScreenshot"
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
      timeoutIdOfProgressBarDisappearDelay: 0,
      percentageOfReadyToPlay: 0,
      cursorPosition: 0,
      videoRatio: 0,
      percentageVideoDraged: 0,
      widthOfThumbnail: 0,
      thumbnailCurrentTime: 0,
      buttonWidth: 20,
      buttonRadius: 0,
    };
  },
  methods: {
    appearProgressSlider() {
      this.isOnProgress = true;
      this.$refs.playedSlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.readySlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.foolProofBar.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.backSlider.style.height = PROGRESS_BAR_HEIGHT;
    },
    hideProgressSlider() {
      if (!this.onProgressSliderMousedown) {
        this.isOnProgress = false;
        this.showScreenshot = false;
        // Reset restart button
        this.isShaking = false;
        this.buttonWidth = 20;
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
      this.$bus.$emit('seek', 0);
      // Reset restart button
      this.buttonWidth = 20;
      this.buttonRadius = 0;
      this.isShaking = false;
    },
    onProgresssBarClick(e) {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      this.onProgressSliderMousedown = true;
      const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
      const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
      if (p <= 0.1) {
        this.buttonWidth = 20;
        this.buttonRadius = 0;
        this.isShaking = false;
      }
      this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
      this.$_documentProgressDragClear();
      this.$_documentProgressDragEvent();
    },
    /**
     * @param e mousemove event
     * This mousemove event only works when the cursor
     * is not at mouse down event.
     */
    onProgresssBarMove(e) {
      /**
       * TODO:
       * 1. 解决由于mousemove触发机制导致的进度条拖动效果不平滑
       * 解决方案1: 将事件放在document上尝试解决
       */
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
      // console.log(this.cursorPosition);
      if (cursorPosition < this.curProgressBarEdge) {
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
          // Reset restart button
          this.buttonWidth = 20;
          this.buttonRadius = 0;
          this.isShaking = false;

          this.$bus.$emit('seek', this.percentageVideoDraged
           * this.$store.state.PlaybackState.Duration);
          this.flagProgressBarDraged = false;
        }
      };
    },
  },
  computed: {
    curProgressBarEdge() {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return 0;
      }
      const progressBarWidth = this.$electron.remote.getCurrentWindow().getSize()[0]
        - FOOL_PROOFING_BAR_WIDTH;
      return (this.$store.state.PlaybackState.AccurateTime
        / this.$store.state.PlaybackState.Duration) * progressBarWidth;
    },
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
      // 当isOnPorgress为false，backBarWidth为0，增加一个opacity transition的class，避免消失过快
      if (this.cursorPosition <= 0) {
        return 0;
      }
      return this.isCursorLeft ? this.cursorPosition + 0.1 : 0;
    },
    progressOpacity() {
      if (this.isOnProgress) {
        return this.isCursorLeft ? 0.3 : 0.9;
      }
      return 0.9;
    },
    heightofScreenshot() {
      return this.widthOfThumbnail / this.videoRatio;
    },
    positionOfScreenshot() {
      const progressBarWidth = this.$electron.remote.getCurrentWindow().getSize()[0] - 20;
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
  },
  watch: {
    // if 判断内的内容重复
    cursorPosition(newVal, oldVal) {
      if (newVal < oldVal && this.isOnProgress && newVal <= 0) {
        this.buttonWidth = this.cursorPosition <= -6 ? 14 : 20 + this.cursorPosition;
        this.buttonRadius = Math.abs(this.cursorPosition);
        this.isShaking = true;
      } else {
        console.log('trigger cursor Position');
        this.buttonWidth = 20;
        this.buttonRadius = 0;
        this.isShaking = false;
      }
    },
    // 使用mouseenter和mouseleave改写, 减少性能上的损失
    isOnProgress(newVal, oldVal) {
      if (!oldVal && newVal && this.cursorPosition <= 0) {
        console.log('trigger is shaking');
        this.isShaking = true;
        this.buttonWidth = this.cursorPosition <= -6 ? 14 : 20 + this.cursorPosition;
        this.buttonRadius = Math.abs(this.cursorPosition);
      } else {
        this.isShaking = false;
        this.buttonWidth = 20;
        this.buttonRadius = 0;
      }
    },
  },
  created() {
    this.$electron.remote.getCurrentWindow().on('resize', () => {
      const widthOfWindow = this.$electron.remote.getCurrentWindow().getSize()[0];
      console.log(widthOfWindow);
      if (widthOfWindow < 845) {
        this.widthOfThumbnail = 136;
      } else if (widthOfWindow < 1920) {
        this.widthOfThumbnail = 170;
      } else {
        this.widthOfThumbnail = 240;
      }
    });
    this.$bus.$on('progressslider-appear', () => {
      this.showScreenshot = false;
      this.cursorPosition = 0;
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
    background: rgba(255, 255, 255, 0.38);

    .button {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
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

  .fool-proof-bar:hover {
    cursor: pointer;
  }

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
  transform-origin: left center;
  animation-name: shake;
  animation-duration: 180ms;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.shake:hover {
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
