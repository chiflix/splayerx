<template>
  <div 
    class="invisible-background" 
    :style="{ height: height + 'px', width: width + 'px', right: right + 'px', top: top + 'px' }"></div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: 'base-invisible-background',
  props: {
    mouseenter: false,
  },
  computed: {
    ...mapGetters(['winWidth', 'winHeight']),
    height() {
      return this.winWidth > 1920 ? Math.round(this.winHeight * 0.61)
        : Math.round(140 + ((this.winWidth - 320) / 3.55));
    },
    width() {
      return this.winWidth > 1920 ? Math.round(this.winWidth * 0.07)
        : Math.round(50 + ((this.winWidth - 320) / 32));
    },
    right() {
      return this.winWidth > 1920 ? 28 : Math.round(12 + ((this.winWidth - 320) / 160));
    },
    top() {
      return Math.round((this.winHeight - this.height) / 2);
    },
  },
};
</script>

<style lang="scss" scoped>
.invisible-background {
  position: absolute;
}
</style>
