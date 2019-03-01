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
import { ipcRenderer } from 'electron';
import { mapGetters } from 'vuex';
import { filePathToUrl } from '@/helpers/path';
import { getVideoInfoByMediaHash, generateThumbnailPathByMediaHash } from '@/helpers/cacheFileStorage';

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
    ...mapGetters(['originSrc', 'duration', 'mediaHash']),
    backPos() {
      const index = this.currentIndex;
      const column = index === 0 ? 0 : Math.ceil(index / 10) - 1;
      const row = index - (10 * column);
      return `-${row * this.thumbnailWidth}px -${column * this.thumbnailHeight}px`;
    },
    src() {
      return this.imgExisted || this.isSaved ? `url("${filePathToUrl(this.imgSrc)}")` : '';
    },
  },
  data() {
    return {
      num: [],
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
    currentTime(val) {
      this.currentIndex = Math.abs(Math.floor(val / (this.duration / this.thumbnailCount)));
    },
    originSrc() {
      this.isSaved = false;
      this.imgExisted = false;
      this.imgSrc = '';
    },
  },
  mounted() {
    this.$bus.$on('set-thumbnail-src', () => {
      this.isSaved = true;
    });
    this.$bus.$on('generateThumbnails', async (num) => {
      const fileContent = await await getVideoInfoByMediaHash(this.mediaHash);
      this.imgExisted = !!fileContent.thumbnail;
      this.imgSrc = await generateThumbnailPathByMediaHash(this.mediaHash);
      this.thumbnailCount = num;
      this.num = ['10', `${Math.ceil(num / 10)}`];
      if (!this.imgExisted) {
        setTimeout(() => {
          const info = {
            src: this.originSrc,
            outPath: this.imgSrc,
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
