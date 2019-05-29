<template>
  <div class="thumbnail-display">
    <div
      :style="{
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
        backgroundImage: src,
        backgroundPosition: backgroundPosition,
        backgroundSize: backgroundSize,
      }"
    />
  </div>
</template>
<script lang="ts">

export default {
  name: 'ThumbnailDisplay',
  props: {
    thumbnailWidth: {
      type: Number,
      required: true,
    },
    thumbnailHeight: {
      type: Number,
      required: true,
    },
    src: {
      type: String,
      required: true,
    },
    backgroundPosition: {
      type: String,
      required: true,
    },
    backgroundSize: {
      type: String,
      required: true,
    },
  },
};
</script>
