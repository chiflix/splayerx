<template>
  <div
    :style="{
      cursor: 'pointer',
      fontSize: `${fontSize}px`,
      height: `${selectedHeight}px`,
    }"
    class="history-item"
  >
    <div class="content">
      <div
        :style="{
          marginLeft: `${iconPos}px`,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
        }"
        class="icon"
      >
        <img
          :style="{
            width: '100%',
            height: '100%',
            borderRadius: '100%',
          }"
          v-if="!icon.includes('Sidebar')"
          :src="icon"
        >
        <Icon
          v-if="icon.includes('Sidebar')"
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
      required: true,
    },
    openTime: {
      type: Number,
      default: Date.now(),
    },
    channel: {
      type: String,
      default: 'Channel',
    },
    fontSize: {
      type: Number,
      required: true,
    },
    iconSize: {
      type: Number,
      required: true,
    },
    selectedHeight: {
      type: Number,
      required: true,
    },
    iconPos: {
      type: Number,
      required: true,
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

      const time = `${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}`;

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
        return `${this.$t('browsing.yesterday')} ${time}`;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow 100ms linear;
  border-radius: 7px;
  &:hover {
    box-shadow: 0 0 6px rgba(0,0,0,0.20);
  }

  .content {
    min-width: 0;
    display:flex;
    justify-content: flex-start;
    align-items: center;
    .title {
      flex-shrink: 10;
      margin-left: 13px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: $font-normal;
      color: #3B3B41;
    }
    .channel {
      margin-left: 13px;
      font-family: $font-normal;
      color: #B5B6BF;
      letter-spacing: 0;
    }
  }
  .time {
    min-width: fit-content;
    margin-left: 10px;
    margin-right: 30px;
    font-family: $font-normal;
    color: #B5B6BF;
    letter-spacing: 0;
    text-align: right;
  }
}
</style>
