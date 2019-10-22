<template>
  <div class="browsing-content">
    <div
      v-if="isHomePage"
      class="home-page"
    >
      <h1 class="title">
        历史播放记录
      </h1>
      <div class="history">
        <BrowsingHistoryItem
          :key="item"
          v-for="item in historys"
          class="item"
        />
      </div>
    </div>
    <div
      v-if="isError"
      class="error-page"
    >
      <div class="title">
        {{ $t('browsing.error.offline' ) }}
      </div>
      <div class="desciption">
        {{ $t('browsing.error.try' ) }}<br>
        {{ $t('browsing.error.firstLine') }}<br>
        {{ $t('browsing.error.secondLine' ) }}
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters } from 'vuex';
import BrowsingHistoryItem from '@/components/BrowsingView/BrowsingHistoryItem.vue';

export default {
  components: {
    BrowsingHistoryItem,
  },
  data() {
    return {
      historys: Array(15),
    };
  },
  computed: {
    ...mapGetters(['isHomePage', 'isError']),
  },
};
</script>
<style lang="scss" scoped>
.browsing-content {
  overflow: auto;
  display: flex;
  align-items: center;
  flex-direction: column;

  .home-page {
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

  .error-page {
    width: 100%;
    height: 100%;
    .title {
      font-family: $font-semibold;
      font-size: 20px;
      color: #ABAFBA;
      letter-spacing: 0;
      line-height: 20px;

      margin-left: 40px;
      margin-top: 36px;
    }
    .desciption {
      font-family: $font-medium;
      font-size: 12px;
      color: #D4D7DF;
      letter-spacing: 0.09px;
      line-height: 18px;


      margin-left: 40px;
      margin-top: 16px;
    }
  }
}
</style>
