<template>
  <div class="screenshot-wrapper"
    :style="{width: widthOfThumbnail + 32 + 'px', left: positionOfScreenshot - 16 + 'px'}">
    <div class="screenshot-background"
      :style="{width: widthOfThumbnail + 2 + 'px'}">
      <div class="screenshot">
        <base-video-player
          :src=src
          :defaultEvents="['loadedmetadata', 'seeked']"
          :customOptions="{ pauseOnStart: true }"
          @loadedmetadata="onMetaLoaded"
          @seeked="thumbnailGeneration"
          ref="thumbnailVideo"
          v-if="videoCanvasShow"
          v-show="!this.autoGeneration" />
        <canvas
          v-show="this.autoGeneration"
          ref="bitmapCanvas"
          :width=widthOfThumbnail
          :height=heightOfThumbnail>
        </canvas>
        <div class="time">
          {{ screenshotContent }}
        </div>
      </div>
    </div>
  </div>
</template>;

<script>
import ThumbnailWorker from '../../worker/thumbnail.worker';
import BaseVideoPlayer from './BaseVideoPlayer';
export default {
  components: {
    BaseVideoPlayer,
  },
  props: {
    src: {
      type: String,
      required: true,
      validator(value) {
        // TODO: check if its a file or url
        if (value.length <= 0) {
          return false;
        }
        return true;
      },
      default: '',
    },
    screenshotContent: {
      type: String,
      default: '00:00',
    },
    positionOfScreenshot: {
      type: Number,
      default: 16,
    },
    widthOfThumbnail: {
      type: Number,
      default: 170,
    },
    heightOfThumbnail: {
      type: Number,
      default: 95,
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    maxThumbnailWidth: {
      type: Number,
      default: 240,
    },
    maxThumbnailHeight: {
      type: Number,
      default: 136,
    },
  },
  data() {
    return {
      videoCanvasShow: true, // whether or not delete canvas and video element
      autoGeneration: false, // whether current generation is auto-generation
      autoGenerationDelay: 0, // setTimeout for manual generation
      videoInfo: {
        duration: 0, // duration of the video loaded
        currentTime: 0, // video time of current auto-generation process
        currentIndex: 0, // index of current auto-generated thumbnail
        lastIndex: 0,
      },
      thumbnailInfo: {
        video: null, // reference of thumbnail video element
        count: 0, // final total number of thumbnail generated
        generationInterval: 0,
        // auto calculated generation interval by max-count and video-duration
        finished: false, // whether or not thumbnail load finished
      },
      imageMap: new Map(), // the set for base64 encoded thumbnails
      manualGenerationIndex: 0, // isolated thumbnail index variable for manual generation
      // constants
      MAX_THUMBNAIL_COUNT: 100, // max number of thumbnail generated
      // Web Worker
      thumbnailWorker: new ThumbnailWorker(),
    };
  },
  watch: {
    currentTime(newValue) {
      this.setImage(newValue);
    },
    src() {
      this.videoCanvasShow = true;
    },
    widthOfThumbnail() {
      this.thumbnailWorker.postMessage({
        type: 'thumbnail-change',
        size: [this.widthOfThumbnail, this.heightOfThumbnail],
      });
    },
  },
  methods: {
    // function called when video loaded
    onMetaLoaded() {
      this.videoInfoInit();
      this.thumbnailInfoInit();
      this.thumbnailWorkerInit();
    },
    // Initialize video info
    videoInfoInit() {
      this.videoInfo.duration = Math.floor(this.$refs.thumbnailVideo.duration());
      this.videoInfo.currentIndex = 0;
    },
    // calculate the interval for auto-generation
    calculateGenerationInterval(duration) {
      let generationInterval = 0;
      let count = 0;
      if (!duration) {
        generationInterval = 3;
        count = this.MAX_THUMBNAIL_COUNT;
      } else if (duration < this.MAX_THUMBNAIL_COUNT) {
        generationInterval = 1;
        count = Math.floor(duration);
      } else {
        generationInterval = 3;
        count = Math.round(duration / generationInterval);
      }
      return {
        generationInterval,
        count,
      };
    },
    // initialize thumbnail info
    thumbnailInfoInit() {
      const interval = this.calculateGenerationInterval(this.videoInfo.duration);
      this.thumbnailInfo.generationInterval = interval.generationInterval;
      this.thumbnailInfo.count = interval.count;
      this.thumbnailInfo.video = this.$refs.thumbnailVideo.videoElement();
      this.$refs.thumbnailVideo.pause();
      this.autoGeneration = true;
      this.thumbnailInfo.finished = false;
      this.imageMap = new Map();
      this.$on('thumbnail-generation-paused', this.pauseAutoGeneration);
    },
    // Initialize thumbnail worker
    thumbnailWorkerInit() {
      this.thumbnailWorker.postMessage({
        type: 'generation-start',
        maxThumbnailSize: [
          this.maxThumbnailWidth,
          this.maxThumbnailHeight,
        ],
      });
      this.thumbnailWorker.addEventListener('message', this.setImageOrNot);
    },
    // Function to pause thumbnail auto generation
    pauseAutoGeneration() {
      if (this.autoGenerationDelay !== 0) {
        clearTimeout(this.autoGenerationDelay);
        this.autoGenerationDelay = setTimeout(this.resumeAutoGeneration, 1000);
      } else {
        this.autoGenerationDelay = setTimeout(this.resumeAutoGeneration, 1000);
      }
    },
    // Function to resume thumbnail auto generation
    resumeAutoGeneration() {
      this.setImage(this.$refs.thumbnailVideo.currentTime());
      this.autoGeneration = true;
      console.log('[Thumbnail]: Thumbnail generation resumed!');
      console.log(`[Thumbnail]: Current index is ${this.videoInfo.currentIndex}.`);
      console.log(`[Thumbnail]: Set current time to ${this.videoInfo.currentTime}.`);
      this.$refs.thumbnailVideo
        .currentTime(this.videoInfo.currentIndex * this.thumbnailInfo.generationInterval);
      console.log(`[Thumbnail]: Actual video current time is ${this.$refs.thumbnailVideo.currentTime()}.`);
    },
    // Manage thumbnail generation
    thumbnailGeneration() {
      const actualTime = this.$refs.thumbnailVideo.currentTime();
      const autoGenerationIndex = this.videoInfo.currentIndex;
      const pace = this.thumbnailInfo.generationInterval;
      let destTime = null;
      let currentIndex = null;
      const { manualGenerationIndex } = this;
      if (this.autoGeneration) {
        destTime = autoGenerationIndex * pace;
        currentIndex = autoGenerationIndex;
        console.log(`[Thumbnail]: Switched to auto generated index ${autoGenerationIndex}.`);
      } else {
        destTime = manualGenerationIndex * pace;
        currentIndex = manualGenerationIndex;
        console.log(`[Thumbnail]: Switched to manual generated index ${manualGenerationIndex}.`);
      }
      if (destTime !== null && currentIndex !== null && actualTime === destTime) {
        if (!this.imageMap.get(currentIndex)) {
          setTimeout(() => {
            console.time('create Image');
            createImageBitmap(this.$refs.thumbnailVideo.videoElement()).then((result) => {
              console.timeEnd('create Image');
              console.time('image send');
              this.thumbnailWorker.postMessage({
                type: 'thumbnail-generated',
                thumbnailImageBitmap: result,
                index: currentIndex,
              }, [result]);
              console.timeEnd('image send');
            });
          }, 300);
        } else if (this.autoGeneration) {
          this.videoInfo.currentIndex += 1;
          this.videoInfo.currentTime
           = this.videoInfo.currentIndex * this.thumbnailInfo.generationInterval;
          this.$refs.thumbnailVideo.currentTime(this.videoInfo.currentTime);
        }
        if (this.videoInfo.currentIndex === 0) {
          console.log(`[Thumbnail]: Generation started at ${Date.now()}.`);
        }
        if (this.videoInfo.currentIndex === this.thumbnailInfo.count) {
          this.$emit('thumbnail-generation-finished');
          console.log(`[Thumbnail]: Generation finished at ${Date.now()}.`);
          console.log(`[Thumbnail]: A total of ${this.thumbnailInfo.count} webp thumbnails generated.`);
          console.log('[Thumbnail]:', this.videoInfo, this.imageMap);
          this.thumbnailWorker.removeEventListener('message', this.setImageOrNot);
        }
      }
    },
    // set image
    setImage(newValue) {
      let currentIndex = Math.floor(newValue / this.thumbnailInfo.generationInterval);
      const currentTime = currentIndex * this.thumbnailInfo.generationInterval;
      if (currentIndex !== this.videoInfo.lastIndex || currentIndex === 0 || !this.autoGeneration) {
        if (this.imageMap.get(currentIndex)) {
          this.thumbnailWorker.postMessage({
            type: 'thumbnail-request',
            index: currentIndex,
          });
        } else if (!this.thumbnailInfo.finished) {
          this.autoGeneration = false;
          this.$emit('thumbnail-generation-paused');
          this.$refs.thumbnailVideo.currentTime(currentTime);
          this.manualGenerationIndex = currentIndex;
        } else if (currentIndex >= this.imageMap.length) {
          currentIndex = this.imageMap.length - 1;
        }
        this.videoInfo.lastIndex = currentIndex;
      }
    },
    setImageOrNot(event) {
      if (event.data.type === 'thumbnail-set') {
        const currentIndex = event.data.index;
        this.imageMap.set(currentIndex, true);
        if (this.imageMap.get(currentIndex)
          && this.videoInfo.currentIndex < this.thumbnailInfo.count
          && this.autoGeneration) {
          this.videoInfo.currentIndex += 1;
          this.videoInfo.currentTime
           = this.videoInfo.currentIndex * this.thumbnailInfo.generationInterval;
          this.$refs.thumbnailVideo.currentTime(this.videoInfo.currentTime);
        }
        console.log(`[Thumbnail]: No.${currentIndex} image generated!`);
      }
    },
  },
  mounted() {
    console.log('[Thumbnail|Refs]:', this.$refs);
    this.$on('thumbnail-generation-finished', () => {
      this.thumbnailInfo.finished = true;
      this.videoCanvasShow = false;
      this.$off('thumbnail-generation-paused', this.pauseAutoGeneration);
    });
    const offscreenImageCanvas = this.$refs.bitmapCanvas.transferControlToOffscreen();
    this.thumbnailWorker.postMessage({
      type: 'offscreencanvas-init',
      bitmapCanvas: offscreenImageCanvas,
      actualSize: [
        this.widthOfThumbnail,
        this.heightOfThumbnail,
      ],
    }, [offscreenImageCanvas]);
  },
};
</script>

<style lang="scss" scoped>
.screenshot {
  position: relative;
  border: 1px solid transparent;
  border-radius: 1px;
  background-clip: padding-box;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;

  .time {
    color: rgba(255, 255, 255, 0.7);
    font-size: 24px;
    letter-spacing: 0.2px;
    position: absolute;
    width: 100%;
    text-align: center;
    align-items: center;
  }
}

.screenshot-background {
  // box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 5px;
  margin-left: 15px;
  margin-right: 15px;
  background-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5) 0%, rgba(84, 84, 84, 0.5) 100%);
  z-index: 100;
  border-radius: 1px;
}

.screenshot-wrapper {
  position: absolute;
  bottom: 20px;
  -webkit-app-region: no-drag;
}
</style>
