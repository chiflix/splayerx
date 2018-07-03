<template>
  <div>
    <transition name="twinkle">
      <img src='~@/assets/icon-pause.svg' type="image/svg+xml"
        class="icon" v-show="isPauseRunning">
    </transition>
    <transition name="twinkle">
      <img src='~@/assets/icon-play.svg' type="image/svg+xml"
        class="icon" v-show="isPlayRunning">
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
  mounted() {
    this.$bus.$on('twinkle-pause-icon', () => {
      this.isPauseRunning = !this.isPauseRunning;
    });
    this.$bus.$on('twinkle-play-icon', () => {
      this.isPlayRunning = !this.isPlayRunning;
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
  display: block;
  position: absolute;
  margin: auto;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  z-index: -1;
  -webkit-user-select: none;
}
@media screen and (max-width: 854px) {
  .icon {
    width: 42.5px;
    height: 42.5px;
  }
}

@media screen and (min-width: 854px) and (max-width: 1920px) {
  .icon {
    width: 85px;
    height: 85px;
  }
}

@media screen and (min-width: 1920px) {
  .icon {
    width: 127.5px;
    height: 127.5px;
  }
}

.twinkle-enter-active, .twinkle-leave-active {
  z-index: 1;
  animation: twinkle .4s;
}
</style>
