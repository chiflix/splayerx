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
import { existsSync } from 'fs';
import path from 'path';
import { ipcRenderer, remote } from 'electron';
import { mapGetters } from 'vuex';
import { filePathToUrl } from '@/helpers/path';

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
    backPos() {
      const index = this.currentIndex;
      const column = index === 0 ? 0 : Math.ceil(index / 10) - 1;
      const row = index - (10 * column);
      return `-${row * this.thumbnailWidth}px -${column * this.thumbnailHeight}px`;
    },
    src() {
      const imgSrc = `${remote.app.getPath('desktop')}/${path.basename(this.originSrc)}.jpg`;
      return existsSync(`${remote.app.getPath('desktop')}/${path.basename(this.originSrc)}.jpg`) || this.isSaved ? `url("${filePathToUrl(imgSrc)}")` : '';
    },
  },
  data() {
    return {
      num: [],
      currentIndex: 0,
      thumbnailCount: 0,
      isSaved: false,
    };
  },
  methods: {
  },
  watch: {
    currentTime(val) {
      this.currentIndex = Math.abs(Math.floor(val / (this.duration / this.thumbnailCount)));
    },
    originSrc() {
      this.isSaved = false;
    },
  },
  mounted() {
    this.$bus.$on('set-thumbnail-src', () => {
      this.isSaved = true;
    });
    this.$bus.$on('generateThumbnails', (num) => {
      this.thumbnailCount = num;
      this.num = ['10', `${Math.ceil(num / 10)}`];
      if (!existsSync(`${remote.app.getPath('desktop')}/${path.basename(this.originSrc)}.jpg`)) {
        setTimeout(() => {
          const info = {
            src: this.originSrc,
            outPath: `${remote.app.getPath('desktop')}/${path.basename(this.originSrc)}.jpg`,
            width: `${this.thumbnailWidth}`,
            num: this.num,
          };
          ipcRenderer.send('generateThumbnails', info);
        }, 100);
      }
    });
  },
};
</script>
