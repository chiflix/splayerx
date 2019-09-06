<template>
  <div
    class="search-url"
  >
    <div
      @dblclick="handleDbClick"
      class="url-search"
    >
      {{ title }}
    </div>
    <div
      @mouseup="handleUrlReload"
      class="control-button page-refresh-icon no-drag"
    >
      <Icon
        type="pageRefresh"
      />
    </div>
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
    title: {
      type: String,
      default: 'Splayer',
    },
    handleUrlReload: {
      type: Function,
      required: true,
    },
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
    handleDbClick() {
      if (!this.isMaximized) {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
      } else {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'unmaximize');
      }
    },
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
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
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
  .page-refresh-icon {
    margin-right: 8px;
  }
}
</style>
