<template>
  <div :class="isProfessional ? 'professional' : ''">
    <div class="subContainer"
      v-for="(cue, i) in currentCues"
      v-fade-in="!(isProfessional && cue.reference && !paused)"
      :key="i"
      :style="{
        writingMode: isVtt ? `vertical-${cue.tags.vertical}` : '',
        left: subLeft(i),
        top: subTop(i),
        bottom: subBottom(i),
        transform: transPos(i),
        display: !isProfessional || checkCurrentSub(cue) ? 'flex' : 'none',
        cursor: dragingMode !== 'default' ? dragingMode : canUseEditor ? 'pointer' : 'default'
      }"
      :class="avaliableClass(i)+`${paused && canUseEditor ? ' enable-hover': ''}`+isCueEditable(cue)+isCueFocus(cue)">
      <div class="cue-wrap" v-if="filter(cue)"
        :style="{
          zoom: zoom,
          // width: `${inputWitdh}px`,
          minWidth: minInputWidth,
          // maxWidth: maxInputWitdh,
          lineHeight: enabledSecondarySub && currentFirstSubtitleId !== '' && currentSecondSubtitleId !== '' ? '68%' : 'normal',
        }">
        <cue-editable-renderer class="cueRender"
          :key="`${cue.index}-${cue.text}`"
          :isFirstSub="isFirstSub"
          :text="cue.text"
          :settings="cue.tags"
          @update:textarea-change="handleTextAreaChange"
          :canUseEditor="canUseEditor"
          :zoom="zoom"
          :cue="cue"></cue-editable-renderer>
      </div>
    </div>
    <div
      v-if="(isProfessional && showAddInput && paused)"
      @click.stop="handleClickSubContainer($event, {
        index: -1,
      })"
      :class="'subContainer subtitle-alignment2'+`${paused ? ' enable-hover': ''}`+`${isEditable && chooseIndex === -1 ? ' editable': ''}`"
      :style="{
        cursor: dragingMode !== 'default' ? dragingMode : 'pointer'
      }">
      <div class="cue-wrap"
        :style="{
          zoom: zoom,
          minWidth: minInputWidth,
          // maxWidth: maxInputWitdh,
          lineHeight: 'normal',
        }">
        <cue-editable-renderer class="cueRender"
          :text="$t('editorCreateSubtitle.button')"
          :settings="{}"
          :isFirstSub="isFirstSub"
          @update:textarea-change="handleTextAreaChange"
          :canUseEditor="canUseEditor"
          :zoom="zoom"
          :cue="{
            index: -1,
          }"></cue-editable-renderer>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapMutations } from 'vuex';
import { isEqual, castArray, isEmpty, cloneDeep } from 'lodash';
import { Editor as editorMutations, Subtitle as subtitleMutations } from '@/store/mutationTypes';
import { videodata } from '@/store/video';
import {
  EVENT_BUS_COLLECTIONS as bus,
  MODIFIED_SUBTITLE_TYPE as modifiedTypes,
} from '@/constants';
import CueEditableRenderer from './CueEditableRenderer.vue';
import SubtitleInstance from './SubtitleLoader/index';
import { uniteSubtitleWithFragment } from './SubtitleLoader/utils';

export default {
  name: 'subtitle-renderer',
  props: {
    subtitleInstance: SubtitleInstance,
    referenceDialogues: { // 参考字幕集合
      type: Array,
      default: () => [],
    },
    playlistShow: { // 监听是否可以使用编辑
      type: Boolean,
      default: false,
    },
    showAddInput: { // 可以新增字幕
      type: Boolean,
      default: false,
    },
    newSubHolder: { // 新增字幕的案例 //TODO remove
      type: Object,
    },
    preciseTime: {
      type: Number,
    },
    dragingMode: { // 拖拽光标传递
      type: String,
      default: 'default',
    },
    currentSub: { // 高级模式，当前可显示的字幕
      type: Array,
      default: () => [],
    },
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
    firstTags: {
      type: Object,
    },
  },
  components: {
    CueEditableRenderer,
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
      index: -1, // cue.index
      editVal: '',
      rows: 1,
      lastTransPercent: 0,
      requestId: 0,
    };
  },
  computed: {
    ...mapGetters([
      'duration', 'scaleNum', 'subtitleDelay', 'intrinsicHeight', 'intrinsicWidth', 'mediaHash', 'subToTop', 'subtitleList', 'winHeight',
      'paused', 'isFullScreen', 'currentFirstSubtitleId', 'currentSecondSubtitleId', 'enabledSecondarySub', 'chosenSize', 'currentTime',
      'isEditable', 'isProfessional', 'winRatio', 'winWidth', 'winHeight', 'chosenStyle', 'isCreateSubtitleMode', 'currentEditedSubtitleId',
      'computedWidth', 'computedHeight', 'chooseIndex', 'isClickFirstSub', // to determine the subtitle renderer's container size
    ]),
    computedSize() {
      return this.winRatio >= 1 ? this.computedHeight : this.computedWidth;
    },
    type() {
      if (this.subtitleInstance && this.subtitleInstance.metaInfo) {
        return this.subtitleInstance.metaInfo.format;
      }
      return '';
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
    canUseEditor() {
      // 是否可以使用编辑模式
      // 暂时使用computed属性来控制是否可以使用编辑模式
      // 后期采用vuex统一管理界面版本 [0,1,2,3]
      // let sizeAvaliable = false;
      // if (this.winRatio > 1) {
      //   // 当视频的宽度大于等于高度，如果高度超过480px,才可以使用编辑模式
      //   sizeAvaliable = this.winHeight >= 480;
      // } else {
      //   // 当视频宽度小于高度，如果宽度超过480px,才可以使用编辑模式
      //   sizeAvaliable = this.winWidth >= 480;
      // }
      // return sizeAvaliable && !this.playlistShow;
      return !this.playlistShow;
    },
    minInputWidth() { // eslint-disable-line
      // 最小就是 ---|-**最小宽度**-|三个icon
      const winRatio = this.winRatio;
      const width = this.winWidth;
      const height = this.winHeight;
      let computed = width;
      if ((winRatio >= 1 && height > 1080) || (winRatio < 1 && width > 1080)) {
        computed = width - (2 * 305);
      } else if ((winRatio >= 1 && height > 481) || (winRatio < 1 && width > 481)) {
        computed = width - (2 * 197);
      } else if ((winRatio >= 1 && height > 289) || (winRatio < 1 && width > 289)) {
        computed = width - (2 * 140);
      }
      if (this.isProfessional) {
        return `${computed / this.zoom}px`;
      } else if (!this.isProfessional && this.isFirstSub) {
        return `${computed / this.scaleNum}px`;
      } else if (!this.isProfessional) {
        return `${computed / this.secondarySubScale}px`;
      }
    },
    maxInputWitdh() { // eslint-disable-line
      const width = this.winWidth;
      if (!this.isEditable || (this.isEditable && this.isClickFirstSub !== this.isFirstSub)) {
        return 'none';
      } else if (this.isProfessional) {
        return `${width / this.zoom}px`;
      } else if (!this.isProfessional && this.isFirstSub) {
        return `${width / this.scaleNum}px`;
      } else if (!this.isProfessional) {
        return `${width / this.secondarySubScale}px`;
      }
    },
    zoom() {
      if (this.isProfessional) {
        // update video scale that width is larger than height
        const updatePCVideoScaleByFactors = (index) => {
          const firstFactors = [21, 29, 37, 45];
          const secondFactors = [24, 26, 28, 30];
          return `${(((firstFactors[index] / 900) * this.computedSize) + (secondFactors[index] / 5)) / 9}`;
        };
        // update video scale that height is larger than width
        const updateMobileVideoScaleByFactors = (index) => {
          const firstFactors = [21, 29, 37, 45];
          const secondFactors = [12, -92, -196, -300];
          return `${(((firstFactors[index] / 760) * this.computedSize) + (secondFactors[index] / 76)) / 9}`;
        };
        // update video scale when width or height is larger than 1080
        const updateVideoScaleByFactors = (val) => {
          const factors = [30, 40, 50, 60];
          return `${((val / 1080) * factors[1]) / 9}`;
        };
        if (this.computedSize >= 1080) {
          return updateVideoScaleByFactors(this.computedSize);
        } else if (this.winRatio >= 1) {
          return updatePCVideoScaleByFactors(1);
        }
        return updateMobileVideoScaleByFactors(1);
      }
      return this.isFirstSub ? `${this.scaleNum}` : `${this.secondarySubScale}`;
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
        this.$emit('update:linesNum', this.lastLineNum(len - 1) + val[len - 1].split('<br>').length); // 第二字幕的行数
        this.$emit('update:tags', tags[len - 1]); // 第二字幕的tags
      } else if (len > 0) {
        this.$emit('update:firstLinesNum', this.lastLineNum(len - 1) + val[len - 1].split('<br>').length);
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
    if (subtitleInstance && !subtitleInstance.parsed) {
      subtitleInstance.once('data', subtitleInstance.parse);
      subtitleInstance.on('parse', (parsed) => {
        const parsedData = parsed.dialogues.map((e, i) => ({ ...e, index: i }));
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
    // 输入框键盘事件
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
      toggleEditable: editorMutations.TOGGLE_EDITABLE,
      updateCurrentEditedSubtitle: editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE,
    }),
    filter(cue) {
      if (!this.isVtt && this.isProfessional && cue.tags) {
        if (cue.tags.pos || cue.tags.alignment !== 2) {
          return false;
        }
      }
      return true;
    },
    checkCurrentSub(sub) {
      if (this.currentSub.length === 0) {
        return false;
      }
      return this.isProfessional && this.currentSub.some(e => e.start === sub.start);
    },
    isCueEditable(cue) {
      if (this.isProfessional && this.isEditable && this.chooseIndex === cue.index) {
        return ' editable';
      } else if (this.isEditable && this.chooseIndex === cue.index &&
        this.isClickFirstSub === this.isFirstSub) {
        return ' editable';
      }
      return '';
    },
    isCueFocus(cue) {
      if (this.currentSub.length === 0 || !this.isProfessional) {
        return '';
      }
      const result = this.currentSub.find(e => cue.start === e.start && cue.end === e.end);
      if (result && result.index === this.chooseIndex) {
        return ' focus';
      }
      return '';
    },
    getCueIndex(cue) {
      if (this.currentSub.length === 0 || !this.isProfessional) {
        return -1;
      }
      const result = this.currentSub.find(e => cue.start === e.start && cue.end === e.end);
      return result ? result.index : -1;
    },
    handleTextAreaChange({cue, text}) { // eslint-disable-line
      if (cue && cue.index === -1) {
        if (text !== '' && this.newSubHolder) {
          const { time: currentTime } = videodata;
          let sub = Object.assign({}, JSON.parse(JSON.stringify(this.newSubHolder.last)), {
            end: parseFloat(currentTime.toFixed(2), 10) + 0.01,
          });
          sub = uniteSubtitleWithFragment(sub);
          delete sub.reference;
          if (this.newSubHolder.distance > 0.5) {
            sub.start = parseFloat((sub.end - 0.5).toFixed(2), 10);
          } else {
            sub.start = parseFloat((sub.end - 0.2).toFixed(2), 10);
          }
          const firstFragments = sub.fragments[0];
          firstFragments.text = text;
          sub.fragments = [firstFragments];
          // ****
          let subtitleInstance = null;
          if (!this.subtitleInstance || !this.currentEditedSubtitleId) {
            subtitleInstance = {
              parsed: {
                dialogues: [],
              },
              metaInfo: {
                language: 'zh-CN',
                name: '',
                format: 'online',
              },
              type: 'online',
              reference: null,
            };
          } else {
            subtitleInstance = cloneDeep(this.subtitleInstance);
          }
          this.$bus.$emit(bus.CREATE_MIRROR_SUBTITLE, {
            sub: subtitleInstance, add: sub, index: this.newSubHolder.insertIndex,
          });
          // this.$emit('update:showAddInput', false);
        }
      } else if (cue && cue.reference) {
        let subtitleInstance = null;
        let index = 0;
        if (!this.subtitleInstance || !this.currentEditedSubtitleId) {
          subtitleInstance = {
            parsed: {
              dialogues: [],
            },
            metaInfo: {
              language: 'zh-CN',
              name: '',
              format: 'online',
            },
            type: 'online',
            reference: null,
          };
        } else {
          subtitleInstance = this.subtitleInstance.type !== 'modified' ? cloneDeep(this.subtitleInstance) : this.subtitleInstance;
          index = subtitleInstance.parsed.dialogues.length;
        }
        if (text) {
          cue.text = text;
          const sub = cloneDeep(uniteSubtitleWithFragment(cue));
          delete sub.reference;
          delete sub.selfIndex;
          subtitleInstance.parsed.dialogues.splice(index, 0, sub);
          this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
            sub: subtitleInstance,
            type: modifiedTypes.ADD_FROM_REFERENCE,
            index,
            selfIndex: cue.selfIndex,
            before: null,
          });
        } else {
          const selfIndex = this.chooseIndex - index;
          this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
            sub: subtitleInstance,
            type: modifiedTypes.DELETE_FROM_REFERENCE,
            index: this.chooseIndex,
            before: null,
            selfIndex,
          });
        }
      } else {
        const index = cue.index;
        let before = null;
        const subtitleInstance = this.subtitleInstance.type !== 'modified' ?
          cloneDeep(this.subtitleInstance) : this.subtitleInstance;
        if (subtitleInstance.metaInfo && subtitleInstance.metaInfo.format === 'ass') {
          if (text.length === 0) {
            before = subtitleInstance.parsed.dialogues.splice(index, 1);
          } else {
            before = cloneDeep(subtitleInstance.parsed.dialogues[index]);
            const firstFragments = subtitleInstance.parsed.dialogues[index].fragments[0];
            firstFragments.text = text;
            subtitleInstance.parsed.dialogues[index].fragments = [firstFragments];
          }
        } else if (subtitleInstance.metaInfo) {
          if (text.length === 0) {
            before = subtitleInstance.parsed.dialogues.splice(index, 1);
          } else {
            before = cloneDeep(subtitleInstance.parsed.dialogues[index]);
            subtitleInstance.parsed.dialogues[index].text = text;
          }
        }
        if (this.isProfessional) {
          if (text.length === 0) {
            this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
              sub: subtitleInstance,
              type: modifiedTypes.DELETE,
              index,
              before,
            });
          } else {
            this.$bus.$emit(bus.WILL_MODIFIED_SUBTITLE, {
              sub: subtitleInstance,
              type: modifiedTypes.REPLACE,
              index,
              before,
            });
          }
        } else {
          this.$bus.$emit(bus.DID_MODIFIED_SUBTITLE, {
            sub: subtitleInstance,
            isSecondSub: !this.isFirstSub,
          });
        }
      }
    },
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
      this.requestId = requestAnimationFrame(this.currentTimeUpdate);
    },
    setCurrentCues(currentTime) { // eslint-disable-line
      const currentDialogues = this.subtitleInstance && this.subtitleInstance.parsed ?
        this.subtitleInstance.parsed.dialogues : [];
      if ((currentDialogues.length + this.referenceDialogues.length) === 0) return;
      const referenceFilters = this.referenceDialogues
        .map((e, i) => Object.assign({ reference: true }, e, { selfIndex: i }));
      let parsedData = [];
      if (this.isProfessional) {
        parsedData = currentDialogues
          .concat(referenceFilters)
          .map((e, i) => (uniteSubtitleWithFragment({ ...e, index: i })))
          .sort((p, n) => (p.start - n.start))
          .filter((e) => {
            const tags = e.fragments && e.fragments[0] && e.fragments[0].tags;
            return tags && !(tags.pos || tags.alignment !== 2);
          });
      } else {
        parsedData = currentDialogues.map((e, i) => ({ ...e, index: i }));
      }
      if (parsedData) {
        const cues = parsedData
          .filter(subtitle => subtitle.start <= currentTime && subtitle.end > currentTime);
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
      const currentCues = [];
      cues.forEach((item) => {
        let currentText = '';
        let currentTags = {};
        if (item.tags) {
          currentText = item.text;
          currentTags = item.tags;
          currentCues.push({
            start: item.start,
            end: item.end,
            tags: currentTags,
            text: currentText,
            index: item.index,
            reference: item.reference,
            selfIndex: item.selfIndex,
            track: item.track,
          });
        } else if (item.fragments && item.fragments.length > 0) {
          currentTags = item.fragments[0].tags;
          currentText = item.fragments.map(e => e.text).join('');
          currentCues.push({
            start: item.start,
            end: item.end,
            tags: currentTags,
            text: currentText,
            index: item.index,
            reference: item.reference,
            selfIndex: item.selfIndex,
            track: item.track,
          });
        }
      });
      return currentCues;
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
        tmp += texts[index - 1].replace('/<br>$/g', '').split('<br>').length;
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
      return (this.subToTop || [7, 8, 9].includes(alignment)) && this.currentSecondSubtitleId !== '' && this.currentFirstSubtitleId !== '' && this.enabledSecondarySub ? transPercent : 0;
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
      // const secondSubHeight = this.linesNum * 9 * this.secondarySubScale;
      // const firstSubHeight = this.firstLinesNum * 9 * this.scaleNum;
      let secondSubHeight = 0;
      let firstSubHeight = 0;
      // 当播放列表打开时，计算为第二字幕相对于第一字幕需要translate的值
      // const subHeightWithDirection = this.subToTop || [7, 8, 9].includes(tags[index].alignment) ?
      //   [firstSubHeight, secondSubHeight] : [secondSubHeight, firstSubHeight];
      // 根据字体尺寸和换行数计算字幕需要translate的百分比，当第一字幕同时存在多条且之前条存在位置信息时，之前条不纳入translate计算
      //  else if (texts[index - 1] && isEqual(tags[index], tags[index - 1]) && this.isFirstSub) {
      //   console.log('ok', this.isFirstSub, texts[index], this.firstLinesNum, this.linesNum);
      //   transPercent = this.lastTransPercent;
      // }
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
        firstSubHeight = texts[index].split('<br>').length * 9 * this.scaleNum;
        subHeightWithDirection = [secondSubHeight, firstSubHeight];
      } else if (!this.isFirstSub && (this.subToTop || [7, 8, 9].includes(tags[index].alignment))) {
        // 第二字幕的按顺序，计算当前自己的比较高度
        secondSubHeight = texts[index].split('<br>').length * 9 * this.secondarySubScale;
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
            return `translate(${this.translateNum(tags[index].alignment)[0]}%, ${this.translateNum(tags[index].alignment)[1] + this.assLine(index)}%)`;
          }
          if (this.currentSecondSubtitleId !== '' && this.enabledSecondarySub && this.shouldTranslate) {
            // 没有位置信息时且同时存在第一第二字幕时第一字幕需要translate的值
            return `translate(${initialTranslate[tags[index].alignment - 1][0]}%, ${this.transDirection(initialTranslate[tags[index].alignment - 1][1] + this.firstSubTransPercent(transPercent, tags[index].alignment), tags[index].alignment) + this.assLine(index)}%)`;
          }
          // 只有第一字幕时需要translate的值
          return `translate(${initialTranslate[tags[index].alignment - 1][0]}%, ${this.transDirection(initialTranslate[tags[index].alignment - 1][1], tags[index].alignment) + this.assLine(index)}%)`;
        }
        if (tags[index] && tags[index].pos) { // 第二字幕不是VTT
          // 字幕不为vtt且存在pos属性时，translate字幕使字幕alignment与pos点重合
          return `translate(${this.translateNum(tags[index].alignment)[0]}%, ${this.transDirection(this.translateNum(tags[index].alignment)[1], tags[index].alignment) + this.assLine(index)}%)`;
        }
        return `translate(${initialTranslate[tags[index].alignment - 1][0]}%, ${this.transDirection(initialTranslate[tags[index].alignment - 1][1] + this.secondarySubTransPercent(transPercent, tags[index].alignment), tags[index].alignment) + this.assLine(index)}%)`;
      }
      if (tags[index].line && tags[index].position) { // 字幕为VTT且有位置信息
        return '';
      }
      if (this.isFirstSub) {
        if (this.currentSecondSubtitleId !== '' && this.enabledSecondarySub) {
          // vtt字幕没有位置信息时且同时存在第一第二字幕时第一字幕需要translate的值
          if (tags[index] && tags[index].vertical) {
            return `translate(${initialTranslate[1][0] + this.vttLine(index)}%, ${this.transDirection(initialTranslate[1][1] + this.firstSubTransPercent(transPercent))}%)`;
          }
          return `translate(${initialTranslate[1][0]}%, ${this.transDirection(initialTranslate[1][1] + this.firstSubTransPercent(transPercent)) + this.vttLine(index)}%)`;
        }
        // 只有第一字幕时需要translate的值
        if (tags[index] && tags[index].vertical) {
          return `translate(${initialTranslate[1][0] + this.vttLine(index)}%, ${this.transDirection([1][1], tags[index].alignment)}%)`;
        }
        return `translate(${initialTranslate[1][0]}%, ${this.transDirection([1][1], tags[index].alignment) + this.vttLine(index)}%)`;
      }
      return `translate(${initialTranslate[1][0]}%, ${this.transDirection(initialTranslate[1][1] + this.secondarySubTransPercent(transPercent, tags[index].alignment), tags[index].alignment) + this.assLine(index)}%)`;
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
        // return
        // `${((20 + ((this.winHeight - this.computedHeight) / 2)) / this.winHeight) * 100}%`;
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
    position: static;
    transform: translate(0, 0)!important;
    justify-content: center;
    &.focus {
      &::before {
        visibility: visible;
      }
    }
    .add-cue-render {
      opacity: 0.3;
      // cursor: pointer;
    }
  }
  .edit-box {
    border-width: 0;
    border-radius: 0;
  }
}
.subContainer {
  // padding: 5px 15px;
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  transform-origin: bottom left;
  z-index: 4;
  border: 1px solid transparent;
  .pointer {
    cursor: pointer;
  }
  .cue-wrap {
    display: flex;
    box-sizing: border-box;
    flex-direction: column-reverse;
    position: relative;
    z-index: 2;
  }
}
.enable-hover {
  &::before {
    content: "";
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 5px;
    overflow: hidden;
    visibility: hidden;
  }
  &:hover {
    &::before {
      visibility: visible;
    }
  }
}
.editable {
  &::before {
    background: rgba(0,0,0,0.1);
    backdrop-filter: blur(10px);
    visibility: visible;
  }
}
.edit-box {
  display: flex;
  position: relative;
  overflow: hidden;
  div, textarea {
    width: 100%;
    outline: none;
    border: none;
    text-align: center;
    white-space: pre-line;
    padding: 0 5px;
    word-break: break-all;
    resize: none;
    overflow-x: hidden;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      width: 0!important;
    }
  }
  textarea {
    position: relative;
    z-index: 10;
    // background: #009be6;
    // font-weight: 800;
    // -webkit-background-clip: text;
    // -webkit-text-fill-color: #fff;
    // -webkit-text-stroke: 1.6px transparent;
  }
  .back {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    opacity: 0;
  }
}
</style>
