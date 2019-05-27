<template>
  <div class="subtitle-loader">
    <div
      v-for="(cue, index) in currentCues"
      :id="cueType+index"
      :key="index"
      class="subContainer"
      :class="avaliableClass(index)"
      :style="{
        writingMode: isVtt ? `vertical-${cue.tags.vertical}` : '',
        left: subLeft(index),
        top: subTop(index),
        bottom: subBottom(index),
        transform: transPos(index),
      }"
    >
      <cue-renderer
        :text="cue.text"
        :settings="cue.tags"
        :style="{
          zoom: isFirstSub ? `${scaleNum}` : `${secondarySubScale}`,
          lineHeight: enabledSecondarySub && currentFirstSubtitleId !== '' &&
            currentSecondSubtitleId !== '' ? '68%' : 'normal',
        }"
      />
    </div>
  </div>
</template>
<script>
import { mapGetters, mapMutations } from 'vuex';
import { isEqual, differenceWith, isEmpty } from 'lodash';
import { Subtitle as subtitleMutations } from '@/store/mutationTypes';
import { videodata } from '@/store/video';
import CueRenderer from './CueRenderer.vue';
import SubtitleInstance from './SubtitleLoader/index';

export default {
  name: 'SubtitleRenderer',
  components: { CueRenderer },
  props: {
    subtitleInstance: SubtitleInstance,
    isFirstSub: {
      type: Boolean,
      default: true,
    },
    linesNum: {
      type: Number,
      default: 1,
    },
    firstLinesNum: {
      type: Number,
      default: 1,
    },
    tags: {
      type: Object,
      required: true,
    },
    firstTags: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      subtitle: null,
      currentCues: [],
      videoSegments: [],
      currentSegment: [0, 0, false],
      elapsedSegmentTime: 0,
      lastIndex: [],
      lastAlignment: [],
      lastText: [],
      subPlayResX: 0,
      subPlayResY: 0,
      lastTransPercent: 0,
      requestId: 0,
    };
  },
  computed: {
    ...mapGetters(['duration', 'scaleNum', 'subtitleDelay', 'intrinsicHeight', 'intrinsicWidth',
      'subToTop', 'currentFirstSubtitleId', 'currentSecondSubtitleId', 'winHeight',
      'enabledSecondarySub', 'chosenSize']),
    type() {
      return this.subtitleInstance.metaInfo.format;
    },
    cueType() {
      return this.isFirstSub ? 'first-cue' : 'secondary-cue';
    },
    currentTags() {
      return this.currentCues.map(cue => cue.tags);
    },
    currentTexts() {
      return this.currentCues.map(cue => cue.text);
    },
    isVtt() {
      return this.type === 'vtt';
    },
    secondarySubScale() { // 第二字幕的字号最小不小于9px
      if (this.currentFirstSubtitleId === '') {
        return this.scaleNum;
      }
      return (this.scaleNum * 5) / 6 < 1 ? 1 : (this.scaleNum * 5) / 6;
    },
    shouldTranslate() {
      return !this.tags.pos && !this.firstTags.pos &&
        this.tags.alignment === this.firstTags.alignment;
    },
  },
  watch: {
    videoSegments(newVal) {
      const duration = newVal
        .filter(segment => segment[2])
        .map(segment => segment[1] - segment[0])
        .reduce((prev, curr) => prev + curr, 0);
      this.updateDuration({ id: this.subtitleInstance.id, duration });
    },
    currentTexts(val) {
      val.forEach((de, index) => {
        const ind = this.lastText.indexOf(de);
        if (ind !== -1) {
          this.currentCues[index].tags.alignment = this.lastAlignment[ind];
        }
      });
      const { currentTags: tags } = this;
      const len = val.length;
      // 在这里监听当前currentCues,来更新firstLinesNum，linesNum
      if (len > 0 && !this.isFirstSub) {
        this.$emit(
          'update:linesNum',
          this.lastLineNum(len - 1) + val[len - 1].split('\n').length,
        ); // 第二字幕的行数
        this.$emit('update:tags', tags[len - 1]); // 第二字幕的tags
      } else if (len > 0) {
        this.$emit(
          'update:firstLinesNum',
          this.lastLineNum(len - 1) + val[len - 1].split('\n').length,
        );
        this.$emit('update:firstTags', tags[len - 1]); // 第一字幕的tags
      } else if (!this.isFirstSub) {
        this.$emit('update:linesNum', 0); // 第二字幕的行数
        this.$emit('update:tags', {}); // 第二字幕的tags
      } else {
        this.$emit('update:firstLinesNum', 0);
        this.$emit('update:firstTags', {}); // 第一字幕的tags
      }
    },
    subToTop(val) {
      if (!val) {
        this.lastIndex.forEach((index) => {
          if (this.currentTags[index]) {
            this.currentTags[index].alignment = this.lastAlignment[index]
              ? this.lastAlignment[index] : 2;
          }
        });
      }
    },
  },
  created() {
    const { subtitleInstance } = this;
    subtitleInstance.once('data', subtitleInstance.parse);
    subtitleInstance.on('parse', (parsed) => {
      const parsedData = parsed.dialogues;
      this.videoSegments = this.getVideoSegments(parsedData, this.duration);
      this.subPlayResX = !isEmpty(parsed.info) ? Number(parsed.info.PlayResX) : this.intrinsicWidth;
      this.subPlayResY = !isEmpty(parsed.info) ? Number(parsed.info.PlayResY) :
        this.intrinsicHeight;
    });
    subtitleInstance.load();
  },
  mounted() {
    this.requestId = requestAnimationFrame(this.currentTimeUpdate);
  },
  beforeDestroy() {
    cancelAnimationFrame(this.requestId);
    this.lastIndex = [];
    this.lastAlignment = [];
    this.lastText = [];
  },
  methods: {
    ...mapMutations({
      updateDuration: subtitleMutations.DURATIONS_UPDATE,
    }),
    avaliableClass(index) {
      if (!this.isVtt) {
        if (!this.currentTags[index].pos) {
          if (this.subToTop && ![4, 5, 6, 7, 8, 9].includes(this.currentTags[index].alignment)) {
            this.lastIndex.push(index);
            this.lastAlignment.push(this.currentTags[index].alignment);
            this.lastText.push(this.currentTexts[index]);
            this.currentTags[index].alignment += 6;
          }
          return `subtitle-alignment${this.currentTags[index].alignment}`;
        }
        return '';
      } else if (this.isVtt && this.currentTags[index].line && this.currentTags[index].position) {
        return '';
      }
      return 'subtitle-alignment2';
    },
    currentTimeUpdate() {
      const { time: currentTime } = videodata;
      const { subtitleDelay } = this;
      if (!this.lastCurrentTime) {
        this.lastCurrentTime = currentTime;
      }
      const { lastCurrentTime } = this;
      this.setCurrentCues(currentTime - (subtitleDelay / 1000));
      this.updateVideoSegments(lastCurrentTime, currentTime);
      this.requestId = requestAnimationFrame(this.currentTimeUpdate);
    },
    isSameCues(cues1, cues2) {
      return !differenceWith(
        cues1,
        cues2,
        (cue1, cue2) => {
          const { text: text1, tags: tags1 } = cue1;
          const { text: text2, tags: tags2 } = cue2;
          return (
            text1 === text2 &&
            isEqual(tags1, tags2)
          );
        },
      ).length;
    },
    setCurrentCues(currentTime) {
      if (!this.subtitleInstance.parsed) return;
      const parsedData = this.subtitleInstance.parsed.dialogues;
      if (parsedData) {
        const cues = this.parsedFragments(parsedData
          .filter(({
            start, end,
            text, fragments,
          }) => (
            start <= currentTime &&
            end >= currentTime &&
            (!!text || !!fragments)
          )));
        if (cues.length !== this.currentCues.length || !this.isSameCues(cues, this.currentCues)) {
          this.currentCues = cues;
        }
      }
    },
    parsedFragments(cues) {
      if (this.type === 'ass') {
        const currentCues = [];
        cues.forEach((item) => {
          let currentText = '';
          let currentTags = {};
          if (item.fragments.length) {
            item.fragments.forEach((cue) => {
              currentText += cue.text;
              if (cue.tags) {
                currentTags = cue.tags;
              }
            });
            currentCues.push({
              start: item.start, end: item.end, tags: currentTags, text: currentText,
            });
          }
        });
        return currentCues;
      }
      cues.forEach((item) => {
        if ('line' in item.tags || 'position' in item.tags || 'vertical' in item.tags) {
          item.tags = { pos: undefined, alignment: 2 };
        }
      });
      return cues;
    },
    updateVideoSegments(lastCurrentTime, currentTime) {
      const { videoSegments, currentSegment, elapsedSegmentTime } = this;
      const segment = videoSegments
        .filter(segment => segment[0] <= currentTime && segment[1] > currentTime)[0];
      if (segment && !segment[2]) {
        if (isEqual(segment, currentSegment)) {
          this.elapsedSegmentTime += currentTime - lastCurrentTime;
        } else {
          const segmentTime = currentSegment[1] - currentSegment[0];
          if (elapsedSegmentTime / segmentTime >= 0.9) {
            const index = videoSegments.findIndex(segment => segment[0] === currentSegment[0]);
            if (index !== -1) {
              this.$set(videoSegments, index, [...videoSegments[index].slice(0, 2), true]);
            }
          }
          this.currentSegment = segment;
        }
      }
    },
    lastLineNum(index) {
      // 全部显示的字幕中，除当前最新一条字幕外所有字幕的行数
      const { currentTexts: texts, currentTags: tags } = this;
      let tmp = 0;
      while (texts[index - 1]) {
        if (!isEqual(tags[index], tags[index - 1])) {
          break;
        }
        tmp += texts[index - 1].replace('/\n$/g', '').split('\n').length;
        index -= 1;
      }
      return tmp;
    },
    lineNum(index) {
      // 最新一条字幕需要换行的translate比例
      const { currentTexts: texts } = this;
      return this.lastLineNum(index) / texts[index].split('\n').length;
    },
    assLine(index) {
      const { currentTags: tags } = this;
      if (tags[index].pos) {
        return -100 * this.lineNum(index);
      }
      const arr = [1, 2, 3];
      if (arr.includes(tags[index].alignment) && !this.subToTop) {
        return -100 * this.lineNum(index);
      }
      return 100 * this.lineNum(index);
    },
    vttLine(index) {
      const { currentTags: tags } = this;
      let tmp = tags[index].line;
      if (tags[index].line && tags[index].line.includes('%')) {
        tmp = -parseInt(tags[index].line, 10) / 100;
      }
      if (tmp >= -1 && tmp < -0.5) {
        return -100 * this.lineNum(index);
      }
      return 100 * this.lineNum(index);
    },
    transDirection(transNum, alignment) { // 播放列表打开，translate方向改变
      return this.subToTop || [7, 8, 9].includes(alignment) ? Math.abs(transNum) : transNum;
    },
    firstSubTransPercent(transPercent, alignment) { // 当播放列表打开，第一字幕对应的transPercent
      return this.subToTop || [7, 8, 9].includes(alignment) ? 0 : transPercent;
    },
    secondarySubTransPercent(transPercent, alignment) { // 当播放列表打开，第二字幕对应的transPercent
      return (this.subToTop || [7, 8, 9].includes(alignment)) &&
      this.currentSecondSubtitleId !== '' && this.currentFirstSubtitleId !== '' &&
      this.enabledSecondarySub ? transPercent : 0;
    },
    transPos(index) { // eslint-disable-line
      const { currentTags: tags, currentTexts: texts, isVtt } = this;
      const initialTranslate = [
        [0, 0],
        [-50, 0],
        [0, 0],
        [0, -50],
        [-50, -50],
        [0, -50],
        [0, 0],
        [-50, 0],
        [0, 0],
      ];
      // 两个字幕的间距，由不同字幕大小下的不同表达式决定
      const subSpaceFactorsA = [5 / 900, 9 / 900, 10 / 900, 12 / 900];
      const subSpaceFactorsB = [4, 21 / 5, 4, 23 / 5];
      let secondSubHeight = 0;
      let firstSubHeight = 0;
      let transPercent;
      let subHeightWithDirection = [];
      // 当出现第二字幕的情况下
      // *. 当第一字幕和第二字幕的alignment不同时，不需要transPercent
      // 1。正常情况：第二字幕没有transPercent，第一字幕参考第二字幕的有效总行数，来计算transPercent
      // 2。字幕在上面：第一字幕没有transPercent，第二字幕参考第一字幕的有效总行数，来计算transPercent
      if (this.tags && this.firstTags && this.tags.alignment !== this.firstTags.alignment) {
        transPercent = 0;
      } else if (this.isFirstSub && !(this.subToTop || [7, 8, 9].includes(tags[index].alignment))) {
        // 根据第二字幕的有效行数，计算第二字幕的比较高度
        secondSubHeight = this.linesNum * 9 * this.secondarySubScale;
        // 第一字幕的按顺序，计算当前自己的比较高度
        firstSubHeight = texts[index].split('\n').length * 9 * this.scaleNum;
        subHeightWithDirection = [secondSubHeight, firstSubHeight];
      } else if (!this.isFirstSub && (this.subToTop || [7, 8, 9].includes(tags[index].alignment))) {
        // 第二字幕的按顺序，计算当前自己的比较高度
        secondSubHeight = texts[index].split('\n').length * 9 * this.secondarySubScale;
        // 根据第一字幕的有效行数，计算第一字幕的比较高度
        firstSubHeight = this.firstLinesNum * 9 * this.scaleNum;
        subHeightWithDirection = [firstSubHeight, secondSubHeight];
      }
      if (subHeightWithDirection.length === 2) {
        transPercent = -((subHeightWithDirection[0] + ((subSpaceFactorsA[this.chosenSize] *
          this.winHeight) + subSpaceFactorsB[this.chosenSize])) / subHeightWithDirection[1]) * 100;
      }
      if (!isVtt) {
        if (this.isFirstSub) { // 第一字幕不是VTT
          if (tags[index] && tags[index].pos) {
            // 字幕不为vtt且存在pos属性时，translate字幕使字幕alignment与pos点重合
            return `translate(
            ${this.translateNum(tags[index].alignment)[0]}%,
            ${this.translateNum(tags[index].alignment)[1] + this.assLine(index)}%)`;
          }
          if (this.currentSecondSubtitleId !== '' &&
            this.enabledSecondarySub && this.shouldTranslate) {
            // 没有位置信息时且同时存在第一第二字幕时第一字幕需要translate的值
            return `translate(${initialTranslate[tags[index].alignment - 1][0]}%,
            ${this.transDirection(
    initialTranslate[tags[index].alignment - 1][1] +
      this.firstSubTransPercent(transPercent, tags[index].alignment),
    tags[index].alignment,
  ) + this.assLine(index)}%)`;
          }
          // 只有第一字幕时需要translate的值
          return `translate(
          ${initialTranslate[tags[index].alignment - 1][0]}%,
          ${this.transDirection(
    initialTranslate[tags[index].alignment - 1][1],
    tags[index].alignment,
  ) + this.assLine(index)}%)`;
        }
        if (tags[index] && tags[index].pos) { // 第二字幕不是VTT
          // 字幕不为vtt且存在pos属性时，translate字幕使字幕alignment与pos点重合
          return `translate(
          ${this.translateNum(tags[index].alignment)[0]}%,
          ${this.transDirection(
    this.translateNum(tags[index].alignment)[1],
    tags[index].alignment,
  ) + this.assLine(index)}%)`;
        }
        return `translate(
        ${initialTranslate[tags[index].alignment - 1][0]}%,
        ${this.transDirection(
    initialTranslate[tags[index].alignment - 1][1] +
      this.secondarySubTransPercent(transPercent, tags[index].alignment),
    tags[index].alignment,
  ) + this.assLine(index)}%)`;
      }
      if (tags[index].line && tags[index].position) { // 字幕为VTT且有位置信息
        return '';
      }
      if (this.isFirstSub) {
        if (this.currentSecondSubtitleId !== '' && this.enabledSecondarySub) {
          // vtt字幕没有位置信息时且同时存在第一第二字幕时第一字幕需要translate的值
          if (tags[index] && tags[index].vertical) {
            return `translate(
            ${initialTranslate[1][0] + this.vttLine(index)}%,
            ${this.transDirection(initialTranslate[1][1] +
              this.firstSubTransPercent(transPercent))}%)`;
          }
          return `translate(
          ${initialTranslate[1][0]}%,
          ${this.transDirection(initialTranslate[1][1] + this.firstSubTransPercent(transPercent)) +
          this.vttLine(index)}%)`;
        }
        // 只有第一字幕时需要translate的值
        if (tags[index] && tags[index].vertical) {
          return `translate(
          ${initialTranslate[1][0] + this.vttLine(index)}%,
          ${this.transDirection([1][1], tags[index].alignment)}%)`;
        }
        return `translate(
        ${initialTranslate[1][0]}%,
        ${this.transDirection([1][1], tags[index].alignment) + this.vttLine(index)}%)`;
      }
      return `translate(
      ${initialTranslate[1][0]}%,
      ${this.transDirection(
    initialTranslate[1][1] +
      this.secondarySubTransPercent(transPercent, tags[index].alignment),
    tags[index].alignment,
  ) + this.assLine(index)}%)`;
    },
    subLeft(index) {
      const { currentTags: tags, type, isVtt } = this;
      if (!isVtt && tags[index].pos) {
        return `${(tags[index].pos.x / this.subPlayResX) * 100}vw`;
      } else if (type === 'vtt' && tags[index].line && tags[index].position) {
        if (tags[index].vertical) {
          if (!tags[index].line.includes('%')) {
            tags[index].line = Math.abs(tags[index].line) * 100;
            tags[index].line += '%';
          }
          return tags[index].line;
        }
        return tags[index].position;
      }
      return '';
    },
    subTop(index) {
      const { currentTags: tags, isVtt } = this;
      if (!isVtt) {
        if (tags[index].pos) {
          return `${(tags[index].pos.y / this.subPlayResY) * 100}vh`;
        } else if ([7, 8, 9].includes(tags[index].alignment)) {
          return `${(60 / 1080) * 100}%`;
        }
        return '';
      } else if (isVtt && tags[index].line && tags[index].position) {
        if (tags[index].vertical) {
          return tags[index].position;
        }
        if (!tags[index].line.includes('%')) {
          tags[index].line = Math.abs(tags[index].line) * 100;
          tags[index].line += '%';
        }
        return tags[index].line;
      }
      return '';
    },
    subBottom(index) {
      const { currentTags: tags, isVtt } = this;
      if (((!isVtt && [1, 2, 3].includes(tags[index].alignment)) && !tags[index].pos) ||
        (isVtt && (!tags[index].line || !tags[index].position))) {
        return `${(60 / 1080) * 100}%`;
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
    getVideoSegments(parsedSubtitle, duration) {
      const subtitleSegments = parsedSubtitle
        .filter(subtitle => subtitle.text !== '')
        .map(subtitle => [subtitle.start || 0, subtitle.end || duration])
        .sort((a, b) => a[0] - b[0]);
      const result = [[0, 0]];
      let currentIndex = 0;
      while (duration && result[result.length - 1][1] !== duration) {
        const lastElement = result[result.length - 1];
        if (currentIndex < subtitleSegments.length) {
          if (lastElement[1] <= subtitleSegments[currentIndex][0]) {
            [lastElement[1]] = [subtitleSegments[currentIndex][0]];
            result.push(subtitleSegments[currentIndex]);
            currentIndex += 1;
          } else {
            currentIndex += 1;
          }
        } else {
          lastElement[1] = duration;
        }
      }
      return result.map(segment => [...segment, false]);
    },
  },
};
</script>
<style scoped lang="scss">
.subtitle-loader {
  position: absolute;
  width: 100%;
  height: 100%;
}
.subContainer {
  position: absolute;
  display: flex;
  flex-direction: column-reverse;
  transform-origin: bottom left;
  z-index: 5;
}
</style>
