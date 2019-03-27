<template>
  <div class="subtitle-loader">
    <div class="subContainer"
      :class="avaliableClass(index)"
      v-for="(cue, index) in currentCues"
      :key="index"
      :style="{
        writingMode: isVtt ? `vertical-${cue.tags.vertical}` : '',
        left: subLeft(index),
        top: subTop(index),
        bottom: subBottom(index),
        transform: transPos(index),
      }">
      <CueRenderer class="cueRender"
        :text="cue.text"
        :settings="cue.tags"
        :style="{
          zoom: isFirstSub ? `${scaleNum}` : `${secondarySubScale}`,
          transform: subLine(index),
          lineHeight: enabledSecondarySub && currentFirstSubtitleId !== '' && currentSecondSubtitleId !== '' ? '68%' : 'normal',
        }"></CueRenderer>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapMutations } from 'vuex';
import { isEqual, castArray, isEmpty } from 'lodash';
import { Subtitle as subtitleMutations } from '@/store/mutationTypes';
import { videodata } from '@/store/video';
import CueRenderer from './CueRenderer.vue';
import SubtitleInstance from './SubtitleLoader/index';

export default {
  name: 'subtitle-renderer',
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
    },
  },
  components: {
    CueRenderer,
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
    };
  },
  computed: {
    ...mapGetters(['duration', 'scaleNum', 'subtitleDelay', 'intrinsicHeight', 'intrinsicWidth', 'subToTop', 'currentFirstSubtitleId', 'currentSecondSubtitleId', 'winHeight', 'enabledSecondarySub', 'chosenSize']),
    type() {
      return this.subtitleInstance.metaInfo.format;
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
      if (parsedData.length) {
        const cues = parsedData
          .filter(subtitle => subtitle.start <= this.subtitleCurrentTime && subtitle.end >= this.subtitleCurrentTime && subtitle.text !== '');
        if (!isEqual(cues, this.currentCues)) {
          this.currentCues = cues;
        }
      }
      this.subPlayResX = !isEmpty(parsed.info) ? Number(parsed.info.PlayResX) : this.intrinsicWidth;
      this.subPlayResY = !isEmpty(parsed.info) ? Number(parsed.info.PlayResY) :
        this.intrinsicHeight;
    });
    subtitleInstance.load();
  },
  mounted() {
    requestAnimationFrame(this.currentTimeUpdate);
    this.$bus.$on('clear-last-cue', () => {
      this.lastIndex = [];
      this.lastAlignment = [];
      this.lastText = [];
    });
  },
  methods: {
    ...mapMutations({
      updateDuration: subtitleMutations.DURATIONS_UPDATE,
    }),
    avaliableClass(index) {
      if (!this.isVtt) {
        if (!this.currentTags[index].pos) {
          if (this.subToTop && this.currentTags[index].alignment !== 8) {
            this.lastIndex.push(index);
            this.lastAlignment.push(this.currentTags[index].alignment);
            this.lastText.push(this.currentTexts[index]);
            this.currentTags[index].alignment = 8;
            return 'subtitle-alignment8';
          }
          return `subtitle-alignment${this.currentTags[index].alignment}`;
        }
        return '';
      } else if (this.isVtt && this.currentTags[index].line !== '' && this.currentTags[index].position !== '') {
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

      requestAnimationFrame(this.currentTimeUpdate);
    },
    setCurrentCues(currentTime) {
      if (!this.subtitleInstance.parsed) return;
      const parsedData = this.subtitleInstance.parsed.dialogues;
      if (parsedData) {
        const cues = parsedData
          .filter(subtitle => subtitle.start <= currentTime && subtitle.end >= currentTime && subtitle.text !== '');
        if (!isEqual(cues, this.currentCues)) {
          let rev = false;
          const tmp = cues;
          if (cues.length >= 2) {
            for (let i = 0; i < tmp.length; i += 1) {
              const pre = castArray(tmp[i]);
              const next = castArray(tmp[i + 1]);
              if (next) {
                pre.splice(2, 1);
                next.splice(2, 1);
                if (isEqual(pre, next)) {
                  rev = true;
                }
              }
            }
          }
          this.currentCues = rev ? this.parsedFragments(cues).reverse()
            : this.parsedFragments(cues);
        }
      }
    },
    parsedFragments(cues) {
      if (this.type === 'ass') {
        const currentCues = [];
        cues.forEach((item) => {
          let currentText = '';
          let currentTags = {};
          item.fragments.forEach((cue) => {
            currentText += cue.text;
            if (cue.tags) {
              currentTags = cue.tags;
            }
          });
          currentCues.push({
            start: item.start, end: item.end, tags: currentTags, text: currentText,
          });
        });
        return currentCues;
      }
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
        tmp += texts[index - 1].split('<br>').length;
        index -= 1;
      }
      return tmp;
    },
    lineNum(index) {
      // 最新一条字幕需要换行的translate比例
      const { currentTexts: texts } = this;
      return this.lastLineNum(index) / texts[index].split('<br>').length;
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
      if (tags[index].line.includes('%')) {
        tmp = -parseInt(tags[index].line, 10) / 100;
      }
      if (tags[index].vertical) {
        if (tmp >= -1 && tmp < -0.5) {
          return `translateX(${-100 * this.lineNum(index)}%)`;
        }
        return `translateX(${100 * this.lineNum(index)}%)`;
      }
      if (tmp >= -1 && tmp < -0.5) {
        return `translateY(${-100 * this.lineNum(index)}%)`;
      }
      return `translateY(${100 * this.lineNum(index)}%)`;
    },
    subLine(index) {
      const { currentTags: tags, currentTexts: texts, isVtt } = this;
      if (!this.isFirstSub) {
        this.$emit('update:linesNum', this.lastLineNum(index) + texts[index].split('<br>').length); // 第二字幕的行数
        this.$emit('update:tags', tags[index]); // 第二字幕的tags
      } else {
        this.$emit('update:firstLinesNum', this.lastLineNum(index) + texts[index].split('<br>').length); // 第一字幕的行数
      }
      if (isEqual(tags[index], tags[index - 1])) {
        if (!isVtt) {
          return `${this.assLine(index)}%`;
        }
        return this.vttLine(index);
      }
      return '';
    },
    transDirection(transNum) { // 播放列表打开，translate方向改变
      return this.subToTop ? Math.abs(transNum) : transNum;
    },
    firstSubTransPercent(transPercent) { // 当播放列表打开，第一字幕对应的transPercent
      return this.subToTop ? 0 : transPercent;
    },
    secondarySubTransPercent(transPercent) { // 当播放列表打开，第二字幕对应的transPercent
      return this.subToTop && this.currentSecondSubtitleId !== '' && this.currentFirstSubtitleId !== '' && this.enabledSecondarySub ? transPercent : 0;
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
      const secondSubHeight = this.linesNum * 9 * this.secondarySubScale;
      const firstSubHeight = this.firstLinesNum * 9 * this.scaleNum;
      // 当播放列表打开时，计算为第二字幕相对于第一字幕需要translate的值
      const subHeightWithDirection = this.subToTop ?
        [firstSubHeight, secondSubHeight] : [secondSubHeight, firstSubHeight];
      // 根据字体尺寸和换行数计算字幕需要translate的百分比，当第一字幕同时存在多条且之前条存在位置信息时，之前条不纳入translate计算
      const transPercent = texts[index - 1] && !this.isFirstLastSubHasPos(tags[index - 1]) ?
        this.lastTransPercent :
        -((subHeightWithDirection[0] + ((subSpaceFactorsA[this.chosenSize] * this.winHeight) +
          subSpaceFactorsB[this.chosenSize])) / subHeightWithDirection[1]) * 100;
      this.lastTransPercent = transPercent;
      if (!isVtt) {
        if (tags[index].pos) {
          // 字幕不为vtt且存在pos属性时，translate字幕使字幕alignment与pos点重合
          return `translate(${this.translateNum(tags[index].alignment)[0]}%, ${this.transDirection(this.translateNum(tags[index].alignment)[1])}%)`;
        }
        if (this.translateWithPos(tags[index])) {
          // 没有位置信息时且同时存在第一第二字幕时第一字幕需要translate的值
          return `translate(${initialTranslate[tags[index].alignment - 1][0]}%, ${this.transDirection(initialTranslate[tags[index].alignment - 1][1] + this.assLine(index) + this.firstSubTransPercent(transPercent))}%)`;
        }
        // 正常translate
        return `translate(${initialTranslate[tags[index].alignment - 1][0]}%, ${this.transDirection(initialTranslate[tags[index].alignment - 1][1] + this.assLine(index) + this.secondarySubTransPercent(transPercent))}%)`;
      }
      if (tags[index].line && tags[index].position) {
        return '';
      }
      if (this.translateWithPos(tags[index])) {
        // vtt字幕没有位置信息时且同时存在第一第二字幕时第一字幕需要translate的值
        return `translate(${initialTranslate[1][0]}%, ${this.transDirection(initialTranslate[1][1] + this.assLine(index) + this.firstSubTransPercent(transPercent))}%)`;
      }
      // 正常translate
      return `translate(${initialTranslate[1][0]}%, ${this.transDirection(initialTranslate[1][1] + this.assLine(index) + this.secondarySubTransPercent(transPercent))}%)`;
    },
    isFirstLastSubHasPos(firstTags) {
      return firstTags.pos || (firstTags.line && firstTags.position) ||
        (firstTags.alignment && firstTags.alignment !== 2);
    },
    isFirstSubHasPos(firstTags) {
      return firstTags.pos || (firstTags.line && firstTags.position) ||
        (firstTags.alignment && firstTags.alignment !== 2 && !this.subToTop); // 判断第一字幕是否存在位置信息
    },
    isSecondaryHasPos() {
      return this.tags.pos || (this.tags.line && this.tags.position) ||
        (this.tags.alignment && this.tags.alignment !== 2 && !this.subToTop); // 判断第二字幕是否存在位置信息
    },
    translateWithPos(firstTags) { // 同时存在第一、第二字幕时，如果都没有位置信息，第一字幕需要额外translate
      return !!(this.isFirstSub && this.currentSecondSubtitleId !== '' && this.enabledSecondarySub && !this.isSecondaryHasPos() && !this.isFirstSubHasPos(firstTags));
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
      const { currentTags: tags, type, isVtt } = this;
      if (!isVtt && tags[index].pos) {
        return `${(tags[index].pos.y / this.subPlayResY) * 100}vh`;
      } else if (type === 'vtt' && tags[index].line && tags[index].position) {
        if (tags[index].vertical) {
          return tags[index].position;
        }
        if (!tags[index].line.includes('%')) {
          tags[index].line = Math.abs(tags[index].line) * 100;
          tags[index].line += '%';
        }
        return tags[index].line;
      } else if ([7, 8, 9].includes(tags[index].alignment)) {
        return `${(60 / 1080) * 100}%`;
      }
      return '';
    },
    subBottom(index) {
      // 把subtitle.scss里固定的bottom移到这里进行计算
      const { currentTags: tags, isVtt } = this;
      if ([1, 2, 3].includes(tags[index].alignment) ||
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
