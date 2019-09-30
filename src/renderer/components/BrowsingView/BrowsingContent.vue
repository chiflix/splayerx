<template>
  <div class="browsing-content">
    <h1 class="title">历史播放记录</h1>
    <div class="history">
      <BrowsingHistoryItem
        :key="item"
        v-for="item in historys"
        class="item"
      />
    </div>
  </div>
</template>
<script lang="ts">
import BrowsingHistoryItem from '@/components/BrowsingView/BrowsingHistoryItem.vue';
import { browsingDB } from '@/helpers/browsingDB';

export default {
  components: {
    BrowsingHistoryItem,
  },
  data() {
    return {
      historys: Array(15),
    };
  },
  created() {
    console.log(browsingDB);
  },
};
</script>
<style lang="scss" scoped>
.browsing-content {
  overflow: auto;
  display: flex;
  align-items: center;
  flex-direction: column;

  .title {
    height: 22px;
    line-height: 22px;
    width: calc(100% - 80px);
    margin-top: 36px;
    margin-bottom: 20px;
    font-family: $font-medium;
    font-size: 16px;
    color: #3B3B41;
    letter-spacing: 0.11px;
  }
  .history {
    width: calc(100% - 80px);
    display: flex;
    justify-content: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    width: fit-content;
    .item {
      margin-right: 20px;
      margin-bottom: 18px;
    }
  }
}
</style>
