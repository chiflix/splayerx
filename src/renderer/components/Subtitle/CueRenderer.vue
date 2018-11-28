<template>
  <div class="subtitle-wrapper">
    <span class="subtitle-border-content"
       :class="'subtitle-border-style'+ChosenIndex" v-html="finalText"></span>
    <span class="subtitle-content"
       :class="'subtitle-style'+ChosenIndex" v-html="finalText"></span>
  </div>
</template>

<script>
import asyncStorage from '@/helpers/asyncStorage';
import { mapGetters } from 'vuex';
export default {
  name: 'CueRender',
  data() {
    return {
    };
  },
  props: {
    text: String,
    settings: Object,
    index: Number,
  },
  computed: {
    ...mapGetters(['chosenStyle', 'scaleNum', 'winWidth']),
    ChosenIndex() {
      return this.chosenStyle ? this.chosenStyle : 0;
    },
    finalText() {
      let tmp = this.text;
      if (this.settings[this.index].i) {
        tmp = `<i>${tmp}`;
      }
      if (this.settings[this.index].b) {
        tmp = `<b>${tmp}`;
      }
      if (this.settings[this.index].u) {
        tmp = `<u>${tmp}`;
      }
      if (this.settings[this.index].s) {
        tmp = `<s>${tmp}`;
      }
      return tmp;
    },
  },
  created() {
    asyncStorage.get('subtitle-style').then((data) => {
      if (data.chosenStyle) {
        this.$store.dispatch('updateChosenStyle', data.chosenStyle);
      }
    });
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
  text-align: center;
}
.subtitle-border-content {
  position: absolute;
  z-index: 0;
  white-space: pre;
  text-align: center;
}
</style>
