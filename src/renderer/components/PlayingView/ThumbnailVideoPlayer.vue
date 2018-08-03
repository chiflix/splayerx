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
      screenWidth: 1920,
      thumbnailSet: new Set(),
      thumbnailChannel: 'thumbnail',
      autoGenerationIndex: 0,
    };
  },
  computed: {
    manualGenerationIndex() {
      if (!this.isAutoGeneration) {
        return Math.floor(this.currentTime / this.generationInterval);
      }
      return null;
    },
  },
  watch: {
    outerThumbnailInfo: {
      deep: true,
      handler: (newValue) => {
        const newVideoSrc = newValue.videoSrc;
        if (this.videoSrcValidator(newVideoSrc)) {
          this.videoSrc = newVideoSrc;
        } else {
          throw(new Error('TypeError: invalid video source'));
        }
      },
    },
    currentTime(newValue) {
      const index  = Math.floor(newValue / this.generationInterval);
      if (!this.thumbnailSet.has(index)) {
        this.isAutoGeneration = false;
        this.videoSeek(index);
      }
    },
  },
  methods: {
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
      return null;
    },
    updateGenerationParameters() {
      this.videoDuration = this.$refs.video.duration();
      this.screenWidth = this.$store.getters.screenWidth;
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
  },
  created() {
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
      }
    };
  },
};
</script>
