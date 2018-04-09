<template>
  <div class="volume" id="volume">
    <div class="container"
          v-if="showVolumeSlider"
          ref="sliderContainer"
          v-on:click.capture.stop="onVolumeSliderClick">
      <div class="slider" ref="slider"
            v-bind:style="{ height: sliderHeight + '%' }">
      </div>
    </div>
    <div class="button" v-on:click.capture.stop="toggleVolumeBar" >
      <img src="~@/assets/icon-volume.svg" type="image/svg+xml" wmode="transparent">
    </div>
  </div>
</template>;

<script>
export default {
  data() {
    return {
      showVolumeSlider: false,
      sliderHeight: 90,
    };
  },
  methods: {
    onVolumeSliderClick(e) {
      const sliderOffsetBottom = this.$refs.sliderContainer.getBoundingClientRect().bottom;
      this.sliderHeight = ((sliderOffsetBottom - e.clientY) * 100)
                          / this.$refs.sliderContainer.clientHeight;
    },
    toggleVolumeBar() {
      console.log('toggleVolumeBar');
      this.showVolumeSlider = !this.showVolumeSlider;
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
  transition: height 100ms;
}

</style>
