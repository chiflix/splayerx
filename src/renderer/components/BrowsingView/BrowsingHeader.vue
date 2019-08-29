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
        order: isDarwin ? 1 : 2,
      }"
    />
    <browsing-favicons
      :record-url="recordUrl"
      :handle-bookmark-open="handleBookmarkOpen"
      :style="{
        order: isDarwin ? 2 : 3,
      }"
    />
    <browsing-input
      v-show="showOpenUrl"
      :close-url-input="closeUrlInput"
      :play-file-with-playing-view="playFileWithPlayingView"
    />
    <div
      :style="{
        width: isDarwin ? '80px' : '100px',
        display: 'flex',
        zIndex: '6',
        order: isDarwin ? 3 : 1,
        webkitAppRegion: 'no-drag',
        cursor: hasVideo ? 'pointer' : '',
      }"
    >
      <Icon
        :type="picInPicType"
        :style="{
          margin: isDarwin ? 'auto 10px auto auto' : 'auto auto auto 15px',
        }"
        @mouseup.native="handleGlobalPip"
      />
      <Icon
        :type="picInPicType"
        :style="{
          margin: isDarwin ? 'auto 10px auto auto' : 'auto auto auto 15px',
        }"
        @mouseup.native="handleEnterPip"
      />
    </div>
  </div>
</template>

<script lang="ts">
import electron from 'electron';
import { mapGetters } from 'vuex';
import BrowsingFavicons from '@/components/BrowsingView/BrowsingFavicons.vue';
import BrowsingInput from '@/components/BrowsingView/BrowsingInput.vue';
import BrowsingControl from '@/components/BrowsingView/BrowsingControl.vue';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingHeader',
  components: {
    'browsing-favicons': BrowsingFavicons,
    'browsing-input': BrowsingInput,
    'browsing-control': BrowsingControl,
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
    picInPicType() {
      return this.hasVideo ? 'pip' : 'pipDisabled';
    },
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
  width: 100%;
  height: 36px;
  display: flex;
  background: rgba(65, 65, 65, 1);
}
</style>
