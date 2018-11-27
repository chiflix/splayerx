<template>
  <div class="subtitle-wrapper">
    <div class="flex-box">
      <p class="subtitle-border-content"
         :class="'subtitle-border-style'+ChosenIndex" v-html="finalText"></p>
      <p class="subtitle-content"
         :class="'subtitle-style'+ChosenIndex" v-html="finalText"></p>
    </div>
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
  },
  computed: {
    ...mapGetters(['chosenStyle', 'scale']),
    ChosenIndex() {
      return this.chosenStyle ? this.chosenStyle : 0;
    },
    finalText() {
      let tmp = this.text;
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
  width: 100%;
  height: auto;
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
.flex-box {
  margin: auto;
  display: flex;
}
</style>
