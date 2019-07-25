<template>
  <div
    :style="{
      width: isDarwin ? '114px' : '110px',
      margin: isDarwin ? 'auto 0 auto 70px' : 'auto 0 auto 5px',
    }"
    class="browsing-control"
  >
    <Icon
      ref="back"
      :type="backType"
      :style="{
        cursor: webInfo.canGoBack ? 'pointer' : ''
      }"
      @mouseup.native="handleUrlBack"
      class="back-icon"
    />
    <Icon
      ref="forward"
      :type="forwardType"
      :style="{
        cursor: webInfo.canGoForward ? 'pointer' : ''
      }"
      @mouseup.native="handleUrlForward"
      class="forward-icon"
    />
    <Icon
      @mouseup.native="handleUrlReload"
      :style="{
        cursor: 'pointer',
      }"
      type="pageRefresh"
      class="page-refresh-icon"
    />
  </div>
</template>

<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingControl',
  components: {
    Icon,
  },
  props: {
    handleUrlReload: {
      type: Function,
      required: true,
    },
    handleUrlBack: {
      type: Function,
      required: true,
    },
    handleUrlForward: {
      type: Function,
      required: true,
    },
    backType: {
      type: String,
      required: true,
    },
    forwardType: {
      type: String,
      required: true,
    },
    webInfo: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
};
</script>

<style scoped lang="scss">
.browsing-control {
  height: 20px;
  display: flex;
  z-index: 6;
  .back-icon {
    width: 16px;
    height: 16px;
    margin: auto 20px auto 7px;
    -webkit-app-region: no-drag;
  }
  .forward-icon {
    width: 16px;
    height: 16px;
    margin: auto 20px auto 0;
    -webkit-app-region: no-drag;
  }
  .page-refresh-icon {
    width: 16px;
    height: 16px;
    -webkit-app-region: no-drag;
    margin: auto 0 auto 0;
  }
}
</style>
