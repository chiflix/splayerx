<template>
  <div
    @mousedown.left="handleDown"
    @mouseup.left="togglePlaylistDisplay"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <lottie
      :options="defaultOptions"
      @animCreated="handleAnimation"
      lot="playlist"
    />
  </div>
</template>
<script lang="ts">
import { mapState } from 'vuex';
import { AnimationItem } from 'lottie-web';
import lottie from '@/components/lottie.vue';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import animationData from '@/assets/playlist.json';

export default {
  name: 'PlaylistControl',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
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
    handleAnimation(anim: AnimationItem) {
      this.anim = anim;
    },
    togglePlaylistDisplay() {
      if (this.mouseDown) {
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
      }
    },
    handleDown() {
      this.mouseDown = true;
      this.anim.playSegments([15, 19], true);
      document.onmouseup = () => {
        if (this.validEnter) {
          this.anim.playSegments([47, 51], true);
        } else if (this.currentMousedownComponent === this.$options.name) {
          this.anim.playSegments([37, 41], true);
        }
        this.mouseDown = false;
      };
    },
    handleEnter() {
      if (this.animFlag) {
        if (!this.mouseDown) {
          this.anim.playSegments([9, 13], true);
        } else {
          this.anim.playSegments([27, 31], true);
        }
      }
      this.validEnter = true;
      this.animFlag = false;
    },
    handleLeave() {
      if (this.mouseDown) {
        this.anim.playSegments([21, 25], true);
      } else {
        this.anim.playSegments([3, 7], true);
      }
      this.animFlag = true;
      this.validEnter = false;
    },
  },
};
</script>
<style lang="scss" scoped>
</style>
