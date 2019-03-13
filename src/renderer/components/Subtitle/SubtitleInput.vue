<template>
  <div :class="isProfessional ? 'professional' : ''">
    <div class="subContainer"
      @click.stop="handleClickSubContainer($event, i)"
      @dblclick.stop="handleDoubleClickSubContainer($event, i)"
      v-for="(cue, i) in currentCues"
      :key="i"
      :style="{
        writingMode: isVtt ? `vertical-${cue.tags.vertical}` : '',
        left: subLeft(i),
        top: subTop(i),
        transform: transPos(i),
        display: !isProfessional || isProfessional && currentSub && currentSub.start === cue.start ? 'flex' : 'none',
      }"
      :class="avaliableClass(i)+`${paused && !isEditable ? ' enable-hover': ''}`">
      <div class="cue-wrap" v-if="filter(cue)">
        <CueRenderer v-show="!isEditable || i !== index" class="cueRender"
          :text="cue.text"
          :settings="cue.tags"
          :style="{
            zoom: `${scaleNum}`,
            transform: subLine(i),
          }"></CueRenderer>
        <div
          class="edit-box"
          v-show="isEditable && paused && i === index">
          <textarea
            class="subtitle-style1 no-drag"
            contenteditable="true"
            ref="textarea"
            @keydown.stop=""
            @blur="handleBlurTextArea($event, i)"
            type="text"
            rows="2"
            v-model="editVal"
            :style="{
              zoom: `${((29 / (11 * 1600)) * computedWidth) + (26 / 55)}`,
              transform: subLine(i),
              width: `${computedWidth*0.60/scaleNum}px`
            }"></textarea>
        </div>
      </div>
      <div class="professional-btn-wrap" @click.stop="handleClickProfessional">
        <Icon type="subtitleEditorEnter" class="subtitleEditorEnter" v-if="!isProfessional"
          :style="{
            cursor: 'pointer',
          }"/>
        <Icon type="subtitleEditorExit" class="subtitleEditorExit" v-if="isProfessional"
          :style="{
            cursor: 'pointer',
          }"/>
      </div>
    </div>
    <div
      v-if="(isProfessional && showAddInput)"
      @click.stop="handleClickAddSub"
      :class="'subContainer subtitle-alignment2'+`${paused && !isEditable ? ' enable-hover': ''}`">
      <div class="cue-wrap">
        <CueRenderer v-show="!isEditable" class="cueRender"
          :text="'点击添加字幕'"
          :settings="{}"
          :style="{
            zoom: `${scaleNum}`,
          }"></CueRenderer>
        <div
          class="edit-box"
          v-show="isEditable && paused">
          <textarea
            class="subtitle-style1 no-drag"
            contenteditable="true"
            ref="textarea"
            @keydown.stop=""
            @blur="handleBlurTextArea($event, null)"
            type="text"
            rows="2"
            v-model="editVal"
            :style="{
              zoom: `${((29 / (11 * 1600)) * computedWidth) + (26 / 55)}`,
              width: `${computedWidth*0.60/scaleNum}px`
            }"></textarea>
        </div>
      </div>
    </div> 
  </div>
</template>
<script>
import { mapGetters, mapMutations } from 'vuex';
import { isEqual, castArray, isEmpty, cloneDeep } from 'lodash';
import { stringifyVtt, toVttTime } from 'subtitle';
import { Subtitle as subtitleMutations, Window as windowMutations } from '@/store/mutationTypes';
import { videodata } from '@/store/video';
import { writeSubtitleByMediaHash, writeSubtitleByPath } from '@/helpers/cacheFileStorage';
import { stringifyAss } from '@/helpers/subtitle';
import CueRenderer from './CueRenderer.vue';
import Icon from '../BaseIconContainer.vue';
import SubtitleInstance from './SubtitleLoader/index';

export default {
  name: 'subtitle-input',
  props: {
    subtitleInstance: SubtitleInstance,
    showAddInput: {
      type: Boolean,
      default: false,
    },
    newSubHolder: {
      type: Object,
    },
    currentSub: {
      type: Object,
    },
  },
  components: {
    CueRenderer,
    Icon,
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
      index: 0,
      editVal: '',
    };
  },
  computed: {
    ...mapGetters([
      'duration', 'scaleNum', 'subtitleDelay', 'intrinsicHeight', 'intrinsicWidth', 'mediaHash', 'subToTop', 'subtitleList',
      'paused',
      'isEditable', 'isProfessional',
      'computedWidth', 'computedHeight', // to determine the subtitle renderer's container size
    ]),
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
    paused(val) {
      if (val === false) {
        this.editable = false;
      }
    },
  },
  created() {
    const { subtitleInstance } = this;
    if (!subtitleInstance.parsed) {
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
        this.subPlayResX = !isEmpty(parsed.info) ? Number(parsed.info.PlayResX) :
          this.intrinsicWidth;
        this.subPlayResY = !isEmpty(parsed.info) ? Number(parsed.info.PlayResY) :
          this.intrinsicHeight;
      });
      subtitleInstance.load();
    }
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
      toggleEditable: windowMutations.TOGGLE_EDITABLE,
      toggleProfessional: windowMutations.TOGGLE_PROFESSIONAL,
    }),
    filter(cue) {
      if (!this.isVtt && this.isProfessional && cue.tags) {
        if (cue.tags.pos || cue.tags.alignment !== 2) {
          return false;
        }
      }
      return true;
    },
    handleClickAddSub() {
      if (this.paused) {
        if (!this.isEditable) {
          this.toggleEditable(this.paused);
          this.$nextTick(() => {
            this.editVal = '';
            this.$refs.textarea && this.$refs.textarea.focus();
          });
        }
      } else {
        this.$bus.$emit('toggle-playback');
      }
    },
    handleClickSubContainer(e, i) {
      if (this.paused) {
        this.index = i;
        if (!this.isEditable) {
          this.toggleEditable(this.paused);
          this.$nextTick(() => {
            this.editVal = this.currentCues[i].text;
            this.$refs.textarea[this.index] && this.$refs.textarea[this.index].focus();
          });
        }
      } else {
        this.$bus.$emit('toggle-playback');
      }
    },
    handleDoubleClickSubContainer(e, i) {
      if (!this.paused) {
        this.index = i;
        this.$bus.$emit('toggle-playback');
        this.$nextTick(() => {
          this.toggleEditable(this.paused);
          this.$nextTick(() => {
            this.editVal = this.currentCues[i].text;
            this.$refs.textarea[this.index] && this.$refs.textarea[this.index].focus();
          });
        });
      }
    },
    handleBlurTextArea(e, i) {
      if (i !== null) {
        this.$nextTick(() => {
          // 处理是否真正修改了字符
          if (this.editVal !== this.currentCues[i].text) {
            // 修改当前currentCues
            this.currentCues[i].text = this.editVal;
            this.$set(this.currentCues, i, this.currentCues[i]);
            // 保存副本
            // 本地字幕
            new Promise(async (resolve) => {
              const start = this.currentCues[i].start;
              const end = this.currentCues[i].end;
              const text = this.currentCues[i].text;
              let sub = '';
              let mimeType = 'vtt';
              let matchIndex = 0;
              const subtitleInstance = cloneDeep(this.subtitleInstance);
              if (subtitleInstance.metaInfo && subtitleInstance.metaInfo.format === 'ass') {
                let old = '';
                let fresh = '';
                subtitleInstance.parsed.dialogues.find((e, i) => {
                  if (e && e.start === start && e.end === end) {
                    // e.text = cu.text;
                    // return true;
                    subtitleInstance.parsed.dialogues[i].fragments[0].text = text;
                    old = stringifyAss(subtitleInstance.parsed.origin.dialogues[i]);
                    subtitleInstance.parsed.origin.dialogues[i].slices[0].fragments[0].text = text;
                    fresh = stringifyAss(subtitleInstance.parsed.origin.dialogues[i]);
                    matchIndex = i;
                  }
                  return false;
                });
                mimeType = 'ass';
                if (text.length === 0) {
                  subtitleInstance.parsed.dialogues.splice(matchIndex, 1);
                  sub = subtitleInstance.data.replace(old, '');
                } else {
                  sub = subtitleInstance.data.replace(old, fresh);
                }
              } else {
                subtitleInstance.parsed.dialogues.find((e, i) => {
                  if (e.start === start && e.end === end) {
                    e.text = text;
                    matchIndex = i;
                    // return true;
                  }
                  if (subtitleInstance.type !== 'modified') {
                    e.start = toVttTime(e.start * 1000);
                    e.end = toVttTime(e.end * 1000);
                  }
                  return false;
                });
                if (text.length === 0) {
                  subtitleInstance.parsed.dialogues.splice(matchIndex, 1);
                  sub = stringifyVtt(subtitleInstance.parsed.dialogues);
                } else {
                  sub = stringifyVtt(subtitleInstance.parsed.dialogues);
                }
              }
              if (subtitleInstance.type === 'modified') {
                this.$bus.$emit('modified-subtitle', { sub: subtitleInstance });
                await writeSubtitleByPath(subtitleInstance.src, sub);
              } else {
                await writeSubtitleByMediaHash(this.mediaHash, sub, { name: '自制 1', mimeType, type: 'modified' }).then((p) => {
                  this.$bus.$emit('add-subtitles', [{ src: p, type: 'modified' }]);
                });
              }
              resolve({});
            }).then(() => {
            });
          }
          if (this.index === i) {
            this.toggleEditable(false);
            this.editVal = '';
          }
        });
      } else {
        if (this.editVal !== '' && this.newSubHolder) {
          const sub = Object.assign({}, JSON.parse(JSON.stringify(this.newSubHolder.last)), {
            end: parseFloat(this.newSubHolder.preciseTime.toFixed(2), 10) + 0.01,
          });
          if (this.newSubHolder.distance > 0.5) {
            sub.start = sub.end - 0.5;
          } else {
            sub.start = sub.end - 0.2;
          }
          sub.fragments[0].text = this.editVal.trim();
          this.$bus.$emit('modified-subtitle-bridge', { add: sub });
        }
        this.toggleEditable(false);
        this.editVal = '';
      }
    },
    handleClickProfessional() {
      this.toggleProfessional(!this.isProfessional);
    },
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
    isCurrentCuesChanged(old, n) {
      if (old.length !== n.length) return true;
      return old.some((e, i) => `${e.start}-${e.end}` !== `${n[i].start}-${n[i].end}`);
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
    lineNum(index) {
      const lastNum = index;
      const { currentTexts: texts, currentTags: tags } = this;
      let tmp = 0;
      while (texts[index - 1]) {
        if (!isEqual(tags[index], tags[index - 1])) {
          break;
        }
        tmp += texts[index - 1].split('<br>').length;
        index -= 1;
      }
      return tmp / texts[lastNum].split('<br>').length;
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
        return `${(tags[index].pos.x / this.subPlayResX) * 100}vw`;
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
        return `${(tags[index].pos.y / this.subPlayResY) * 100}vh`;
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
<style lang="scss" scoped>
.professional {
  .subContainer {
    padding: 5px 15px;
    &::before {
      content: "";
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      backdrop-filter: blur(3px); 
      background: rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 5px;
    }
    .professional-btn-wrap {
      display: flex;
    }
  }
  .edit-box {
    border-width: 0;
    border-radius: 0;
  }
  .enable-hover {
    &:hover {
      border-radius: 0;
      overflow: visible;
    }
  }
}
.subContainer {
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  transform-origin: bottom left;
  z-index: 5;
  border: 1px solid transparent;
  cursor: pointer;
  .cue-wrap {
    display: flex;
    flex-direction: column-reverse;
    position: relative;
    z-index: 2;
  }
  .professional-btn-wrap {
    display: flex;
    width: 36px;
    height: 82.5%;
    position: absolute;
    right: -2px;
    top: 50%;
    transform: translate(100%, -50%);
    z-index: 1;
    display: none;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px); 
    background: rgba(0,0,0,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    border-left: none;
    border-radius: 0 5px 5px 0;
  }
} 
.enable-hover {
  &:hover {
    padding: 5px 15px;
    &::before {
      content: "";
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      backdrop-filter: blur(3px); 
      background: rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 5px;
    }
    .professional-btn-wrap {
      display: flex;
    }
  }
}
.edit-box {
  div, textarea {
    outline: none;
    border: none;
    text-align: center;
    white-space: pre-line;
    padding: 0 5px;
    word-break: break-all;
    resize: none;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
