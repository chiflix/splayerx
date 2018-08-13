<template>
  <div class="the-preview-thumbnail"
    :style="{width: thumbnailWidth +'px', height: thumbnailHeight + 'px', left: positionOfThumbnail + 'px'}">
    <thumbnail-video-player
      :quickHash="quickHash"
      :currentTime="currentTime"
      :thumbnailWidth="thumbnailWidth"
      :thumbnailHeight="thumbnailHeight"
      :outerThumbnailInfo="outerThumbnailInfo">
      <span class="time">{{ videoTime }}</span>
    </thumbnail-video-player>
  </div>
</template>

<script>
import idb from 'idb';
import { THUMBNAIL_DB_NAME, THUMBNAIL_DB_VERSION } from '@/constants';
import ThumbnailVideoPlayer from './ThumbnailVideoPlayer';
export default {
  components: {
    'thumbnail-video-player': ThumbnailVideoPlayer,
  },
  props: {
    src: String,
    currentTime: Number,
    maxThumbnailWidth: Number,
    videoRatio: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    positionOfThumbnail: Number,
    videoTime: String,
  },
  data() {
    return {
      outerThumbnailInfo: {
        videoSrc: this.src,
        videoDuration: -1,
        generationInterval: -1,
        screenWidth: 1920,
        maxThumbnailWidth: 240,
        videoRatio: this.videoRatio,
      },
      quickHash: null,
      THUMBNAIL_DB_NAME: 'splayerx-preview-thumbnails',
      THUMBNAIL_DB_VERSION: 1,
    };
  },
  watch: {
    src(newValue) {
      this.updateMediaQuickHash(newValue);
      this.$set(this.outerThumbnailInfo, 'videoSrc', newValue);
    },
  },
  methods: {
    updateMediaQuickHash(src) {
      const regexes = {
        file: new RegExp('^file:///?'),
        http: new RegExp('^(http|https)://'),
      };

      let filePath = src;
      Object.keys(regexes).forEach((fileType) => {
        if (regexes[fileType].test(src)) {
          filePath = src.replace(regexes[fileType], '');
        }
      });
      this.quickHash = this.mediaQuickHash(filePath);
    },
  },
  created() {
    this.updateMediaQuickHash(this.src);
    idb.open(THUMBNAIL_DB_NAME, THUMBNAIL_DB_VERSION, (upgradeDB) => {
      const { oldVersion } = upgradeDB;
      switch (oldVersion) {
        default: {
          break;
        }
        case 0: {
          console.log('[IndexedDB]: Initial objectStore.');
          const store = upgradeDB.createObjectStore(
            `thumbnail-width-${this.maxThumbnailWidth}`,
            { keyPath: 'id', autoIncrement: false, unique: true },
          );
          store.createIndex('quickHash', 'quickHash', { unique: false });
          store.createIndex('index', 'index', { unique: false });
          break;
        }
      }
    });
  },
};
</script>
<style lang="scss" scoped>
.the-preview-thumbnail {
  position: absolute;
  bottom: 20px;
  -webkit-app-region: no-drag;
  border: 1px solid;
  border-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5), rgba(84, 84, 84, 0.5)) 10;
  border-radius: 1px;
  box-sizing: content-box;
  background-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5), rgba(84, 84, 84, 0.5));
}
.time {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.2px;
  @media screen and (max-width: 854px) {
    font-size: 20px;
  }
  @media screen and (min-width: 854px) and (max-width: 1920px) {
    font-size: 24px;
  }
  @media screen and (min-width: 1920px) {
    font-size: 40px;
  }
}
</style>
