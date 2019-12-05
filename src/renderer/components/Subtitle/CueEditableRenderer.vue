<template>
  <div
    ref="wrap"
    :class="'subtitle-wrapper sub-mark'+`${paused && canUseEditor ? ' text no-drag' : ''}`"
  >
    <div
      ref="input"
      :contenteditable="paused && canUseEditor ? 'plaintext-only' : false"
      :style="{
        textAlign: textAlign,
        opacity: opacity,
        lineHeight: '145%',
        maxWidth: isEditable && chooseIndex === cue.index
          && isClickFirstSub === isFirstSub ? `${(winWidth-10)/zoom}px` : 'none',
      }"
      :class="'subtitle-content subtitle-style'+chosenStyleIndex+`${isEditable
        && chooseIndex === cue.index && isClickFirstSub === isFirstSub ? ' pre-line' : ''}`"
      v-html="finalText"
      @focus.stop="handleFocus"
      @keydown.stop="keydown"
      @mousedown.stop="handleMouseDown"
      @click.stop=""
      @blur="handleBlurTextArea"
    />
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import { Editor as editorMutations } from '@/store/mutationTypes';
import { EVENT_BUS_COLLECTIONS as bus } from '@/constants';

export default {
  name: 'CueEditableRenderer',
  props: {
    text: {
      type: String,
      required: true,
    },
    settings: {
      type: Object,
      default: () => { },
    },
    canUseEditor: Boolean,
    cue: {
      type: Object,
      default: () => { },
    },
    isFirstSub: {
      type: Boolean,
      default: true,
    },
    zoom: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      tmpText: '',
      focus: false,
      offsetDone: false, // 光标定位
    };
  },
  computed: {
    ...mapGetters(['chosenStyle', 'scaleNum', 'winWidth', 'isProfessional', 'paused', 'isEditable', 'chooseIndex', 'isClickFirstSub', 'enabledSecondarySub', 'primarySubtitleId', 'secondarySubtitleId', 'autoFocus']),
    chosenStyleIndex() {
      // 如果是字幕高级编辑模式，字幕块就使用默认的样式
      if (this.isProfessional) {
        return '';
      }
      return this.chosenStyle ? this.chosenStyle : 0;
    },
    opacity() { // eslint-disable-line
      const cue = this.cue;
      const isEditable = this.isEditable;
      const chooseIndex = this.chooseIndex;
      if (cue && cue.reference && isEditable && chooseIndex === cue.index) {
        return '0.9';
      } if (cue && cue.reference) {
        return '0.3';
      } if (cue && cue.index === -1 && chooseIndex === -1 && isEditable) {
        return '0.9';
      } if (cue && cue.index === -1 && this.tmpText) {
        return '0.9';
      } if (cue && cue.index === -1) {
        return '0.3';
      }
      return '0.9';
    },
    textAlign() {
      const alignLeft = [1, 4, 7];
      const alignRight = [3, 6, 9];
      if (this.settings && alignLeft.includes(this.settings.alignment)) {
        return 'left';
      } if (this.settings && alignRight.includes(this.settings.alignment)) {
        return 'right';
      }
      return 'center';
    },
    finalText() {
      // let tmp = this.tmpText ? this.tmpText : this.text;
      let tmp = this.text;
      if (this.cue.index === -1 && !this.isEditable) {
        tmp = this.$t('subtitle.createSubtitle.placeholder');
      }
      tmp = this.tmpText ? this.tmpText : tmp;
      if (this.settings) {
        if (this.settings.i) {
          tmp = `<i>${tmp}`;
        }
        if (this.settings.b) {
          tmp = `<b>${tmp}`;
        }
        if (this.settings.u) {
          tmp = `<u>${tmp}`;
        }
        if (this.settings.s) {
          tmp = `<s>${tmp}`;
        }
      }
      return tmp;
    },
    factor() {
      if (this.enabledSecondarySub && this.primarySubtitleId !== '' && this.secondarySubtitleId !== '') {
        return 0.85;
      }
      return 1;
    },
  },
  watch: {
    autoFocus(v) {
      if (v && !this.focus && this.chooseIndex === this.cue.index
        && this.isFirstSub === this.isClickFirstSub) {
        const input = this.$refs.input;
        input.focus();
      }
    },
  },
  mounted() {
    // autoFocus watcher 失效
    this.$bus.$on(bus.SUBTITLE_EDITOR_AUTO_FOCUS, () => {
      if (!this.focus && this.chooseIndex === this.cue.index
        && this.isFirstSub === this.isClickFirstSub) {
        const input = this.$refs.input;
        input.focus();
      }
    });
  },
  destroyed() {
    this.$bus.$off(bus.SUBTITLE_EDITOR_AUTO_FOCUS);
  },
  methods: {
    ...mapMutations({
      toggleEditable: editorMutations.TOGGLE_EDITABLE,
      updateChooseIndex: editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX,
      updateClickSubtitle: editorMutations.UPDATE_IS_CLICK_FIRST_SUBTITLE,
      updateAutoFocus: editorMutations.UPDATE_AUTO_FOCUS,
    }),
    handleMouseDown() {
      if (!this.canUseEditor) return;
      const isPaused = this.paused;
      if (isPaused) {
        this.updateClickSubtitle(this.isFirstSub);
      } else {
        setImmediate(() => {
          this.$bus.$emit('toggle-playback');
        });
      }
    },
    select(collapse) {
      const input = this.$refs.input;
      let sel;
      let range;
      if (window.getSelection && document.createRange) {
        range = document.createRange();
        range.selectNodeContents(input);
        !collapse && range.collapse(collapse);
        sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(input);
        !collapse && range.collapse(collapse);
        range.select();
      }
    },
    scrollToCursor(rangeText, targetHeight) { // eslint-disable-line
      const input = this.$refs.input;
      const wrap = this.$refs.wrap;
      let len = rangeText.length;
      let beforeBrs = 0;
      const brIndexs = [];
      input.innerHTML.replace(/<br>/gi, '\n').split('\n').forEach((e, i) => {
        if (i === 0) {
          brIndexs.push(e.length + 1);
        } else {
          brIndexs.push((e.length + 1) + brIndexs[i - 1]);
        }
      });
      brIndexs.forEach((e) => {
        if (len >= e) {
          len += 1;
          beforeBrs += 1;
        }
      });
      if (wrap && input && brIndexs.length > 0) {
        const inputHeight = input.offsetHeight / this.factor;
        const oneRowHeight = targetHeight / 2;
        if (inputHeight > targetHeight && beforeBrs > 1 && beforeBrs === brIndexs.length - 1) {
          wrap.scrollTop = (inputHeight - targetHeight);
        } else if (inputHeight > targetHeight && beforeBrs !== 0) {
          wrap.scrollTop = (oneRowHeight * beforeBrs);
        } else {
          wrap.scrollTop = inputHeight > targetHeight ? (oneRowHeight * beforeBrs) : 0;
        }
      }
    },
    handleFocus() { // eslint-disable-line
      if (this.isFirstSub !== this.isClickFirstSub || this.focus) return;
      this.focus = true;
      if (!this.isEditable) {
        this.toggleEditable(true);
      }
      if (this.chooseIndex !== this.cue.index) {
        this.updateChooseIndex(this.cue.index);
      }
      if (this.cue.reference) {
        this.select(true);
      } else if (this.autoFocus) {
        // 非主动点击触发输入，光标需要定位末尾
        this.select(false);
        this.updateAutoFocus(false);
      }
      const wrap = this.$refs.wrap;
      if (wrap && wrap.parentNode) {
        // zoom会影响line-height，导致line-height不准确
        // 这里创建一个两行的临时dom来计算真实两行高度
        const computedHeightDom = document.createElement('div');
        computedHeightDom.innerHTML = '<br><br>';
        computedHeightDom.style = `
          position: absolute;
          left: 0;
          top: 0;
          font-size: 9px;
          line-height: 145%;
          width: 10px;
          z-index: -1;
          opacity: 0,
        `;
        wrap.parentNode.appendChild(computedHeightDom);
        let computedHeight = computedHeightDom.getBoundingClientRect()
          ? computedHeightDom.getBoundingClientRect().height : computedHeightDom.offsetHeight;
        // css 计算两行高度为 9 * 1.45 * = 26.1 但是实际高度要少一点点px
        // 如果临时dom高度是在预计范围内部，就使用临时的dom高度
        computedHeight = computedHeight > 24 && computedHeight < 28 ? computedHeight : 25.5;
        // computedHeight += 2;
        wrap.style = `
          max-height: ${computedHeight}px;
          overflow-x: scroll;
          overflow-y: scroll;
        `;
        wrap.parentNode.removeChild(computedHeightDom);
        setImmediate(() => {
          // 这里计算光标前的文本，注意<br>被忽略
          const input = this.$refs.input;
          const doc = input.ownerDocument || input.document;
          const win = doc.defaultView || doc.parentWindow;
          if (win.getSelection().rangeCount > 0) { // 选中的区域
            const range = win.getSelection().getRangeAt(0);
            const preCaretRange = range.cloneRange(); // 克隆一个选中区域
            preCaretRange.selectNodeContents(input); // 设置选中区域的节点内容为当前节点
            preCaretRange.setEnd(range.endContainer, range.endOffset); // 重置选中区域的结束位置
            // 得到光标前面的文本，计算光标之前有几个换行，在定位到光标位置
            this.scrollToCursor(preCaretRange.toString(), computedHeight);
          }
        });
      }
    },
    handleBlurTextArea() {
      if (this.isFirstSub !== this.isClickFirstSub) return;
      this.toggleEditable(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      this.focus = false;
      const wrap = this.$refs.wrap;
      if (wrap) {
        wrap.scrollTop = 9999;
        wrap.style = '';
      }
      this.offsetDone = false;
      let html = this.$refs.input.innerHTML;
      html = html.replace(/<br>/gi, '\n');
      html = html.trim();
      html = html.replace(/(<([^>]+)>)/gi, '');
      // html = html.replace(/\n/gi, '<br>');
      html = html.replace(/&nbsp;/g, ' ');
      this.tmpText = html.trim();
      if (this.tmpText !== this.cue.text || this.cue.reference) {
        this.$emit('update:textarea-change', {
          cue: this.cue,
          text: html.trim(),
          isFirstSub: this.isFirstSub,
        });
      } else if (this.tmpText === this.cue.text) {
        this.$refs.input.innerHTML = this.finalText;
      }
      this.updateAutoFocus(false);
      this.$refs.input.style.opacity = this.opacity;
    },
    /**
     * 处理输入框快捷键
     */
    keydown(e) { // eslint-disable-line
      // 处理输入框快捷键
      const { remote } = this.$electron;
      const input = this.$refs.input;
      const browserWindow = remote.BrowserWindow;
      const focusWindow = browserWindow.getFocusedWindow();
      const checkCmdOrCtrl = (process.platform === 'darwin' && e.metaKey) || (process.platform !== 'darwin' && e.ctrlKey);
      if (e && e.keyCode === 27) { // esc 失去焦点
        e.target && e.target.blur();
        e.preventDefault();
      } else if (e && e.keyCode === 65 && checkCmdOrCtrl) { // c+a
        focusWindow.webContents.selectAll();
        e.preventDefault();
      } else if (e && e.keyCode === 67 && checkCmdOrCtrl) { // c+c
        focusWindow.webContents.copy();
        e.preventDefault();
      } else if (e && e.keyCode === 86 && checkCmdOrCtrl) { // c+v
        focusWindow.webContents.paste();
        e.preventDefault();
      } else if (e && e.keyCode === 88 && checkCmdOrCtrl) { // c+x
        focusWindow.webContents.cut();
        e.preventDefault();
      } else if (e && e.keyCode === 90 && checkCmdOrCtrl) { // c+z
        focusWindow.webContents.undo();
        e.preventDefault();
      } else if (e && e.keyCode === 90 && checkCmdOrCtrl && e.shiftKey) { // c+s+z
        focusWindow.webContents.redo();
        e.preventDefault();
      } else if (e && e.keyCode === 13 && !e.shiftKey) {
        e.target.blur();
        e.preventDefault();
      } else if (e && e.keydown === 67) {
        e.preventDefault();
      }
      if (!this.isProfessional) {
        input.style.opacity = 0.9;
        requestAnimationFrame(() => {
          if (input) {
            input.style.opacity = 1;
          }
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.subtitle-wrapper {
  position: relative;
  z-index: 5;
  &::-webkit-scrollbar {
    display: none;  // Safari and Chrome
  }
  &.max {
    max-height: 25.5px;
    max-width: 100%;
    overflow: scroll;
  }
  &.text {
    cursor: pointer;
  }
}
.subtitle-content {
  z-index: 1;
  white-space: pre-wrap;
  word-break: normal;
  padding: 0 5px;
  box-sizing: border-box;
  &.pre-line {
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: normal;
  }
  &::-webkit-scrollbar {
    display: none;  // Safari and Chrome
  }
  overflow: scroll;
  &:focus {
    // background: red;
  }
}
</style>
