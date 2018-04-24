<template>
  <div class="progress" ref="sliderContainer"
       @mousedown.capture.stop="onProgresssBarClick"
       @mousemove.capture.stop="onProgresssBarDrag"
       @mouseup.capture.stop="releaseClick">
    <div class="progress--container">
      <div class="progress--readytoplay"
      :style="{ width: widthOfReadyProgressBar +'px' }">
        <div class="readyline"></div>
      </div>
      <div class="progress--played"
      :style="{ width: progress +'%' }">
        <div class="playedline"></div>
        <div class="light"></div>
      </div>
    </div>
  </div>
</template>;

<script>

export default {
  data() {
    return {
      onProgresssBarMouseDown: false,
      widthOfReadyProgressBar: 0,
    };
  },
  methods: {
    releaseClick() {
      this.onProgresssBarMouseDown = false;
    },
    onProgresssBarClick(e) {
      if (Number.isNaN(this.$store.state.PlaybackState.Duration)) {
        return;
      }
      const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
      const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
      this.onProgresssBarMouseDown = true;

      this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
    },
    onProgresssBarDrag(e) {
      if (this.onProgresssBarMouseDown) {
        const sliderOffsetLeft = this.$refs.sliderContainer.getBoundingClientRect().left;
        const p = (e.clientX - sliderOffsetLeft) / this.$refs.sliderContainer.clientWidth;
        this.$bus.$emit('seek', p * this.$store.state.PlaybackState.Duration);
      } else {
        this.widthOfReadyProgressBar = e.clientX;
        console.log(this.widthOfReadyProgressBar);
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

  .progress--container {
    position: relative;
    bottom: 0;
    width: 100%;
    height: 100%;
  }
}

.video-controller .progress:hover {
  padding-top: 20px;
}

.video-controller .progress--played {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 100%;
  transition: width 5ms;

  .playedline {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #FFFFFF;
    box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.5);
    transition: height 200ms;
  }
  .light {
    pointer-events: none;
    position: absolute;
    bottom: 0;
    width: 100%;
    height: (450rem/16);
    opacity: 0.1;
    background-image: linear-gradient(-180deg, rgba(255,255,255,0.00) 76%, #FFFFFF 100%);
  }
}

.video-controller .progress--readytoplay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 100%;
  // transition: width 5ms;

  .readyline {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 20px 0 rgba(255, 255, 255, 0.1);
    transition: height 200ms;
  }
}
</style>
