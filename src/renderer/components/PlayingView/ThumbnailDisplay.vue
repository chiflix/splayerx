<template>
  <div
    :data-component-name="$options.name"
    class="thumbnail-display">
    <div
     :style="{
       width: `${thumbnailWidth}px`,
       height: `${thumbnailHeight}px`,
       backgroundImage: src,
       backgroundPosition: backPos,
     }"></div>
  </div>
</template>
<script>
import path from 'path';
import { ipcRenderer, remote } from 'electron';
import { mapGetters } from 'vuex';

export default {
  name: 'thumbnail-display',
  components: {
  },
  props: {
    quickHash: String,
    maxThumbnailWidth: Number,
    currentTime: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
  },
  computed: {
    ...mapGetters(['originSrc', 'duration']),
    src() {
      return `url("file://${remote.app.getPath('desktop')}/${path.basename(this.originSrc)}.jpg?version=${this.currentIndex}")`;
    },
    backPos() {
      const index = this.currentIndex;
      const column = index === 0 ? 0 : Math.ceil(index / 10) - 1;
      const row = index - (10 * column);
      return `-${row * this.thumbnailWidth}px -${column * this.thumbnailHeight}px`;
    },
  },
  data() {
    return {
      num: [],
      currentIndex: 0,
      thumbailCount: 0,
    };
  },
  watch: {
    currentTime(val) {
      this.currentIndex = Math.abs(Math.floor(val / (this.duration / this.thumbailCount)));
    },
  },
  mounted() {
    this.$bus.$on('generateThumbnails', (num) => {
      this.thumbailCount = num;
      this.num = ['10', `${Math.ceil(num / 10)}`];
      setTimeout(() => {
        const info = {
          src: this.originSrc, outPath: `${remote.app.getPath('desktop')}/${path.basename(this.originSrc)}.jpg`, width: `${this.thumbnailWidth}`, num: this.num,
        };
        ipcRenderer.send('generateThumbnails', info);
      }, 100);
    });
  },
  methods: {
  },
};
</script>
