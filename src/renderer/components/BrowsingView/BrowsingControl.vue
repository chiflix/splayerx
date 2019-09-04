<template>
  <div
    :style="{
      width: isDarwin ? '114px' : '110px',
    }"
    class="browsing-control"
  >
    <div
      @mouseup="handleSidebar"
      class="control-button sidebar-icon no-drag"
    >
      <Icon
        type="sidebar"
      />
    </div>
    <div
      @mouseup="handleUrlBack"
      class="control-button back-icon"
    >
      <Icon
        ref="back"
        :type="backType"
        :style="{
          cursor: webInfo.canGoBack ? 'pointer' : ''
        }"
      />
    </div>
    <div
      @mouseup="handleUrlForward"
      class="control-button forward-icon"
    >
      <Icon
        ref="forward"
        :type="forwardType"
        :style="{
          cursor: webInfo.canGoForward ? 'pointer' : ''
        }"
      />
    </div>
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
  methods: {
    handleSidebar() {
      this.$event.emit('side-bar-mouseup');
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
  .control-button {
    width: 30px;
    height: 30px;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 100ms ease-in;
    &:hover {
      background-color: #F5F6F8;
    }
  }
  .sidebar-icon {
    margin-left: 8px;
  }
  .back-icon {
    margin-left: 4px;
    margin-right: 4px;
  }
  .forward-icon {
    margin-right: 8px;
  }
}
</style>
