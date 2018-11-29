<template>
  <div class="subtitle-loader"></div>
</template>
<script>
import { mapGetters } from 'vuex';
import isEqual from 'lodash/isEqual';
import Subtitle from './Subtitle';
export default {
  name: 'subtitle-loader',
  props: {
    subtitleSrc: String,
  },
  data() {
    return {
      subtitle: null,
      currentCues: [],
    };
  },
  computed: {
    ...mapGetters(['currentTime']),
  },
  watch: {
    currentTime(newVal) {
      const { parsedData } = this.subtitle;
      if (parsedData) {
        const cues = parsedData
          .filter(subtitle => subtitle.start <= newVal && subtitle.end >= newVal);
        if (!isEqual(cues, this.currentCues) && cues.length) {
          this.currentCues = cues;
        }
      }
    },
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
