<template>
  <div class="browsing-content">
    <div v-if="isError" class="error-page">
      <div class="title">
        未连接到互联网
      </div>
      <div class="desciption">
        请试试以下办法：<br>检查网线、调制解调器和路由器<br>重新连接到 Wi-Fi 网络
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters(['isError']),
  },
};
</script>
<style lang="scss" scoped>
.browsing-content {
  overflow: auto;
  display: flex;
  align-items: center;
  flex-direction: column;
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
