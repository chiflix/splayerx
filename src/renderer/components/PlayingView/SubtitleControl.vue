<template>
  <div class="subtitle-control">
    <div class="subtitle-control-board"
      v-show="subtitleCtrlAppearFlag">
      <div class="subtitle-menu-button"
        @click.capture.stop.left="toggleSubtitleMenu">
        {{curSubName}}
      </div>
    </div>
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
    subtitleNameArr() {
      return this.$store.state.PlaybackState.SubtitleNameArr;
    },
    curSubName() {
      return this.$store.state.PlaybackState.SubtitleNameArr[
        this.$store.state.PlaybackState.FirstSubIndex];
    },
  },
  watch: {

  },
  created() {

  },
};
</script>

<style lang="scss">
.video-controller .subtitle-control {
  position: absolute;
  bottom: 0;
  width: 100%;
  .subtitle-control-board {
    position: relative;
    bottom: 90px;
    text-align: center;
  }
  .subtitle-menu-button:hover {
    cursor: pointer;
  }
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
