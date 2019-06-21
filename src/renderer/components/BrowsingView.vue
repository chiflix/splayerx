<template>
  <div class="browsing">
    <browsing-titlebar />
    <browsing-header v-show="!isPip" />
    <div
      v-show="loadingState && !isPip"
      class="loading-state loading-animation"
    />
    <div
      v-show="isPip"
      class="pip-buttons"
    >
      <Icon
        :style="{ marginRight: '12px' }"
        type="pipRecord"
      />
      <Icon
        @mouseup.native="handleExitPip"
        type="pipBack"
      />
    </div>
    <webview
      ref="webView"
      :src="availableUrl"
      :style="{ webkitAppRegion: isPip ? 'drag' : 'no-drag' }"
      :preload="preload"
      autosize
      class="web-view"
      allowpopups
    />
    <browsing-control
      v-show="!isPip"
      :class="controlToShow ? 'control-show-animation' : 'control-hide-animation'"
    />
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
  components: {
    'browsing-header': BrowsingHeader,
    'browsing-control': BrowsingControl,
    'browsing-titlebar': BrowsingTitleBar,
    Icon,
  },
  data() {
    return {
      quit: false,
      loadingState: false,
      startTime: 0,
      isPip: false,
      pipType: '',
      bilibiliType: 'video',
      supportedRecordHost: ['www.youtube.com', 'www.bilibili.com', 'www.youku.com', 'v.youku.com'],
      preload: `file:${require('path').resolve(__static, 'pip/preload.js')}`,
      windowScrollY: 0,
      controlToShow: true,
    };
  },
  computed: {
    ...mapGetters(['browsingWinSize', 'winPos', 'isFullScreen', 'initialUrl', 'browsingWinWidth']),
    availableUrl() {
      const parsedUrl = urlParseLax(this.initialUrl);
      return parsedUrl.protocol ? parsedUrl.href : `http://${this.initialUrl}`;
    },
  },
  watch: {
    browsingWinWidth(val) {
      if (this.isPip) {
        if (this.pipType === 'youtube') {
          this.youtubeWatcher(val);
        } else if (this.pipType === 'bilibili') {
          this.bilibiliWatcher(val);
        }
      }
    },
    windowScrollY(val, oldVal) {
      this.controlToShow = oldVal > val;
    },
  },
  methods: {
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
      updateBrowsingSize: browsingActions.UPDATE_BROWSING_SIZE,
      updateRecordUrl: browsingActions.UPDATE_RECORD_URL,
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
      this.$refs.webView.executeJavaScript('document.getElementsByTagName("ytd-app")[0].style.display = "";'
        + 'document.querySelector(".html5-video-player").style.left = "";'
        + 'document.querySelector(".html5-video-player").style.transform = "";'
        + 'document.querySelector(".html5-video-player").style.position = "relative";'
        + 'document.querySelector(".html5-video-player").style.width = "100%";'
        + 'document.querySelector(".html5-video-player").style.height = "100%";'
        + 'window.removeEventListener("resize", setZoom);'
        + 'document.querySelector("video").style.zoom = 1');
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
          this.$refs.webView.executeJavaScript('var timer = setInterval(() => {'
            + 'if (document.querySelector("iframe") && document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr")) {'
            + 'console.log(document.querySelector("iframe").contentDocument.body);document.querySelector("iframe").contentDocument.body.prepend(document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr"));'
            + 'document.querySelector("iframe").contentDocument.querySelector(".live-room-app").style.display = "none";'
            + 'clearInterval(timer)'
            + '}'
            + '}, 100)');
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
    window.addEventListener('beforeunload', () => {
      electron.ipcRenderer.send('store-browsing-last-size', this.isPip ? [1200, 900] : this.browsingWinSize);
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
      this.$refs.webView.reload();
    });
    this.$refs.webView.addEventListener('load-commit', () => {
      this.$refs.webView.blur();
      const loadUrl = this.$refs.webView.getURL();
      const recordIndex = this.supportedRecordHost.indexOf(urlParseLax(loadUrl).hostname);
      if (recordIndex !== -1) {
        switch (recordIndex) {
          case 0:
            this.updateRecordUrl({ youtube: loadUrl });
            break;
          case 1:
            this.updateRecordUrl({ bilibili: loadUrl });
            break;
          case 2:
          case 3:
            this.updateRecordUrl({ youku: loadUrl });
            break;
          default:
            break;
        }
      }
      this.$refs.webView.executeJavaScript('document.querySelector("video")', (r) => {
        this.$bus.$emit('web-info', {
          hasVideo: !!r,
          url: loadUrl,
          canGoBack: this.$refs.webView.canGoBack(),
          canGoForward: this.$refs.webView.canGoForward(),
        });
      });
    });
    this.$refs.webView.addEventListener('ipc-message', (evt) => {
      const { channel, args } = evt;
      switch (channel) {
        case 'scroll':
          console.log(args); // TODO:
          this.windowScrollY = args[0].windowScrollY;
          break;
        default:
          console.warn(`Unhandled ipc-message: ${channel}`, args);
          break;
      }
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
    background-image: linear-gradient(-90deg, #414141 18%, #555555 34%,
      #626262 51%, #626262 56%, #555555 69%, #414141 86%);
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
.control-show-animation {
  animation: control-show 100ms linear 1 normal forwards;
}
.control-hide-animation {
  animation: control-hide 100ms linear 1 normal forwards;
}
@keyframes loading {
  0% { transform: translateX(-100%) }
  25% { transform: translateX(-50%) }
  50% { transform: translateX(0%) }
  75% { transform: translateX(50%) }
  100% { transform: translateX(100%) }
}
@keyframes control-show {
  0% { transform: translate(-50%, 110px) }
  50% { transform: translate(-50%, 55px) }
  100% { transform: translate(-50%, 0px) }
}
@keyframes control-hide {
  0% { transform: translate(-50%, 0px) }
  50% { transform: translate(-50%, 55px) }
  100% { transform: translate(-50%, 110px) }
}
</style>
