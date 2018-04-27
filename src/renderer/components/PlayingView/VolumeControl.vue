<template>
  <div class="volume" id="volume"
    @mouseover="appearVolumeBar"
    @mouseout.capture.stop="hideVolumeBar">
    <transition name="fade">
    <div class="container" ref="sliderContainer"
      v-show="showVolumeSlider"
      @mousedown.capture.stop="onVolumeSliderClick"
      @mousemove.capture.stop="onVolumeSliderDrag">
      <div class="slider"
        :style="{ height: volume + '%' }">
      </div>
    </div>
    </transition>
    <div class="button"
      @mousedown.capture.stop="onVolumeButtonClick">
      <img type="image/svg+xml" wmode="transparent"
        src="~@/assets/icon-volume.svg">
    </div>
  </div>
</template>;

<script>
export default {
  data() {
    return {
      onVolumeSliderMousedown: false,
      showVolumeSlider: false,
      isMuted: false,
      currentVolume: 0,
      srcOfVolumeButtonImage: '~@/assets/icon-volume.svg',
      timeoutIdOfVolumeBarDisappearDelay: 0,
    };
  },
  methods: {
    onVolumeSliderClick(e) {
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
          this.isMuted = true;
        }
      }
    },
    onVolumeButtonClick() {
      if (!this.isMuted) {
        console.log(this.volume);
        this.currentVolume = this.volume;
        this.$store.commit('Volume', 0);
        this.isMuted = !this.isMuted;
        this.srcOfVolumeButtonImage = '~@/assets/icon-volume-mute.svg';
      } else {
        this.$store.commit('Volume', this.currentVolume / 100);
        this.isMuted = !this.isMuted;
        console.log(this.currentVolume);
        this.srcOfVolumeButtonImage = '~@/assets/icon-volume.svg';
      }
    },
    appearVolumeBar() {
      console.log('appearVolumeBar');
      this.showVolumeSlider = true;
    },
    hideVolumeBar() {
      console.log('hideVolumeBar');
      if (!this.onVolumeSliderMousedown) {
        this.showVolumeSlider = false;
      }
    },
  },
  computed: {
    volume() {
      return 100 * this.$store.state.PlaybackState.Volume;
    },
  },
  created() {
    this.$bus.$on('volumeslider-appear', () => {
      console.log('volumeslider-appear event has been trigger');
      this.appearVolumeBar();
      if (typeof this.timeoutIdOfVolumeBarDisappearDelay === 'number') {
        clearTimeout(this.timeoutIdOfVolumeBarDisappearDelay);
        this.timeoutIdOfVolumeBarDisappearDelay = setTimeout(this.hideVolumeBar, 3000);
      } else {
        this.timeoutIdOfVolumeBarDisappearDelay = setTimeout(this.hideVolumeBar, 3000);
      }
    });
    this.$bus.$on('VolumeMouseup', () => {
      this.onVolumeSliderMousedown = false;
    });
  },
};
</script>

<style lang="scss" scoped>

.video-controller .volume {
  position: absolute;
  bottom: 25px;
  right: 75px;
  width: 30px;
  height: 150px;
  -webkit-app-region: no-drag;

  .container {
    position: relative;
    width: 15px;
    height: 100px;
    margin: 0 auto;
    background-color: rgba(255,255,255,0.1);
  }

  .slider {
    position: absolute;
    bottom: 0;
    width: 15px;
    background-color: white;
  }

  .fade-enter-active {
   transition: opacity .5s;
  }

  .fade-leave-active {
   transition: opacity .5s;
  }

  .fade-enter-to, .fade-leave {
   opacity: 1;
  }

  .fade-enter, .fade-leave-to {
   opacity: 0;
  }
}
</style>
