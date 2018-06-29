
export default {
  methods: {
  /**
   * @param id the target subtitle index in the array
   */
    subtitleShow(id) {
      const { vid } = this;
      // 消除之前的字幕
      const curIndex = this.$store.state.PlaybackState.CurrentIndex;
      vid.textTracks[curIndex].mode = 'disabled';
      vid.textTracks[id].mode = 'hidden';
      this.$store.commit('CurrentIndex', id);
    },
    subtitleChange() {
      const targetSubtitle = this.$store.state.PlaybackState.CurrentIndex + 1;
      this.subtitleShow(targetSubtitle);
      this.$store.commit('CurrentIndex', targetSubtitle);
    },
  },
};
