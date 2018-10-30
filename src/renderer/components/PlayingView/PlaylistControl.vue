<template>
  <div>
    <div @mousedown.left="togglePlaylistDisplay">
      <Icon type="listicon"></Icon>
    </div>
  </div>
</template>
<script>
import Icon from '../BaseIconContainer';
export default {
  name: 'playlist-control',
  props: {
    showAttached: Boolean,
  },
  data() {
    return {
      clicks: 0,
    };
  },
  components: {
    Icon,
  },
  methods: {
    togglePlaylistDisplay() {
      this.clicks = this.showAttached ? 1 : 0;
      this.clicks += 1;
      switch (this.clicks) {
        case 1:
          this.$emit('update:showAttached', true);
          break;
        case 2:
          this.$emit('update:showAttached', false);
          this.clicks = 0;
          break;
        default:
          this.clicks = 0;
          break;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
</style>
