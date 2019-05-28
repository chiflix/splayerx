<template>
  <div
    class="subtitle-wrapper"
    :style="{
      fontStyle: isItalic ? 'italic' : '',
      fontWeight: isBold ? 'bold' : '',
      textDecoration: lineType,
    }"
  >
    <span
      class="subtitle-border-content"
      :style="{ textAlign: textAlign }"
      :class="'subtitle-border-style'+ChosenIndex"
    >{{ text }}</span>
    <span
      class="subtitle-content"
      :style="{ textAlign: textAlign}"
      :class="'subtitle-style'+ChosenIndex"
    >{{ text }}</span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'CueRenderer',
  props: {
    text: {
      type: String,
      required: true,
    },
    settings: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isItalic: false,
      isBold: false,
      lineType: '',
    };
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
  },
  watch: {
    settings(val) {
      this.isItalic = false;
      this.isBold = false;
      this.lineType = '';
      if (val) {
        if (val.i) {
          this.isItalic = true;
        }
        if (val.b) {
          this.isBold = true;
        }
        if (val.u) {
          this.lineType = 'underline';
        }
        if (val.s) {
          this.lineType = 'line-through';
        }
      }
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
