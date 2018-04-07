<template>
  <div class="progress" id="progress">
    <div class="progress--played" id="progress--played"
    :style="{ width: progress +'%' }">
      <div class="line" id="progress--line"></div>
      <!-- <div class="light"></div> -->
    </div>
  </div>
</template>;

<script>

export default {
  computed: {
    progress() {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return 0;
      }
      return (100 * this.$store.state.PlaybackState.CurrentTime)
        / this.$store.state.PlaybackState.Duration;
    },
  },
};

</script>

<style lang="scss">

.video-controller .progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px; }
.video-controller .progress--played {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
}
  .video-controller .progress--played .line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: #FFFFFF;
    box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
    transition: height 200ms; }
    .video-controller .progress--played .line.line--mouseover {
      height: 10px; }
  .video-controller .progress--played .light {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 300px;
    opacity: 0.1;
    background-image: linear-gradient(-180deg, rgba(255, 255, 255, 0) 76%, #FFFFFF 100%); }

</style>
