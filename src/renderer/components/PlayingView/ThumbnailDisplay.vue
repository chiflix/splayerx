<template>
  <div class="thumbnail-display">
    <div
     :style="{
       width: `${thumbnailWidth}px`,
       height: `${thumbnailHeight}px`,
       backgroundImage: src,
       backgroundPosition: backPos,
       backgroundSize: backSize,
     }"></div>
  </div>
</template>
<script lang="ts">

export default {
  name: 'thumbnail-display',
  props: {
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    src: String,
    backPos: String,
    backSize: String,
  },
};
</script>
