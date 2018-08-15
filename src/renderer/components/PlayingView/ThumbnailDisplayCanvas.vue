<template>
  <canvas
    ref="canvas"
    :width="thumbnailWidth"
    :height="thumbnailHeight"></canvas>
</template>
<script>
// import THUMBNAIL_DB_NAME from '@/constants';
export default {
  name: 'thumbnail-display-canvas',
  props: {
    currentTime: {
      type: Number,
      default: 0,
      required: true,
      validator: value => typeof value === 'number' && value >= 0,
    },
    lastGenerationIndex: Number,
    maxThumbnailCount: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    quickHash: String,
  },
  // data() {
  //   return {
  //     interval: 3,
  //   };
  // },
  // watch: {
  //   outerThumbnailInfo(newValue) {

  //   },
  //   currentTime(newValue) {

  //   },
  // },
  // methods: {

  // },
};
</script>

