<template>
  <div class="volume" id="volume"
    @mouseover.capture.stop="appearVolumeController"
    @mouseout.capture.stop="hideVolumeController">
    <transition-group name="fade" tag="div">
      <div class="container"  ref="sliderContainer"
        v-show="showVolumeSlider"
        @mousedown.capture.stop="onVolumeSliderClick"
        @mousemove.capture.stop="onVolumeSliderDrag"
        key="slider">
        <div class="slider" ref="slider"
          :style="{ height: volume + '%' }">
        </div>
      </div>
      <div class="button"
        @mousedown.capture.stop="onVolumeButtonClick"
        v-show="showVolumeButton"
        key="button">
        <img type="image/svg+xml" wmode="transparent"
          :src="srcOfVolumeButtonImage">
      </div>
    </transition-group>
  </div>
</template>;

<script>
export default {
  data() {
    return {
      showVolumeButton: true,
      showVolumeSlider: false,
      onVolumeSliderMousedown: false,
      currentVolume: 0,
      timeoutIdOfVolumeButtonDisappearDelay: 0,
      timeoutIdOfVolumeControllerDisappearDelay: 0,
    };
  },
  methods: {
    onVolumeSliderClick(e) {
      console.log('onVolumeSliderClick');
      this.onVolumeSliderMousedown = true;
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      this.$store.commit('Volume', (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight);
    },
    onVolumeSliderDrag(e) {
      if (this.onVolumeSliderMousedown) {
        const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
        if (sliderOffsetBottom - e.clientY > 1) {
          this.$store.commit('Volume', (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight);
        } else {
          this.$store.commit('Volume', 0);
        }
      }
    },
    onVolumeButtonClick() {
      console.log('onVolumeButtonClick');
      if (this.volume !== 0) {
        this.currentVolume = this.volume;
        this.$store.commit('Volume', 0);
      } else {
        this.$store.commit('Volume', this.currentVolume / 100);
      }
    },
    appearVolumeButton() {
      console.log('appearVolumeButton');
      this.showVolumeButton = true;
    },
    hideVolumeButton() {
      console.log('hideVolumeButton');
      if (!this.onVolumeSliderMousedown) {
        this.showVolumeButton = false;
      }
    },
    appearVolumeController() {
      console.log('appearVolumeController');
      if (this.timeoutIdOfVolumeButtonDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfVolumeButtonDisappearDelay);
      }
      this.showVolumeSlider = true;
      this.showVolumeButton = true;
    },
    hideVolumeController() {
      console.log('hideVolumeController');
      if (!this.onVolumeSliderMousedown) {
        this.showVolumeSlider = false;
        this.showVolumeButton = false;
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
        srcOfVolumeButtonImage = require('../../assets/icon-volume.svg');
      } else if (this.volume > 33 && this.volume <= 66) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume.svg');
      } else if (this.volume > 66 && this.volume <= 100) {
        srcOfVolumeButtonImage = require('../../assets/icon-volume.svg');
      }
      return srcOfVolumeButtonImage;
    },
  },
  created() {
    this.$bus.$on('volumecontroller-appear', () => {
      console.log('volumecontroller-appear event has been trigger');
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
    this.$bus.$on('volumebutton-appear', () => {
      console.log('volumebutton-appear event has been trigger');
      this.appearVolumeButton();
      if (this.timeoutIdOfVolumeButtonDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfVolumeButtonDisappearDelay);
        this.timeoutIdOfVolumeButtonDisappearDelay
        = setTimeout(this.hideVolumeButton, 3000);
      } else {
        this.timeoutIdOfVolumeButtonDisappearDelay = setTimeout(this.hideVolumeButton, 3000);
      }
    });
    this.$bus.$on('volume-mouseup', () => {
      this.onVolumeSliderMousedown = false;
    });
  },
};
</script>

<style lang="scss" scoped>

.video-controller .volume {
  position: absolute;
  bottom: 27px;
  right: 37+35+15+35px;
  width: 30px;
  height: 150px;
  -webkit-app-region: no-drag;

  .container {
    position: relative;
    width: 15px;
    height: 105px;
    margin: 0 auto;
    background-color: rgba(255,255,255,0.2);
    border-radius: 1px;
  }

  .slider {
    position: absolute;
    bottom: 0;
    width: 15px;
    background: rgba(255,255,255,0.70);
    border-radius: 1px;
    transition: height 50ms;
  }

  .button {
    position: absolute;
    bottom: 0;
    width: 35px;
    height: 30px;
  }
  .button img {
    width: 35px;
    height: 30px;
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
}

</style>
