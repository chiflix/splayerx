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
      type: Number,
      default: Date.now(),
    },
    channel: {
      type: String,
      default: 'Channel',
    },
  },
  computed: {
    date() {
      const openDate = new Date(this.openTime);
      const year = openDate.getFullYear();
      const month = openDate.getMonth();
      const date = openDate.getDate();
      const hour = openDate.getHours();
      const minute = openDate.getMinutes();

      const time = `${hour >= 12 ? this.$t('browsing.pm') : this.$t('browsing.am')} ${hour >= 12 ? hour - 12 : hour}:${minute < 10 ? '0' : ''}${minute}`;

      const today = new Date(Date.now());
      if (today.toDateString() === openDate.toDateString()) {
        return `${this.$t('browsing.today')} ${time}`;
      }

      const yesterday = new Date(Date.now());
      const yesDate = yesterday.getDate();

      yesterday.setDate(yesDate - 1);
      if (yesDate === 1) {
        const yesMonth = yesterday.getMonth();
        yesterday.setMonth(yesMonth - 1);
        if (yesMonth === 1) {
          yesterday.setFullYear(yesterday.getFullYear() - 1);
        }
      }

      if (yesterday.toDateString() === openDate.toDateString()) {
        return `${this.$t('browsing.yesterday')} ${time}}`;
      }

      return `${year}-${month}-${date} ${time}`;
    },
  },
};
</script>
<style lang="scss" scoped>
.history-item {
  min-width: 724px;
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
    min-width: 0;
    display:flex;
    justify-content: flex-start;
    align-items: center;
    .icon {
      margin-left: 20px;
      width: 28px;
      height: 28px;
    }
    .title {
      flex-shrink: 10;
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
    min-width: fit-content;
    margin-left: 10px;
    margin-right: 30px;
    font-family: $font-normal;
    font-size: 15px;
    color: #B5B6BF;
    letter-spacing: 0;
    text-align: right;
  }
}
</style>
