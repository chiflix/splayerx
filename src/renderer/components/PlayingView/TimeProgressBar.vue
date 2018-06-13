<template>
  <transition name="fade" appear>
  <div class="progress" ref="sliderContainer"
    @mouseover.capture="appearProgressSlider"
    @mouseout.capture="hideProgressSlider"
    @mousedown.capture.stop="onProgresssBarClick"
    @mousemove.capture="onProgresssBarMove"
    v-show="showProgressBar">
    <div class="progress-container">
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
        :style="{ width: positionOfReadyBar +'px' }"></div>
        <div class="playback-line"
        v-show="playbackwardLineShow"
        :style="{ left: positionOfReadyBar + 'px', width: widthPlaybackward + 'px'}"></div>
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

export default {
  data() {
    return {
      showScreenshot: false,
      showProgressBar: true,
      playbackwardLineShow: false,
      onProgressSliderMousedown: false,
      timeoutIdOfProgressBarDisappearDelay: 0,
      percentageOfReadyToPlay: 0,
      widthOfReadyToPlay: 0,
      lengthPlayBack: 0,
      videoRatio: 0,
    };
  },
  methods: {
    appearProgressSlider() {
      this.$_clearTimeoutDelay();
      this.$refs.playedSlider.style.height = '10px';
      this.$refs.readySlider.style.height = '10px';
    },
    hideProgressSlider() {
      if (!this.onProgressSliderMousedown) {
        this.showScreenshot = false;
        this.widthOfReadyToPlay = 0;
        this.$refs.playedSlider.style.height = '4px';
        this.$refs.readySlider.style.height = '0px';
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
    onProgresssBarClick(e) {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      this.onProgressSliderMousedown = true;
      const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
      const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
      this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
      this.documentMouseMoveEvent();
    },
    /**
     * Todo:
     * 1. 解决document.mouseup和PlayingView的Event Bus
     * 中的mouseup冲突问题。
     * 2. 当拖动进度条到结束时间后在拖回，视频仍会保持结束时的
     * 暂停状态，而不会自动开始播放。
     */
    /**
     * documentMouseMoveEvent fuction help to set a
     * mouse move event to seek the video when the
     * cursor is at mouse down event and is moved in
     * the screen.
     */
    documentMouseMoveEvent() {
      document.onmousemove = (e) => {
        const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
        const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
        this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
      };
    },
    /**
     * This mousemove event only works when the cursor
     * is not at mouse down event.
     */
    onProgresssBarMove(e) {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      if (!this.onProgressSliderMousedown) {
        const curProgressBarWidth = this.currentWindow.getSize()[0] * (this.progress / 100);
        const widthProgressBarMove = e.clientX;
        if (widthProgressBarMove < curProgressBarWidth) {
          this.playbackwardLineShow = true;
        } else {
          this.playbackwardLineShow = false;
        }
        this.percentageOfReadyToPlay = widthProgressBarMove
          / this.$refs.sliderContainer.clientWidth;
        this.widthOfReadyToPlay = widthProgressBarMove;
        this.showScreenshot = true;
      }
    },
    /**
     * documentMouseMoveClear function is an event to
     * clear the document mouse move event and clear
     * mouse down status
     */
    documentMouseMoveClear() {
      document.onmouseup = () => {
        this.onProgressSliderMousedown = false;
        document.onmousemove = null;
      };
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
      return (100 * this.$store.state.PlaybackState.CurrentTime)
        / this.$store.state.PlaybackState.Duration;
    },
    heightofScreenshot() {
      return 170 / this.videoRatio;
    },
    positionOfScreenshot() {
      const halfWidthOfScreenshot = 170 / 2;
      const minWidth = halfWidthOfScreenshot + 16;
      const maxWidth = this.currentWindow.getSize()[0] - 16;
      if (this.widthOfReadyToPlay < minWidth) {
        return 16;
      } else if (this.widthOfReadyToPlay + halfWidthOfScreenshot > maxWidth) {
        return maxWidth - 170;
      }
      return this.widthOfReadyToPlay - halfWidthOfScreenshot;
    },
    currentWindow() {
      return this.$electron.remote.getCurrentWindow();
    },
    positionOfReadyBar() {
      return this.widthOfReadyToPlay;
    },
    screenshotContext() {
      return this.timecodeFromSeconds(this.percentageOfReadyToPlay
        * this.$store.state.PlaybackState.Duration);
    },
    widthPlaybackward() {
      return (this.currentWindow.getSize()[0] * (this.progress / 100))
        - this.widthOfReadyToPlay;
    },
  },
  created() {
    this.documentMouseMoveClear();
    // this.$bus.$on('progressbar-mouseup', () => {
    //   this.onProgressSliderMousedown = false;
    // });
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
  height: 20px;
  -webkit-app-region: no-drag;
  z-index: 700;

  .progress-container:hover {
    cursor: pointer;
  }

  .progress-container {
   position: absolute;
   left: 0;
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
  .playback-line {
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

@keyframes progressbar {
  
}

</style>
