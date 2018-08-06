<template>
  <div class="thumbnail-video-player">
    <base-video-player
      ref="video"
      :src="videoSrc"
      :defaultEvents="['loadedmetadata', 'seeked']"
      @loadedmetadata="updateGenerationParameters"
      @seeked="thumbnaiGeneration" />
  </div>
</template>

<script>
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
import { setTimeout, clearTimeout } from 'timers';
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
    channelName: {
      type: String,
      required: true,
      default: 'thumbnail',
    },
    outerThumbnailInfo: {
      type: Object,
      required: true,
      default: () => ({
        videoSrc: 'file:///',
        videoDuration: 0,
        generationInterval: 3,
        screenWidth: 1920,
      }),
    },
  },
  data() {
    return {
      isAutoGeneration: true,
      videoDuration: 0,
      videoSrc: null,
      thumbnailSet: new Set(),
      thumbnailChannel: 'thumbnail',
      autoGenerationIndex: 0,
      generationInterval: 3,
      autoGenerationTimer: 0,
      MAX_GENERATION_DELAY: 1000,
    };
  },
  computed: {
    manualGenerationIndex() {
      if (!this.isAutoGeneration) {
        return Math.floor(this.currentTime / this.generationInterval);
      }
      return 0;
    },
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
        this.pauseAutoGeneration();
        this.videoSeek(index);
      }
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
      throw new Error('TypeError: invalid src value.');
    },
    // Data regenerators
    updateGenerationParameters() {
      this.videoDuration = 2000;
      this.generationInterval = Math.round(this.screenWidth / (this.videoDuration / 4));
      this.autoGenerationIndex = Math.floor(this.currentTime / this.generationInterval);
    },
    thumbnaiGeneration() {
      createImageBitmap(this.$refs.video.videoElement()).then((imageBitmap) => {
        this.thumbnailChannel.postMessage({
          type: 'thumbnail-generated',
          index: this.isAutoGeneration ? this.autoGenerationIndex : this.manualGenerationIndex,
          imageBitmap,
        }, [imageBitmap]);
      });
    },
    videoSeek(index) {
      const videoElement = this.$refs.video.videoElement();
      if (!videoElement) {
        return;
      }
      videoElement.currentTime = index * this.generationInterval;
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
    },
  },
  created() {
    const videoSrc = this.outerThumbnailInfo.videoSrc;
    if (this.currentTime !== 0) {
      if (this.videoSrcValidator(videoSrc)) {
        this.videoSrc = videoSrc;
        this.videoDuration = this.outerThumbnailInfo.videoDuration;
        this.screenWidth = this.outerThumbnailInfo.screenWidth;
        this.generationInterval = this.outerThumbnailInfo.generationInterval;
        this.autoGenerationIndex = Math.floor(this.currentTime / this.generationInterval);
      }
    } else {
      if (this.videoSrcValidator(videoSrc)) {
        this.videoSrc = videoSrc;
        this.screenWidth = this.outerThumbnailInfo.screenWidth;
      }
    }

    this.thumbnailChannel = new BroadcastChannel(this.channelName);
    this.thumbnailChannel.onmessage = (event) => {
      const { type } = event.data;
      if (!type) {
        return;
      }
      switch (type) {
        default: {
          break;
        }
        case 'thumbnail-stored': {
          this.thumbnailSet.add(event.data.thumbnailIndex);
          while (this.thumbnailSet.has(this.autoGenerationIndex)) {
            this.autoGenerationIndex += 1;
          }
          this.videoSeek(this.autoGenerationIndex);
          break;
        }
        case 'generation-finished': {
          this.thumbnailChannel.close();
          break;
        }
      }
    };
  },
};
</script>
