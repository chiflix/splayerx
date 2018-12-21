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
      :class="avaliableClass(index)">
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
import { mapGetters, mapMutations } from 'vuex';
import isEqual from 'lodash/isEqual';
import toArray from 'lodash/toArray';
import { Subtitle as subtitleMutations } from '@/store/mutationTypes';
import { videodata } from '@/store/video';
import CueRenderer from './CueRenderer.vue';
import SubtitleInstance from './SubtitleLoader/index';

export default {
  name: 'subtitle-loader',
  props: {
    subtitleInstance: SubtitleInstance,
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
      subToTop: false,
      lastIndex: [],
      lastAlignment: [],
      lastText: [],
    };
  },
  computed: {
    ...mapGetters(['duration', 'scaleNum', 'intrinsicHeight', 'intrinsicWidth']),
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
  },
  watch: {
    videoSegments(newVal) {
      const duration = newVal
        .filter(segment => segment[2])
        .map(segment => segment[1] - segment[0])
        .reduce((prev, curr) => prev + curr, 0);
      this.updateDuration({ id: this.subtitleInstance.src, duration });
    },
    currentTexts(val) {
      val.forEach((de, index) => {
        const ind = this.lastText.indexOf(de);
        if (ind !== -1) {
          this.currentCues[index].tags.alignment = this.lastAlignment[ind];
        }
      });
    },
  },
  created() {
    const { subtitleInstance } = this;
    subtitleInstance.on('data', subtitleInstance.parse);
    subtitleInstance.on('parse', (parsed) => {
      this.videoSegments = this.getVideoSegments(parsed, this.duration);
      if (parsed.length) {
        const cues = parsed
          .filter(subtitle => subtitle.start <= this.subtitleCurrentTime && subtitle.end >= this.subtitleCurrentTime && subtitle.text !== '');
        if (!isEqual(cues, this.currentCues)) {
          this.currentCues = cues;
        }
      }
    });
    subtitleInstance.load();
    this.$bus.$on('subtitle-to-top', (val) => {
      this.subToTop = val;
      if (!val) {
        this.lastIndex.forEach((index) => {
          if (this.currentTags[index]) {
            this.currentTags[index].alignment = this.lastAlignment[index]
              ? this.lastAlignment[index] : 2;
          }
        });
      }
    });
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
      if (!this.isVtt && !this.currentTags[index].pos) {
        if (this.subToTop && this.currentTags[index].alignment !== 8) {
          this.lastIndex.push(index);
          this.lastAlignment.push(this.currentTags[index].alignment);
          this.lastText.push(this.currentTexts[index]);
          this.currentTags[index].alignment = 8;
          return 'subtitle-alignment8';
        }
        return `subtitle-alignment${this.currentTags[index].alignment}`;
      } else if (this.isVtt && this.currentTags[index].line !== '' && this.currentTags[index].position !== '') {
        return '';
      }
      return 'subtitle-alignment2';
    },
    currentTimeUpdate() {
      const { time: currentTime } = videodata;
      if (!this.lastCurrentTime) {
        this.lastCurrentTime = currentTime;
      }
      const { lastCurrentTime } = this;
      this.setCurrentCues(currentTime);
      this.updateVideoSegments(lastCurrentTime, currentTime);

      requestAnimationFrame(this.currentTimeUpdate);
    },
    setCurrentCues(currentTime) {
      if (!this.subtitleInstance) return;
      const { parsed } = this.subtitleInstance;
      if (parsed) {
        const cues = parsed
          .filter(subtitle => subtitle.start <= currentTime && subtitle.end >= currentTime && subtitle.text !== '');
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
          this.currentCues = rev ? cues.reverse() : cues;
        }
      }
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
            this.$set(videoSegments, index, [...videoSegments[index].slice(0, 2), true]);
          }
          this.currentSegment = segment;
        }
      }
    },
    lineNum(index) {
      const lastNum = index;
      const { currentTexts: texts, currentTags: tags } = this;
      let tmp = 0;
      while (texts[index - 1]) {
        if (!isEqual(tags[index], tags[index - 1])) {
          break;
        }
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
      if (arr.includes(tags[index].alignment) && !this.subToTop) {
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
