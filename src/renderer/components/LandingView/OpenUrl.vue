<template>
  <div class="open-url" :style="{
    left: isDarwin ? '' : '15px',
    right: isDarwin ? '15px' : '',
  }">
    <input class="url-input" ref="inputValue" :style="{ order: isDarwin ? '1' : '2' }" placeholder="请输入URL..." @keypress="handleEnterKey" onfocus="select()">
    <Icon type="closeSearch" :style="{
      order: isDarwin ? '2' : '1',
      margin: isDarwin ? 'auto 0 auto 10px' : 'auto 10px auto 0' }" class="close-icon" @mouseup.native="handleCloseUrlInput"></Icon>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'OpenUrl',
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
    handleEnterKey(e) {
      if (e.key === 'Enter') {
        this.updateInitialUrl(this.$refs.inputValue.value);
        this.$router.push({
          name: 'browsing-view',
        });
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
.open-url {
  display: flex;
  width: auto;
  height: 26px;
  position: absolute;
  top: 8px;
  z-index: 6;
  .url-input {
    width: 275px;
    height: 26px;
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 13px;
    border: none;
    z-index: 6;
    text-indent: 15px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }
  .close-icon {
    width: 18px;
    height: 18px;
    z-index: 6;
    cursor: pointer;
  }
}
</style>
