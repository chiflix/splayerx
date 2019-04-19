<template>
  <div class="search-url" :style="{
    left: isDarwin ? '' : '15px',
    right: isDarwin ? '15px' : '',
  }">
    <input class="url-search" ref="searchValue" :style="{ order: isDarwin ? '1' : '2' }" placeholder="请输入URL..." @keypress="handleSearchKey" onfocus="select()">
    <Icon type="closeInput" :style="{
      order: isDarwin ? '2' : '1',
      margin: isDarwin ? 'auto 0 auto 10px' : 'auto 10px auto 0' }" class="close-search-icon" @mouseup.native="handleCloseUrlInput"></Icon>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
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
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
    }),
    handleCloseUrlInput() {
      this.$bus.$emit('open-url-show', false);
    },
    handleSearchKey(e) {
      if (e.key === 'Enter') {
        this.updateInitialUrl(this.$refs.searchValue.value);
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
