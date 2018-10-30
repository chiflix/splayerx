<template>
<div class="container">
  <BaseInfoCard>
    <div class="recent-playlist-item"
        :class="{ blur: isBlur }">
          <div class="progress">
            <div class="slider"></div>
          </div>
          <div class="title">S09E06</div>
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
  data() {
    return {
      isBlur: false,
    };
  },
  methods: {
  },
};
</script>
<style lang="scss" scoped>
.container {
  height: 78px;
  width: 138px;
  margin-right: 15px;
}
.recent-playlist-item {
  .progress {
    position: absolute;
    left: 15px;
    top: 39px;
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
    left: 15px;
    top: 49px;
  }
}
.blur {
  filter: blur(1px);
}
</style>
