<template>
  <span>hhh</span>
</template>
<script>
export default {
  name: 'thumbnail-display',
  props: {
    quickHash: String,
    autoGenerationIndex: {
      type: Number,
      validator: value => value > 0,
    },
  },
  watch: {
    autoGenerationIndex(newValue, oldValue) {
      console.log('[ThumbnailDisplay]:', newValue, oldValue);
    },
  },
  created() {
    console.log('New file:', this.autoGenerationIndex);
  },
};
</script>
