<template>
  <div
    :style="{
      width: isDarwin || (!isDarwin && showSidebar) ? 'calc(100vw - 76px)' : '100vw',
    }"
    @dblclick="handleDbClick"
    class="header"
  >
    <browsing-control
      :handle-url-back="handleUrlBack"
      :handle-url-forward="handleUrlForward"
      :back-type="webInfo.canGoBack ? 'back' : 'backDisabled'"
      :forward-type="webInfo.canGoForward ? 'forward' : 'forwardDisabled'"
      :web-info="webInfo"
    />
    <browsing-input
      :handle-url-reload="handleUrlReload"
      :title="title"
      :is-loading="isLoading"
      :close-url-input="closeUrlInput"
      :play-file-with-playing-view="playFileWithPlayingView"
    />
    <browsing-pip-control
      :has-video="webInfo.hasVideo"
      :handle-enter-pip="handleEnterPip"
    />
    <browsing-title-bar
      v-if="!isDarwin"
      :show-sidebar="showSidebar"
    />
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import BrowsingInput from '@/components/BrowsingView/BrowsingInput.vue';
import BrowsingControl from '@/components/BrowsingView/BrowsingControl.vue';
import BrowsingPipControl from '@/components/BrowsingView/BrowsingPipControl.vue';
import BrowsingTitleBar from '@/components/BrowsingView/BrowsingTitleBar.vue';

export default {
  name: 'BrowsingHeader',
  components: {
    'browsing-input': BrowsingInput,
    'browsing-control': BrowsingControl,
    'browsing-pip-control': BrowsingPipControl,
    'browsing-title-bar': BrowsingTitleBar,
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: 'Splayer',
    },
    isLoading: {
      type: Boolean,
      required: true,
    },
    handleEnterPip: {
      type: Function,
      required: true,
    },
    handleUrlReload: {
      type: Function,
      required: true,
    },
    handleUrlBack: {
      type: Function,
      required: true,
    },
    handleUrlForward: {
      type: Function,
      required: true,
    },
    handleBookmarkOpen: {
      type: Function,
      required: true,
    },
    webInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showOpenUrl: false,
    };
  },
  computed: {
    ...mapGetters(['recordUrl', 'isMaximized']),
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  methods: {
    handleDbClick(e: Event) {
      if ((e.target as HTMLElement).tagName !== 'svg') {
        if (!this.$electron.remote.getCurrentWindow().isMaximized()) {
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
        } else {
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'unmaximize');
        }
      }
    },
    closeUrlInput() {
      this.$bus.$emit('open-url-show', false);
    },
    playFileWithPlayingView(inputUrl: string) {
      if (this.openFileByPlayingView(inputUrl)) {
        this.openUrlFile(inputUrl);
      } else {
        this.$electron.remote.BrowserView.getAllViews()[1].webContents.loadURL(inputUrl);
        this.$electron.remote.BrowserView.getAllViews()[0].webContents.loadURL(inputUrl);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.header {
  position: absolute;
  right: 0;
  border-top-left-radius: 4px;
  box-sizing: border-box;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #FFF;
}
</style>
