<template>
  <transition name="fade" appear>
  <div class="progress" ref="sliderContainer"
    @mouseover.capture.stop="appearProgressSlider"
    @mouseout.capture.stop="hideProgressSlider"
    @mousedown.capture.stop="onProgresssBarClick"
    @mousemove.capture="onProgresssBarDrag"
    v-show="showProgressBar">
    <div class="progress-container">
      <div class="screenshot-background"
      :style="{ left: positionOfScreenshot +'px' }">
        <div class="screenshot">
          <div class="">
            {{ screenshotContext }}
          </div>
        </div>
      </div>
      <div class="progress-ready" ref="readySlider">
        <div class="background-line"></div>
        <div class="line"
        :style="{ width: widthOfReadyToPlay +'px' }"></div>
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
      onProgressSliderMousedown: false,
      timeoutIdOfProgressBarDisappearDelay: 0,
      positionOfCursor: 0,
    };
  },
  methods: {
    appearProgressSlider() {
      this.$_clearTimeoutDelay();
      this.showScreenshot = true;
      this.$refs.playedSlider.style.height = '10px';
      this.$refs.readySlider.style.height = '10px';
    },
    hideProgressSlider() {
      if (!this.onProgressSliderMousedown) {
        // this.showScreenshot = false;
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
    },
    onProgresssBarDrag(e) {
      if (this.onProgressSliderMousedown) {
        const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
        const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
        this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
      } else {
        this.positionOfCursor = e.clientX;
      }
    },
    $_clearTimeoutDelay() {
      if (this.timeoutIdOfProgressBarDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfProgressBarDisappearDelay);
      }
    },
  },
  computed: {
    clientWidth() {
      return this.$refs.sliderContainer.clientWidth;
    },
    progress() {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return 0;
      }
      return (100 * this.$store.state.PlaybackState.CurrentTime)
        / this.$store.state.PlaybackState.Duration;
    },
    widthOfReadyToPlay() {
      return this.positionOfCursor;
    },
    positionOfScreenshot() {
      return this.widthOfReadyToPlay;
    },
    screenshotContext() {
      return this.timecodeFromSeconds(this.widthOfReadyToPlay
        * this.$store.state.PlaybackState.CurrentTime);
    },
  },
  created() {
    this.$bus.$on('progressbar-mouseup', () => {
      this.onProgressSliderMousedown = false;
    });
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

  .progress-container {
   position: absolute;
   left: 0;
   bottom: 0;
   width: 100%;
   height: 100%;

   .screenshot {
     position: relative;
     width: 170px;
     height: 100px;
     border: 2px solid transparent;
     border-radius: 2px;
     background-color: #000;
     background-clip: padding-box;
   }

   .screenshot-background {
     position: absolute;
     height: 100px;
     width: 170px;
     bottom: 32px;
     background-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.2) 0%, rgba(84, 84, 84, 0.5) 100%);
     border-radius: 2px;
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
