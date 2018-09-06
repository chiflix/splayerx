<template>
  <div class="thumbnail-wrapper"
    :style="{width: thumbnailWidth +'px', height: thumbnailHeight +'px', left: positionOfThumbnail + 'px'}">
    <div class="thumbnail-background" :style="{width: thumbnailWidth + 2 +'px'}">
      <div class="the-preview-thumbnail" :style="{height: thumbnailHeight + 2 +'px'}">
        <thumbnail-video-player
          v-if="mountVideo"
          v-show="displayVideo"
          :quickHash="quickHash"
          :currentTime="videoCurrentTime"
          :thumbnailWidth="thumbnailWidth"
          :thumbnailHeight="thumbnailHeight"
          :outerThumbnailInfo="outerThumbnailInfo"
          @update-thumbnail-info="updateThumbnailInfo" />
        <thumbnail-display
          v-if="mountImage"
          v-show="!displayVideo"
          :quickHash="quickHash"
          :autoGenerationIndex="autoGenerationIndex"
          :maxThumbnailWidth="maxThumbnailWidth"
          :currentIndex="currentIndex"
          :thumbnailWidth="thumbnailWidth"
          :thumbnailHeight="thumbnailHeight" />
        <span class="time">{{ videoTime }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import idb from 'idb';
import {
  THUMBNAIL_DB_NAME,
  INFO_DATABASE_NAME,
  THUMBNAIL_OBJECT_STORE_NAME,
} from '@/constants';
import ThumbnailVideoPlayer from './ThumbnailVideoPlayer';
import ThumbnailDisplay from './ThumbnailDisplay';
export default {
  components: {
    'thumbnail-video-player': ThumbnailVideoPlayer,
    'thumbnail-display': ThumbnailDisplay,
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
        newVideo: true,
        videoSrc: this.src,
        videoDuration: -1,
        generationInterval: -1,
        screenWidth: 1920,
        maxThumbnailWidth: 240,
        videoRatio: this.videoRatio,
        lastGenerationIndex: 0,
      },
      quickHash: null,
      displayVideo: true,
      videoCurrentTime: 0,
      canvasCurrentTime: 0,
      autoGenerationIndex: 0,
      generationInterval: 3,
      mountVideo: false,
      mountImage: false,
      maxThumbnailCount: 0,
      lastGenerationIndex: 0,
      currentIndex: 0,
      generatedIndex: 0,
    };
  },
  watch: {
    src() {
      // Reload video and image components
      this.mountVideo = false;
      this.mountImage = false;
      this.generatedIndex = 0;
      this.currentIndex = 0;
      this.quickHash = this.mediaQuickHash(this.$store.state.PlaybackState.OriginSrcOfVideo);
      this.retrieveThumbnailInfo(this.quickHash).then(this.updateThumbnailData);
    },
    currentTime(newValue) {
      const index = Math.abs(Math.floor(newValue / this.generationInterval));
      this.currentIndex = index;
      if (index <= this.generatedIndex) {
        this.displayVideo = false;
        this.canvasCurrentTime = newValue;
      } else {
        this.displayVideo = true;
        this.videoCurrentTime = newValue;
      }
    },
  },
  methods: {
    updateThumbnailInfo(event) {
      this.autoGenerationIndex = event.index;
      this.generationInterval = event.interval;
      this.infoDB().add(THUMBNAIL_OBJECT_STORE_NAME, {
        quickHash: this.quickHash,
        lastGenerationIndex: event.index,
        generationInterval: event.interval,
        maxThumbnailCount: event.count,
      });
      if (!this.mountImage) {
        this.mountImage = this.autoGenerationIndex > 0;
      }
      if (this.mountVideo) {
        this.mountVideo = event.index < event.count;
      }
    },
    retrieveThumbnailInfo(quickHash) {
      return new Promise((resolve) => {
        this.infoDB().get(THUMBNAIL_OBJECT_STORE_NAME, quickHash).then((result) => {
          if (result) {
            const { lastGenerationIndex, maxThumbnailCount, generationInterval } = result;
            this.autoGenerationIndex = lastGenerationIndex;
            this.generationInterval = generationInterval;
            resolve({
              lastGenerationIndex,
              maxThumbnailCount,
              generationInterval,
              newVideo: false,
            });
          }
          resolve({
            newVideo: true,
          });
        });
      });
    },
    updateThumbnailData(dataResult) {
      const result = dataResult;
      if (result) {
        const thumnailInfo = result;
        // Update Generation Parameters
        this.lastGenerationIndex = result.lastGenerationIndex || 0;
        this.maxThumbnailCount = result.maxThumbnailCount || 0;
        this.videoCurrentTime = result.generationInterval * result.lastGenerationIndex || 0;
        // Update outerThumbnailInfo
        this.outerThumbnailInfo = Object.assign(
          {},
          this.outerThumbnailInfo,
          thumnailInfo,
          { videoSrc: this.src },
          { lastGenerationIndex: this.lastGenerationIndex },
          { maxThumbnailCount: this.maxThumbnailCount },
        );
        // Update mountVideo
        this.mountVideo = !result.lastGenerationIndex ||
          result.lastGenerationIndex < result.maxThumbnailCount;
        // Update mountImage
        this.mountImage = typeof result.lastGenerationIndex === 'number' &&
          result.lastGenerationIndex > 0;
      }
    },
  },
  created() {
    idb.open(THUMBNAIL_DB_NAME).then((db) => {
      const obejctStoreName = `thumbnail-width-${this.maxThumbnailWidth}`;
      if (!db.objectStoreNames.contains(obejctStoreName)) {
        idb.open(THUMBNAIL_DB_NAME, db.version + 1, (upgradeDB) => {
          console.log('[IndexedDB]: Initial thumbnails storage objectStore.');
          const store = upgradeDB.createObjectStore(
            `thumbnail-width-${this.maxThumbnailWidth}`,
            { keyPath: 'id', autoIncrement: false, unique: true },
          );
          store.createIndex('quickHash', 'quickHash', { unique: false });
          store.createIndex('index', 'index', { unique: false });
        });
      }
      /* eslint-disable newline-per-chained-call */
    });
    idb.open(INFO_DATABASE_NAME).then((db) => {
      this.quickHash = this.mediaQuickHash(this.$store.state.PlaybackState.OriginSrcOfVideo);
      const obejctStoreName = THUMBNAIL_OBJECT_STORE_NAME;
      if (!db.objectStoreNames.contains(obejctStoreName)) {
        console.log('[IndexedDB]: Initial preview thumbnail info objectStore.');
        return idb.open(INFO_DATABASE_NAME, db.version + 1, (upgradeDB) => {
          upgradeDB.createObjectStore(obejctStoreName, { keyPath: 'quickHash' }, { unique: true });
        });
      }
      return idb.open(INFO_DATABASE_NAME);
    })
      .then(() => this.retrieveThumbnailInfo(this.quickHash))
      .then(this.updateThumbnailData).catch((err) => {
        console.log(err);
      });
    this.$bus.$on('image-all-get', (e) => {
      this.generatedIndex = e;
    });
  },
};
</script>
<style lang="scss" scoped>
.thumbnail-wrapper {
  position: absolute;
  bottom: 20px;
  -webkit-app-region: no-drag;
  box-sizing: content-box;
}
.thumbnail-background {
  background-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5), rgba(84, 84, 84, 0.5));
  border-radius: 1px;
}
.the-preview-thumbnail {
  position: relative;
  border: 1px solid transparent;
  border-radius: 1px;
  background-clip: padding-box;
  background-color: #000;
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
