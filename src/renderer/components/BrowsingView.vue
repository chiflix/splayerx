<template>
 <div class="browsing">
   <browsing-header></browsing-header>
   <div class="loading-state loading-animation" v-show="loadingState"></div>
   <webview :src="availableUrl" autosize class="web-view" ref="webView" allowpopups></webview>
   <browsing-control></browsing-control>
 </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
import urlParseLax from 'url-parse-lax';
import BrowsingHeader from './BrowsingView/BrowsingHeader.vue';
import BrowsingControl from './BrowsingView/BrowsingControl.vue';

export default {
  name: 'BrowsingView',
  data() {
    return {
      quit: false,
      loadingState: false,
    };
  },
  components: {
    'browsing-header': BrowsingHeader,
    'browsing-control': BrowsingControl,
  },
  computed: {
    ...mapGetters(['winSize', 'winPos', 'isFullScreen', 'initialUrl']),
    availableUrl() {
      const parsedUrl = urlParseLax(this.initialUrl);
      return parsedUrl.protocol ? parsedUrl.href : `http://${this.initialUrl}`;
    },
  },
  watch: {
    initialUrl(val) {
      console.log(val);
    },
  },
  methods: {
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
    }),
  },
  mounted() {
    if (this.winSize[0] < 1200) {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [1200, 675]);
    }
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [720, 405]);
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
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', newPosition);
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
      this.$refs.webView.reload();
    });
    this.$refs.webView.addEventListener('load-commit', () => {
      this.$refs.webView.blur();
      this.$bus.$emit('web-info', { url: this.$refs.webView.getURL(), canGoBack: this.$refs.webView.canGoBack(), canGoForward: this.$refs.webView.canGoForward() });
    });
    this.$electron.ipcRenderer.on('quit', () => {
      this.quit = true;
    });
    this.$refs.webView.addEventListener('dom-ready', () => { // for webview test
      this.$refs.webView.openDevTools();
    });
    this.$refs.webView.addEventListener('new-window', (e) => { // new tabs
      this.updateInitialUrl(e.url);
    });
    this.$refs.webView.addEventListener('did-start-loading', () => {
      this.loadingState = true;
    });
    this.$refs.webView.addEventListener('did-stop-loading', () => {
      this.loadingState = false;
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
  display: flex;
  flex-direction: column;
  .web-view {
    flex: 1;
    -webkit-app-region: no-drag;
    background: rgba(255, 255, 255, 1);
  }
  .loading-state {
    width: 100%;
    height: 36px;
    position: absolute;
    background-image: linear-gradient(-90deg, #414141 18%, #505050 44%, #545454 51%, #545454 56%, #505050 63%, #414141 86%);
  }
}
.loading-animation {
  animation: loading 1s linear 1 normal forwards;
  animation-iteration-count: infinite;
}
@keyframes loading {
  0% { transform: translateX(-100%) }
  25% { transform: translateX(-50%) }
  50% { transform: translateX(0%) }
  75% { transform: translateX(50%) }
  100% { transform: translateX(100%) }
}
</style>
