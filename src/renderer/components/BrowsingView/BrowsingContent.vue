<template>
  <div class="browsing-content">
    <div
      v-if="isHomePage"
      class="home-page"
    >
      <BrowsingHistory />
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
import BrowsingHistory from '@/components/BrowsingView/BrowsingHistory.vue';

export default {
  components: {
    BrowsingHistory,
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
    width: calc(100% - 104px);
    height: 100%;
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
