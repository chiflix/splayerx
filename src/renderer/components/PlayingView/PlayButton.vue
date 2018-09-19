<template>
  <div
    :data-component-name="$options.name">
  <Icon :type="src" class="icon" :class="ani_mode"
          v-if="iconAppear"
          @animationend.native="animationEnd">
    </Icon>
  </div>
</template>

<script>
import Icon from '../IconContainer';
export default {
  name: 'play-button',
  data() {
    return {
      iconAppear: false, // control whether the icon show up or not
      ani_mode: '', // change the CSS
      src: '',
    };
  },
  components: {
    Icon,
  },
  methods: {
    animationEnd() {
      this.iconAppear = false; // after the animation ends, icon disappears
    },
  },
  mounted() {
    this.$bus.$on('twinkle-pause-icon', () => {
      this.src = 'pause';
      this.iconAppear = true;
      this.ani_mode = 'icon-ani-pause';// css for pause button animation
    });
    this.$bus.$on('twinkle-play-icon', () => {
      this.src = 'play';
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

@media screen and (max-width: 512px) {
  .icon {
    width: 49px;
    height: 49px;
  }
}
@media screen and (min-width: 513px) and (max-width: 854px) {
  .icon {
    width: 59px;
    height: 59px;
  }
}
@media screen and (min-width: 855px) and (max-width: 1920px) {
  .icon {
    width: 79px;
    height: 79px;
  }
}
@media screen and (min-width: 1921px) {
  .icon {
    width: 109px;
    height: 108px;
  }
}
</style>
