<template>
  <div
    :style="{
      width: isDarwin ? 'calc(100% - 176px)' : 'calc(100% - 290px)',
    }"
    class="search-url"
  >
    <div
      @dblclick="handleDbClick"
      :style="{
        order: isDarwin ? 1 : 2,
      }"
      class="url-search"
    >
      {{ title }}
    </div>
    <div
      @mouseup="handleUrlReload"
      :style="{
        order: isDarwin ? 2 : 1,
      }"
      class="control-button page-refresh-icon no-drag"
    >
      <Icon
        :type="isLoading ? 'reloadStop' : 'pageRefresh'"
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
    isLoading: {
      type: Boolean,
      required: true,
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
      if (!this.$electron.remote.getCurrentWindow().isMaximized()) {
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
  height: 40px;
  z-index: 6;
  .url-search {
    width: 100%;
    margin-left: 8px;
    outline: none;
    background-color: #FFF;
    border: none;
    z-index: 6;

    font-size: 12px;
    color: #7E808E;
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
      background-color: #ECEEF0;
    }
  }
  .page-refresh-icon {
    margin-right: 8px;
    margin-left: 8px;
  }
}
</style>
