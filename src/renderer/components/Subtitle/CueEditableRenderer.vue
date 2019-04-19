<template>
  <div ref="wrap" :class="'subtitle-wrapper sub-mark'+`${paused && canUseEditor ? ' text no-drag' : ''}`">
    <div
      ref="input"
      :contenteditable="paused && canUseEditor"
      :style="{
        textAlign: this.textAlign,
        opacity: this.opacity,
      }"
      :class="'subtitle-content subtitle-style'+chosenStyleIndex+`${isEditable ? ' pre-line' : ''}`"
      v-html="finalText"
      @focus.stop="handleFocus"
      @keydown.stop="keydown"
      @mosueup.stop=""
      @blur="handleBlurTextArea"></div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import { Editor as editorMutations } from '@/store/mutationTypes';
import { EVENT_BUS_COLLECTIONS as bus } from '@/constants';

export default {
  name: 'cue-editable-renderer',
  data() {
    return {
      focus: false,
      autoFocus: false,
    };
  },
  props: {
    text: String,
    settings: Object,
    canUseEditor: Boolean,
    cue: {
      type: Object,
    },
  },
  computed: {
    ...mapGetters(['chosenStyle', 'scaleNum', 'winWidth', 'isProfessional', 'paused', 'isEditable', 'chooseIndex']),
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
      } else if (cue && cue.reference) {
        return '0.3';
      } else if (cue && cue.index === -1 && chooseIndex === -1 && isEditable) {
        return '0.9';
      } else if (cue && cue.index === -1) {
        return '0.3';
      }
      return '0.9';
    },
    textAlign() {
      const alignLeft = [1, 4, 7];
      const alignRight = [3, 6, 9];
      if (this.settings && alignLeft.includes(this.settings.alignment)) {
        return 'left';
      } else if (this.settings && alignRight.includes(this.settings.alignment)) {
        return 'right';
      }
      return 'center';
    },
    finalText() {
      let tmp = this.text;
      if (this.chooseIndex === this.cue.index && this.isEditable) {
        tmp = this.cue.text;
      }
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
  },
  watch: {
    isEditable(v) {
      if (v && !this.focus && this.chooseIndex === this.cue.index) {
        const input = this.$refs.input;
        this.autoFocus = true;
        input.focus();
      }
    },
  },
  methods: {
    ...mapMutations({
      toggleEditable: editorMutations.TOGGLE_EDITABLE,
      updateChooseIndex: editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX,
    }),
    handleFocus() {// eslint-disable-line
      this.focus = true;
      const input = this.$refs.input;
      let sel;
      let range;
      if (!this.isEditable) {
        this.toggleEditable(true);
      }
      if (this.chooseIndex !== this.cue.index) {
        this.updateChooseIndex(this.cue.index);
      }
      const wrap = this.$refs.wrap;
      if (wrap) {
        wrap.style = `
          max-height: 25.5px;
          overflow-x: hidden;
          overflow-y: scroll;
        `;
      }
      if (this.cue.reference) {
        if (window.getSelection && document.createRange) {
          range = document.createRange();
          range.selectNodeContents(input);
          sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (document.body.createTextRange) {
          range = document.body.createTextRange();
          range.moveToElementText(input);
          range.select();
        }
      }
      if (this.autoFocus && !this.cue.reference) { // 非主动点击触发输入，光标需要定位末尾
        if (window.getSelection && document.createRange) {
          range = document.createRange();
          range.selectNodeContents(input);
          range.collapse(false);
          sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (document.body.createTextRange) {
          range = document.body.createTextRange();
          range.moveToElementText(input);
          range.collapse(false);
          range.select();
        }
        this.autoFocus = false;
      }
    },
    handleBlurTextArea() {
      // console.log(this.$refs.input.innerHTML, this.cue.text);
      this.toggleEditable(false);
      // this.updateChooseIndex(-2);
      this.$emit('update:show-textarea', false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      this.focus = false;
      const wrap = this.$refs.wrap;
      if (wrap) {
        wrap.style = '';
      }
      let html = this.$refs.input.innerHTML;
      html = html.replace(/<br>/gi, '\n');
      html = html.replace(/(<([^>]+)>)/gi, '');
      html = html.replace(/\n/gi, '<br>');
      this.$bus.$emit(bus.SUBTITLE_TEXTAREA_CHANGE, this.cue, html.trim());
      this.$refs.input.style.opacity = this.opacity;
    },
    keydown(e) { // eslint-disable-line
      // 处理输入框快捷键
      const { remote } = this.$electron;
      const input = this.$refs.input;
      // const opacity = this.opacity;
      const browserWindow = remote.BrowserWindow;
      const focusWindow = browserWindow.getFocusedWindow();
      const checkCmdOrCtrl = (process.platform === 'darwin' && e.metaKey) || (process.platform !== 'darwin' && e.ctrlKey);
      if (e && e.keyCode === 27) {
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
  padding: 0 5px;
  box-sizing: border-box;
  position: relative;
  z-index: 5;
  &::-webkit-scrollbar {
    width: 0!important;
  }
  &.max {
    max-height: 25.5px;
    overflow-x: hidden;
    overflow-y: scroll;
  }
  &.text {
    cursor: text;
  }
}
.subtitle-content {
  z-index: 1;
  white-space: pre;
  &.pre-line {
    white-space: pre-line;
    word-break: break-all;
  }
  &:focus {
    // background: red;
  }
}
</style>
