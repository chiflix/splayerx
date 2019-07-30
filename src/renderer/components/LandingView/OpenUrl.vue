<template>
  <div
    :style="{
      left: isDarwin ? '' : '15px',
      right: isDarwin ? '15px' : '',
    }"
    class="open-url no-drag"
  >
    <input
      ref="inputValue"
      :style="{ order: isDarwin ? '1' : '2' }"
      @keypress.self="handleEnterKey"
      class="url-input no-drag"
      placeholder="请输入URL..."
      onfocus="select()"
    >
    <Icon
      :style="{
        order: isDarwin ? '2' : '1',
        margin: isDarwin ? 'auto 0 auto 10px' : 'auto 10px auto 0' }"
      @mouseup.native="closeUrlInput"
      type="closeSearch"
      class="close-icon"
    />
  </div>
</template>

<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'OpenUrl',
  components: {
    Icon,
  },
  props: {
    openInputUrl: {
      type: Function,
      required: true,
    },
    closeUrlInput: {
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
    handleEnterKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        const inputUrl = this.$refs.inputValue.value;
        this.openInputUrl(inputUrl);
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
    padding-left: 15px;
    padding-right: 15px;
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
