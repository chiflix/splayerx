<template>
<div
  :data-component-name="$options.name"
  class="next-video">
  <img>
  <div class="content">
    <div class="info">
      <div class="top">
        <div class="duration">{{ formattedDuration }}</div>
        <div class="title"></div>
      </div>
      <div class="vid-name">{{ name }}</div>
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
    name: {
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
  },
};
</script>
<style lang="scss" scoped>
.next-video {
  position: absolute;
  // temp style
  right: 0;
  width: 500px;
  height: 112px;
  background-color: white;
  //temp style
  display: flex;
  img {
    height: 100%;
    width: 30%;
    background-color: black;
  }
  .content {
    padding: 10px;
    display: flex;
    width: 100%;
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