<template>
  <div class="history-item">
    <div class="content">
      <div class="image">
        <Icon
          :type="icon"
        />
      </div>
      <div class="title">
        {{ title }}
      </div>
      <div class="channel">
        {{ channel }}
      </div>
    </div>
    <div class="time">
      {{ date }}
    </div>
  </div>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon
  },
  props: {
    title: {
      type: String,
      default: 'Title..',
    },
    url: {
      type: String,
      default: 'Channel',
    },
    icon: {
      type: String,
      default: 'bilibiliSidebar',
    },
    openTime: {
      type: String,
      default: new Date(),
    },
    channel: {
      type: String,
      default: 'Channel',
    },
  },
  computed: {
    date() {
      return this.openTime;
    },
  },
};
</script>
<style lang="scss" scoped>
.history-item {
  width: calc(100% - 12px);
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow 1s;
  border-radius: 7px;
  &:hover {
    box-shadow: 0 1px 9px 0 rgba(0,0,0,0.10);
  }

  .content {
    display:flex;
    justify-content: flex-start;
    align-items: center;
    .image {
      margin-left: 20px;
      width: 28px;
      height: 28px;
    }   
    .title {
      font-family: $font-normal;
      font-size: 15px;
      color: #3B3B41;
    }
    .channel {
      font-family: $font-normal;
      font-size: 15px;
      color: #B5B6BF;
      letter-spacing: 0; 
    }
  }
  .time {
    font-family: $font-normal;
    font-size: 15px;
    color: #B5B6BF;
    letter-spacing: 0;
    text-align: right;
  }
}
</style>
