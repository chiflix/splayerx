<template>
  <div
    class="search-url"
  >
    <div
      class="url-search"
    >
      Splayer
    </div>
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
  align-items: center;
  width: 100%;
  height: 40px;
  z-index: 6;
  .url-search {
    width: 100%;
    outline: none;
    background-color: #FFF;
    border: none;
    z-index: 6;

    font-size: 12px;
    color: rgba(15, 26, 59, 0.5);
    letter-spacing: 0.09px;
    text-align: center;
  }
  .page-refresh-icon {
    width: 16px;
    height: 16px;
    -webkit-app-region: no-drag;
    margin-right: 16px;
    margin-left: 12px;
  }
}
</style>
