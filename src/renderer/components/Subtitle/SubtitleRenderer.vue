<template>
  <div
    class="subtitle-loader"
  >
    <div
      v-for="(item, index) in noPositionCues"
      :key="'noPosition' + index"
      :class="'subtitle-alignment'+(index+1)"
      :style="{
        zIndex: '2',
        bottom: calculateSubBottom(index),
        top: calculateSubTop(index),
      }"
    >
      <p
        v-for="(cue, ind) in item"
        :v-if="!cue.hide"
        :key="cue.text + ind"
        :style="{
          zoom: cue.category === 'first' ? `${scaleNum}` : `${secondarySubScale}`,
          writingMode: (cue.category === 'first' ? firstType === 'vtt' : secondType === 'vtt')
            ? `vertical-${cue.tags.vertical}` : '',
          lineHeight: calculateLineHeight(cue.text),
          paddingTop: calculatePaddingTop(cue, ind, item),
          paddingBottom: calculatePaddingBottom(cue, ind, item),
          marginBottom: item[ind + 1] && cue.category === 'first' &&
            item[ind + 1].category === 'secondary' ? `${subtitleSpace / scaleNum}px` : '',
          fontWeight: cue.tags.b ? 'bold' : '',
          fontStyle: cue.tags.i ? 'italic' : '',
          textDecoration: cue.tags.u ? 'underline' : cue.tags.s ? 'line-through' : '',
        }"
        :class="[`subtitle-style${chosenStyle}`]"
      ><!--eslint-disable-line-->{{ cue.text }}</p>
    </div>
    <div
      v-for="(item, index) in positionCues"
      :key="'position'+index"
      :style="{
        position: 'absolute',
        left: subLeft(item[0]),
        top: subTop(item[0]),
        transform: `translate(${translateNum(item[0])[0]}%, ${translateNum(item[0])[1]}%)`,
        transformOrigin: 'bottom left',
      }"
    >
      <p
        v-for="(cue, ind) in item"
        :key="cue.text + ind"
        :style="{
          whiteSpace: 'pre',
          zoom: cue.category === 'first' ? `${scaleNum}` : `${secondarySubScale}`,
          fontWeight: cue.tags.b ? 'bold' : '',
          fontStyle: cue.tags.i ? 'italic' : '',
          textDecoration: cue.tags.u ? 'underline' : cue.tags.s ? 'line-through' : '',
          lineHeight: calculateLineHeight(cue.text),
          paddingTop: calculatePaddingTop(cue, ind, item),
          paddingBottom: calculatePaddingBottom(cue, ind, item),
        }"
        :class="'subtitle-style'+chosenStyle"
      ><!--eslint-disable-line-->{{ cue.text }}</p>
    </div>
  </div>
</template>
<script lang="ts">
import { isEqual } from 'lodash';
import { Cue, Tags } from '@/interfaces/ISubtitle';
import { calculateTextSize } from '@/libs/utils';

export default {
  name: 'SubtitleRenderer',
  props: {
    currentCues: {
      type: Array,
      required: true,
    },
    subPlayRes: {
      type: Array,
      required: true,
    },
    scaleNum: {
      type: Number,
      required: true,
    },
    subToTop: {
      type: Boolean,
    },
    currentFirstSubtitleId: {
      type: String,
      required: true,
    },
    currentSecondarySubtitleId: {
      type: String,
      required: true,
    },
    winHeight: {
      type: Number,
      required: true,
    },
    chosenStyle: {
      type: Number,
      default: 0,
    },
    chosenSize: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      noPositionCues: [],
      normalFont: 'Avenir, Roboto-Regular, PingFang SC, Microsoft Yahei',
    };
  },
  computed: {
    subtitleSpace() {
      const subSpaceFactors: number[] = [12, 15, 18, 21];
      return subSpaceFactors[this.chosenSize] / 1080 * this.winHeight;
    },
    firstType() {
      return this.currentCues[0].cue && this.currentCues[0].cue.length > 0 ? this.currentCues[0].cue[0].format : '';
    },
    secondType() {
      return this.currentCues[1].cue && this.currentCues[1].cue.length > 0 ? this.currentCues[1].cue[0].format : '';
    },
    secondarySubScale() {
      if (this.currentFirstSubtitleId === '') {
        return this.scaleNum;
      }
      return (this.scaleNum * 5) / 6 < 1 ? 1 : (this.scaleNum * 5) / 6;
    },
    positionCues() {
      const firstCues: Cue[] = this.currentCues[0]
        .filter((cue: Cue) => this.calculatePosition(cue.category, cue.tags)).map((cue: Cue) => { cue.category = 'first'; return cue; });
      const secondaryCues: Cue[] = this.currentCues[1]
        .filter((cue: Cue) => this.calculatePosition(cue.category, cue.tags)).map((cue: Cue) => { cue.category = 'secondary'; return cue; });
      const firstClassifiedCues: Cue[][] = [];
      const secondaryClassifiedCues: Cue[][] = [];
      firstCues.forEach((item: Cue) => {
        const index: number = firstClassifiedCues
          .findIndex((e: Cue[]) => isEqual(e[0].tags, item.tags));
        if (index !== -1) {
          firstClassifiedCues[index].push(item);
        } else {
          firstClassifiedCues.push([item]);
        }
      });
      secondaryCues.forEach((item: Cue) => {
        const index: number = secondaryClassifiedCues
          .findIndex((e: Cue[]) => isEqual(e[0].tags, item.tags));
        if (index !== -1) {
          secondaryClassifiedCues[index].push(item);
        } else {
          secondaryClassifiedCues.push([item]);
        }
      });
      return (firstClassifiedCues || []).concat(secondaryClassifiedCues || []);
    },
    allCues() {
      const allCues = [];
      for (let i = 1; i < 10; i += 1) {
        const firstCues = this.currentCues[0]
          .filter((cue: Cue) => (this.subToTop && [1, 2, 3]
            .includes(this.calculateAlignment(cue.category, cue.tags))
            ? this.calculateAlignment(cue.category, cue.tags) + 6
            : this.calculateAlignment(cue.category, cue.tags)) === i
            && !this.calculatePosition(cue.category, cue.tags));
        const secondaryCues = this.currentCues[1]
          .filter((cue: Cue) => (this.subToTop && [1, 2, 3]
            .includes(this.calculateAlignment(cue.category, cue.tags))
            ? this.calculateAlignment(cue.category, cue.tags) + 6
            : this.calculateAlignment(cue.category, cue.tags)) === i
            && !this.calculatePosition(cue.category, cue.tags));
        allCues.push((firstCues.length ? firstCues.map((cue: Cue) => { cue.category = 'first'; return cue; }) : [])
          .concat(secondaryCues.length ? secondaryCues.map((cue: Cue) => { cue.category = 'secondary'; return cue; }) : []));
      }
      return allCues;
    },
  },
  watch: {
    allCues: {
      handler(val: Cue[][], oldVal: Cue[][]) {
        this.noPositionCues = val;
        this.$nextTick(() => {
          for (let i = 0; i < 9; i += 1) {
            if (val[i].length < oldVal[i].length
              && val[i].every((e: Cue) => oldVal[i].includes(e))) {
              this.noPositionCues[i] = oldVal[i].map((cue: Cue) => {
                cue.hide = !val[i].includes(cue);
                return cue;
              });
            } else {
              this.noPositionCues[i] = val[i].map((cue: Cue) => { cue.hide = false; return cue; });
            }
          }
        });
      },
      deep: true,
    },
  },
  methods: {
    calculateSubBottom(index: number) {
      if ([1, 2, 3].includes(index + 1)) {
        const textHeight = calculateTextSize('9px', this.normalFont, '108%', this.secondarySubScale.toString(), 'test').height;
        const padding = this.chosenStyle === 4 ? 0.9 : 0;
        const adaptedCues = this.noPositionCues[0]
          .concat(this.noPositionCues[1], this.noPositionCues[2])
          .filter((cue: Cue) => cue.category && cue.category === 'secondary');
        if (adaptedCues.length === 1 && this.currentFirstSubtitleId && !adaptedCues[0].text.includes('\n')) {
          return `${((textHeight + padding) * this.secondarySubScale + padding * 2 + (60 / 1080) * this.winHeight) * 100 / this.winHeight}%`;
        }
        if (adaptedCues.length === 0 && this.currentSecondarySubtitleId
          && this.currentFirstSubtitleId) {
          return `${(this.subtitleSpace + (textHeight + padding) * 2 * this.secondarySubScale + (60 / 1080) * this.winHeight) * 100 / this.winHeight}%`;
        }
        return `${60 / 10.8}%`;
      }
      return '';
    },
    calculateSubTop(index: number) {
      if ([7, 8, 9].includes(index + 1)) {
        const textHeight = calculateTextSize('9px', this.normalFont, '108%', this.scaleNum.toString(), 'test').height;
        const padding = this.chosenStyle === 4 ? 0.9 : 0;
        const adaptedCues = this.noPositionCues[6]
          .concat(this.noPositionCues[7], this.noPositionCues[8])
          .filter((cue: Cue) => cue.category && cue.category === 'first');
        if (adaptedCues.length === 1 && this.currentSecondarySubtitleId && !adaptedCues[0].text.includes('\n')) {
          return `${(60 / 1080 * this.winHeight + (textHeight + padding * 2) * this.scaleNum) * 100 / this.winHeight}%`;
        }
        if (adaptedCues.length === 0 && this.currentSecondarySubtitleId
          && this.currentFirstSubtitleId) {
          return `${(this.subtitleSpace + (textHeight + padding) * 2 * this.scaleNum + 60 / 1080 * this.winHeight) * 100 / this.winHeight}%`;
        }
        return `${60 / 10.8}%`;
      }
      return '';
    },
    calculatePaddingTop(cue: Cue, ind: number, item: Cue[]) {
      if (this.chosenStyle === 4
        && (ind === 0 || (item[ind - 1].category === 'first' && cue.category === 'secondary'))) {
        return '0.9px';
      }
      return '';
    },
    calculatePaddingBottom(cue: Cue, ind: number, item: Cue[]) {
      if (this.chosenStyle === 4
        && (ind === item.length - 1 || (cue.category === 'first' && (!item[ind + 1] || item[ind + 1].category === 'secondary')))) {
        return '0.9px';
      }
      return '';
    },
    calculateLineHeight(text: string) {
      const line = text.split('\n').length + 1;
      return `${(line - 1) * 20 + 100}%`;
    },
    calculatePosition(category: string, tags: Tags) {
      const type = category === 'first' ? this.firstType : this.secondType;
      if (type !== 'vtt') {
        return !!tags.pos;
      }
      return tags.line && tags.position;
    },
    calculateAlignment(category: string, tags: Tags) {
      const type = category === 'first' ? this.firstType : this.secondType;
      if (type !== 'vtt') {
        return !tags || !tags.alignment ? 2 : tags.alignment;
      }
      return !tags.line && !tags.position ? 2 : '';
    },
    subLeft(cue: Cue) {
      const subPlayResX: number = cue.category === 'first' ? this.subPlayRes[0].x : this.subPlayRes[1].x;
      const type = cue.category === 'first' ? this.firstType : this.secondType;
      const { tags } = cue;
      if (type !== 'vtt' && tags.pos) {
        return `${(tags.pos.x / subPlayResX) * 100}vw`;
      }
      if (type === 'vtt' && tags.line && tags.position) {
        if (tags.vertical) {
          if (!tags.line.includes('%')) {
            tags.line = `${Math.abs(Number(tags.line)) * 100}%`;
          }
          return tags.line;
        }
        return tags.position;
      }
      return '';
    },
    subTop(cue: Cue) {// eslint-disable-line
      const subPlayResY: number = cue.category === 'first' ? this.subPlayRes[0].y : this.subPlayRes[1].y;
      const type = cue.category === 'first' ? this.firstType : this.secondType;
      const { tags } = cue;
      const isVtt = type === 'vtt';
      if (!isVtt) {
        if (tags.pos) {
          return `${(tags.pos.y / subPlayResY) * 100}vh`;
        }
        if (tags.alignment && [7, 8, 9].includes(tags.alignment)) {
          return `${(60 / 1080) * 100}%`;
        }
        return '';
      }
      if (isVtt && tags.line && tags.position) {
        if (tags.vertical) {
          return tags.position;
        }
        if (!tags.line.includes('%')) {
          tags.line = `${Math.abs(Number(tags.line)) * 100}%`;
        }
        return tags.line;
      }
      return '';
    },
    translateNum(cue: Cue) { // eslint-disable-line
      const index = this.calculateAlignment(cue.category, cue.tags)
        ? this.calculateAlignment(cue.category, cue.tags) : 2;
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
.subtitle-loader {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: auto;
}
</style>
