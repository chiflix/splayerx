<template>
  <div class="history-item">
    <div class="content">
      <div class="icon">
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
    Icon,
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
      const a = new Date(this.openTime);
      const date = a.getDate();
      const year = a.getFullYear();
      console.log(a);
      return `${year}年 ${date}日`;
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
  transition: box-shadow 500ms;
  border-radius: 7px;
  &:hover {
    box-shadow: 0 1px 9px 0 rgba(0,0,0,0.10);
  }

  .content {
    display:flex;
    justify-content: flex-start;
    align-items: center;
    .icon {
      margin-left: 20px;
      width: 28px;
      height: 28px;
    }
    .title {
      margin-left: 13px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: $font-normal;
      font-size: 15px;
      color: #3B3B41;
    }
    .channel {
      margin-left: 13px;
      font-family: $font-normal;
      font-size: 15px;
      color: #B5B6BF;
      letter-spacing: 0;
    }
  }
  .time {
    margin-right: 30px;
    font-family: $font-normal;
    font-size: 15px;
    color: #B5B6BF;
    letter-spacing: 0;
    text-align: right;
  }
}
</style>
