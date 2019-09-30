<template>
  <div class="history-item">
    <div class="image" />
    <div class="content">
      <div class="title">
        {{ title }}
      </div>
      <div class="info">
        <span class="channel">{{ channel }}</span>
        <span class="author">{{ author }}</span>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  props: {
    title: {
      type: String,
      default: 'Title..',
    },
    channel: {
      type: String,
      default: 'Channel',
    },
    author: {
      type: String,
      default: 'Author',
    },
  },
};
</script>
<style lang="scss" scoped>
.history-item {
  width: 172px;
  height: 156px;
  border-radius: 4px;

  .image {
    background-color: gray;
    width: 172px;
    height: 96px;
  }
  .content {
    width: 172px;
    height: 60px;
    display: flex;
    flex-direction: column;
    padding-top: 8px;
    .title {
      font-family: $font-medium;
      font-size: 12px;
      color: #3B3B41;
      letter-spacing: -0.3px;
      line-height: 16px;
      margin-bottom: 4px;
    }
    .info {
      opacity: 0.58;
      font-family: $font-medium;
      font-size: 12px;
      color: #7E808F;
      letter-spacing: 0;
      line-height: 16px;
    }
  }
}
</style>
