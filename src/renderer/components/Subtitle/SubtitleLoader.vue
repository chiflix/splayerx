<template>
  <div class="subtitle-laoder"></div>
</template>
<script>
import srtVttCompiler from 'subtitle';
import assCompiler from 'ass-compiler';
export default {
  name: 'subtitle-loader',
  props: {
    subtitle: String,
    type: String,
    currentTime: Number,
  },
  data() {
    return {
      parsedSubtitle: null,
    };
  },
  methods: {
    getParser(type) {
      let parser = String.prototype.toString;
      switch (type) {
        default:
          break;
        case 'ass':
        case 'ssa':
          parser = assCompiler.parse;
          break;
        case 'srt':
        case 'vtt':
          parser = srtVttCompiler.parse;
      }
      return parser;
    },
  },
  created() {
    const { subtitle, type } = this;
    this.parsedSubtitle = this.getParser(type)(subtitle);
    Object.freeze(this.parsedSubtitle);
    console.log(this.parsedSubtitle);
  },
};
</script>

