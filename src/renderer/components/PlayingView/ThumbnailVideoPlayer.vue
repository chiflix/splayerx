<template>
  <div class="thumbnail-video-player">
    <slot>00:00</slot>
    <base-video-player
      ref="video"
      :src="videoSrc"
      :defaultEvents="['loadedmetadata', 'seeked']"
      :customOptions="{ pauseOnStart: true }"
      :videoSize="{ width: thumbnailWidth, height: thumbnailHeight}"
      @loadedmetadata="updateGenerationParameters"
      @seeked="thumbnailGeneration" />
  </div>
</template>

<script>
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
import { THUMBNAIL_DB_NAME, THUMBNAIL_DB_VERSION } from '@/constants';
import idb from 'idb';
export default {
  name: 'thumbnail-video-player',
  components: {
    'base-video-player': BaseVideoPlayer,
  },
  props: {
    currentTime: {
      type: Number,
      default: 0,
      required: true,
      validator: value => typeof value === 'number' && value >= 0,
    },
    outerThumbnailInfo: {
      type: Object,
      required: true,
      default: () => ({
        videoSrc: 'file:///',
        videoDuration: 0,
        generationInterval: 3,
        screenWidth: 1920,
        maxThumbnailWidth: 240,
        videoRatio: 1.78,
      }),
    },
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    quickHash: String,
  },
  data() {
    return {
      isAutoGeneration: true,
      videoDuration: 0,
      videoSrc: null,
      thumbnailSet: new Set(),
      canvasContainer: null,
      autoGenerationIndex: -1,
      generationInterval: 3,
      autoGenerationTimer: 0,
      MAX_GENERATION_DELAY: 1000,
      maxThumbnailWidth: 240,
      maxThumbnailHeight: 135,
      maxThumbnailCount: 600,
      manualGenerationIndex: -1,
      tempBlobArray: [],
    };
  },
  watch: {
    outerThumbnailInfo: {
      deep: true,
      /* eslint-disable object-shorthand */
      handler: function outerThumbnailInfoHandler(newValue) {
        const newVideoSrc = newValue.videoSrc;
        if (this.videoSrcValidator(newVideoSrc)) {
          this.videoSrc = newVideoSrc;
        }
      },
    },
    currentTime(newValue) {
      const index = Math.floor(newValue / this.generationInterval);
      if (!this.thumbnailSet.has(index) && this.$options.props.currentTime.validator(newValue)) {
        this.isAutoGeneration = false;
        this.manualGenerationIndex = index;
        this.pauseAutoGeneration();
        this.videoSeek(index);
      }
    },
    autoGenerationIndex(newValue) {
      this.videoSeek(newValue);
    },
  },
  methods: {
    // Data validators
    videoSrcValidator(src) {
      const fileSrcRegexes = {
        http: RegExp('^(http|https)://'),
        file: RegExp('^file:///?'),
      };
      if (typeof src === 'string') {
        if (fileSrcRegexes.http.test(src)) {
          return 'http';
        }
        if (fileSrcRegexes.file.test(src)) {
          return 'file';
        }
      }
      throw new TypeError('invalid src value.');
    },
    // Data regenerators
    updateGenerationParameters() {
      this.videoDuration = this.videoElement.duration;
      this.generationInterval = Math.round(this.videoDuration / (this.screenWidth / 4));
      this.autoGenerationIndex = Math.floor(this.currentTime / this.generationInterval);
      this.maxThumbnailCount = Math.floor(this.videoDuration / this.generationInterval);
      console.log('[ThumbnailVideoPlayer|Info]:', this.videoDuration, this.maxThumbnailCount, this.generationInterval);
    },
    thumbnailGeneration() {
      const index = this.isAutoGeneration ? this.autoGenerationIndex : this.manualGenerationIndex;
      if (!this.thumbnailSet.has(index)) {
        const context = this.canvasContainer.getContext('2d');
        context.drawImage(
          this.videoElement,
          0, 0, this.maxThumbnailWidth, this.maxThumbnailHeight,
        );
        this.canvasContainer.toBlob((blobResult) => {
          this.thumbnailSet.add(index);
          console.log(this.isAutoGeneration, index, blobResult, this.quickHash);
          this.tempBlobArray.push({
            index,
            blobImage: blobResult,
          });
          if (this.tempBlobArray.length === 30) {
            this.tempBlobArray.forEach((blob) => {
              idb.open(THUMBNAIL_DB_NAME, THUMBNAIL_DB_VERSION).then((db) => {
                const storeName = `thumbnail-width-${this.maxThumbnailWidth}`;
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                store.add({
                  quickHash: this.quickHash,
                  index: blob.index,
                  blob: blob.blobImage,
                });
                return tx.complete;
              }).then(() => {
                console.log(`${30} blobs added.`);
              });
            });
            this.tempBlobArray = [];
          }
          if (this.isAutoGeneration && this.autoGenerationIndex < this.maxThumbnailCount) {
            this.autoGenerationIndex += 1;
          }
        }, 'image/webp', 0.1);
      }
    },
    videoSeek(index) {
      let internalIndex = index;
      if (this.videoElement && internalIndex <= this.maxThumbnailCount) {
        while (this.thumbnailSet.has(internalIndex)) {
          internalIndex += 1;
        }
        this.videoElement.currentTime = internalIndex * this.generationInterval;
        if (this.isAutoGeneration) {
          this.autoGenerationIndex = internalIndex;
        }
      }
    },
    pauseAutoGeneration() {
      if (this.autoGenerationTimer !== 0) {
        clearTimeout(this.autoGenerationTimer);
        this.autoGenerationTimer = setTimeout(this.resumeAutoGeneration, this.MAX_GENERATION_DELAY);
      } else {
        this.autoGenerationTimer = setTimeout(this.resumeAutoGeneration, this.MAX_GENERATION_DELAY);
      }
    },
    resumeAutoGeneration() {
      this.isAutoGeneration = true;
      this.videoSeek(this.autoGenerationIndex);
    },
  },
  created() {
    const { videoSrc } = this.outerThumbnailInfo;
    if (this.videoSrcValidator(videoSrc)) {
      if (this.currentTime !== 0) {
        this.videoSrc = videoSrc;
        this.videoDuration = this.outerThumbnailInfo.videoDuration;
        this.screenWidth = this.outerThumbnailInfo.screenWidth;
        this.generationInterval = this.outerThumbnailInfo.generationInterval;
        this.autoGenerationIndex = Math.floor(this.currentTime / this.generationInterval);
      } else {
        this.videoSrc = videoSrc;
        this.screenWidth = this.outerThumbnailInfo.screenWidth;
      }
    }

    if (this.outerThumbnailInfo.maxThumbnailWidth) {
      this.maxThumbnailWidth = this.outerThumbnailInfo.maxThumbnailWidth;
      if (this.outerThumbnailInfo.videoRatio) {
        this.maxThumbnailHeight =
          Math.round(this.maxThumbnailWidth / this.outerThumbnailInfo.videoRatio);
      } else {
        this.maxThumbnailHeight = Math.round(this.maxThumbnailWidth / 1.78);
      }
    }
    this.canvasContainer = document.createElement('canvas');
  },
  mounted() {
    this.videoElement = this.$refs.video.videoElement ?
      this.$refs.video.videoElement() : document.querySelector('.base-video-player');
  },
};
</script>
<style lang="scss" scoped>
</style>

