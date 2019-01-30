<template>
  <div @mousedown.left="handleDown" @mouseup.left="togglePlaylistDisplay" @mouseenter="handleEnter" @mouseleave="handleLeave">
    <lottie v-on:animCreated="handleAnimation" :options="defaultOptions" lot="playlist"></lottie>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import lottie from '@/components/lottie.vue';
import animationData from '@/assets/playlist.json';

export default {
  name: 'playlist-control',
  components: {
    lottie,
  },
  props: {
    showAttached: Boolean,
  },
  data() {
    return {
      defaultOptions: { animationData },
      animationSpeed: 1,
      anim: {},
      validEnter: false,
      clicks: 0,
    };
  },
  computed: {
    ...mapState({
      currentMousedownComponent: ({ Input }) => Input.mousedownComponentName,
    }),
  },
  methods: {
    handleAnimation(anim) {
      this.anim = anim;
    },
    togglePlaylistDisplay() {
      this.clicks = this.showAttached ? 1 : 0;
      this.clicks += 1;
      switch (this.clicks) {
        case 1:
          this.$emit('update:showAttached', true);
          break;
        case 2:
          this.$emit('update:showAttached', false);
          this.clicks = 0;
          break;
        default:
          this.clicks = 0;
          break;
      }
    },
    handleDown() {
      this.mouseDown = true;
      this.anim.playSegments([15, 19], false);
      document.onmouseup = () => {
        if (this.validEnter) {
          this.anim.playSegments([47, 51], false);
        } else if (this.currentMousedownComponent === this.$options.name) {
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
