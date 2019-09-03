<template>
  <div
    @dblclick="handleDbClick"
    class="header"
  >
    <browsing-control
      :handle-url-reload="handleUrlReload"
      :handle-url-back="handleUrlBack"
      :handle-url-forward="handleUrlForward"
      :back-type="backType"
      :forward-type="forwardType"
      :web-info="webInfo"
      :style="{
      }"
    />
    <browsing-input
      :close-url-input="closeUrlInput"
      :play-file-with-playing-view="playFileWithPlayingView"
      :style="{
      }"
    />
    <browsing-pip
      :handle-enter-pip="handleEnterPip"
      :handle-global-pip="handleGlobalPip"
      :style="{
      }"
    />
  </div>
</template>

<script lang="ts">
import electron from 'electron';
import { mapGetters } from 'vuex';
import BrowsingFavicons from '@/components/BrowsingView/BrowsingFavicons.vue';
import BrowsingInput from '@/components/BrowsingView/BrowsingInput.vue';
import BrowsingControl from '@/components/BrowsingView/BrowsingControl.vue';
import BrowsingPip from '@/components/BrowsingView/BrowsingPip.vue';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingHeader',
  components: {
    'browsing-favicons': BrowsingFavicons,
    'browsing-input': BrowsingInput,
    'browsing-control': BrowsingControl,
    'browsing-pip': BrowsingPip,
    Icon,
  },
  props: {
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
    handleGlobalPip: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      showOpenUrl: false,
      backType: 'backDisabled',
      forwardType: 'forwardDisabled',
      hasVideo: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    };
  },
  computed: {
    ...mapGetters(['recordUrl', 'isMaximized']),
    isDarwin() {
      return process.platform === 'darwin';
    },
    webInfo() {
      return {
        canGoBack: this.canGoBack,
        canGoForward: this.canGoForward,
      };
    },
  },
  watch: {
    canGoBack(val: boolean) {
      this.backType = val ? 'back' : 'backDisabled';
    },
    canGoForward(val: boolean) {
      this.forwardType = val ? 'forward' : 'forwardDisabled';
    },
  },
  mounted() {
    this.$bus.$on('update-web-info', (info: {
      hasVideo?: boolean, url?: string, canGoBack?: boolean, canGoForward?: boolean
    }) => {
      const keys = Object.keys(info);
      keys.forEach((key: string) => {
        this[key] = info[key];
      });
    });
  },
  methods: {
    handleDbClick() {
      if (!this.isMaximized) {
        electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
      } else {
        electron.ipcRenderer.send('callMainWindowMethod', 'unmaximize');
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
    updateWebInfo(info: {
      hasVideo?: boolean, url?: string, canGoBack?: boolean, canGoForward?: boolean
    }) {
      const keys = Object.keys(info);
      keys.forEach((key: string) => {
        this[key] = info[key];
      });
    },
  },
};
</script>

<style scoped lang="scss">
.header {
  border-top-left-radius: 4px;
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #FFF;
  border-bottom: 1px solid #F2F1F4;
}
</style>
