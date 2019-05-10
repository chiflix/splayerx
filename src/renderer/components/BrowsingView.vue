<template>
 <div class="browsing">
   <browsing-titlebar></browsing-titlebar>
   <browsing-header v-show="!isPip"></browsing-header>
   <div class="loading-state loading-animation" v-show="loadingState && !isPip"></div>
   <div class="pip-buttons" v-show="isPip">
     <Icon type="pipRecord" :style="{ marginRight: '12px' }"></Icon>
     <Icon type="pipBack" @mouseup.native="handleExitPip"></Icon>
   </div>
   <webview :src="availableUrl" autosize class="web-view" ref="webView" allowpopups :style="{ webkitAppRegion: isPip ? 'drag' : 'no-drag' }"></webview>
   <browsing-control v-show="!isPip"></browsing-control>
 </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import electron from 'electron';
import { Browsing as browsingActions } from '@/store/actionTypes';
import urlParseLax from 'url-parse-lax';
import BrowsingHeader from './BrowsingView/BrowsingHeader.vue';
import BrowsingControl from './BrowsingView/BrowsingControl.vue';
import Icon from './BaseIconContainer.vue';
import BrowsingTitleBar from './BrowsingView/BrowsingTitlebar.vue';

export default {
  name: 'BrowsingView',
  data() {
    return {
      quit: false,
      loadingState: false,
      startTime: 0,
      isPip: false,
      pipType: '',
      bilibiliType: 'video',
    };
  },
  components: {
    'browsing-header': BrowsingHeader,
    'browsing-control': BrowsingControl,
    'browsing-titlebar': BrowsingTitleBar,
    Icon,
  },
  computed: {
    ...mapGetters(['browsingWinSize', 'winPos', 'isFullScreen', 'initialUrl', 'browsingWinWidth']),
    availableUrl() {
      const parsedUrl = urlParseLax(this.initialUrl);
      return parsedUrl.protocol ? parsedUrl.href : `http://${this.initialUrl}`;
    },
  },
  watch: {
    initialUrl(val) {
      console.log(val);
    },
    browsingWinWidth(val) {
      if (this.isPip) {
        if (this.pipType === 'youtube') {
          this.youtubeWatcher(val);
        } else if (this.pipType === 'bilibili') {
          this.bilibiliWatcher(val);
        }
      }
    },
  },
  methods: {
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
      updateBrowsingSize: browsingActions.UPDATE_BROWSING_SIZE,
    }),
    handleExitPip() {
      if (this.isPip) {
        if (this.pipType === 'youtube') {
          this.youtubeRecover();
        } else if (this.pipType === 'bilibili') {
          this.bilibiliRecover();
        }
        this.isPip = false;
      }
    },
    youtubeAdapter() {
      this.$refs.webView.executeJavaScript('document.querySelector("video").style', (result) => {
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [parseFloat(result.width) / parseFloat(result.height)]);
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [parseInt(180 * (parseFloat(result.width) / parseFloat(result.height)), 10), 180]);
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [parseInt(180 * (parseFloat(result.width) / parseFloat(result.height)), 10), 180]);
      });
      this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.body.appendChild(document.querySelector(".html5-video-player")); if (!isPaused) {document.querySelector("video").play()}');
      this.$refs.webView.executeJavaScript('document.getElementsByTagName("ytd-app")[0].style.display = "none"');
      this.$refs.webView.executeJavaScript('if (document.querySelector(".video-ads")) document.querySelector(".video-ads").style.display = "none"'); // remove youtube ads
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.left = "50%";document.querySelector(".html5-video-player").style.transform = "translateX(-50%)";');
      this.$refs.webView.executeJavaScript('var setZoom = function() {setTimeout(() => { document.querySelector("video").style.zoom = document.body.clientWidth / parseFloat(document.querySelector("video").style.width);document.querySelector(".ytp-chrome-bottom").style.width = "calc(100% - 24px)"; }, 250);};window.addEventListener("resize", setZoom);');
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.background = "rgba(0, 0, 0, 1)"');
    },
    youtubeWatcher(val) {
      this.$refs.webView.executeJavaScript(`document.querySelector(".html5-video-player").style.position = "absolute";document.querySelector(".html5-video-player").style.width = "${val}px";document.querySelector(".html5-video-player").style.height = "${this.browsingWinSize[1]}px";`);
    },
    youtubeRecover() {
      this.$refs.webView.executeJavaScript('document.getElementsByTagName("ytd-app")[0].style.display = "";' +
        'document.querySelector(".html5-video-player").style.left = "";' +
        'document.querySelector(".html5-video-player").style.transform = "";' +
        'document.querySelector(".html5-video-player").style.position = "relative";' +
        'document.querySelector(".html5-video-player").style.width = "100%";' +
        'document.querySelector(".html5-video-player").style.height = "100%";' +
        'window.removeEventListener("resize", setZoom);' +
        'document.querySelector("video").style.zoom = 1');
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.background = "rgba(255, 255, 255, 1)"');
      this.$refs.webView.executeJavaScript('if (document.querySelector(".video-ads")) document.querySelector(".video-ads").style.display = ""'); // remove youtube ads
      this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.querySelector(".ytd-player").appendChild(document.querySelector(".html5-video-player")); if (!isPaused) {document.querySelector("video").play()}');
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [0, 0]);
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [720, 405]);
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [1200, 900]);
    },
    bilibiliAdapter() {
      this.$refs.webView.executeJavaScript('[document.querySelector("iframe"), document.querySelector(".live-player-ctnr"), document.querySelector("#bofqi")]', (r) => {
        this.bilibiliType = ['iframeStreaming', 'videoStreaming', 'video'][r.findIndex(i => i)];
      }).then(() => {
        console.log(this.bilibiliType);
        if (this.bilibiliType === 'video') {
          this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.body.appendChild(document.querySelector(".player")); if (!isPaused) {document.querySelector("video").play()}');
          this.$refs.webView.executeJavaScript('document.querySelector("#bofqi").style', (result) => {
            const videoAspectRatio = parseFloat(result.width) / (parseFloat(result.height) - 46);
            electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [videoAspectRatio]);
            electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [parseInt(180 * (parseFloat(result.width) / parseFloat(result.height)), 10), 180]);
            electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [parseInt(180 * videoAspectRatio, 10), 180]);
          });
          this.$refs.webView.executeJavaScript('document.querySelector("#app").style.display = "none"');
          this.$refs.webView.executeJavaScript('document.body.style.overflow = "hidden"');
          this.$refs.webView.executeJavaScript('document.querySelector(".bili-header-m").style.display = "none"');
        } else if (this.bilibiliType === 'videoStreaming') {
          electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [320 / 180]);
          electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [320, 180]);
          electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [320, 180]);
          this.$refs.webView.executeJavaScript('document.body.prepend(document.querySelector(".live-player-ctnr"))');
          this.$refs.webView.executeJavaScript('document.querySelector(".live-room-app").style.display = "none"');
        } else {
          electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [320 / 180]);
          electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [320, 180]);
          electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [320, 180]);
          this.$refs.webView.executeJavaScript('document.body.prepend(document.querySelector("iframe"));document.querySelector("#app").style.display = "none"');
          this.$refs.webView.executeJavaScript('var timer = setInterval(() => {' +
            'if (document.querySelector("iframe") && document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr")) {' +
            'console.log(document.querySelector("iframe").contentDocument.body);document.querySelector("iframe").contentDocument.body.prepend(document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr"));' +
            'document.querySelector("iframe").contentDocument.querySelector(".live-room-app").style.display = "none";' +
            'clearInterval(timer)' +
            '}' +
            '}, 100)');
        }
      });
    },
    bilibiliWatcher(val) {
      if (this.bilibiliType === 'video') {
        if (val >= 480) {
          this.$refs.webView.executeJavaScript('document.querySelector(".player").style.width= "100%"; document.querySelector(".player").style.height= "calc(100% + 46px)"');
        } else {
          this.$refs.webView.executeJavaScript('document.querySelector(".player").style.width= "100%"; document.querySelector(".player").style.height= "100%"');
        }
      } else if (this.bilibiliType === 'iframeStreaming') {
        this.$refs.webView.executeJavaScript(`document.body.style.height = "${this.browsingWinSize[1]}px"`);
      }
    },
    bilibiliRecover() {
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [0, 0]);
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [720, 405]);
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [1200, 900]);
      if (this.bilibiliType === 'video') {
        this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.querySelector("#bofqi").prepend(document.querySelector(".player")); if (!isPaused) {document.querySelector("video").play()}');
        this.$refs.webView.executeJavaScript('document.querySelector("#app").style.display = ""');
        this.$refs.webView.executeJavaScript('document.body.style.overflow = ""');
        this.$refs.webView.executeJavaScript('document.querySelector(".bili-header-m").style.display = ""');
        this.$refs.webView.executeJavaScript('document.querySelector(".player").style.height= "100%"');
      } else if (this.bilibiliType === 'videoStreaming') {
        this.$refs.webView.executeJavaScript('document.querySelector(".player-section").prepend(document.querySelector(".live-player-ctnr"))');
        this.$refs.webView.executeJavaScript('document.querySelector(".live-room-app").style.display = ""');
      } else if (this.bilibiliType === 'iframeStreaming') {
        this.$refs.webView.executeJavaScript('document.querySelector(".live-root").childNodes[0].prepend(document.querySelector("iframe"));;document.querySelector("#app").style.display = ""');
      }
    },
  },
  created() {
    electron.ipcRenderer.on('initial-url', (e, url) => {
      this.updateInitialUrl(url);
    });
    electron.ipcRenderer.on('browsingViewSize', (e, size) => {
      this.updateBrowsingSize(size);
    });
  },
  mounted() {
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
      this.$refs.webView.executeJavaScript('document.querySelector("video")', (r) => {
        this.$bus.$emit('web-info', {
          hasVideo: !!r,
          url: this.$refs.webView.getURL(),
          canGoBack: this.$refs.webView.canGoBack(),
          canGoForward: this.$refs.webView.canGoForward(),
        });
      });
    });
    electron.ipcRenderer.on('quit', () => {
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
      const parseUrl = urlParseLax(this.initialUrl);
      if (parseUrl.host.includes('youtube')) {
        this.pipType = 'youtube';
        this.youtubeAdapter();
      } else if (parseUrl.host.includes('bilibili')) {
        this.pipType = 'bilibili';
        this.bilibiliAdapter();
      }
      this.isPip = true;
    });
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
  .pip-buttons {
    width: auto;
    height: 20px;
    display: flex;
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 100;
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
