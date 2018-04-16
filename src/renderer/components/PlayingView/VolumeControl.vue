<template>
  <div class="volume" id="volume">
    <div class="container"
          v-if="showVolumeSlider"
          ref="sliderContainer"
          v-on:mousedown.capture.stop="onVolumeSliderClick"
          v-on:mousemove.capture.stop="onVolumeSliderMove"
          v-on:mouseup.capture.stop="releaseClick">
      <div class="slider" ref="slider"
            v-bind:style="{ height: volume + '%' }">
      </div>
    </div>
    <div class="button" v-on:mousedown.capture.stop="toggleVolumeBar" >
      <img src="~@/assets/icon-volume.svg" type="image/svg+xml" wmode="transparent">
    </div>
  </div>
</template>;

<script>
export default {
  data() {
    return {
      state: 0,
      showVolumeSlider: false,
    };
  },
  methods: {
    onVolumeSliderClick(e) {
      this.state = 1;
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
      this.state = 0;
    },
    toggleVolumeBar() {
      console.log('toggleVolumeBar');
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
}
.video-controller .volume .container {
  position: relative;
  width: 15px;
  height: 100px;
  margin: 0 auto;
}

.video-controller .volume .slider {
  position: absolute;
  bottom: 0;
  width: 15px;
  background-color: white;
  transition: height 10ms;
}

</style>
