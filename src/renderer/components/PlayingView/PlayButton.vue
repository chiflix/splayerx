<template>
  <div>
  <img type="image/svg+xml"  :src="src" class="icon"
        :class="ani_mode"
        @animationend="animationEnd"
        v-if="iconAppear">
  </div>
</template>

<script>
export default {
  data() {
    return {
      iconAppear: false, // control whether the icon show up or not
      ani_mode: '', // change the CSS
      src: '',
    };
  },
  methods: {
    animationEnd() {
      this.iconAppear = false; // after the animation ends, icon disappears
    },
  },
  mounted() {
    this.$bus.$on('twinkle-pause-icon', () => {
      this.src = require('../../assets/icon-pause.svg'); // set path of icon
      this.iconAppear = true;
      this.ani_mode = 'icon-ani-pause';// css for pause button animation
    });
    this.$bus.$on('twinkle-play-icon', () => {
      this.src = require('../../assets/icon-play.svg');
      this.iconAppear = true;
      this.ani_mode = 'icon-ani-play';
    });
  },
};
</script>


<style>
.icon {
  /* display: none; */
  position: absolute;
  margin: auto;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-user-select: none;
}

.icon-ani-pause {
  animation: ytp-bezel-fadeout1 500ms linear 1 normal forwards;
}
.icon-ani-play {
  animation: ytp-bezel-fadeout2 500ms linear 1 normal forwards;
  left: 14px;
}
@keyframes ytp-bezel-fadeout1 {
  0% {opacity: 1; transform: scale(0.25)};
  50% {opacity: 0.5; transform: scale(0.5)}
  100% {opacity: 0; transform: scale(1)};
}
@keyframes ytp-bezel-fadeout2 {
  0% {opacity: 1; transform: scale(0.25)};
  50% {opacity: 0.5; transform: scale(0.5)}
  100% {opacity: 0; transform: scale(1)};
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
