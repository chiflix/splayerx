<template>
    <div :class="lot" ref="lavContainer"></div>
</template>

<script>
import lottie from 'lottie-web';
export default {
  props: {
    options: {
      type: Object,
      required: true,
    },
    height: Number,
    width: Number,
    lot: String,
  },
  data() {
    return {
    };
  },
  mounted() {
    this.anim = lottie.loadAnimation({
      container: this.$refs.lavContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: this.options.animationData,
      rendererSettings: this.options.rendererSettings,
    });
    this.$emit('animCreated', this.anim);
  },
};
</script>
<style lang="scss" scoped>
    .subtitle {
        @media screen and (min-width: 513px) and (max-width: 854px) {
            width: 23px;
            height: 18px;
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
            width: 30.67px;
            height: 24px;
        }
        @media screen and (min-width: 1921px) {
            width: 46px;
            height: 36px;
        }
    }
</style>

