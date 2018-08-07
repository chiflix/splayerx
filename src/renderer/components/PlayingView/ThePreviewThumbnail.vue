<template>
  <div class="the-preview-thumbnail"
    :style="{width: thumbnailWidth +'px', height: thumbnailHeight + 'px', left: positionOfThumbnail + 'px'}">
    <thumbnail-video-player
      :currentTime="currentTime"
      :thumbnailWidth="thumbnailWidth"
      :thumbnailHeight="thumbnailHeight"
      :outerThumbnailInfo="outerThumbnailInfo"/>
  </div>
</template>

<script>
import ThumbnailVideoPlayer from './ThumbnailVideoPlayer';
export default {
  components: {
    'thumbnail-video-player': ThumbnailVideoPlayer,
  },
  props: {
    src: String,
    currentTime: Number,
    maxThumbnailWidth: Number,
    videoRatio: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    positionOfThumbnail: Number,
  },
  data() {
    return {
      outerThumbnailInfo: {
        videoSrc: this.src,
        videoDuration: -1,
        generationInterval: -1,
        screenWidth: 1920,
        maxThumbnailWidth: 240,
        videoRatio: this.videoRatio,
      },
    };
  },
};
</script>
<style lang="scss" scoped>
.the-preview-thumbnail {
  position: absolute;
  bottom: 20px;
  -webkit-app-region: no-drag;
  border: 2px solid;
  border-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5), rgba(84, 84, 84, 0.5)) 10;
  box-sizing: content-box;
  background-color: #000;
}
</style>
