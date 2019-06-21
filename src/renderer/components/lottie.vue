<template>
  <div
    ref="lavContainer"
    :class="lot"
  />
</template>

<script lang="ts">
import lottie from 'lottie-web';

export default {
  props: {
    options: {
      type: Object,
      required: true,
    },
    lot: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      anim: {},
    };
  },
  mounted() {
    this.anim = lottie.loadAnimation({
      container: this.$refs.lavContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: this.options.animationData,
    });
    this.anim.setSpeed(1.5);
    this.$emit('animCreated', this.anim);
  },
};
</script>
<style lang="scss" scoped>
.advance, .subtitle, .playlist{
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 26.4px;
    height: 22px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 38.4px;
    height: 32px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 60px;
    height: 50px;
  }
  display: block;
}
</style>
