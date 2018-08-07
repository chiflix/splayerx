<template>
  <div class="thumbnail-video-player"
    :style="{ width: thumbnailWidth, height: thumbnailHeight }">
    <base-video-player
      ref="video"
      :src="videoSrc"
      :defaultEvents="['loadedmetadata', 'seeked']"
      :customOptions="{ pauseOnStart: true }"
      @loadedmetadata="updateGenerationParameters"
      @seeked="thumbnailGeneration" />
  </div>
</template>

<script>
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
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
    };
  },
  watch: {
    outerThumbnailInfo: {
      deep: true,
      handler: (newValue) => {
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
      console.log('[ThumbnailVideoPlayer|AutoGeneration]:', newValue, this.videoElement.currentTime);
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
      this.generationInterval = Math.round(this.screenWidth / (this.videoDuration / 4));
      this.autoGenerationIndex = Math.floor(this.currentTime / this.generationInterval);
      this.maxThumbnailCount = Math.floor(this.videoDuration / this.generationInterval);
    },
    thumbnailGeneration() {
      const context = this.canvasContainer.getContext('2d');
      context.drawImage(
        this.videoElement,
        0, 0, this.maxThumbnailWidth, this.maxThumbnailHeight,
      );
      this.canvasContainer.toBlob((blobResult) => {
        console.log(
          blobResult,
          this.isAutoGeneration ? this.autoGenerationIndex : this.manualGenerationIndex,
        );
        this.thumbnailSet.add(this.autoGenerationIndex);
        if (this.isAutoGeneration && this.autoGenerationIndex < this.maxThumbnailCount) {
          this.autoGenerationIndex += 1;
        }
      }, 'image/webp', 0.1);
    },
    videoSeek(index) {
      if (this.videoElement && index <= this.maxThumbnailCount && !this.thumbnailSet.has(index)) {
        this.videoElement.currentTime = index * this.generationInterval;
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
      this.videoSeek(this.autoGenerationIndex * this.generationInterval);
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
.thumbnail-video-player {
  bottom: 20px;
}
</style>

