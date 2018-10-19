<template>
  <div @mousedown.left="handleDown" @mouseenter="handleEnter" @mouseleave="handleLeave">
    <!--<Icon type="listicon"></Icon>-->
    <lottie v-on:animCreated="handleAnimation" :options="defaultOptions" lot="playlist"></lottie>
  </div>
</template>
<script>
import lottie from '@/components/lottie.vue';
import * as animationData from '@/assets/playlist.json';
import Icon from '../BaseIconContainer';
export default {
  name: 'playlist-control',
  components: {
    Icon,
    lottie,
  },
  data() {
    return {
      defaultOptions: { animationData },
      animationSpeed: 1,
      anim: {},
      validEnter: false,
    };
  },
  methods: {
    handleAnimation(anim) {
      this.anim = anim;
    },
    handleDown() {
      this.mouseDown = true;
      this.anim.playSegments([15, 19], false);
      document.onmouseup = () => {
        if (this.validEnter) {
          this.anim.playSegments([47, 51], false);
        } else {
          this.anim.playSegments([37, 41], false);
        }
        this.mouseDown = false;
      };
    },
    handleEnter() {
      if (this.animFlag) {
        if (!this.mouseDown) {
          this.anim.playSegments([9, 13], false);
        } else {
          this.anim.playSegments([27, 31], false);
        }
      }
      this.validEnter = true;
      this.animFlag = false;
    },
    handleLeave() {
      if (this.mouseDown) {
        this.anim.playSegments([21, 25], false);
      } else {
        this.anim.playSegments([3, 7], false);
      }
      this.animFlag = true;
      this.validEnter = false;
    },
  },
};
</script>
<style lang="scss" scoped>
</style>
