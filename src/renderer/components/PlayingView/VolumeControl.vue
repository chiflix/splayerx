<template>
  <div class="volume" id="volume"
    @mouseover="appearVolumeBar"
    @mouseout.capture.stop="hideVolumeBar"
    @mouseup.capture.stop="releaseClick">
    <transition name="fade">
    <div class="container"
          v-show="showVolumeSlider"
          ref="sliderContainer"
          @mousedown.capture.stop="onVolumeSliderClick"
          @mousemove.capture.stop="onVolumeSliderMove">
      <div class="slider" ref="slider"
            v-bind:style="{ height: volume + '%' }">
      </div>
    </div>
  </transition>
    <div class="button"
          >
      <img src="~@/assets/icon-volume.svg" type="image/svg+xml" wmode="transparent">
    </div>
  </div>
</template>;

<script>
export default {
  data() {
    return {
      state: false,
      showVolumeSlider: false,
    };
  },
  methods: {
    onVolumeSliderClick(e) {
      this.state = true;
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      this.$store.commit('Volume', (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight);
    },
    onVolumeSliderMove(e) {
      if (this.state) {
        const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
        if (sliderOffsetBottom - e.clientY > 1) {
          this.$store.commit('Volume', (sliderOffsetBottom - e.clientY) / this.$refs.sliderContainer.clientHeight);
        } else {
          this.$store.commit('Volume', 0);
        }
      }
    },
    releaseClick() {
      this.state = !this.state;
    },
    appearVolumeBar() {
      console.log('appearVolumeBar');
      this.showVolumeSlider = !this.showVolumeSlider;
    },
    hideVolumeBar() {
      console.log('hideVolumeBar');
      this.showVolumeSlider = !this.showVolumeSlider;
    },
  },
  computed: {
    volume() {
      return 100 * this.$store.state.PlaybackState.Volume;
    },
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
