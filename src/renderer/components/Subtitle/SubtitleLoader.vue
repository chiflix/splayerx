<template>
  <div class="subtitle-loader">
    <div class="subContainer"
      :class="type === 'ass' && !set[index].pos ? 'subtitle-alignment'+set[index].alignment : ''"
      v-for="(sub, index) in subs"
      :style="{
        writingMode: type === 'vtt' ? `vertical-${set[index].vertical}` : '',
        left: subLeft(index),
        top: subTop(index),
        transform: transPos(index),
      }">
      <CueRenderer class="cueRender"
        :index="index"
        :text="sub"
        :settings="set"
        :style="{
          zoom: `${scaleNum}`,
          transform: subLine(index),
        }"></CueRenderer>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import isEqual from 'lodash/isEqual';
import Subtitle from './Subtitle';
import CueRenderer from './CueRenderer.vue';
export default {
  name: 'subtitle-loader',
  props: {
    subtitleSrc: String,
  },
  components: {
    CueRenderer,
  },
  computed: {
    ...mapGetters(['scaleNum']),
  },
  data() {
    return {
      subtitle: null,
      parsedData: null,
      subs: ['在线\n测试在\n线测试在\n线测试\n在线测试', 'h\nap\npy', 'en\ndi\nng'],
      set: [{
        alignment: 8, position: '40%', line: '-0.2', vertical: 'lr',
      }, {
        alignment: 8, position: '40%', line: '-0.2', vertical: 'lr',
      }, {
        alignment: 8, position: '40%', line: '-0.2', vertical: 'lr',
      }],
      type: 'ass',
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
  methods: {
    lineNum(index) {
      const lastNum = index;
      let tmp = 0;
      while (this.subs[index - 1]) {
        tmp += this.subs[index - 1].split('\n').length;
        index -= 1;
      }
      return tmp / this.subs[lastNum].split('\n').length;
    },
    assLine(index) {
      if (this.set[index].pos) {
        return `translateY(${-100 * this.lineNum(index)}%)`;
      }
      const arr = [1, 2, 3];
      if (arr.includes(this.set[index].alignment)) {
        return `translateY(${-100 * this.lineNum(index)}%)`;
      }
      return `translateY(${100 * this.lineNum(index)}%)`;
    },
    vttLine(index) { //eslint-disable-line
      let tmp = this.set[index].line;
      if (this.set[index].line.includes('%')) {
        tmp = parseInt(this.set[index].line, 10) / 100;
      }
      if (this.set[index].vertical) {
        if ((tmp >= -1 && tmp < -0.5) || (tmp > 0.5 && tmp <= 1)) {
          return `translateX(${-100 * this.lineNum(index)}%)`;
        }
        return `translateX(${100 * this.lineNum(index)}%)`;
      }
      if ((tmp >= -1 && tmp < -0.5) || (tmp > 0.5 && tmp <= 1)) {
        return `translateY(${-100 * this.lineNum(index)}%)`;
      }
      return `translateY(${100 * this.lineNum(index)}%)`;
    },
    subLine(index) {
      if (isEqual(this.set[index], this.set[index - 1])) {
        if (this.type === 'ass') {
          return this.assLine(index);
        }
        return this.vttLine(index);
      }
      return '';
    },
    transPos(index) {
      if (this.type === 'ass' && this.set[index].pos) {
        return `translate(${this.translateNum(this.set[index].alignment)[0]}%, ${this.translateNum(this.set[index].alignment)[1]}%)`;
      }
      return '';
    },
    subLeft(index) {
      if (this.type === 'ass' && this.set[index].pos) {
        return `${this.set[index].pos[0]}px`;
      } else if (this.type === 'vtt') {
        if (this.set[index].vertical) {
          if (!this.set[index].line.includes('%')) {
            this.set[index].line = Math.abs(this.set[index].line) * 100;
            this.set[index].line += '%';
          }
          return this.set[index].line;
        }
        return this.set[index].position;
      }
      return '';
    },
    subTop(index) {
      if (this.type === 'ass' && this.set[index].pos) {
        return `${this.set[index].pos[1]}px`;
      } else if (this.type === 'vtt') {
        if (this.set[index].vertical) {
          return this.set[index].position;
        }
        if (!this.set[index].line.includes('%')) {
          this.set[index].line = Math.abs(this.set[index].line) * 100;
          this.set[index].line += '%';
        }
        return this.set[index].line;
      }
      return '';
    },
    translateNum(index) {
      switch (index) {
        case 1:
          return [0, -100];
        case 2:
          return [-50, -100];
        case 3:
          return [-100, -100];
        case 4:
          return [0, -50];
        case 5:
          return [-50, -50];
        case 6:
          return [-100, -50];
        case 7:
          return [0, 0];
        case 8:
          return [-50, 0];
        case 9:
          return [-100, 0];
        default:
          return [0, 0];
      }
    },
  },
};
</script>
<style scoped lang="scss">
  .subContainer {
    position: absolute;
    display: flex;
    flex-direction: column-reverse;
    transform-origin: bottom left;
    z-index: 5;
  }
</style>
