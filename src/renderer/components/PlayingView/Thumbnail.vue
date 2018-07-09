<template>
  <div class="screenshot-background"
    :style="{ left: positionOfScreenshot +'px' }">
    <div class="screenshot">
      <video ref="thumbnailVideoCanvas"
        @loadedmetadata="onMetaLoaded"
        :width=widthOfThumbnail
        :height=heightofScreenshot
        :src="src">
      </video>
      <div class="time">
        {{ screenshotContent }}
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
    heightofScreenshot: Number,
    screenshotContent: null,
    currentTime: Number,
  },
  watch: {
    currentTime(newValue) {
      this.$refs.thumbnailVideoCanvas.currentTime = newValue;
    },
  },
  methods: {
    onMetaLoaded() {
      this.$refs.thumbnailVideoCanvas.pause();
    },
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
  }
}

.screenshot-background {
  position: absolute;
  bottom: 26px;
  // box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 5px;
  background-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5) 0%, rgba(84, 84, 84, 0.5) 100%);
  border-radius: 1px;
  z-index: 100;
  -webkit-app-region: no-drag;
}
</style>
