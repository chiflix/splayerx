<template>
  <div>
    <transition name="twinkle">
      <img src='~@/assets/icon-pause.svg' type="image/svg+xml"
        class="icon" v-show="isPauseRunning"
        @animationend="pauseAnimationEnd">
    </transition>
    <transition name="twinkle">
      <img src='~@/assets/icon-play.svg' type="image/svg+xml"
        class="icon" v-show="isPlayRunning"
        @animationend="playAnimationEnd">
    </transition>

  </div>
</template>;

<script>
export default {
  data() {
    return {
      isPauseRunning: false,
      isPlayRunning: false,
    };
  },
  methods: {
    pauseAnimationEnd() {
      this.isPauseRunning = false;
    },
    playAnimationEnd() {
      this.isPlayRunning = false;
    },
  },
  mounted() {
    this.$bus.$on('twinkle-pause-icon', () => {
      console.log('twinkle-pause-icon');
      this.isPauseRunning = true;
    });
    this.$bus.$on('twinkle-play-icon', () => {
      console.log('twinkle-play-icon');
      this.isPlayRunning = true;
    });
  },
};
</script>

<style lang='scss'>
@keyframes twinkle {
  0% {opacity: 0; transform: scale(1)};
  50% {opacity: 1; transform: scale(1.5)};
  100% {opacity: 0; transform: scale(2)};
}
.icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  opacity: 0;
}
.twinkle-enter-active {
  animation: twinkle .4s;
}
</style>
