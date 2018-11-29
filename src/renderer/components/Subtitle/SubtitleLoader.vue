<template>
  <div
    class="subtitle-loader"></div>
</template>
<script>
import Subtitle from './Subtitle';
export default {
  name: 'subtitle-loader',
  props: {
    subtitleSrc: String,
  },
  data() {
    return {
      subtitle: null,
    };
  },
  created() {
    const { subtitleSrc } = this;
    this.subtitle = new Subtitle(subtitleSrc);
    this.subtitle.load();
    this.subtitle.once('parse', (parsed) => {
      this.parsedData = parsed;
    });
  },
};
</script>
<style lang="scss" scoped>
.subtitle-loader {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
