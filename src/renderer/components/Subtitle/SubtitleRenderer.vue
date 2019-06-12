<template>
  <div
    class="subtitle-loader"
    :class="'subtitle-style'+chosenStyle"
  >
    <div
      v-for="(item, index) in noPositionCues"
      :key="'noPosition' + index"
      :class="'subtitle-alignment'+(index+1)"
    >
      <p
        v-for="(cue, ind) in item"
        :key="cue.text + ind"
        :style="{
          zoom: cue.category === 'first' ? `${scaleNum}` : `${secondarySubScale}`,
          opacity: cue.hide ? '0' : '1',
          writingMode: (cue.category === 'first' ? type === 'vtt' : secondType === 'vtt')
            ? `vertical-${cue.tags.vertical}` : '',
          lineHeight: subtitleInstance && secondaryInstance ? '112%' : 'normal',
          marginBottom: item[ind + 1] && cue.category === 'first' &&
            item[ind + 1].category === 'secondary' ?`${subtitleSpace / scaleNum}px` : ''
        }"
      >{{ cue.text }}</p>
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
        v-for="(cue, index) in item"
        :key="cue.text + index"
        :style="{
          whiteSpace: 'pre',
          zoom: cue.category === 'first' ? `${scaleNum}` : `${secondarySubScale}`,
        }"
      >{{ cue.text }}</p>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapMutations } from 'vuex';
import { isEqual, differenceWith, isEmpty, groupBy } from 'lodash';
import { Subtitle as subtitleMutations } from '@/store/mutationTypes';
import { videodata } from '@/store/video';
import SubtitleInstance from './SubtitleLoader/index';

export default {
  name: 'SubtitleRenderer',
  props: {
    secondaryInstance: SubtitleInstance,
    subtitleInstance: SubtitleInstance,
  },
  data() {
    return {
      currentCues: [],
      secondCues: [],
      videoSegments: [],
      videoSecondSegments: [],
      secondSegment: [0, 0, false],
      currentSegment: [0, 0, false],
      elapsedSegmentTime: 0,
      elapsedSecondTime: 0,
      subPlayResX: 0,
      subPlayResY: 0,
      secPlayResX: 0,
      secPlayResY: 0,
      requestId: 0,
      noPositionCues: [],
    };
  },
  computed: {
    ...mapGetters(['duration', 'scaleNum', 'subtitleDelay', 'intrinsicHeight', 'intrinsicWidth',
      'subToTop', 'currentFirstSubtitleId', 'currentSecondSubtitleId', 'winHeight', 'chosenStyle',
      'enabledSecondarySub', 'chosenSize']),
    subtitleSpace() {
      const subSpaceFactorsA = [5 / 900, 9 / 900, 10 / 900, 12 / 900];
      const subSpaceFactorsB = [4, 21 / 5, 4, 23 / 5];
      return (subSpaceFactorsA[this.chosenSize] * this.winHeight) +
        subSpaceFactorsB[this.chosenSize];
    },
    type() {
      return this.subtitleInstance ? this.subtitleInstance.metaInfo.format : '';
    },
    secondType() {
      return this.secondaryInstance ? this.secondaryInstance.metaInfo.format : '';
    },
    secondarySubScale() { // 第二字幕的字号最小不小于9px
      if (this.currentFirstSubtitleId === '') {
        return this.scaleNum;
      }
      return (this.scaleNum * 5) / 6 < 1 ? 1 : (this.scaleNum * 5) / 6;
    },
    allCues() {
      const allCues = [];
      for (let i = 1; i < 10; i += 1) {
        const firstCues = this.currentCues
          .filter(cue =>
            (this.subToTop && [1, 2, 3].includes(this.calculateAlignment(cue.category, cue.tags)) ?
              this.calculateAlignment(cue.category, cue.tags) + 6 :
              this.calculateAlignment(cue.category, cue.tags)) === i &&
            !this.calculatePosition(cue.category, cue.tags));
        const secondaryCues = this.secondCues
          .filter(cue =>
            (this.subToTop && [1, 2, 3].includes(this.calculateAlignment(cue.category, cue.tags))
              ? this.calculateAlignment(cue.category, cue.tags) + 6 :
              this.calculateAlignment(cue.category, cue.tags)) === i &&
            !this.calculatePosition(cue.category, cue.tags));
        allCues.push((firstCues.length ? firstCues.map((cue) => {
          cue.category = 'first';
          return cue;
        }) : [])
          .concat(secondaryCues.length ? secondaryCues.map((cue) => {
            cue.category = 'secondary';
            return cue;
          }) : []));
      }
      return allCues;
    },
    positionCues() {
      const firstCues = this.currentCues
        .filter(cue => this.calculatePosition(cue.category, cue.tags)).map((cue) => { cue.category = 'first'; return cue; });
      const secondaryCues = this.secondCues
        .filter(cue => this.calculatePosition(cue.category, cue.tags)).map((cue) => { cue.category = 'secondary'; return cue; });
      const firstClassifiedCues = [];
      const secondaryClassifiedCues = [];
      firstCues.forEach((item) => {
        const index = firstClassifiedCues.findIndex(e => isEqual(e[0].tags, item.tags));
        if (index !== -1) {
          firstClassifiedCues[index].push(item);
        } else {
          firstClassifiedCues.push([item]);
        }
      });
      secondaryCues.forEach((item) => {
        const index = secondaryClassifiedCues.findIndex(e => isEqual(e[0].tags, item.tags));
        if (index !== -1) {
          secondaryClassifiedCues[index].push(item);
        } else {
          secondaryClassifiedCues.push([item]);
        }
      });
      return (firstClassifiedCues || []).concat(secondaryClassifiedCues || []);
    },
  },
  watch: {
    allCues: {
      handler(val, oldVal) {
        for (let i = 0; i < 9; i += 1) {
          if (val[i].length < oldVal[i].length && oldVal[i].includes(...val[i])) {
            this.noPositionCues[i] = oldVal[i].map((cue) => {
              if (!val[i].includes(cue)) {
                cue.hide = true;
              }
              return cue;
            });
          } else {
            this.noPositionCues[i] = val[i].map((cue) => { cue.hide = false; return cue; });
          }
        }
      },
      deep: true,
    },
    videoSegments(newVal) {
      const duration = newVal
        .filter(segment => segment[2])
        .map(segment => segment[1] - segment[0])
        .reduce((prev, curr) => prev + curr, 0);
      if (this.subtitleInstance) {
        this.updateDuration({ id: this.subtitleInstance.id, duration });
      }
    },
    videoSecondSegments(newVal) {
      const duration = newVal
        .filter(segment => segment[2])
        .map(segment => segment[1] - segment[0])
        .reduce((prev, curr) => prev + curr, 0);
      if (this.secondaryInstance) {
        this.updateDuration({ id: this.secondaryInstance.id, duration });
      }
    },
    subtitleInstance(val) {
      if (val) {
        const { subtitleInstance } = this;
        subtitleInstance.once('data', subtitleInstance.parse);
        subtitleInstance.on('parse', (parsed) => {
          const parsedData = parsed.dialogues;
          this.videoSegments = this.getVideoSegments(parsedData, this.duration);
          this.subPlayResX = !isEmpty(parsed.info) ? Number(parsed.info.PlayResX) : this.intrinsicWidth; // eslint-disable-line
          this.subPlayResY = !isEmpty(parsed.info) ? Number(parsed.info.PlayResY) :
            this.intrinsicHeight;
        });
        subtitleInstance.load();
      } else {
        this.currentCues = [];
      }
    },
    secondaryInstance(val) {
      if (val) {
        const { secondaryInstance } = this;
        secondaryInstance.once('data', secondaryInstance.parse);
        secondaryInstance.on('parse', (parsed) => {
          const parsedData = parsed.dialogues;
          this.videoSecondSegments = this.getVideoSegments(parsedData, this.duration);
          this.secPlayResX = !isEmpty(parsed.info) ? Number(parsed.info.PlayResX) : this.intrinsicWidth; // eslint-disable-line
          this.secPlayResY = !isEmpty(parsed.info) ? Number(parsed.info.PlayResY) :
            this.intrinsicHeight;
        });
        secondaryInstance.load();
      } else {
        this.secondCues = [];
      }
    },
  },
  mounted() {
    this.requestId = requestAnimationFrame(this.currentTimeUpdate);
  },
  beforeDestroy() {
    cancelAnimationFrame(this.requestId);
  },
  methods: {
    ...mapMutations({
      updateDuration: subtitleMutations.DURATIONS_UPDATE,
    }),
    calculatePosition(category, tags) {
      const type = category === 'first' ? this.type : this.secondType;
      if (type !== 'vtt') {
        return !!tags.pos;
      }
      return tags.line && tags.position;
    },
    calculateAlignment(category, tags) {
      const type = category === 'first' ? this.type : this.secondType;
      if (type !== 'vtt') {
        return !tags || !tags.alignment ? 2 : tags.alignment;
      }
      return !tags.line && !tags.position ? 2 : '';
    },
    currentTimeUpdate() {
      const { time: currentTime } = videodata;
      const { subtitleDelay } = this;
      if (!this.lastCurrentTime) {
        this.lastCurrentTime = currentTime;
      }
      const { lastCurrentTime } = this;
      if (this.subtitleInstance) {
        this.setCurrentCues(currentTime - (subtitleDelay / 1000));
        this.updateVideoSegments(lastCurrentTime, currentTime);
      }
      if (this.secondaryInstance) {
        this.setSecondCues(currentTime - (subtitleDelay / 1000));
        this.updateVideoSecondSegments(lastCurrentTime, currentTime);
      }
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
    setSecondCues(currentTime) {
      if (!this.secondaryInstance.parsed) return;
      const parsedData = this.secondaryInstance.parsed.dialogues;
      if (parsedData) {
        const cues = this.parsedSecond(parsedData
          .filter(({
            start, end,
            text, fragments,
          }) => (
            start <= currentTime &&
            end >= currentTime &&
            (!!text || !!fragments)
          )));
        if (cues.length !== this.secondCues.length || !this.isSameCues(cues, this.secondCues)) {
          this.secondCues = cues;
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
    parsedSecond(cues) {
      if (this.secondType === 'ass') {
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
    updateVideoSecondSegments(lastCurrentTime, currentTime) {
      const { videoSecondSegments, secondSegment, elapsedSecondTime } = this;
      const segment = videoSecondSegments
        .filter(segment => segment[0] <= currentTime && segment[1] > currentTime)[0];
      if (segment && !segment[2]) {
        if (isEqual(segment, secondSegment)) {
          this.elapsedSecondTime += currentTime - lastCurrentTime;
        } else {
          const segmentTime = secondSegment[1] - secondSegment[0];
          if (elapsedSecondTime / segmentTime >= 0.9) {
            const index = videoSecondSegments
              .findIndex(segment => segment[0] === secondSegment[0]);
            if (index !== -1) {
              this.$set(
                videoSecondSegments,
                index, [...videoSecondSegments[index].slice(0, 2), true],
              );
            }
          }
          this.secondSegment = segment;
        }
      }
    },
    subLeft(cue) {
      const subPlayResX = cue.category === 'first' ? this.subPlayResX : this.secPlayResX;
      const { tags, type } = cue;
      if (type !== 'vtt' && tags.pos) {
        return `${(tags.pos.x / subPlayResX) * 100}vw`;
      } else if (type === 'vtt' && tags.line && tags.position) {
        if (tags.vertical) {
          if (!tags.line.includes('%')) {
            tags.line = Math.abs(tags.line) * 100;
            tags.line += '%';
          }
          return tags.line;
        }
        return tags.position;
      }
      return '';
    },
    subTop(cue) {
      const subPlayResY = cue.category === 'first' ? this.subPlayResY : this.secPlayResY;
      const { tags, type } = cue;
      const isVtt = type === 'vtt';
      if (!isVtt) {
        if (tags.pos) {
          return `${(tags.pos.y / subPlayResY) * 100}vh`;
        } else if ([7, 8, 9].includes(tags.alignment)) {
          return `${(60 / 1080) * 100}%`;
        }
        return '';
      } else if (isVtt && tags.line && tags.position) {
        if (tags.vertical) {
          return tags.position;
        }
        if (!tags.line.includes('%')) {
          tags.line = Math.abs(tags.line) * 100;
          tags.line += '%';
        }
        return tags.line;
      }
      return '';
    },
    translateNum(cue) { // eslint-disable-line
      const index = this.calculateAlignment(cue.category, cue.tags) ?
        this.calculateAlignment(cue.category, cue.tags) : 2;
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
