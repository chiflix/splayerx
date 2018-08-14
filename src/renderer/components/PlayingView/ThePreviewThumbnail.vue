<template>
  <div class="the-preview-thumbnail"
    :style="{width: thumbnailWidth +'px', height: thumbnailHeight + 'px', left: positionOfThumbnail + 'px'}">
    <thumbnail-video-player
      :quickHash="quickHash"
      :currentTime="videoCurrentTime"
      :thumbnailWidth="thumbnailWidth"
      :thumbnailHeight="thumbnailHeight"
      :outerThumbnailInfo="outerThumbnailInfo"
      @update-thumbnail-info="updateThumbnailInfo"
      v-if="initialized"
      v-show="displayVideo">
      <span class="time">{{ videoTime }}</span>
    </thumbnail-video-player>
  </div>
</template>

<script>
import idb from 'idb';
import {
  THUMBNAIL_DB_NAME,
  INFO_DATABASE_NAME,
} from '@/constants';
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
        newVideo: true,
        videoSrc: this.src,
        videoDuration: -1,
        generationInterval: -1,
        screenWidth: 1920,
        maxThumbnailWidth: 240,
        videoRatio: this.videoRatio,
      },
      quickHash: null,
      initialized: false,
      displayVideo: true,
      videoCurrentTime: 0,
      canvasCurrentTime: 0,
      autoGenerationIndex: 0,
      generationInterval: 3,
    };
  },
  watch: {
    src(newValue) {
      this.updateMediaQuickHash(newValue);
      this.retrieveThumbnailInfo(this.quickHash).then((result) => {
        if (result) {
          const thumnailInfo = result;
          this.outerThumbnailInfo = Object.assign(
            {},
            this.outerThumbnailInfo,
            thumnailInfo,
            { videoSrc: this.src },
          );
          this.displayVideo = result.lastGenerationIndex &&
            result.lastGenerationIndex === result.maxGenerationCount;
        }
      });
    },
    currentTime(newValue) {
      const index = Math.abs(Math.floor(newValue / this.generationInterval));
      if (index <= this.autoGenerationIndex) {
        this.displayVideo = false;
        this.canvasCurrentTime = newValue;
      } else {
        this.displayVideo = true;
        this.videoCurrentTime = newValue;
      }
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
    updateThumbnailInfo(event) {
      this.displayVideo = event.index !== event.count;
      this.autoGenerationIndex = event.index;
      this.generationInterval = event.interval;
      idb.open(INFO_DATABASE_NAME).then((db) => {
        const tx = db.transaction('the-preview-thumbnail', 'readwrite');
        const store = tx.objectStore('the-preview-thumbnail');
        store.put({
          quickHash: this.quickHash,
          lastGenerationIndex: event.index,
          generationInterval: event.interval,
          maxThumbnailCount: event.count,
        });
      });
    },
    retrieveThumbnailInfo(quickHash) {
      return new Promise((resolve, reject) => {
        idb.open(INFO_DATABASE_NAME).then((db) => {
          const tx = db.transaction('the-preview-thumbnail', 'readonly');
          const store = tx.objectStore('the-preview-thumbnail');
          store.get(quickHash).then((result) => {
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
        }).catch((err) => {
          reject(err);
        });
      });
    },
  },
  created() {
    idb.open(THUMBNAIL_DB_NAME).then((db) => {
      const obejctStoreName = `thumbnail-width-${this.maxThumbnailWidth}`;
      db.close();
      if (!db.objectStoreNames.contains(obejctStoreName)) {
        return idb.open(THUMBNAIL_DB_NAME, db.version + 1, (upgradeDB) => {
          console.log('[IndexedDB]: Initial previewThumbnail objectStore.');
          const store = upgradeDB.createObjectStore(
            `thumbnail-width-${this.maxThumbnailWidth}`,
            { keyPath: 'id', autoIncrement: false, unique: true },
          );
          store.createIndex('quickHash', 'quickHash', { unique: false });
          store.createIndex('index', 'index', { unique: false });
        });
      }
      return idb.open(INFO_DATABASE_NAME);
      /* eslint-disable newline-per-chained-call */
    }).then((db) => {
      this.updateMediaQuickHash(this.src);
      const obejctStoreName = 'the-preview-thumbnail';
      this.infoDB().db.close();
      if (!db.objectStoreNames.contains(obejctStoreName)) {
        console.log('[IndexedDB]: Initial preview thumbnail info objectStore.');
        return idb.open(INFO_DATABASE_NAME, db.version + 1, (upgradeDB) => {
          upgradeDB.createObjectStore(obejctStoreName, { keyPath: 'quickHash' }, { unique: true });
        });
      }
      return idb.open(INFO_DATABASE_NAME);
    }).then(() => this.retrieveThumbnailInfo(this.quickHash)).then((result) => {
      if (result) {
        const thumnailInfo = result;
        this.outerThumbnailInfo = Object.assign(
          {},
          this.outerThumbnailInfo,
          thumnailInfo,
          { videoSrc: this.src },
        );
        this.displayVideo = result.lastGenerationIndex &&
          result.lastGenerationIndex === result.maxGenerationCount;
      }
      this.videoCurrentTime = result.generationInterval * result.lastGenerationIndex || 0;
      console.log(this.videoCurrentTime);
      this.initialized = true;
    }).catch((err) => {
      console.log(err);
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
