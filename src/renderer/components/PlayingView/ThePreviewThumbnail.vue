<template>
  <div class="thumbnail-wrapper"
    :style="{width: thumbnailWidth +'px', height: thumbnailHeight +'px', transform: `translateX(${positionOfThumbnail}px)`}">
    <div class="the-preview-thumbnail" :style="{height: thumbnailHeight + 2 +'px'}">
      <thumbnail-video-player
        v-if="disableAutoGeneration || mountVideo"
        v-show="displayVideo"
        :quickHash="mediaHash"
        :currentTime="videoCurrentTime"
        :thumbnailWidth="thumbnailWidth"
        :thumbnailHeight="thumbnailHeight"
        :outerThumbnailInfo="outerThumbnailInfo"
        :disabled="disableAutoGeneration"
        @update-thumbnail-info="updateThumbnailInfo" />
      <thumbnail-display
        v-if="!disableAutoGeneration && mountImage"
        v-show="!displayVideo"
        :quickHash="mediaHash"
        :autoGenerationIndex="autoGenerationIndex"
        :maxThumbnailWidth="maxThumbnailWidth"
        :currentIndex="currentIndex"
        :thumbnailWidth="thumbnailWidth"
        :thumbnailHeight="thumbnailHeight" />
    </div>
    <div class="thumbnail-gradient"></div>
    <div class="time">
      <span class="flex-items" :style="{ color: hoveredEnd ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)'}">{{ videoTime }}</span>
      <transition name="hovered-end">
        <base-icon class="flex-items hovered-end" type="hoveredEnd" v-if="hoveredEnd" />
      </transition>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import idb from 'idb';
import { ipcRenderer } from 'electron';
import {
  THUMBNAIL_DB_NAME,
  THUMBNAIL_OBJECT_STORE_NAME,
} from '@/constants';
import Icon from '../BaseIconContainer.vue';
import ThumbnailVideoPlayer from './ThumbnailVideoPlayer.vue';
import ThumbnailDisplay from './ThumbnailDisplay.vue';

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
      disableAutoGeneration: false,
    };
  },
  computed: {
    ...mapGetters(['originSrc', 'convertedSrc', 'mediaHash']),
  },
  watch: {
    async mediaHash(newValue) {
      // Reload video and image components
      this.mountVideo = false;
      this.mountImage = false;
      this.generatedIndex = 0;
      this.currentIndex = 0;
      const thumbnailInfo = await this.retrieveThumbnailInfo(newValue);
      this.updateThumbnailData(thumbnailInfo);
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
      this.infoDB.add(THUMBNAIL_OBJECT_STORE_NAME, {
        quickHash: this.mediaHash,
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
      return new Promise(async (resolve) => {
        this.disableAutoGeneration = await this.isInvalidVideo(this.originSrc);
        this.infoDB.get(THUMBNAIL_OBJECT_STORE_NAME, quickHash).then((result) => {
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
        const thumbnailInfo = result;
        // Update Generation Parameters
        this.lastGenerationIndex = result.lastGenerationIndex || 0;
        this.maxThumbnailCount = result.maxThumbnailCount || 0;
        this.videoCurrentTime = result.generationInterval * result.lastGenerationIndex || 0;
        // Update outerThumbnailInfo
        this.outerThumbnailInfo = Object.assign(
          {},
          this.outerThumbnailInfo,
          thumbnailInfo,
          { videoSrc: this.convertedSrc },
          { lastGenerationIndex: this.lastGenerationIndex || 0 },
          { maxThumbnailCount: this.maxThumbnailCount || 0 },
        );
        // Update mountVideo
        this.mountVideo = !result.lastGenerationIndex ||
          result.lastGenerationIndex < result.maxThumbnailCount;
        // Update mountImage
        this.mountImage = typeof result.lastGenerationIndex === 'number' &&
          result.lastGenerationIndex > 0;
      }
    },
    isInvalidVideo(videoSrc) {
      return new Promise((resolve) => {
        ipcRenderer.once(`mediaInfo-${videoSrc}-reply`, (event, info) => {
          const {
            codec_long_name: codecName,
            coded_width: width,
          } = JSON.parse(info).streams[0]; // eslint-disable-line camelcase
          resolve(/HEVC|265/.test(codecName) || width > 1920);
        });
      });
    },
  },
  created() {
    idb.open(THUMBNAIL_DB_NAME).then((db) => {
      const obejctStoreName = `thumbnail-width-${this.maxThumbnailWidth}`;
      if (!db.objectStoreNames.contains(obejctStoreName)) {
        idb.open(THUMBNAIL_DB_NAME, db.version + 1, (upgradeDB) => {
          this.addLog('info', `[IndexedDB]: Initial thumbnails storage objectStore of width: ${this.maxThumbnailWidth} `);
          const store = upgradeDB.createObjectStore(
            `thumbnail-width-${this.maxThumbnailWidth}`,
            { keyPath: 'id', autoIncrement: false, unique: true },
          );
          store.createIndex('quickHash', 'quickHash', { unique: false });
          store.createIndex('index', 'index', { unique: false });
        });
      }
    });
    this.retrieveThumbnailInfo(this.mediaHash)
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
  bottom: 15px;
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

  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    font-size: 20px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    font-size: 20px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    font-size: 24px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
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
