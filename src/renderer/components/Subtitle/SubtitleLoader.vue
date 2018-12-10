<template>
  <div class="subtitle-loader">
    <div class="subContainer"
      v-for="(cue, index) in currentCues"
      :key="index"
      :style="{
        writingMode: isVtt ? `vertical-${cue.tags.vertical}` : '',
        left: subLeft(index),
        top: subTop(index),
        transform: transPos(index),
      }"
      :class="!isVtt && !cue.tags.pos ? `subtitle-alignment${cue.tags.alignment}` : isVtt && cue.tags.line !=='' && cue.tags.position !== '' ? '' : 'subtitle-alignment2'">
      <CueRenderer class="cueRender"
        :text="cue.text"
        :settings="cue.tags"
        :style="{
          zoom: `${scaleNum}`,
          transform: subLine(index),
        }"></CueRenderer>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import isEqual from 'lodash/isEqual';
import toArray from 'lodash/toArray';
import Subtitle from './Subtitle';
import CueRenderer from './CueRenderer.vue';
export default {
  name: 'subtitle-loader',
  props: {
    subtitleSrc: String,
    id: String,
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
    };
  },
  computed: {
    ...mapGetters(['currentTime', 'duration', 'scaleNum', 'SubtitleDelay', 'intrinsicHeight', 'intrinsicWidth']),
    type() {
      return this.subtitle.metaInfo.type;
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
    subtitleCurrentTime() {
      return this.currentTime - (this.SubtitleDelay / 1000);
    },
  },
  watch: {
    subtitleCurrentTime(newVal) {
      const { parsedData } = this.subtitle;
      if (parsedData) {
        const cues = parsedData
          .filter(subtitle => subtitle.start <= newVal && subtitle.end >= newVal && subtitle.text !== '');
        if (!isEqual(cues, this.currentCues)) {
          let rev = false;
          const tmp = cues;
          if (cues.length >= 2) {
            for (let i = 0; i < tmp.length; i += 1) {
              const pre = toArray(tmp[i]);
              const next = toArray(tmp[i + 1]);
              if (next) {
                pre.splice(2, 1);
                next.splice(2, 1);
                if (isEqual(pre, next)) {
                  rev = true;
                }
              }
            }
          }
          if (rev) {
            this.currentCues = cues.reverse();
          } else {
            this.currentCues = cues;
          }
        }
      }
    },
    currentTime(newVal, oldValue) {
      const { videoSegments, currentSegment, elapsedSegmentTime } = this;
      const segment = videoSegments
        .filter(segment => segment[0] <= newVal && segment[1] > newVal)[0];
      if (segment && !segment[2]) {
        if (isEqual(segment, currentSegment)) {
          this.elapsedSegmentTime += newVal - oldValue;
        } else {
          const segmentTime = currentSegment[1] - currentSegment[0];
          if (elapsedSegmentTime / segmentTime >= 0.9) {
            const index = videoSegments.findIndex(segment => segment[0] === currentSegment[0]);
            this.$set(videoSegments, index, [...videoSegments[index].slice(0, 2), true]);
          }
          this.elapsedSegmentTime = 0;
        }
        this.currentSegment = segment;
      }
    },
    videoSegments(newVal) {
      const duration = newVal
        .filter(segment => segment[2])
        .map(segment => segment[1] - segment[0])
        .reduce((prev, curr) => prev + curr, 0);
      this.updateDuration([this.id, duration]);
    },
  },
  created() {
    const { subtitleSrc } = this;
    this.subtitle = new Subtitle(subtitleSrc);
    this.subtitle.load();
    this.subtitle.once('parse', (parsed) => {
      this.parsedData = parsed;
      this.videoSegments = this.getVideoSegments(parsed, this.duration);
      this.$bus.$emit('finish-loading', this.subtitle.metaInfo.type);
      if (parsed) {
        const cues = parsed
          .filter(subtitle => subtitle.start <= this.subtitleCurrentTime && subtitle.end >= this.subtitleCurrentTime && subtitle.text !== '');
        if (!isEqual(cues, this.currentCues)) {
          this.currentCues = cues;
        }
      }
    });
  },
  methods: {
    ...mapActions({
      updateDuration: 'SUBTITLE_DURATION_UPDATE',
    }),
    lineNum(index) {
      const lastNum = index;
      const { currentTexts: texts } = this;
      let tmp = 0;
      while (texts[index - 1]) {
        tmp += texts[index - 1].split('\n').length;
        index -= 1;
      }
      return tmp / texts[lastNum].split('\n').length;
    },
    assLine(index) {
      const { currentTags: tags } = this;
      if (tags[index].pos) {
        return `translateY(${-100 * this.lineNum(index)}%)`;
      }
      const arr = [1, 2, 3];
      if (arr.includes(tags[index].alignment)) {
        return `translateY(${-100 * this.lineNum(index)}%)`;
      }
      return `translateY(${100 * this.lineNum(index)}%)`;
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
      const { currentTags: tags, isVtt } = this;
      if (isEqual(tags[index], tags[index - 1])) {
        if (!isVtt) {
          return this.assLine(index);
        }
        return this.vttLine(index);
      }
      return '';
    },
    transPos(index) {
      const { currentTags: tags, isVtt } = this;
      if (!isVtt && tags[index].pos) {
        return `translate(${this.translateNum(tags[index].alignment)[0]}%, ${this.translateNum(tags[index].alignment)[1]}%)`;
      }
      return '';
    },
    subLeft(index) {
      const { currentTags: tags, type, isVtt } = this;
      if (!isVtt && tags[index].pos) {
        return `${(tags[index].pos.x / this.intrinsicWidth) * 100}vw`;
      } else if (type === 'vtt') {
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
        return `${(tags[index].pos.y / this.intrinsicHeight) * 100}vh`;
      } else if (type === 'vtt') {
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
      while (result[result.length - 1][1] !== duration) {
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
  position: relative;
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
