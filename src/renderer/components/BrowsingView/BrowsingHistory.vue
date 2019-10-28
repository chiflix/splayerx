<template>
  <div class="browsing-history">
    <div class="title">
      历史记录
    </div>
    <div class="clear">
      |  清除
    </div>
    <div class="history">
      <BrowsingHistoryItem
        :key="item"
        v-for="item in historys"
        v-bind="item"
        class="item"
      />
    </div>
  </div>
</template>
<script lang="ts">
import BrowsingHistoryItem from '@/components/BrowsingView/BrowsingHistoryItem.vue';
import { browsingHistory } from '@/services/browsing/BrowsingHistory';

export default {
  components: {
    BrowsingHistoryItem,
  },
  created() {
    browsingHistory.getHistorys().then((result: any) => {
      this.historys = result;
    });
  },
  data() {
    return {
      historys: [],
    };
  },
};
</script>
<style lang="scss" scoped>
.browsing-history {
  width: 100%;
  height: 100%;
  .title {
    font-family: $font-semibold;
    font-size: 25px;
    color: #3B3B41;
  }
  .history {
    margin-left: 6px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    .item {
    }
  }
}
</style>
