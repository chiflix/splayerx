<template>
  <div
    class="search-url"
  >
    <input
      ref="searchValue"
      @keypress="handleSearchKey"
      class="url-search"
      placeholder="请输入URL..."
      onfocus="select()"
    >
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
  name: 'BrowsingInput',
  components: {
    Icon,
  },
  props: {
    closeUrlInput: {
      type: Function,
      required: true,
    },
    playFileWithPlayingView: {
      type: Function,
      required: true,
    },
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  methods: {
    handleCloseUrlInput() {
      this.closeUrlInput();
    },
    handleSearchKey(e: KeyboardEvent) {
      const inputUrl = this.$refs.searchValue.value;
      if (e.key === 'Enter') {
        this.playFileWithPlayingView(inputUrl);
      }
    },
  },
};
</script>

<style scoped lang="scss">
::-webkit-input-placeholder {
  color: rgba(255, 255, 255, 0.47);
}
::selection {
  background-color: rgba(255, 255, 255, 0.2);
}
.search-url {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  height: 24px;
  z-index: 6;
  .url-search {
    width: 100%;
    height: 24px;
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    border: none;
    z-index: 6;
    text-indent: 15px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }
  .page-refresh-icon {
    width: 16px;
    height: 16px;
    -webkit-app-region: no-drag;
    margin: auto 0 auto 0;
  }
}
</style>
