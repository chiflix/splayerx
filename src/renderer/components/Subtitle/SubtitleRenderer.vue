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
        bottom: subBottom(i),
        transform: transPos(i),
        display: !isProfessional || checkCurrentSub(cue) ? 'flex' : 'none',
        cursor: dragingMode !== 'default' ? dragingMode : canUseEditor ? 'pointer' : 'default'
      }"
      :class="avaliableClass(i)+`${paused && canUseEditor ? ' enable-hover': ''}`+`${isEditable && index === i ? ' editable': ''}`+isCueFocus(cue)">
      <div class="cue-wrap" v-if="filter(cue)">
        <CueRenderer v-show="!isEditable || i !== index" class="cueRender"
          :text="cue.text"
          :settings="cue.tags"
          :style="{
            zoom: isFirstSub ? `${scaleNum}` : `${secondarySubScale}`,
            lineHeight: enabledSecondarySub && currentFirstSubtitleId !== '' && currentSecondSubtitleId !== '' ? '68%' : 'normal',
          }"></CueRenderer>
        <div
          class="edit-box"
          @mousemove.stop=""
          :style="{
            zoom: isProfessional ? `${((29 / (11 * 1600)) * computedWidth) + (26 / 55)}` : `${scaleNum}`,
            // zoom: `${scaleNum}`,
            // transform: subLine(i),
            width: `${computedWidth*0.60/scaleNum}px`
          }"
          v-show="isEditable && paused && i === index">
          <div
            :class="'back no-drag '+`${isProfessional ? 'subtitle-style1' : `subtitle-style${chosenStyle ? chosenStyle : 0}`}`"
            contenteditable="true">{{editVal.replace(/ /g, '&nbsp;')}}</div>
          <textarea
            :class="'no-drag '+`${isProfessional ? 'subtitle-style1' : `subtitle-style${chosenStyle ? chosenStyle : 0}`}`"
            contenteditable="true"
            :ref="`textarea${i}`"
            @keydown.stop="handleKeyDownTextArea"
            @blur="handleBlurTextArea($event, i)"
            @mousedown.left.stop=""
            :rows="rows"
            type="text"
            v-model="editVal"></textarea>
        </div>
      </div>
    </div>
    <div
      v-if="(isProfessional && showAddInput)"
      @click.stop="handleClickAddSub"
      :class="'subContainer subtitle-alignment2'+/*`${paused && !isEditable ? ' enable-hover': ''}`*/`${isEditable && index === null ? ' editable': ''}`"
      :style="{
        bottom: `${((20 + ((winHeight - computedHeight) / 2)) / winHeight) * 100}%`,
        cursor: dragingMode !== 'default' ? dragingMode : 'pointer'
      }">
      <div class="cue-wrap">
        <CueRenderer v-show="!isEditable || index !== null" class="cueRender add-cue-render"
          :text="'点击添加字幕'"
          :settings="{}"
          :style="{
            zoom: `${((29 / (11 * 1600)) * computedWidth) + (26 / 55)}`,
          }"></CueRenderer>
        <div
          class="edit-box"
          @mousemove.stop=""
          v-show="isEditable && paused && index === null"
          :style="{
            zoom: `${((29 / (11 * 1600)) * computedWidth) + (26 / 55)}`,
            // zoom: `${scaleNum}`,
            width: `${computedWidth*0.60/scaleNum}px`
          }">
          <div
            class="back subtitle-style1 no-drag"
            contenteditable="true">{{editVal.replace(/ /g, '&nbsp;')}}</div>
          <textarea
            class="subtitle-style1 no-drag"
            contenteditable="true"
            ref="textarea"
            @keydown.stop="handleKeyDownTextArea"
            @blur="handleBlurTextArea($event, null)"
            type="text"
            :rows="rows"
            v-model="editVal"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapMutations } from 'vuex';
import { isEqual, castArray, isEmpty, cloneDeep } from 'lodash';
import { Subtitle as subtitleMutations, Window as windowMutations } from '@/store/mutationTypes';
import { videodata } from '@/store/video';
import CueRenderer from './CueRenderer.vue';
import SubtitleInstance from './SubtitleLoader/index';

let count = 1;

export default {
  name: 'subtitle-renderer',
  props: {
    subtitleInstance: SubtitleInstance,
    playlistShow: {
      type: Boolean,
      default: false,
    },
    showAddInput: {
      type: Boolean,
      default: false,
    },
    newSubHolder: {
      type: Object,
    },
    dragingMode: {
      type: String,
      default: 'default',
    },
    currentSub: {
      type: Array,
      default: () => [],
    },
    chooseIndexs: {
      type: Number,
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
      index: null,
      editVal: '',
      rows: 1,
      lastTransPercent: 0,
    };
  },
  computed: {
    ...mapGetters([
      'duration', 'scaleNum', 'subtitleDelay', 'intrinsicHeight', 'intrinsicWidth', 'mediaHash', 'subToTop', 'subtitleList', 'winHeight',
      'paused', 'isFullScreen', 'currentFirstSubtitleId', 'currentSecondSubtitleId', 'enabledSecondarySub', 'chosenSize',
      'isEditable', 'isProfessional', 'winRatio', 'winWidth', 'winHeight', 'chosenStyle', 'isCreateSubtitleMode',
      'computedWidth', 'computedHeight', // to determine the subtitle renderer's container size
    ]),
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
      let sizeAvaliable = false;
      if (this.winRatio > 1) {
        // 当视频的宽度大于等于高度，如果高度超过480px,才可以使用编辑模式
        sizeAvaliable = this.winHeight >= 480;
      } else {
        // 当视频宽度小于高度，如果宽度超过480px,才可以使用编辑模式
        sizeAvaliable = this.winWidth >= 480;
      }
      return sizeAvaliable && !this.enabledSecondarySub && !this.playlistShow;
    },
    trimEditVal() {
      return this.editVal.replace(/ /g, '*');
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
    editVal(val) {
      if (val && val.match(/\n/i)) {
        this.rows = 2;
        return;
      }
      const index = this.index;
      this.$nextTick(() => {
        const ref = this.$refs.textarea ? this.$refs.textarea : (this.$refs[`textarea${index}`] && this.$refs[`textarea${index}`][0]);
        const back = ref && ref.parentNode && ref.parentNode.children && ref.parentNode.children[0];
        const backHeight = back && back.offsetHeight;
        if (backHeight) {
          this.rows = backHeight > 20 ? 2 : 1;
        }
      });
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
    count = requestAnimationFrame(this.currentTimeUpdate);
    this.$bus.$off('clear-last-cue');
    this.$bus.$on('clear-last-cue', () => {
      this.lastIndex = [];
      this.lastAlignment = [];
      this.lastText = [];
    });
    // 输入框键盘事件
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  },
  methods: {
    ...mapMutations({
      updateDuration: subtitleMutations.DURATIONS_UPDATE,
      toggleEditable: windowMutations.TOGGLE_EDITABLE,
      toggleProfessional: windowMutations.TOGGLE_PROFESSIONAL,
      setCreateMode: windowMutations.SET_CREATE_MODE,
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
    isCueFocus(cue) {
      if (this.currentSub.length === 0 || !this.isProfessional) {
        return '';
      }
      const result = this.currentSub.find(e => cue.start === e.start && cue.end === e.end);
      if (result && result.index === this.chooseIndexs) {
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
    handleClickAddSub() {
      const isPaused = this.paused;
      if (isPaused) {
        if (!this.isEditable) {
          this.toggleEditable(isPaused);
          this.$nextTick(() => {
            this.editVal = '';
            this.$refs.textarea && this.$refs.textarea.focus();
          });
        }
      } else {
        this.$bus.$emit('toggle-playback');
      }
      this.$emit('update:chooseIndexs', -1);
    },
    handleClickSubContainer(e, i) {
      if (!this.canUseEditor) return;
      const isPaused = this.paused;
      if (isPaused) {
        this.index = i;
        if (!this.isEditable) {
          this.toggleEditable(isPaused);
          this.$nextTick(() => {
            const txt = this.currentCues[i].text;
            const ref = this.$refs[`textarea${i}`][0];
            this.editVal = txt.replace(/<br>/gi, '\n');
            ref && ref.focus();
            setImmediate(() => {
              ref.scrollTop = 9999;
            });
          });
        }
      } else {
        this.$bus.$emit('toggle-playback');
      }
      // 点击字幕块，更新字幕条选中状态
      const index = this.getCueIndex(this.currentCues[i]);
      if (this.isProfessional && index !== -1) {
        this.$emit('update:chooseIndexs', index);
      }
    },
    handleDoubleClickSubContainer(e, i) {
      if (!this.canUseEditor) return;
      if (!this.paused) {
        this.index = i;
        this.$bus.$emit('toggle-playback');
        this.$nextTick(() => {
          this.toggleEditable(this.paused);
          this.$nextTick(() => {
            const txt = this.currentCues[i].text;
            const ref = this.$refs[`textarea${i}`][0];
            this.editVal = txt.replace(/<br>/gi, '\n');
            ref && ref.focus();
            setImmediate(() => {
              ref.scrollTop = 9999;
            });
          });
        });
      }
      // 点击字幕块，更新字幕条选中状态
      const index = this.getCueIndex(this.currentCues[i]);
      if (this.isProfessional && index !== -1) {
        this.$emit('update:chooseIndexs', index);
      }
    },
    handleBlurTextArea(e, i) {
      const editVal = this.editVal.trim();
      if (i !== null) {
        this.$nextTick(() => {
          // 处理是否真正修改了字符
          if (editVal !== this.currentCues[i].text) {
            // 修改当前currentCues
            this.currentCues[i].text = editVal;
            this.$set(this.currentCues, i, this.currentCues[i]);
            // 保存副本
            // 本地字幕
            const text = this.currentCues[i].text;
            const index = this.currentCues[i].index;
            let before = null;
            const subtitleInstance = cloneDeep(this.subtitleInstance);
            if (subtitleInstance.metaInfo && subtitleInstance.metaInfo.format === 'ass') {
              if (text.length === 0) {
                subtitleInstance.parsed.dialogues.splice(index, 1);
              } else {
                subtitleInstance.parsed.dialogues[index].fragments[0].text = text;
              }
            } else if (subtitleInstance.metaInfo) {
              if (text.length === 0) {
                before = subtitleInstance.parsed.dialogues.splice(index, 1);
              } else {
                before = cloneDeep(subtitleInstance.parsed.dialogues[index]);
                subtitleInstance.parsed.dialogues[index].text = text;
              }
            }
            this.$bus.$emit('modified-subtitle', {
              sub: subtitleInstance,
              action: 'replace',
              index,
              before,
            });
          }
          if (this.index === i) {
            this.toggleEditable(false);
            this.editVal = '';
            this.index = null;
            this.rows = 1;
          }
        });
      } else {
        if (editVal !== '' && this.newSubHolder) {
          const sub = Object.assign({}, JSON.parse(JSON.stringify(this.newSubHolder.last)), {
            end: parseFloat(this.newSubHolder.preciseTime.toFixed(2), 10) + 0.01,
          });
          if (this.newSubHolder.distance > 0.5) {
            sub.start = sub.end - 0.5;
          } else {
            sub.start = sub.end - 0.2;
          }
          if (this.type === 'ass' && !this.isCreateSubtitleMode) {
            sub.fragments[0].text = editVal.trim;
          } else {
            sub.text = editVal;
          }
          const subtitleInstance = !this.subtitleInstance || this.isCreateSubtitleMode ? {
            parsed: {
              dialogues: [],
            },
            metaInfo: {
              language: 'zh-CN',
              name: '',
              format: 'online',
            },
            type: 'online',
          } : cloneDeep(this.subtitleInstance);
          this.setCreateMode(false);
          this.$bus.$emit('modified-subtitle-bridge', { sub: subtitleInstance, add: sub, index: this.newSubHolder.insertIndex });
        }
        this.toggleEditable(false);
        this.editVal = '';
        this.rows = 1;
      }
    },
    handleKeyDownTextArea(e) { // eslint-disable-line
      // 处理输入框快捷键
      const { remote } = this.$electron;
      const browserWindow = remote.BrowserWindow;
      const focusWindow = browserWindow.getFocusedWindow();
      const checkCmdOrCtrl = (process.platform === 'darwin' && e.metaKey) || (process.platform !== 'darwin' && e.ctrlKey);
      if (e && e.keyCode === 27) {
        e.target && e.target.blur();
      } else if (e && e.keyCode === 65 && checkCmdOrCtrl) { // c+a
        focusWindow.webContents.selectAll();
      } else if (e && e.keyCode === 67 && checkCmdOrCtrl) { // c+c
        focusWindow.webContents.copy();
      } else if (e && e.keyCode === 86 && checkCmdOrCtrl) { // c+v
        focusWindow.webContents.paste();
      } else if (e && e.keyCode === 88 && checkCmdOrCtrl) { // c+x
        focusWindow.webContents.cut();
      } else if (e && e.keyCode === 90 && checkCmdOrCtrl) { // c+z
        focusWindow.webContents.undo();
      } else if (e && e.keyCode === 90 && checkCmdOrCtrl && e.shiftKey) { // c+s+z
        focusWindow.webContents.redo();
      }
    },
    handleKeyDown(e) {
      if (e && e.keyCode === 27) {
        // const index = this.index;
        // console.log(index, ref);
        // if (ref) {
        //   ref.blur();
        //   // return;
        // }
        if (!this.isFullScreen) {
          this.toggleProfessional(false);
        }
      }
    },
    handleKeyUp() {
    },
    handleClickProfessional() {
      // 如果退出高级模式，需要恢复原来播放尺寸
      // 进入高级模式，需要设定window的信息，在本组件的watch里
      this.toggleProfessional(!this.isProfessional);
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
      count = requestAnimationFrame(this.currentTimeUpdate);
    },
    setCurrentCues(currentTime) {
      if (!this.subtitleInstance || !this.subtitleInstance.parsed) return;
      const parsedData = this.subtitleInstance.parsed.dialogues.map((e, i) => ({ ...e, index: i }));
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
            start: item.start,
            end: item.end,
            tags: currentTags,
            text: currentText,
            index: item.index,
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
        tmp += texts[index - 1].replace('/<br>$/g', '').split('<br>').length;
        index -= 1;
      }
      return tmp;
    },
    lineNum(index) {
      // 最新一条字幕需要换行的translate比例
      const { currentTags: tags, currentTexts: texts } = this;
      if (!this.isFirstSub) {
        this.$emit('update:linesNum', this.subToTop || [7, 8, 9].includes(tags[index].alignment) ? texts[index].split('<br>').length : this.lastLineNum(index) + texts[index].split('<br>').length); // 第二字幕的行数
        this.$emit('update:tags', tags[index]); // 第二字幕的tags
      } else {
        this.$emit('update:firstLinesNum', this.subToTop || [7, 8, 9].includes(tags[index].alignment) ? this.lastLineNum(index) + texts[index].split('<br>').length : texts[index].split('<br>').length); // 第一字幕的行数
        this.$emit('update:firstTags', tags[index]); // 第一字幕的tags
      }
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
      const secondSubHeight = this.linesNum * 9 * this.secondarySubScale;
      const firstSubHeight = this.firstLinesNum * 9 * this.scaleNum;
      // 当播放列表打开时，计算为第二字幕相对于第一字幕需要translate的值
      const subHeightWithDirection = this.subToTop || [7, 8, 9].includes(tags[index].alignment) ?
        [firstSubHeight, secondSubHeight] : [secondSubHeight, firstSubHeight];
      // 根据字体尺寸和换行数计算字幕需要translate的百分比，当第一字幕同时存在多条且之前条存在位置信息时，之前条不纳入translate计算
      let transPercent;
      if (texts[index - 1] && isEqual(tags[index], tags[index - 1]) && this.linesNum === texts[index - 1].split('<br>').length) {
        transPercent = this.lastTransPercent;
      } else if (this.tags &&
        this.tags.alignment !== this.firstTags.alignment && !texts[index - 1]) {
        transPercent = 0;
      } else {
        transPercent = -((subHeightWithDirection[0] + ((subSpaceFactorsA[this.chosenSize] *
          this.winHeight) + subSpaceFactorsB[this.chosenSize])) / subHeightWithDirection[1]) * 100;
      }
      this.lastTransPercent = transPercent;
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
        // return `${(60 / 1080) * 100}%`;
        return `${((20 + ((this.winHeight - this.computedHeight) / 2)) / this.winHeight) * 100}%`;
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
  destroyed() {
    cancelAnimationFrame(count);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  },
};
</script>
<style lang="scss" scoped>
.professional {
  position: absolute;
  left: 50%;
  bottom: 2.88184%;
  transform-origin: bottom left;
  z-index: 5;
  transform: translate(-50%, 0);
  .subContainer {
    position: static;
    transform: translate(0, 0)!important;
    justify-content: center;
    &.focus {
      padding: 0 12px;
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
        // visibility: hidden;
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
  .enable-hover {
    &:hover {
      border-radius: 0;
      // overflow: visible;
    }
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
    flex-direction: column-reverse;
    position: relative;
    z-index: 2;
  }
}
.editable {
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
    font-weight: 800;
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
