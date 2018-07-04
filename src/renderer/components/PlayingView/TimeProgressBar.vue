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
      showProgressBackward: false,
      onProgressSliderMousedown: false,
      timeoutIdOfProgressBarDisappearDelay: 0,
      percentageOfReadyToPlay: 0,
      widthOfReadyToPlay: 0,
      videoRatio: 0,
      percentageVideoDraged: 0,
      flagProgressBarDraged: false,
      widthOfThumbnail: 0,
      thumbnailCurrentTime: 0,
    };
  },
  methods: {
    appearProgressSlider() {
      this.$refs.playedSlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.readySlider.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.foolProofBar.style.height = PROGRESS_BAR_HEIGHT;
      this.$refs.backwardSlider.style.height = PROGRESS_BAR_HEIGHT;
    },
    hideProgressSlider() {
      if (!this.onProgressSliderMousedown) {
        this.showScreenshot = false;
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
      this.$bus.$emit('seek', 0);
      this.widthOfReadyToPlay = 0;
    },
    onProgresssBarClick(e) {
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
    onProgresssBarMove(e) {
      /**
       * TODO:
       * 1. 解决由于mousemove触发机制导致的进度条拖动效果不平滑
       * 解决方案1: 将事件放在document上尝试解决
       */
      console.log(e.clientX);
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
      const currentWindow = this.$electron.remote.getCurrentWindow();
      const progressBarWidth = currentWindow.getSize()[0] - FOOL_PROOFING_BAR_WIDTH;

      const curProgressBarWidth = (progressBarWidth * (this.progress / 100))
       + FOOL_PROOFING_BAR_WIDTH;
      const cursorPosition = e.clientX - FOOL_PROOFING_BAR_WIDTH;
      this.widthOfReadyToPlay = cursorPosition;
      if (cursorPosition < curProgressBarWidth) {
        if (curProgressBarWidth > 0) {
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
          this.$bus.$emit('seek', this.percentageVideoDraged
           * this.$store.state.PlaybackState.Duration);
          this.flagProgressBarDraged = false;
        }
      };
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
      const progressBarWidth = this.$electron.remote.getCurrentWindow().getSize()[0]
        - FOOL_PROOFING_BAR_WIDTH;
      const width = (progressBarWidth * (this.progress / 100))
        - this.cursorPosition;
      return width > 0 ? width : 0;
    },
    heightofScreenshot() {
      return this.widthOfThumbnail / this.videoRatio;
    },
    positionOfScreenshot() {
      const progressBarWidth = this.$electron.remote.getCurrentWindow().getSize()[0] - 20;
      const halfWidthOfScreenshot = this.widthOfThumbnail / 2;
      const minWidth = (this.widthOfThumbnail / 2) + 16;
      const maxWidth = progressBarWidth - 16;
      if (this.widthOfReadyToPlay < minWidth) {
        return 16 - FOOL_PROOFING_BAR_WIDTH;
      } else if (this.widthOfReadyToPlay + halfWidthOfScreenshot > maxWidth) {
        return maxWidth - this.widthOfThumbnail;
      }
      return this.widthOfReadyToPlay - halfWidthOfScreenshot;
    },
    screenshotContent() {
      return this.timecodeFromSeconds(this.percentageOfReadyToPlay
        * this.$store.state.PlaybackState.Duration);
    },
    cursorPosition() {
      return this.widthOfReadyToPlay;
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
      this.showProgressBackward = false;
      this.showScreenshot = false;
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
    z-index: 701;

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
