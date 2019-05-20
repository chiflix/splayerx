<template>
  <div
    class="thumbnail-display">
    <div
     :style="{
       width: `${thumbnailWidth}px`,
       height: `${thumbnailHeight}px`,
       backgroundImage: src,
       backgroundPosition: backPos,
       backgroundSize: backSize,
     }"></div>
  </div>
</template>
<script lang="ts">
// import { ipcRenderer } from 'electron';
import { mapGetters } from 'vuex';
import { filePathToUrl } from '@/helpers/path';
import thumbnailService from '@/services/media/thumbnailService';
// import thumbnailService from '../../thumbnailService/services/media/thumbnailService';
// import thumbnailService from '@/services/media/thumbnailService';
// import { getVideoInfoByMediaHash,
// generateThumbnailPathByMediaHash } from '@/helpers/cacheFileStorage';

export default {
  name: 'thumbnail-display',
  components: {
  },
  props: {
    currentTime: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
  },
  computed: {
    ...mapGetters(['originSrc', 'duration', 'mediaHash']),
    backPos() {
      const index = this.currentIndex;
      const column = index === 0 ? 0 : Math.ceil(index / 10) - 1;
      const row = index - (10 * column);
      return `-${row * 100}% -${column * 100}%`;
    },
    backSize() {
      return `1000% ${Math.ceil(this.thumbnailCount / 10) * 100}%`;
    },
    src() {
      return this.imgExisted || this.isSaved ? `url("${filePathToUrl(this.imgSrc)}")` : '';
    },
  },
  data() {
    return {
      currentIndex: 0,
      thumbnailCount: 0,
      isSaved: false,
      imgExisted: false,
      imgSrc: '',
    };
  },
  methods: {
  },
  watch: {
    currentTime(val: number) {
      this.currentIndex = Math.abs(Math.floor(val / (this.duration / this.thumbnailCount)));
    },
    originSrc() {
      this.isSaved = false;
      this.imgExisted = false;
      this.imgSrc = '';
    },
  },
  mounted() {
    this.$bus.$on('set-thumbnail-src', (src: string) => {
      if (src === this.originSrc) {
        this.isSaved = true;
      }
    });
    this.$bus.$on('generate-thumbnails', async (num: number) => {
      this.thumbnailCount = num;
      try {
        const result = await thumbnailService.getImage(this.mediaHash);
        if (!result) {
          this.imgExisted = false;
          this.imgSrc = await thumbnailService.generateImage(this.mediaHash, this.originSrc, num);
        } else {
          this.imgExisted = true;
          this.imgSrc = result;
        }
      } catch (err) { //
      }
    });
  },
};
</script>
