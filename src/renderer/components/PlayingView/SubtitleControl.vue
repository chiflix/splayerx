<template>
  <div class="subtitle-control">
    <div class="subtitle-control-board"
      v-show="subtitleCtrlAppearFlag">
      <div class="subtitle-menu-wrapper"
        v-show="subtitleMenuAppearFlag">
        <ul class="subtitle-menu">
          <li class="subtitle-menu-item"
            v-for="(name, index) in subtitleNameArr"
            :key="index"
            @click.capture.stop.left="subtitleSelect(index)">
            {{name}}
          </li>
        </ul>
      </div>
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
    subtitleSelect(index) {
      console.log(index);
      this.$bus.$emit('changeSubtitle', index);
    },
  },
  computed: {
    subtitleNameArr() {
      return this.$store.state.PlaybackState.SubtitleNameArr;
    },
    curSubName() {
      const curIndex = this.$store.state.PlaybackState.FirstSubIndex
        - this.$store.state.PlaybackState.StartIndex;
      return this.$store.state.PlaybackState.SubtitleNameArr[curIndex];
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

.subtitle-menu-item:hover {
  cursor: pointer;
}
</style>
