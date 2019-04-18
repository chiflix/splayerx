<template>
  <div class="open-url" :style="{
    left: isDarwin ? '' : '15px',
    right: isDarwin ? '15px' : '',
  }">
    <input class="url-input" :style="{ order: isDarwin ? '1' : '2' }" placeholder="请输入URL...">
    <Icon type="closeSearch" :style="{
      order: isDarwin ? '2' : '1',
      margin: isDarwin ? 'auto 0 auto 10px' : 'auto 10px auto 0' }" class="close-icon" @mouseup.native="handleCloseUrlInput"></Icon>
  </div>
</template>

<script>
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
    color: rgba(255, 255, 255, 0.47);
  }
  .close-icon {
    width: 18px;
    height: 18px;
    z-index: 6;
  }
}
</style>
