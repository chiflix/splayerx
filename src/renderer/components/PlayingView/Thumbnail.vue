<template>
  <div class="screenshot-wrapper"
    :style="{width: widthOfThumbnail + 32 + 'px', left: positionOfScreenshot - 16 + 'px'}">
    <div class="screenshot-background"
      :style="{width: widthOfThumbnail + 2 + 'px'}">
      <div class="screenshot">
        <canvas
          ref="thumbnailCanvas"
          :width=widthOfThumbnail
          :height=heightOfThumbnail
          v-if="videoCanvasShow"
          v-show=false>
        </canvas>
        <video
          preload="metadata"
          ref="thumbnailVideo"
          id="thumbnailVideo"
          @loadedmetadata="onMetaLoaded"
          :width=widthOfThumbnail
          :height=heightOfThumbnail
          :src="this.$store.state.PlaybackState.SrcOfVideo"
          v-if="videoCanvasShow"
          v-show="!this.autoGeneration">
        </video>
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
export default {
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
    },
    positionOfScreenshot: Number,
    widthOfThumbnail: Number,
    heightOfThumbnail: Number,
    screenshotContent: null,
    currentTime: Number,
    maxThumbnailWidth: Number,
    maxThumbnailHeight: Number,
  },
  data() {
    return {
      videoCanvasShow: true, // whether or not delete canvas and video element
      autoGeneration: false, // whether current generation is auto-generation
      autoGenerationDelay: 0, // setTimeout for manual generation
      videoInfo: {
        duration: null, // duration of the video loaded
        currentTime: 0, // video time of current auto-generation process
        currentIndex: 0, // index of current auto-generated thumbnail
        lastIndex: 0,
      },
      thumbnailInfo: {
        canvas: null, // reference of thumbnail canvas element
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
      IMAGE_QUALITY: 0.5, // the quality of thumbnail images (only webp or jpeg type)
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
  },
  methods: {
    // function called when video loaded
    onMetaLoaded() {
      this.$refs.thumbnailVideo.pause();
      this.videoInfoInit();
      this.calculateGenerationInterval();
      this.thumbnailInfoInit();
      this.thumbnailWorkerInit();
      this.autoGeneration = true;
    },
    // calculate the interval for auto-generation
    calculateGenerationInterval() {
      if (!this.videoInfo.duration) {
        this.thumbnailInfo.generationInterval = 3;
        this.thumbnailInfo.count = this.MAX_THUMBNAIL_COUNT;
      } else if (this.videoInfo.duration < this.MAX_THUMBNAIL_COUNT) {
        this.thumbnailInfo.generationInterval = 1;
        this.thumbnailInfo.count = parseInt(this.videoInfo.duration, 10);
      } else {
        this.thumbnailInfo.generationInterval
        = parseInt(this.videoInfo.duration / this.MAX_THUMBNAIL_COUNT, 10);
        this.thumbnailInfo.count = this.MAX_THUMBNAIL_COUNT;
      }
    },
    // initialize thumbnail info
    thumbnailInfoInit() {
      this.thumbnailInfo.canvas = this.$refs.thumbnailCanvas;
      this.thumbnailInfo.video = this.$refs.thumbnailVideo || document.querySelector('#thumbnailVideo');
      this.thumbnailInfo.video.currentTime = 0;
      this.thumbnailInfo.video.addEventListener('seeked', this.thumbnailGeneration);
      this.thumbnailInfo.finished = false;
      this.imageMap = new Map();
      this.$bus.$on('thumbnail-generation-paused', this.pauseAutoGeneration);
    },
    // Initialize video info
    videoInfoInit() {
      this.videoInfo.duration = parseInt(this.$refs.thumbnailVideo.duration, 10);
      this.thumbnailInfo.count =
      parseInt(this.videoInfo.duration / this.thumbnailInfo.generationInterval, 10);
      this.videoInfo.currentIndex = 0;
    },
    // Initialize thumbnail worker
    thumbnailWorkerInit() {
      const offscreenImageCanvas = this.$refs.bitmapCanvas.transferControlToOffscreen();
      this.thumbnailWorker.postMessage({
        type: 'generation-start',
        thumbnailSize: [
          this.maxThumbnailWidth,
          this.maxThumbnailHeight,
        ],
        bitmapCanvas: offscreenImageCanvas,
      }, [offscreenImageCanvas]);
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
      this.setImage(this.thumbnailInfo.video.currentTime);
      this.autoGeneration = true;
      console.log('[Thumbnail]: Thumbnail generation resumed!');
      console.log(`[Thumbnail]: Current index is ${this.videoInfo.currentIndex}.`);
      console.log(`[Thumbnail]: Set current time to ${this.videoInfo.currentTime}.`);
      this.thumbnailInfo.video.currentTime
      = this.videoInfo.currentIndex * this.thumbnailInfo.generationInterval;
      console.log(`[Thumbnail]: Actual video current time is ${this.thumbnailInfo.video.currentTime}.`);
    },
    // Manage thumbnail generation
    thumbnailGeneration(event) {
      const actualTime = event.target.currentTime;
      const autoGenerationIndex = this.videoInfo.currentIndex;
      const pace = this.thumbnailInfo.generationInterval;
      let destTime = null;
      let currentIndex = null;
      const { manualGenerationIndex } = this;
      // const { videoWidth, videoHeight } = document.querySelector('video');
      if (this.autoGeneration) {
        destTime = autoGenerationIndex * pace;
        currentIndex = autoGenerationIndex;
        console.log(`[Thumbnail]: Switched to auto generated index ${autoGenerationIndex}.`);
      } else {
        destTime = manualGenerationIndex * pace;
        currentIndex = manualGenerationIndex;
        console.log(`[Thumbnail]: Switched to manual generated index ${manualGenerationIndex}.`);
      }
      if (destTime !== null && currentIndex !== null) {
        if (actualTime === destTime && !this.imageMap.get(currentIndex)) {
          console.time('create Image');
          createImageBitmap(this.thumbnailInfo.video).then((result) => {
            console.timeEnd('create Image');
            console.time('image send');
            this.thumbnailWorker.postMessage({
              type: 'thumbnail-generated',
              thumbnailImageBitmap: result,
              index: currentIndex,
              originSize: [result.width, result.height],
            }, [result]);
            console.timeEnd('image send');
          });
        }
        if (this.videoInfo.currentIndex === 0) {
          console.log(`[Thumbnail]: Generation started at ${Date.now()}.`);
        }
        if (this.videoInfo.currentIndex === this.thumbnailInfo.count) {
          this.$bus.$emit('thumbnail-generation-finished');
          console.log(`[Thumbnail]: Generation finished at ${Date.now()}.`);
          console.log(`[Thumbnail]: A total of ${this.thumbnailInfo.count} webp thumbnails of quality ${this.IMAGE_QUALITY} generated.`);
          console.log('[Thumbnail]:', this.videoInfo, this.imageMap);
          this.thumbnailInfo.video.removeEventListener('seeked', this.thumbnailGeneration);
          this.thumbnailWorker.removeEventListener('message', this.setImageOrNot);
        }
      }
    },
    // set image
    setImage(newValue) {
      let currentIndex = parseInt(newValue / this.thumbnailInfo.generationInterval, 10);
      const currentTime = currentIndex * this.thumbnailInfo.generationInterval;
      if (currentIndex !== this.videoInfo.lastIndex || currentIndex === 0) {
        if (this.imageMap.get(currentIndex)) {
          console.log(`Image ${currentIndex} set!`);
          console.time('image request');
          this.thumbnailWorker.postMessage({
            type: 'thumbnail-request',
            index: currentIndex,
            size: [this.widthOfThumbnail, this.heightOfThumbnail],
          });
          console.timeEnd('image request');
        } else if (!this.thumbnailInfo.finished) {
          this.autoGeneration = false;
          this.$bus.$emit('thumbnail-generation-paused');
          this.thumbnailInfo.video.currentTime = currentTime;
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
          this.thumbnailInfo.video.currentTime
          = this.videoInfo.currentTime
           = this.videoInfo.currentIndex * this.thumbnailInfo.generationInterval;
        }
        console.log(`[Thumbnail]: No.${currentIndex} image generated!`);
      }
    },
  },
  created() {
    this.$bus.$on('thumbnail-generation-finished', () => {
      this.videoCanvasShow = false;
      this.$bus.$off('thumbnail-generation-paused', this.pauseAutoGeneration);
      this.thumbnailInfo.finished = true;
    });
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
