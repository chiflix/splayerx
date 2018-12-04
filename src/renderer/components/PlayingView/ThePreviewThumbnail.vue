<template>
  <div class="thumbnail-wrapper"
    :style="{width: thumbnailWidth +'px', height: thumbnailHeight +'px', left: positionOfThumbnail + 'px'}">
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
    </div>
    <div class="thumbnail-gradient"></div>
    <div class="time">
      <span class="flex-items">{{ videoTime }}</span>
      <transition name="hovered-end">
        <base-icon class="flex-items hovered-end" type="hoveredEnd" v-if="hoveredEnd" />
      </transition>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import idb from 'idb';
import {
  THUMBNAIL_DB_NAME,
  INFO_DATABASE_NAME,
  THUMBNAIL_OBJECT_STORE_NAME,
} from '@/constants';
import Icon from '../BaseIconContainer';
import ThumbnailVideoPlayer from './ThumbnailVideoPlayer';
import ThumbnailDisplay from './ThumbnailDisplay';
export default {
  components: {
    'thumbnail-video-player': ThumbnailVideoPlayer,
    'thumbnail-display': ThumbnailDisplay,
    'base-icon': Icon,
  },
  props: {
    currentTime: Number,
    maxThumbnailWidth: Number,
    videoRatio: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    positionOfThumbnail: Number,
    videoTime: String,
    hoveredEnd: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      outerThumbnailInfo: {
        newVideo: true,
        videoSrc: this.convertedSrc,
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
  computed: {
    ...mapGetters(['originSrc', 'convertedSrc']),
  },
  watch: {
    originSrc() {
      // Reload video and image components
      this.mountVideo = false;
      this.mountImage = false;
      this.generatedIndex = 0;
      this.currentIndex = 0;
      this.quickHash = this.mediaQuickHash(this.originSrc);
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
          { videoSrc: this.convertedSrc },
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
          this.addLog('info', '[IndexedDB]: Initial thumbnails storage objectStore.');
          const store = upgradeDB.createObjectStore(
            `thumbnail-width-${this.maxThumbnailWidth}`,
            { keyPath: 'id', autoIncrement: false, unique: true },
          );
          store.createIndex('quickHash', 'quickHash', { unique: false });
          store.createIndex('index', 'index', { unique: false });
        });
      }
    });
    idb.open(INFO_DATABASE_NAME).then((db) => {
      this.quickHash = this.mediaQuickHash(this.originSrc);
      const obejctStoreName = THUMBNAIL_OBJECT_STORE_NAME;
      if (!db.objectStoreNames.contains(obejctStoreName)) {
        this.addLog('info', '[IndexedDB]: Initial thumbnails storage objectStore.');
        return idb.open(INFO_DATABASE_NAME, db.version + 1, (upgradeDB) => {
          upgradeDB.createObjectStore(obejctStoreName, { keyPath: 'quickHash' }, { unique: true });
        });
      }
      return idb.open(INFO_DATABASE_NAME);
    })
      .then(() => this.retrieveThumbnailInfo(this.quickHash))
      .then(this.updateThumbnailData)
      .catch((err) => {
        this.addLog('error', err);
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
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 3px;
}
.the-preview-thumbnail {
  position: absolute;
}
.thumbnail-gradient {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
}
.time {
  display: flex;
  justify-content: center;
  align-items: center;
  width: auto;
  height: 100%;
  position: relative;

  @media screen and (max-width: 512px) {
    font-size: 20px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    font-size: 20px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    font-size: 24px;
  }
  @media screen and (min-width: 1921px) {
    font-size: 40px;
  }
  span {
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.8px;
    font-weight: 600;
    margin-right: 3px;
  }
  .hovered-end-enter-active {
    transition: all 5s;
  }
  .hovered-end-enter-leave {
    transition: all 8s;
  }
}
</style>
