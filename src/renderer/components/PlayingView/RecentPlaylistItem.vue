<template>
<div class="container"
  :style="{
    minWidth: `${thumbnailWidth}px`,
    minHeight: `${thumbnailHeight}px`,
  }">
  <BaseInfoCard
    :style="{
      width: `${thumbnailWidth}px`,
      height: `${thumbnailHeight}px`,
    }">
    <div class="recent-playlist-item"
        :class="{ blur: isBlur }">
          <div class="progress"
            :style="{
              left: side,
              bottom: bottom,
            }">
            <div class="slider"></div>
          </div>
          <div class="title"
            :style="{
              left: side,
              bottom: bottom,
            }">S09E06</div>
    </div>
  </BaseInfoCard>
</div>
</template>
<script>
import BaseInfoCard from '@/components/PlayingView/BaseInfoCard.vue';
export default {
  components: {
    BaseInfoCard,
  },
  props: {
    thumbnailWidth: {
      type: Number,
      default: 112,
    },
    winWidth: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    lastPlayedTime: {
      type: Number,
    },
    cover: {
      type: String,
    },
    src: {
      type: String,
    },
  },
  data() {
    return {
      isBlur: false,
    };
  },
  methods: {
  },
  computed: {
    thumbnailHeight() {
      return this.thumbnailWidth / (112 / 63);
    },
    side() {
      return this.winWidth > 1355 ? `${this.thumbnailWidth / (112 / 14)}px` : '14px';
    },
    bottom() {
      return this.winWidth > 1355 ? `${this.thumbnailWidth / (112 / 14)}px` : '14px';
    },
  },
};
</script>
<style lang="scss" scoped>
.container {
  margin-right: 15px;
}
.recent-playlist-item {
  .progress {
    position: absolute;
    width: 61px;
    height: 2px;
    border-radius: 2px;
    background-color: rgba(216,216,216,0.40);
    .slider {
      height: 100%;
      width: 50%;
      border-radius: 2px;
      background-color: #D8D8D8;
    }
  }
  .title {
    font-family: Avenir-Heavy;
    font-size: 14px;
    color: rgba(255,255,255,0.40);
    letter-spacing: 0.58px;
    line-height: 14px;

    position: absolute;
    width: calc(100% - 28px);
  }
}
.blur {
  filter: blur(1px);
}
</style>
