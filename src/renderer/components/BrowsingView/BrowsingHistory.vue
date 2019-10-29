<template>
  <div class="browsing-history">
    <div class="title">
      <span>历史记录</span> 
      <span
        @click="handleClear"
        class="clear"
      >清除</span>
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
import { browsingHistory } from '@/services/browsing/BrowsingHistoryService';

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
  methods: {
    async handleClear() {
      await browsingHistory.clearAllHistorys();
      this.historys = [];
    },
  },
};
</script>
<style lang="scss" scoped>
.browsing-history {
  width: calc(100% - 104px);
  height: 100%;
  .title {
    font-family: $font-semibold;
    font-size: 25px;
    color: #3B3B41;
    .clear {
      border-left: 1px solid #B5B6BF; 
      font-family: $font-light;
      font-size: 19px;
      color: #B5B6BF;
      letter-spacing: 0.14px;
    }
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
