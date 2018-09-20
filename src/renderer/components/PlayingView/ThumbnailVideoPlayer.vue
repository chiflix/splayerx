<template>
  <div
    :data-component-name="$options.name"
    class="thumbnail-video-player">
    <base-video-player
      v-show="useFallback"
      ref="video"
      :src="videoSrc"
      :defaultEvents="['loadedmetadata', 'seeked']"
      :customOptions="{ pauseOnStart: true }"
      @loadedmetadata="updateGenerationParameters"
      @seeked="thumbnailGeneration"
      style="opacity: 0.99" />
    <base-image-display
      v-if="!useFallback"
      :imgSrc="tempImage"
      :width="thumbnailWidth"
      :height="thumbnailHeight"
      style="opacity: 0.99" />
  </div>
</template>

<script>
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
import BaseImageDisplay from '@/components/PlayingView/BaseImageDisplay';
import { THUMBNAIL_DB_NAME } from '@/constants';
import idb from 'idb';
export default {
  name: 'thumbnail-video-player',
  components: {
    'base-video-player': BaseVideoPlayer,
    'base-image-display': BaseImageDisplay,
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
      lastGenerationIndex: 0,
      tempImage: null,
      useFallback: false,
    };
  },
  watch: {
    outerThumbnailInfo(newValue) {
      this.updateVideoInfo(newValue);
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
    thumbnailHeight(newValue) {
      if (this.videoElement) {
        this.videoElement.style.height = `${newValue}px`;
      }
    },
  },
  methods: {
    // Data validators
    videoSrcValidator(src) {
      let result = '';
      const fileSrcRegexes = {
        http: RegExp('^(http|https)://'),
        notWindowsFile: RegExp('^file://'),
        windowsFile: RegExp(/^[a-zA-Z]:\/(((?![<>:"//|?*]).)+((?<![ .])\/)?)*$/),
      };
      if (typeof src === 'string') {
        Object.keys(fileSrcRegexes).forEach((filetype) => {
          if (fileSrcRegexes[filetype].test(src)) result = filetype;
        });
      }
      return result;
    },
    // Data regenerators
    updateGenerationParameters() {
      this.videoDuration = this.$refs.video.duration();
      this.generationInterval = Math.round(this.videoDuration / (this.screenWidth / 4)) || 1;
      this.maxThumbnailCount = Math.floor(this.videoDuration / this.generationInterval);
      this.$emit('update-thumbnail-info', {
        index: this.autoGenerationIndex,
        interval: this.generationInterval,
        count: this.maxThumbnailCount,
      });
      this.videoSeek(this.autoGenerationIndex);
    },
    thumbnailGeneration() {
      const index = this.isAutoGeneration ? this.autoGenerationIndex : this.manualGenerationIndex;
      if (!this.thumbnailSet.has(index)) {
        const context = this.canvasContainer.getContext('2d');
        context.drawImage(
          this.videoElement,
          0, 0, this.maxThumbnailWidth, this.maxThumbnailHeight,
        );
        createImageBitmap(this.canvasContainer).then((imageBitmap) => {
          if (!this.isAutoGeneration) {
            this.tempImage = imageBitmap;
          } else {
            this.thumbnailSet.add(index);
            this.tempBlobArray.push({
              index,
              imageBitmap,
            });
          }
          if (
            (this.isAutoGeneration && index >= this.maxThumbnailCount) ||
            this.tempBlobArray.length === 30) {
            const array = this.tempBlobArray;
            this.thumbnailArrayHandler(array).then(() => {
              this.$emit('update-thumbnail-info', {
                index: this.autoGenerationIndex,
                interval: this.generationInterval,
                count: this.maxThumbnailCount,
              });
            });
            this.tempBlobArray = [];
          }
          if (this.isAutoGeneration && this.autoGenerationIndex < this.maxThumbnailCount) {
            this.autoGenerationIndex += 1;
          }
        });
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
      this.useFallback = true;
      if (this.autoGenerationTimer !== 0) {
        clearTimeout(this.autoGenerationTimer);
        this.autoGenerationTimer = setTimeout(this.resumeAutoGeneration, this.MAX_GENERATION_DELAY);
      } else {
        this.autoGenerationTimer = setTimeout(this.resumeAutoGeneration, this.MAX_GENERATION_DELAY);
      }
    },
    resumeAutoGeneration() {
      this.useFallback = false;
      this.isAutoGeneration = true;
      this.videoSeek(this.autoGenerationIndex);
    },
    thumbnailArrayHandler(array) {
      const promiseArray = [];
      idb.open(THUMBNAIL_DB_NAME).then((db) => {
        const name = `thumbnail-width-${this.maxThumbnailWidth}`;
        const tx = db.transaction(name, 'readwrite');
        const store = tx.objectStore(name);
        array.forEach((thumbnail) => {
          promiseArray.push(store.put({
            id: `${thumbnail.index}-${this.quickHash}`,
            imageBitmap: thumbnail.imageBitmap,
            quickHash: this.quickHash,
            index: thumbnail.index,
          }));
        });
      });
      return Promise.all(promiseArray);
    },
    updateVideoInfo(outerThumbnailInfo) {
      const { videoSrc } = outerThumbnailInfo;
      if (this.videoSrcValidator(videoSrc)) {
        this.videoSrc = videoSrc;
        if (!outerThumbnailInfo.newVideo) {
          this.screenWidth = outerThumbnailInfo.screenWidth;
          this.generationInterval = outerThumbnailInfo.generationInterval <= 0 ?
            this.generationInterval : outerThumbnailInfo.generationInterval;
          this.autoGenerationIndex = outerThumbnailInfo.lastGenerationIndex || 0;
        } else {
          this.screenWidth = outerThumbnailInfo.screenWidth;
          this.autoGenerationIndex = 0;
        }
      }
    },
  },
  created() {
    this.updateVideoInfo(this.outerThumbnailInfo);

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
    this.canvasContainer.width = this.maxThumbnailWidth;
    this.canvasContainer.height = this.maxThumbnailHeight;
  },
  mounted() {
    // Use document to pass unit test
    this.videoElement = this.$refs.video.videoElement ?
      this.$refs.video.videoElement() : document.querySelector('.base-video-player');
    if (this.videoElement) {
      this.videoElement.style.height = `${this.thumbnailHeight}px`;
    }
  },
};
</script>
