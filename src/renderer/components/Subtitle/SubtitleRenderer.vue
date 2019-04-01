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
        cursor: canUseEditor ? 'pointer' : ''
      }"
      :class="avaliableClass(i)+`${paused && canUseEditor ? ' enable-hover': ''}`+`${isEditable && index === i ? ' editable': ''}`+isCueFocus(cue)">
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
          @mousemove.stop=""
          :style="{
            // zoom: `${((29 / (11 * 1600)) * computedWidth) + (26 / 55)}`,
            zoom: `${scaleNum}`,
            transform: subLine(i),
            width: `${computedWidth*0.60/scaleNum}px`
          }"
          v-show="isEditable && paused && i === index">
          <div
            class="back subtitle-style1 no-drag"
            contenteditable="true">{{editVal.replace(/ /g, '&nbsp;')}}</div>
          <textarea
            class="subtitle-style1 no-drag"
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
      <div class="professional-btn-wrap" @click.stop="handleClickProfessional" v-if="!isProfessional && !isEditable && canUseEditor">
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
      :class="'subContainer subtitle-alignment2'+/*`${paused && !isEditable ? ' enable-hover': ''}`*/`${isEditable && index === null ? ' editable': ''}`"
      :style="{
        bottom: `${((20 + ((winHeight - computedHeight) / 2)) / winHeight) * 100}%`
      }">
      <div class="cue-wrap">
        <CueRenderer v-show="!isEditable || index !== null" class="cueRender add-cue-render"
          :text="'点击添加字幕'"
          :settings="{}"
          :style="{
            zoom: `${scaleNum}`,
          }"></CueRenderer>
        <div
          class="edit-box"
          @mousemove.stop=""
          v-show="isEditable && paused && index === null"
          :style="{
            // zoom: `${((29 / (11 * 1600)) * computedWidth) + (26 / 55)}`,
            zoom: `${scaleNum}`,
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
// import { stringifyVtt, toVttTime } from 'subtitle';
import { Subtitle as subtitleMutations, Window as windowMutations } from '@/store/mutationTypes';
import { videodata } from '@/store/video';
// import { stringifyAss } from '@/helpers/subtitle';
import CueRenderer from './CueRenderer.vue';
import Icon from '../BaseIconContainer.vue';
import SubtitleInstance from './SubtitleLoader/index';

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
    currentSub: {
      type: Array,
      default: () => [],
    },
    chooseIndexs: {
      type: Number,
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
      index: null,
      editVal: '',
      rows: 1,
    };
  },
  computed: {
    ...mapGetters([
      'duration', 'scaleNum', 'subtitleDelay', 'intrinsicHeight', 'intrinsicWidth', 'mediaHash', 'subToTop', 'subtitleLis', 'winHeight',
      'paused', 'isFullScreen',
      'isEditable', 'isProfessional', 'winRatio', 'winWidth', 'winHeight',
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
      return sizeAvaliable && !this.playlistShow;
    },
    trimEditVal() {
      return this.editVal.replace(/ /g, '*');
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
    requestAnimationFrame(this.currentTimeUpdate);
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
          if (this.type === 'ass') {
            sub.fragments[0].text = this.editVal.trim();
          } else {
            sub.text = this.editVal.trim();
          }
          const subtitleInstance = !this.subtitleInstance ? {
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
      const { currentTags: tags, isVtt } = this;
      if (isEqual(tags[index], tags[index - 1])) {
        if (!isVtt) {
          return `${this.assLine(index)}%`;
        }
        return this.vttLine(index);
      }
      return '';
    },
    transPos(index) {
      const { currentTags: tags, isVtt } = this;
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
      if (!isVtt) {
        if (tags[index].pos) {
          return `translate(${this.translateNum(tags[index].alignment)[0]}%, ${this.translateNum(tags[index].alignment)[1]}%)`;
        }
        return `translate(${initialTranslate[tags[index].alignment - 1][0]}%, ${initialTranslate[tags[index].alignment - 1][1] + this.assLine(index)}%)`;
      }
      return '';
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
      if (!isVtt) {
        if (tags[index].pos) {
          return `${(tags[index].pos.y / this.subPlayResY) * 100}vh`;
        } else if ([7, 8, 9].includes(tags[index].alignment)) {
          return `${((20 + ((this.winHeight - this.computedHeight) / 2)) / this.winHeight) * 100}%`;
        }
      } else if (type === 'vtt' && tags[index].line && tags[index].position) {
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
      if (([1, 2, 3].includes(tags[index].alignment) && !tags[index].pos) ||
        (isVtt && (!tags[index].line || !tags[index].position))) {
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
    // &::before {
    //   content: "";
    //   width: 100%;
    //   height: 100%;
    //   position: absolute;
    //   left: 0;
    //   top: 0;
    //   z-index: 1;
    //   backdrop-filter: blur(3px);
    //   background: rgba(0,0,0,0.05);
    //   border: 1px solid rgba(255,255,255,0.15);
    //   border-radius: 5px;
    //   // visibility: hidden;
    // }
    .professional-btn-wrap {
      display: flex;
    }
    // &.editable, &.focus, &:hover {
    //   &::before {
    //     visibility: visible;
    //   }
    // }
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
      cursor: pointer;
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
    // padding: 5px 15px;
    // &::before {
    //   content: "";
    //   width: 100%;
    //   height: 100%;
    //   position: absolute;
    //   left: 0;
    //   top: 0;
    //   z-index: 1;
    //   backdrop-filter: blur(3px);
    //   background: rgba(0,0,0,0.05);
    //   border: 1px solid rgba(255,255,255,0.15);
    //   border-radius: 5px;
    //   // visibility: hidden;
    // }
    .professional-btn-wrap {
      display: flex;
    }
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
