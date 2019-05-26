<template>
  <div
    class="thumbnail-display"
  >
    <div
      :style="{
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
        backgroundImage: src,
        backgroundPosition: backPos,
        backgroundSize: backSize,
      }"
    />
  </div>
</template>
<script>
import { ipcRenderer } from 'electron';
import { mapGetters } from 'vuex';
import { filePathToUrl } from '@/helpers/path';
import { getVideoInfoByMediaHash, generateThumbnailPathByMediaHash } from '@/helpers/cacheFileStorage';

export default {
  name: 'ThumbnailDisplay',
  components: {
  },
  props: {
    currentTime: {
      type: Number,
      required: true,
    },
    thumbnailWidth: {
      type: Number,
      required: true,
    },
    thumbnailHeight: {
      type: Number,
      required: true,
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
    this.$bus.$on('set-thumbnail-src', (src) => {
      if (src === this.originSrc) {
        this.isSaved = true;
      }
    });
    this.$bus.$on('generate-thumbnails', async (num) => {
      const fileContent = await getVideoInfoByMediaHash(this.mediaHash);
      this.imgExisted = !!fileContent.thumbnail;
      this.imgSrc = await generateThumbnailPathByMediaHash(this.mediaHash);
      this.thumbnailCount = num;
      if (!this.imgExisted) {
        const info = {
          src: this.originSrc,
          outPath: this.imgSrc,
          width: '272',
          num: { rows: '10', cols: `${Math.ceil(num / 10)}` },
        };
        ipcRenderer.send('generateThumbnails', info);
      }
    });
  },
  methods: {
  },
};
</script>
