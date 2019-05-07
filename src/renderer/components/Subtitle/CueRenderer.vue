<template>
  <div class="subtitle-wrapper">
    <span class="subtitle-border-content"
       :style="{ textAlign: this.textAlign}"
       :class="'subtitle-border-style'+ChosenIndex" v-html="finalText"></span>
    <span class="subtitle-content"
       :style="{ textAlign: this.textAlign}"
       :class="'subtitle-style'+ChosenIndex" v-html="finalText"></span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'cue-renderer',
  props: {
    text: String,
    settings: Object,
  },
  computed: {
    ...mapGetters(['chosenStyle', 'scaleNum', 'winWidth']),
    ChosenIndex() {
      return this.chosenStyle ? this.chosenStyle : 0;
    },
    textAlign() {
      const alignLeft = [1, 4, 7];
      const alignRight = [3, 6, 9];
      if (alignLeft.includes(this.settings.alignment)) {
        return 'left';
      } else if (alignRight.includes(this.settings.alignment)) {
        return 'right';
      }
      return 'center';
    },
    finalText() {
      let tmp = this.text;
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
};
</script>

<style scoped>
.subtitle-wrapper {
  position: relative;
  z-index: 5;
  display: flex;
}
.subtitle-content {
  z-index: 1;
  white-space: pre;
}
.subtitle-border-content {
  position: absolute;
  z-index: 0;
  white-space: pre;
}
</style>
