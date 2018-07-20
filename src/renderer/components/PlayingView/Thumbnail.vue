<template>
  <div class="screenshot-wrapper"
    :style="{width: widthOfThumbnail + 32 + 'px', left: positionOfScreenshot - 16 + 'px'}">
    <div class="screenshot-background"
      :style="{width: widthOfThumbnail + 2 + 'px'}">
      <div class="screenshot">
        <canvas
          ref="thumbnailCanvas"
          :width=widthOfThumbnail
          :height=heightofThumbnail
          v-if="videoStatus"
          v-show=false>
        </canvas>
        <video 
          preload="metadata"
          ref="thumbnailVideo"
          id="thumbnailVideo"
          @loadedmetadata="onMetaLoaded"
          :width=widthOfThumbnail
          :height=heightofThumbnail
          :src="this.$store.state.PlaybackState.SrcOfVideo"
          v-if="videoStatus"
          v-show=false>
        </video>
        <img
          :width=widthOfThumbnail
          :height=heightofThumbnail
          :src="imageURL" />
        <div class="time">
          {{ screenshotContent }}
        </div>
      </div>
    </div>
  </div>
</template>;

<script>
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
    heightofThumbnail: Number,
    screenshotContent: null,
    currentTime: Number,
  },
  data() {
    return {
      videoStatus: true,
      thumbnailCanvas: null,
      thumbnailVideo: null,
      videoInfo: {
        duration: 0,
        currentTime: 0,
        currentIndex: 0,
        thumbnailCount: 0,
        thumbnailPace: 15,
        thumbnailQuality: 0.5,
      },
      imageMap: new Map(),
      imageURL: null,
    };
  },
  watch: {
    currentTime(newValue) {
      const currentIndex = parseInt(newValue / this.videoInfo.thumbnailPace, 10);
      // const currentTime = currentIndex * this.videoInfo.thumbnailPace;
      if (this.imageMap.get(currentIndex)) {
        this.imageURL = this.imageMap.get(currentIndex);
        console.log(`Horay! Number ${currentIndex} found!`);
      }
    },
  },
  methods: {
    onMetaLoaded() {
      this.$refs.thumbnailVideo.pause();
      this.$refs.thumbnailVideo.currentTime = this.videoInfo.currentTime = 0;
      this.videoInfoInit();
      this.thumbnailCanvasInit();
    },
    thumbnailCanvasInit() {
      this.thumbnailCanvas = this.$refs.thumbnailCanvas;
      this.thumbnailVideo = this.$refs.thumbnailVideo || document.querySelector('#thumbnailVideo');
      this.imageMap = new Map();
    },
    videoInfoInit() {
      this.videoInfo.duration = parseInt(this.$refs.thumbnailVideo.duration, 10);
      this.videoInfo.thumbnailCount =
      parseInt(this.videoInfo.duration / this.videoInfo.thumbnailPace, 10);
      this.videoInfo.currentIndex = 0;
    },
    getCurrentThumbnail(event) {
      const actualTime = event.target.currentTime;
      const destTime = this.videoInfo.currentTime;
      const { currentIndex } = this.videoInfo;
      const { videoWidth, videoHeight } = document.querySelector('video');
      if (actualTime === destTime) {
        this.thumbnailCanvas.getContext('2d').drawImage(
          this.thumbnailVideo,
          0, 0, videoWidth, videoHeight,
          0, 0, this.widthOfThumbnail, this.heightofThumbnail,
        );
        this.imageMap.set(currentIndex, this.thumbnailCanvas.toDataURL('image/webp', this.videoInfo.thumbnailQuality));
        // console.log('Array Image:', currentIndex, 'Saved');
      }
      if (this.videoInfo.currentIndex === 0) {
        console.log(`[Thumbnail]: Generation started at ${Date.now()}.`);
      }
      if (this.imageMap.get(currentIndex)
        && this.videoInfo.currentIndex < this.videoInfo.thumbnailCount) {
        this.videoInfo.currentIndex += 1;
        this.thumbnailVideo.currentTime
        = this.videoInfo.currentTime
        = this.videoInfo.currentIndex * this.videoInfo.thumbnailPace;
      }
      if (this.videoInfo.currentIndex === this.videoInfo.thumbnailCount) {
        this.$bus.$emit('thumbnail-load-finished');
        console.log(`[Thumbnail]: Generation finished at ${Date.now()}.`);
        console.log(`[Thumbnail]: A total of ${this.videoInfo.thumbnailCount} webp thumbnails of quality ${this.videoInfo.thumbnailQuality} generated.`);
        console.log('[Thumbnail]:', this.videoInfo);
      }
      // console.log(`Video seeked at ${destTime} successfully!`);
    },
  },
  mounted() {
    this.thumbnailCanvasInit();
    this.thumbnailVideo.addEventListener('seeked', this.getCurrentThumbnail);
    this.$bus.$on('thumbnail-load-finished', () => {
      this.videoStatus = false;
      this.thumbnailVideo.removeEventListener('seeked', this.getCurrentThumbnail);
      console.log(this.imageMap);
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
