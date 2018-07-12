<template>
  <!-- <img type="image/svg+xml" class="icon" :class="mode"
    ref="icon"  @animationend="animationEnd"
    :src="src"
    v-if="show"> -->
    <div>
      <button v-on:click="show = !show">
        Toggle
      </button>
      <transition name="fade">
        <img type="image/svg+xml" :src="require('../../assets/icon-pause.svg')" >
      </transition>
    </div>
</template>;

<script>
export default {
  data() {
    return {
      show: false,
      icon: 'icon',
      mode: '',
      src: '',
    };
  },
  methods: {
    animationEnd() {
      this.$refs.icon.style.display = 'none';
      this.mode = '';
      this.show = false;
    },
  },
  mounted() {
    this.$bus.$on('twinkle-pause-icon', () => {
      this.show = true;
      if (this.show) {
        this.src = require('../../assets/icon-pause.svg');
        this.$refs.icon.style.display = 'block';
        this.mode = 'paused-mode';
      }
    });
    this.$bus.$on('twinkle-play-icon', () => {
      this.show = true;
      if (this.show) {
        this.src = require('../../assets/icon-play.svg');
        this.$refs.icon.style.display = 'block';
        this.mode = 'playing-mode';
      }
    });
  },
};
</script>

<style lang='scss'>
/* @keyframes twinkle1 {
  0% {opacity: 0; transform: scale(1)};
  50% {opacity: 1; transform: scale(1.5)};
  100% {opacity: 0; transform: scale(2)};
}
@keyframes twinkle2 {
  0% {opacity: 0; transform: scale(1)};
  50% {opacity: 1; transform: scale(1.5)};
  100% {opacity: 0; transform: scale(2)};
} */
@keyframes twinkle1 {
  0% {opacity: 1; transform: scale(1)};
  100% {opacity: 0; transform: scale(2)};
}
@keyframes twinkle2 {
  0% {opacity: 1; transform: scale(1)};
  100% {opacity: 0; transform: scale(2)};
}
.icon {
  display: none;
  position: absolute;
  margin: auto;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-user-select: none;
}
.playing-mode {
  animation: twinkle1 1s linear 1 normal forwards;
  left: 14px;
}
.paused-mode {
  animation: twinkle2 1s linear 1 normal forwards;
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
</style>
