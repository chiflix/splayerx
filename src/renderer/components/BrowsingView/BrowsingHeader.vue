<template>
  <div
    :style="{
      width: isDarwin || (!isDarwin && showSidebar) ? 'calc(100vw - 76px)' : '100vw',
      background: isDarkMode ? '#434348' : '#FFFFFF',
    }"
    class="header"
  >
    <browsing-control
      :handle-url-back="handleUrlBack"
      :handle-url-forward="handleUrlForward"
      :back-type="backType"
      :forward-type="forwardType"
      :is-dark-mode="isDarkMode"
      :web-info="webInfo"
    />
    <browsing-input
      :handle-url-reload="handleUrlReload"
      :title="title"
      :is-web-page="isWebPage"
      :current-url="currentUrl"
      :is-loading="isLoading"
      :can-reload="webInfo.canReload"
      :get-download-video="getDownloadVideo"
      :got-download-info="gotDownloadInfo"
      :download-error-code="downloadErrorCode"
      :handle-dblclick="handleDbClick"
      :is-dark-mode="isDarkMode"
    />
    <browsing-pip-control
      :has-video="webInfo.hasVideo"
      :handle-enter-pip="handleEnterPip"
      :is-dark-mode="isDarkMode"
    />
    <browsing-title-bar
      v-if="!isDarwin"
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
    isWebPage: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: 'SPlayer',
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
    currentUrl: {
      type: String,
      required: true,
    },
    getDownloadVideo: {
      type: Function,
      required: true,
    },
    gotDownloadInfo: {
      type: Boolean,
      required: true,
    },
    downloadErrorCode: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      showOpenUrl: false,
    };
  },
  computed: {
    ...mapGetters(['recordUrl', 'showSidebar', 'isDarkMode']),
    isDarwin() {
      return process.platform === 'darwin';
    },
    backType() {
      if (this.isDarkMode) {
        return this.webInfo.canGoBack ? 'backDark' : 'backDisabledDark';
      }
      return this.webInfo.canGoBack ? 'back' : 'backDisabled';
    },
    forwardType() {
      if (this.isDarkMode) {
        return this.webInfo.canGoForward ? 'forwardDark' : 'forwardDisabledDark';
      }
      return this.webInfo.canGoForward ? 'forward' : 'forwardDisabled';
    },
  },
  methods: {
    handleDbClick(e: Event) {
      if ((e.target as HTMLElement).tagName !== 'svg') {
        const currentWindow = this.$electron.remote.getCurrentWindow();
        const isMaximized = currentWindow.isMaximized();
        this.$electron.ipcRenderer.send('callMainWindowMethod', isMaximized ? 'unmaximize' : 'maximize');
        const bounds = currentWindow.getBounds();
        if (!this.isDarwin && !isMaximized && (bounds.x < 0 || bounds.y < 0)) {
          currentWindow.getBrowserViews()[0].setBounds({
            x: this.showSidebar ? 76 : 0,
            y: 40,
            width: this.showSidebar ? bounds.width + (bounds.x * 2) - 76
              : bounds.width + (bounds.x * 2),
            height: bounds.height - 40,
          });
        } else {
          currentWindow.getBrowserViews()[0].setBounds({
            x: this.showSidebar ? 76 : 0,
            y: 40,
            width: this.showSidebar ? currentWindow.getSize()[0] - 76
              : currentWindow.getSize()[0],
            height: currentWindow.getSize()[1] - 40,
          });
        }
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
}
</style>
