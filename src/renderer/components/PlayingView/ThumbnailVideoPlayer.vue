<template>
  <div class="thumbnail-video-player">
    <base-video-player
      :src=src
      :defaultEvents="['loadedmetadata', 'seeked']"
      :customOptions="{ pauseOnStart: true }"
      @loadedmetadata="onMetaLoaded"
      @seeked="thumbnailGeneration"
      ref="video" />
  </div>
</template>

<script>
import BaseVideoPlayer from './BaseVideoPlayer';
export default {
  name:'thumbnail-video-player',
  components: {
    BaseVideoPlayer,
  },
  props: {
    src: String,
  },
  data() {
    return {
      videoElement: null,
      count: 0,
      generationInterval: 0,
      generationFinished: false,
    }
  },
  methods: {
    onMetaLoaded() {
      const videoInfo = {
        duration: this.$refs.video.duration(),
      }
      this.$emit('video-info', videoInfo);
    },
    thumbnailGeneration() {

    }
  }
}
</script>

