<template>
  <transition name="fade" appear>
  <div
    @mouseover.stop="appearVolumeSlider"
    @mouseout.stop="hideVolumeSlider"
    @mousemove="throttledCall">
    <transition name="fade">
      <div class="container"  ref="sliderContainer"
        @mousedown.stop.left="onVolumeSliderClick"
        v-show="showVolumeSlider">
        <div class="slider" ref="slider"
          :style="{ height: volume + '%' }">
        </div>
      </div>
    </transition>
      <div
        @mousedown.stop.left="onVolumeButtonClick">
        <img type="image/svg+xml" wmode="transparent" v-show="showVolumeController"
          :src="srcOfVolumeButtonImage">
      </div>
  </div>
</transition>
</template>;

<script>
import _ from 'lodash';
export default {
  data() {
    return {
      showVolumeSlider: false,
      showVolumeController: true,
      onVolumeSliderMousedown: false,
      currentVolume: 0,
      timeoutIdOfVolumeControllerDisappearDelay: 0,
      throttledCall: null,
    };
  },
  methods: {
    onVolumeButtonClick() {
      console.log('onVolumeButtonClick');
      this.$_clearTimeoutDelay();
      if (this.volume !== 0) {
        this.currentVolume = this.volume;
        this.$bus.$emit('volume', 0);
      } else {
        this.$bus.$emit('volume', this.currentVolume / 100);
      }
    },
    onVolumeSliderClick(e) {
      console.log('onVolumeSliderClick');
      this.onVolumeSliderMousedown = true;
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      this.$bus.$emit('volume', (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight);
      this.$_documentVoluemeDragClear();
      this.$_documentVolumeSliderDragEvent();
    },
    clearAllWidgetsTimeout() {
      this.$bus.$emit('clear-all-widget-disappear-delay');
    },
    appearVolumeSlider() {
      this.$_clearTimeoutDelay();
      this.showVolumeSlider = true;
    },
    hideVolumeSlider() {
      if (!this.onVolumeSliderMousedown) {
        this.showVolumeSlider = false;
      }
    },
    appearVolumeController() {
      this.showVolumeController = true;
    },
    hideVolumeController() {
      if (!this.onVolumeSliderMousedown) {
        this.showVolumeController = false;
        if (this.showVolumeSlider) {
          this.showVolumeSlider = false;
        }
      }
    },
    $_clearTimeoutDelay() {
      if (this.timeoutIdOfVolumeControllerDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfVolumeControllerDisappearDelay);
      }
    },
    /**
     * @param e mousemove event
     */
    $_effectVolumeSliderDrag(e) {
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      if (sliderOffsetBottom - e.clientY > 1) {
        const volume = (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight;
        if (volume >= 1) {
          this.$bus.$emit('volume', 1);
        } else {
          this.$bus.$emit('volume', volume);
        }
      } else {
        this.$bus.$emit('volume', 0);
      }
    },
    /**
     * $_documentVolumeSliderDragEvent fuction help to set a
     * mouse move event to change the volume when the
     * cursor is at mouse down event and is moved in
     * the screen.
     */
    $_documentVolumeSliderDragEvent() {
      document.onmousemove = (e) => {
        this.$_effectVolumeSliderDrag(e);
      };
    },
    /**
     * documentVolumeMoveClear function is an event to
     * clear the document mouse move event and clear
     * mouse down status
     */
    $_documentVoluemeDragClear() {
      document.onmouseup = () => {
        this.onVolumeSliderMousedown = false;
        document.onmousemove = null;
      };
    },
  },
  computed: {
    volume() {
      return 100 * this.$store.state.PlaybackState.Volume;
    },
    srcOfVolumeButtonImage() {
      let srcOfVolumeButtonImage;
      if (this.volume === 0) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume-mute.svg');
      } else if (this.volume > 0 && this.volume <= 25) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume-1.svg');
      } else if (this.volume > 25 && this.volume <= 50) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume-2.svg');
      } else if (this.volume > 50 && this.volume <= 75) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume-3.svg');
      } else if (this.volume > 75 && this.volume <= 100) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume-4.svg');
      }
      return srcOfVolumeButtonImage;
    },
  },
  created() {
    this.$bus.$on('volumecontroller-appear-delay', () => {
      this.appearVolumeController();
      if (this.timeoutIdOfVolumeControllerDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfVolumeControllerDisappearDelay);
        this.timeoutIdOfVolumeControllerDisappearDelay
          = setTimeout(this.hideVolumeController, 3000);
      } else {
        this.timeoutIdOfVolumeControllerDisappearDelay
          = setTimeout(this.hideVolumeController, 3000);
      }
    });
    this.$bus.$on('volumeslider-appear', () => {
      this.appearVolumeSlider();
      if (this.timeoutIdOfVolumeControllerDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfVolumeControllerDisappearDelay);
        this.timeoutIdOfVolumeControllerDisappearDelay
          = setTimeout(this.hideVolumeController, 3000);
      } else {
        this.timeoutIdOfVolumeControllerDisappearDelay
          = setTimeout(this.hideVolumeController, 3000);
      }
    });
    this.$bus.$on('volumecontroller-appear', this.appearVolumeController);
    this.$bus.$on('volumecontroller-hide', this.hideVolumeController);
  },
  beforeMount() {
    this.throttledCall = _.throttle(this.clearAllWidgetsTimeout, 500);
  },
};
</script>

<style lang="scss" scoped>
.container {
  position: absolute;
  background-color: rgba(255,255,255,0.2);
  border-radius: 1px;
  left: 50%;
  transform: translate(-50%);
  &:hover {
    cursor: pointer;
  }

  .slider {
    width: 100%;
    position: absolute;
    bottom: 0;
    background: rgba(255,255,255,0.7);
    border-radius: 1px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    bottom: 18+10px;
    width: 15px;
    height: 84px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    bottom: 24+10px;
    width: 24px;
    height: 105px;
  }
  @media screen and (min-width: 1921px) {
    bottom: 36+10px;
    width: 24px;
    height: 168px;
  }
}
.fade-enter-active {
 transition: opacity 100ms;
}

.fade-leave-active {
 transition: opacity 200ms;
}

.fade-enter-to, .fade-leave {
 opacity: 1;
}

.fade-enter, .fade-leave-to {
 opacity: 0;
}
</style>
