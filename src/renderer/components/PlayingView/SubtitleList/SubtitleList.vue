<template>
  <div class="subtitle-list">
    <div
      v-for="(item, id) in subtitleList"
      :key="id"
      @click.capture.stop.left="subtitleSelect(id)"
      :title="item">
      <div class="subtitle-list-item">
        {{item}}
      </div>
      <div class="icon-selected">
        √
      </div>
    </div>
  </div>
</template>

<script>
import subtitleMixin from '@/commons/js/mixin';

export default {
  mixins: [subtitleMixin],
  data() {
    return {
      subtitleList: [],
    };
  },
  methods: {
    loadSubtitleList() {
      // this.subtitleList = [];
      const vid = this.$store.state.PlaybackState.VideoCanvas;
      console.log(vid);
      this.subtitleList.splice(0, this.subtitleList.length);
      const startIndex = this.$store.state.PlaybackState.StartIndex;
      for (let i = startIndex; i < vid.textTracks.length; i += 1) {
        this.subtitleList.push(vid.textTracks[i].label);
      }
    },
  },
  created() {
    this.$bus.$on('metaLoaded', () => {
      console.log('loadSubtitle');
      this.loadSubtitleList();
    });
  },
};
</script>

<style lang="scss">
.subtitle-list-item:hover {
  cursor: pointer;
}
.subtitle-list-item {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 210px;
}

.icon-selected {
  display: inline-block;
  overflow: hidden;
}
// 使用动态样式变化height
.subtitle-list {
  -webkit-app-region: no-drag;
  overflow: auto;
  height: 100px;
  padding: 10px;
  background-color: rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.7)
}
.subtitle-list::-webkit-scrollbar {
  background: grey; 
  width: 4px;
  border-radius: 10px;
}
.subtitle-list::-webkit-scrollbar-thumb {
  background: white;
  border-radius: 10px;
}
.subtitle-list::-webkit-scrollbar-track {
  border-radius: 10px;
}
</style>

