<template>
  <div
    :data-component-name="$options.name">
  <Icon :type="paused ? 'pause' : 'play'" class="icon" :class="ani_mode"
          v-if="iconAppear"
          @animationend.native="iconAppear = false">
    </Icon>
  </div>
</template>

<script>
import Icon from '../BaseIconContainer';
export default {
  name: 'play-button',
  props: {
    paused: false,
  },
  data() {
    return {
      iconAppear: false, // control whether the icon show up or not
      ani_mode: '', // change the CSS
    };
  },
  components: {
    Icon,
  },
  watch: {
    paused(newVal) {
      this.iconAppear = true;
      this.ani_mode = newVal ? 'icon-ani-pause' : 'icon-ani-play';
    },
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
    width: 54px;
    height: 54px;
  }
}
@media screen and (min-width: 513px) and (max-width: 854px) {
  .icon {
    width: 67px;
    height: 67px;
  }
}
@media screen and (min-width: 855px) and (max-width: 1920px) {
  .icon {
    width: 93px;
    height: 93px;
  }
}
@media screen and (min-width: 1921px) {
  .icon {
    width: 129px;
    height: 129px;
  }
}
</style>
