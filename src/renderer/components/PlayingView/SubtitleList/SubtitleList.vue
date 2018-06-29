<template>
  <div class="subtitle-list">
    <div class="subtitle-list-item"
    v-for="(item, id) in subtitleList"
    :key="id"
    @click.capture.stop="subtitleSelect(id)">
    {{item}}
    </div>
  </div>
</template>

<script>
import subtitleMixin from '@/commons/js/mixin';

export default {
  mixins: [subtitleMixin],
  data() {
    return {
      vid: {},
      subtitleList: [],
    };
  },
  methods: {
    loadSubtitleList() {
      // this.subtitleList = [];
      this.subtitleList.splice(0, this.subtitleList.length);
      const startIndex = this.$store.state.PlaybackState.StartIndex;
      for (let i = startIndex; i < this.vid.textTracks.length; i += 1) {
        this.subtitleList.push(this.vid.textTracks[i].label);
      }
    },
  },
  created() {
    this.$bus.$on('metaLoaded', (video) => {
      this.vid = video;
      console.log('loadSubtitle');
      this.loadSubtitleList();
    });
  },
};
</script>

<style>
.subtitle-list-item:hover {
  cursor: pointer;
}
</style>

