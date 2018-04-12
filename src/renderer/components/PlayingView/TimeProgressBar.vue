<template>
  <div class="progress" ref="sliderContainer"
       v-on:mousedown="onProgresssBarClick"
       v-on:mousemove="onProgresssBarMove"
       v-on:mouseup="releaseClick">
    <div class="progress--container">
      <div class="progress--played"
      :style="{ width: progress +'%' }">
        <div class="line"></div>
      </div>
    </div>
  </div>
</template>;

<script>

export default {
  data() {
    return {
      state: 0,
    };
  },
  methods: {
    releaseClick() {
      this.state = 0;
    },
    onProgresssBarClick(e) {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
      const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
      this.state = 1;

      this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
    },
    onProgresssBarMove(e) {
      // if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
      //   return;
      // }
      if (this.state) {
        const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
        const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
        this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
      }
    },
  },
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
  height: 30px;
  padding-top: 28px;
  transition: padding-top 250ms;
  -webkit-app-region: no-drag;
}

.video-controller .progress:hover {
  padding-top: 20px;
}

.video-controller .progress .progress--container {
  position: relative;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.video-controller .progress--played {
  position: relative;
  bottom: 0;
  left: 0;
  width: 0;
  height: 100%;
  transition: width 100ms;

}

.video-controller .progress--played .line {
  position: relative;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
  transition: height 200ms;
}


</style>
