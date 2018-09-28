<template>
<div
  :data-component-name="$options.name"
  class="next-video"
  @mousedown.capture.stop="handleMouseDown">
  <div class="preview">
    <img
      :src="srcOfThumbnail">
  </div>
  <div class="content">
    <div class="info">
      <div class="top">
        <div class="duration">{{ formattedDuration }}</div>
        <div class="title">Next in Playing List</div>
      </div>
      <div class="vid-name">{{ videoName }}</div>
    </div>
    <Icon/>
  </div>
</div>
</template>
<script>
import Icon from '../IconContainer';
export default {
  name: 'next-video',
  components: {
    Icon,
  },
  props: {
    videoName: {
      type: String,
    },
    duration: {
      type: Number,
    },
    srcOfThumbnail: {
      type: String,
    },
  },
  data() {
    return {
      formattedDuration: this.timecodeFromSeconds(this.duration),
    };
  },
  methods: {
    handleMouseDown() {
      console.log('mousedown');
      this.$store.commit('NextVideo');
    },
  },
};
</script>
<style lang="scss" scoped>
.next-video {
  // temp style
  height: 112px;
  background-color: white;
  //temp style
  display: flex;
  .preview {
    height: 100%;
    width: 100%;
    background-color: black;
  }
  .content {
    padding: 10px;
    display: flex;
    .info {
      display: flex;
      flex-direction: column;
      .top {
        display: flex;
        color: black;
      }
      .vid-name {
        color: black;
      }
    }
  }
}
</style>