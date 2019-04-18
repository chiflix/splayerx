<template>
  <div class="search-url" :style="{
    left: isDarwin ? '' : '15px',
    right: isDarwin ? '15px' : '',
  }">
    <input class="url-search" :style="{ order: isDarwin ? '1' : '2' }" placeholder="请输入URL...">
    <Icon type="closeInput" :style="{
      order: isDarwin ? '2' : '1',
      margin: isDarwin ? 'auto 0 auto 10px' : 'auto 10px auto 0' }" class="close-search-icon" @mouseup.native="handleCloseUrlInput"></Icon>
  </div>
</template>

<script>
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'BrowsingInput',
  components: {
    Icon,
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  methods: {
    handleCloseUrlInput() {
      this.$bus.$emit('open-url-show', false);
    },
  },
};
</script>

<style scoped lang="scss">
::-webkit-input-placeholder {
  color: rgba(255, 255, 255, 0.47);
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
    color: rgba(255, 255, 255, 0.47);
  }
  .close-search-icon {
    width: 10px;
    height: 10px;
    z-index: 6;
    display: flex;
  }
}
</style>
