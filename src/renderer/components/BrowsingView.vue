<template>
 <div class="browsing">
   <browsing-header :url="url"></browsing-header>
   <webview :src="url" autosize class="web-view" ref="webView" allowpopups></webview>
 </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BrowsingHeader from './BrowsingView/BrowsingHeader.vue';

export default {
  name: 'BrowsingView',
  data() {
    return {
      url: 'https://www.youtube.com',
      quit: false,
    };
  },
  components: {
    'browsing-header': BrowsingHeader,
  },
  computed: {
    ...mapGetters(['winSize', 'winPos', 'isFullScreen']),
  },
  mounted() {
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [1200, 675]);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [0, 0]);
    const windowRect = [
      window.screen.availLeft, window.screen.availTop,
      window.screen.availWidth, window.screen.availHeight,
    ];
    const newPosition = this.calculateWindowPosition(
      this.winPos.concat(this.winSize),
      windowRect,
      [1200, 675],
    );
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', newPosition);
    this.$bus.$on('search-with-url', (url) => {
      this.$refs.webView.loadURL(url);
    });
    this.$bus.$on('url-back', () => {
      if (this.$refs.webView.canGoBack()) {
        this.$refs.webView.goBack();
      }
    });
    this.$bus.$on('url-forward', () => {
      if (this.$refs.webView.canGoForward()) {
        this.$refs.webView.goForward();
      }
    });
    this.$bus.$on('url-reload', () => {
      this.$refs.webView.loadURL(this.$refs.webView.getURL());
    });
    this.$refs.webView.addEventListener('load-commit', () => {
      this.url = this.$refs.webView.getURL();
      this.$bus.$emit('web-info', { canGoBack: this.$refs.webView.canGoBack(), canGoForward: this.$refs.webView.canGoForward() });
    });
    this.$electron.ipcRenderer.on('quit', () => {
      this.quit = true;
    });
    window.onbeforeunload = (e) => {
      if (!this.quit) {
        e.returnValue = false;
        this.$bus.$off(); // remove all listeners before back to landing view
        const x = (window.screen.width / 2) - 360;
        const y = (window.screen.height / 2) - 200;
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [720, 405]);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', [x, y]);
        this.$router.push({
          name: 'landing-view',
        });
        if (this.isFullScreen) this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [!this.isFullScreen]);
      }
    };
  },
  beforeDestroy() {
    window.onbeforeunload = null;
  },
};
</script>

<style scoped lang="scss">
.browsing {
  height: 100vh;
  width: 100vw;
  background-image: url(../assets/gradient-bg.png);
  display: flex;
  flex-direction: column;
  .web-view {
    flex: 1;
    -webkit-app-region: no-drag;
  }
}
</style>
