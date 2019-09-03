<template>
  <div
    :style="{
      width: isDarwin ? '113px' : '110px',
    }"
    class="browsing-control"
  >
    <SidebarIcon
      @mouseover.native="mouseoverSidebar = true"
      @mouseout.native="mouseoverSidebar = false"
      @mouseup.native="handleSidebar"
      :mouseover="mouseoverSidebar"
      class="sidebar no-drag"
    />
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
  </div>
</template>

<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';
import SidebarIcon from '@/components/LandingView/SidebarIcon.vue';

export default {
  name: 'BrowsingControl',
  components: {
    SidebarIcon,
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
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 6;
  border-right: 1px solid #F2F1F4;
  .sidebar {
    display: flex;
    justify-content: flex-end;
    margin-left: 15px;
    transition: width 100ms linear;
  }
  .back-icon {
    width: 16px;
    height: 16px;
    margin-left: 21px;
    margin-right: 18px;
    -webkit-app-region: no-drag;
  }
  .forward-icon {
    width: 16px;
    height: 16px;
    margin-right: 17px;
    -webkit-app-region: no-drag;
  }
}
</style>
