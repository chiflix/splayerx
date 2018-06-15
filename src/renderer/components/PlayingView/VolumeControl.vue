<template>
  <transition name="fade" appear>
  <div class="volume" id="volume"
    @mouseover.capture.stop="appearVolumeSlider"
    @mouseout.capture.stop="hideVolumeSlider"
    v-if="showVolumeController">
    <transition name="fade">
      <div class="container"  ref="sliderContainer"
        @mousedown.capture.stop.left="onVolumeSliderClick"
        v-if="showVolumeSlider">
        <div class="slider" ref="slider"
          :style="{ height: volume + '%' }">
        </div>
      </div>
    </transition>
      <div class="button"
        @mousedown.capture.stop.left="onVolumeButtonClick">
        <img type="image/svg+xml" wmode="transparent"
          :src="srcOfVolumeButtonImage">
      </div>
  </div>
</transition>
</template>;

<script>
export default {
  data() {
    return {
      showVolumeSlider: false,
      showVolumeController: true,
      onVolumeSliderMousedown: false,
      currentVolume: 0,
      timeoutIdOfVolumeControllerDisappearDelay: 0,
    };
  },
  methods: {
    onVolumeButtonClick() {
      console.log('onVolumeButtonClick');
      this.$_clearTimeoutDelay();
      if (this.volume !== 0) {
        this.currentVolume = this.volume;
        this.$store.commit('Volume', 0);
      } else {
        this.$store.commit('Volume', this.currentVolume / 100);
      }
    },
    onVolumeSliderClick(e) {
      console.log('onVolumeSliderClick');
      this.onVolumeSliderMousedown = true;
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      this.$store.commit('Volume', (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight);
      this.documentVoluemeDragClear();
      this.documentVolumeSliderDragEvent();
    },
    /**
     * @param e mousemove event
     */
    effectVolumeSliderDrag(e) {
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      if (sliderOffsetBottom - e.clientY > 1) {
        const volume = (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight;
        if (volume >= 1) {
          this.$store.commit('Volume', 1);
        } else {
          this.$store.commit('Volume', volume);
        }
      } else {
        this.$store.commit('Volume', 0);
      }
    },
    /**
     * documentVolumeSliderDragEvent fuction help to set a
     * mouse move event to change the volume when the
     * cursor is at mouse down event and is moved in
     * the screen.
     */
    documentVolumeSliderDragEvent() {
      document.onmousemove = (e) => {
        this.effectVolumeSliderDrag(e);
      };
    },
    /**
     * documentVolumeMoveClear function is an event to
     * clear the document mouse move event and clear
     * mouse down status
     */
    documentVoluemeDragClear() {
      document.onmouseup = () => {
        this.onVolumeSliderMousedown = false;
        document.onmousemove = null;
      };
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
        /* if (this.showVolumeSlider) {
          this.showVolumeSlider = false;
        } */
      }
    },
    $_clearTimeoutDelay() {
      if (this.timeoutIdOfVolumeControllerDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfVolumeControllerDisappearDelay);
      }
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
      } else if (this.volume > 0 && this.volume <= 33) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume-1.svg');
      } else if (this.volume > 33 && this.volume <= 66) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume-2.svg');
      } else if (this.volume > 66 && this.volume <= 100) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume-3.svg');
      }
      return srcOfVolumeButtonImage;
    },
  },
  created() {
    this.$bus.$on('volumecontroller-appear', () => {
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
    this.$bus.$on('volumecontroller-hide', () => {
      this.hideVolumeController();
    });
  },
};
</script>

<style lang="scss" scoped>

.video-controller .volume {
  position: absolute;
  bottom: 27px;
  right: 37+15+35px;
  width: 35px;
  height: 150px;
  -webkit-app-region: no-drag;
  z-index: 500;

  .container {
    position: relative;
    width: 15px;
    height: 105px;
    margin: 0 auto;
    background-color: rgba(255,255,255,0.2);
    border-radius: 1px;
  }

  .container:hover {
    cursor:  pointer;
  }

  .slider {
    position: absolute;
    bottom: 0;
    width: 15px;
    background: rgba(255,255,255,0.70);
    border-radius: 1px;
  }

  .button {
    position: absolute;
    bottom: 0;
    right:0;
    width: 35px;
    height: 30px;
  }

  .button:hover {
    cursor: pointer;
  }

  .button img {
    width: 35px;
    height: 30px;
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
