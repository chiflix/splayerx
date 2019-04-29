<template>
 <div class="browsing">
   <browsing-header v-show="!isPip"></browsing-header>
   <div class="loading-state loading-animation" v-show="loadingState && !isPip"></div>
   <webview :src="availableUrl" autosize class="web-view" ref="webView" allowpopups :style="{ webkitAppRegion: isPip ? 'drag' : 'no-drag' }"></webview>
   <browsing-control v-show="!isPip"></browsing-control>
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
      startTime: 0,
      isPip: false,
    };
  },
  components: {
    'browsing-header': BrowsingHeader,
    'browsing-control': BrowsingControl,
  },
  computed: {
    ...mapGetters(['winSize', 'winPos', 'isFullScreen', 'initialUrl', 'winWidth']),
    availableUrl() {
      const parsedUrl = urlParseLax(this.initialUrl);
      return parsedUrl.protocol ? parsedUrl.href : `http://${this.initialUrl}`;
    },
  },
  watch: {
    initialUrl(val) {
      console.log(val);
    },
    winWidth(val) {
      if (this.isPip) {
        this.$refs.webView.executeJavaScript('document.querySelector(".ytp-preview").style.top = "";document.querySelector(".ytp-preview").style.bottom = "50px"');
        this.$refs.webView.executeJavaScript(`document.querySelector(".html5-video-player").style.position = "absolute";document.querySelector(".html5-video-player").style.width = "${val}px";document.querySelector(".html5-video-player").style.height = "${this.winSize[1]}px";`);
        this.$refs.webView.executeJavaScript(`document.querySelector("video").style.width = "${val}px";document.querySelector("video").style.height = "${this.winSize[1]}px"`);
      }
    },
  },
  methods: {
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
    }),
  },
  mounted() {
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [0, 0]);
    if (this.winSize[0] < 1200) {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [1200, 900]);
    }
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [720, 405]);
    const windowRect = [
      window.screen.availLeft, window.screen.availTop,
      window.screen.availWidth, window.screen.availHeight,
    ];
    const newPosition = this.calculateWindowPosition(
      this.winPos.concat(this.winSize),
      windowRect,
      [1200, 900],
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
      this.startTime = new Date();
      this.loadingState = true;
    });
    this.$refs.webView.addEventListener('did-stop-loading', () => {
      const loadingTime = new Date() - this.startTime;
      if (loadingTime % 3000 === 0) {
        this.loadingState = false;
      } else {
        setTimeout(() => {
          this.loadingState = false;
        }, 3000 - (loadingTime % 3000));
      }
    });
    this.$bus.$on('enter-pip', () => {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [320, 180]);
      this.$refs.webView.executeJavaScript('document.getElementsByTagName("ytd-app")[0].appendChild(document.querySelector(".html5-video-player"));');
      this.$refs.webView.executeJavaScript('document.querySelector("#content").remove()');
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [320, 180]);
      this.$refs.webView.executeJavaScript('document.querySelector("video").style', (result) => {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [parseFloat(result.width) / parseFloat(result.height)]);
      });
      this.$refs.webView.executeJavaScript('document.querySelector(".video-ads").style.display = "none"');
      this.$refs.webView.executeJavaScript('document.querySelector(".ytp-chrome-bottom").style.width = "calc(100% - 24px)"');
      this.$refs.webView.executeJavaScript('document.querySelector("video").style.width = "320px";document.querySelector("video").style.height = "180px";');
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.position = "absolute";document.querySelector(".html5-video-player").style.width = "320px";document.querySelector(".html5-video-player").style.height = "180px";');
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.left = "50%";document.querySelector(".html5-video-player").style.transform = "translateX(-50%)";');
      this.$refs.webView.executeJavaScript('document.querySelector("video").play()');
      this.isPip = true;
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
    background: rgba(255, 255, 255, 1);
  }
  .loading-state {
    width: 100%;
    height: 36px;
    position: absolute;
    background-image: linear-gradient(-90deg, #414141 18%, #555555 34%, #626262 51%, #626262 56%, #555555 69%, #414141 86%);
  }
}
.loading-animation {
  animation: loading 3s linear 1 normal forwards;
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
