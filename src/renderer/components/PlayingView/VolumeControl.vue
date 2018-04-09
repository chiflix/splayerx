<template>
  <div class="volume" id="volume">
    <div class="volume--bar" v-if="shouldShowVolumeBar">
      <div class="volume--current">
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
      shouldShowVolumeBar: false,
    };
  },
  methods: {
    toggleVolumeBar() {
      console.log('toggleVolumeBar');
      this.shouldShowVolumeBar = !this.shouldShowVolumeBar;
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
.video-controller .volume .volume--bar {
  width: 15px;
  height: 80%;
  margin: 0 auto;
  background-color: white;
}

</style>
