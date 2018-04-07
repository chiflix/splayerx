<template>
  <div class="timing" id="timing">
      <span class="time timing--current" id="timing--current"></span>
      <span class="time">{{ currentTime }}<span v-if="hasDuration">/{{ duration }}</span></span>
      <span class="time timing--total" id="timing--total"></span>
  </div>
</template>;

<script>

export default {
  computed: {
    hasDuration() {
      return !Number.isNaN(this.$store.state.PlaybackState.Duration);
    },
    duration() {
      return this.timecodeFromSeconds(this.$store.state.PlaybackState.Duration);
    },
    currentTime() {
      return this.timecodeFromSeconds(this.$store.state.PlaybackState.CurrentTime);
    },
  },
};
</script>

<style lang="scss">

.video-controller .timing {
  position: absolute;
  bottom: 25px;
  left: 30px;
  height: 24px;
}
.video-controller .timing .time {
  display: inline-block;
  color: #FFFFFF;
  font: 600 18px 'Avenir';
  line-height: 24px;
  letter-spacing: 0.2px;
  user-select: none;
  opacity: .5;
}
.video-controller .timing .timing--current {
  opacity: 1;
}

</style>
