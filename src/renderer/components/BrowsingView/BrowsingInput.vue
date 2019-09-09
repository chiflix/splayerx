<template>
  <div
    :style="{
      left: isDarwin ? '' : '15px',
      right: isDarwin ? '15px' : '',
    }"
    class="search-url"
  >
    <input
      ref="searchValue"
      :style="{ order: isDarwin ? '1' : '2' }"
      @keypress="handleSearchKey"
      class="url-search"
      placeholder="请输入URL..."
      onfocus="select()"
    >
    <Icon
      :style="{
        order: isDarwin ? '2' : '1',
        margin: isDarwin ? 'auto 0 auto 10px' : 'auto 10px auto 0' }"
      @mouseup.native="handleCloseUrlInput"
      type="closeInput"
      class="close-search-icon"
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
  width: auto;
  height: 24px;
  position: absolute;
  top: 6px;
  z-index: 6;
  .url-search {
    width: 275px;
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
  .close-search-icon {
    width: 10px;
    height: 10px;
    z-index: 6;
    display: flex;
    cursor: pointer;
  }
}
</style>
