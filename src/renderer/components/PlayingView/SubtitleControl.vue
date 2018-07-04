<template>
  <div class="subtitle-control">
    <div class="subtitle-control-board"
      v-show="subtitleCtrlAppearFlag"></div>
    <div class="subtitle-button"
      @click.capture.stop.left="toggleSubtitle">
      <img src="" alt="Button">
    </div>
  </div>
</template>;

<script>
export default {
  components: {

  },
  data() {
    return {
      subtitleAppearFlag: true,
      subtitleCtrlAppearFlag: true,
      subtitleMenuAppearFlag: false,
    };
  },
  methods: {
    toggleSubtitle() {
      this.$bus.$emit('toggleSubtitle');
    },
    toggleSubtitleCtrl() {
      this.subtitleCtrlAppearFlag = !this.subtitleCtrlAppearFlag;
    },
    toggleSubtitleMenu() {
      this.subtitleMenuAppearFlag = !this.subtitleMenuAppearFlag;
    },
  },
  computed: {

  },
  watch: {

  },
  created() {

  },
};
</script>

<style lang="scss">
.video-controller .subtitle {
}
.video-controller .subtitle-button {
  position: absolute;
  bottom: 30px;
  right: 90px;
}
.video-controller .subtitle-button:hover {
  cursor: pointer;
}
</style>
