<template>
  <div class="browsing-history">
    <div class="title">
      <span>历史记录</span>
      <span
        @click="handleClear"
        class="clear"
      >|  清除</span>
    </div>
    <div class="dash" />
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
  data() {
    return {
      historys: [],
    };
  },
  created() {
    browsingHistory.getHistorys().then((result: any) => {
      this.historys = result;
    });
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
  width: 100%;
  height: 100%;
  .title {
    font-family: $font-semibold;
    font-size: 25px;
    color: #3B3B41;
    .clear {
      height: 26px;
      margin-left: 9px;
      font-family: $font-light;
      font-size: 19px;
      color: #B5B6BF;
      letter-spacing: 0.14px;
    }
  }
  .dash {
    margin-top: 18px;
    width: 100%;
    height: 1px;
    border-top: 1px solid #EEEEEE;
  }
  .history {
    margin-top: 20px;
    margin-left: 6px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
  }
}
</style>
