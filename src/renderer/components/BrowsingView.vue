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
    />
    <browsing-control
      ref="browsingControl"
      v-show="!isPip"
      :class="controlToShow ? 'control-show-animation' : 'control-hide-animation'"
      :handle-enter-pip="handleEnterPip"
      :handle-url-reload="handleUrlReload"
      :handle-url-back="handleUrlBack"
      :handle-url-forward="handleUrlForward"
    />
  </div>
</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import electron from 'electron';
// @ts-ignore
import urlParseLax from 'url-parse-lax';
import { Browsing as browsingActions } from '@/store/actionTypes';
import BrowsingHeader from '@/components/BrowsingView/BrowsingHeader.vue';
import BrowsingControl from '@/components/BrowsingView/BrowsingControl.vue';
import Icon from '@/components/BaseIconContainer.vue';
import BrowsingTitleBar from '@/components/BrowsingView/BrowsingTitlebar.vue';

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
      supportedRecordHost: ['www.youtube.com', 'www.bilibili.com', 'www.iqiyi.com'],
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
    browsingWinWidth(val: number) {
      if (this.isPip) {
        if (this.pipType === 'youtube') {
          this.youtubeWatcher(val);
        } else if (this.pipType === 'bilibili') {
          this.bilibiliWatcher(val);
        } else {
          this.iqiyiWatcher(val);
        }
      }
    },
    windowScrollY(val: number, oldVal: number) {
      this.controlToShow = oldVal > val;
    },
    initialUrl() {
      this.controlToShow = true;
    },
  },
  created() {
    electron.ipcRenderer.on('initial-url', (e: Event, url: string) => {
      this.updateInitialUrl(url);
    });
    electron.ipcRenderer.on('browsingViewSize', (e: Event, size: number[]) => {
      this.updateBrowsingSize(size);
    });
  },
  mounted() {
    window.addEventListener('beforeunload', () => {
      electron.ipcRenderer.send('store-browsing-last-size', this.isPip ? [1200, 900] : this.browsingWinSize);
    });
    this.$refs.webView.addEventListener('load-commit', () => {
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
            this.updateRecordUrl({ iqiyi: loadUrl });
            break;
          default:
            break;
        }
      }
      this.$refs.webView.executeJavaScript('var el = document.querySelector("iframe");if (el && el.contentDocument) {document.getElementsByTagName("video").length + el.contentDocument.getElementsByTagName("video").length} else {document.getElementsByTagName("video").length}', (r: number) => {
        this.$refs.browsingControl.updateWebInfo({
          hasVideo: !!r,
          url: loadUrl,
          canGoBack: this.$refs.webView.canGoBack(),
          canGoForward: this.$refs.webView.canGoForward(),
        });
      });
    });
    this.$refs.webView.addEventListener('ipc-message', (evt: any) => {
      const { channel, args }: { channel: string, args: { windowScrollY: number }[] } = evt;
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
      window.focus();
      this.$refs.webView.focus();
      this.$refs.webView.openDevTools();
    });
    this.$refs.webView.addEventListener('new-window', (e: any) => { // new tabs
      this.updateInitialUrl(e.url);
    });
    this.$refs.webView.addEventListener('did-start-loading', () => {
      this.startTime = new Date().getTime();
      this.loadingState = true;
    });
    this.$refs.webView.addEventListener('did-stop-loading', () => {
      const loadingTime: number = new Date().getTime() - this.startTime;
      if (loadingTime % 3000 === 0) {
        this.loadingState = false;
      } else {
        setTimeout(() => {
          this.loadingState = false;
        }, 3000 - (loadingTime % 3000));
      }
    });
  },
  methods: {
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
      updateBrowsingSize: browsingActions.UPDATE_BROWSING_SIZE,
      updateRecordUrl: browsingActions.UPDATE_RECORD_URL,
    }),
    handleUrlForward() {
      if (this.$refs.webView.canGoForward()) {
        this.$refs.webView.goForward();
      }
    },
    handleUrlBack() {
      if (this.$refs.webView.canGoBack()) {
        this.$refs.webView.goBack();
      }
    },
    handleUrlReload() {
      this.$refs.webView.reload();
    },
    handleEnterPip() {
      const parseUrl = urlParseLax(this.initialUrl);
      if (parseUrl.host.includes('youtube')) {
        this.pipType = 'youtube';
        this.youtubeAdapter();
      } else if (parseUrl.host.includes('bilibili')) {
        this.pipType = 'bilibili';
        this.bilibiliAdapter();
      } else {
        this.pipType = 'iqiyi';
        this.iqiyiAdapter();
      }
      this.isPip = true;
    },
    handleExitPip() {
      if (this.isPip) {
        if (this.pipType === 'youtube') {
          this.youtubeRecover();
        } else if (this.pipType === 'bilibili') {
          this.bilibiliRecover();
        } else {
          this.iqiyiRecover();
        }
        this.isPip = false;
      }
    },
    iqiyiAdapter() {
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [320 / 180]);
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [320, 180]);
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [320, 180]);
      this.$refs.webView.executeJavaScript('document.body.style.overflow = "hidden";document.querySelector(".qy-flash-box").style.cssText = "position: fixed; left: 0; top: 0; z-index: 9999"');
      this.$refs.webView.executeJavaScript(`setTimeout(() => {document.querySelector(".flash-box").style.width="${this.browsingWinSize[0]}px";document.querySelector(".flash-box").style.height="${this.browsingWinSize[1]}px"}, 0)`);
    },
    iqiyiWatcher(val: number) {
      this.$refs.webView.executeJavaScript(`setTimeout(() => {document.querySelector(".flash-box").style.width="${val}px";document.querySelector(".flash-box").style.height="${this.browsingWinSize[1]}px"}, 0)`);
    },
    iqiyiRecover() {
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [0, 0]);
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [720, 405]);
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [1200, 900]);
      this.$refs.webView.executeJavaScript('document.body.style.overflow = "";document.querySelector(".qy-flash-box").style.cssText = `position: ""; left: ""; top: ""; z-index: ""`');
      this.$refs.webView.executeJavaScript('document.querySelector(".flash-box").style.width="100%";document.querySelector(".flash-box").style.height="100%"');
    },
    youtubeAdapter() {
      this.$refs.webView.executeJavaScript('document.querySelector("video").style', (result: CSSStyleDeclaration) => {
        const aspectRatio: number[] = [parseFloat(result.width as string)
          / parseFloat(result.height as string)];
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', aspectRatio);
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [180 * aspectRatio[0], 180]);
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [180 * aspectRatio[0], 180]);
      });
      this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.body.appendChild(document.querySelector(".html5-video-player")); if (!isPaused) {document.querySelector("video").play()}');
      this.$refs.webView.executeJavaScript('document.getElementsByTagName("ytd-app")[0].style.display = "none"');
      this.$refs.webView.executeJavaScript('if (document.querySelector(".video-ads")) document.querySelector(".video-ads").style.display = "none"'); // remove youtube ads
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.left = "50%";document.querySelector(".html5-video-player").style.transform = "translateX(-50%)";');
      this.$refs.webView.executeJavaScript('var setZoom = function() {setTimeout(() => { document.querySelector("video").style.zoom = document.body.clientWidth / parseFloat(document.querySelector("video").style.width);document.querySelector(".ytp-chrome-bottom").style.width = "calc(100% - 24px)"; }, 250);};window.addEventListener("resize", setZoom);');
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.background = "rgba(0, 0, 0, 1)"');
    },
    youtubeWatcher(val: number) {
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
      this.$refs.webView.executeJavaScript('[document.querySelector(".live-player-ctnr"), document.querySelector("iframe"), document.querySelector("#bofqi")]', (r: (HTMLElement | null)[]) => {
        this.bilibiliType = ['videoStreaming', 'iframeStreaming', 'video'][r.findIndex(i => i)];
      }).then(() => {
        console.log(this.bilibiliType);
        if (this.bilibiliType === 'video') {
          this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.body.appendChild(document.querySelector(".player")); if (!isPaused) {document.querySelector("video").play()}');
          this.$refs.webView.executeJavaScript('document.querySelector("#bofqi").style', (result: CSSStyleDeclaration) => {
            const videoAspectRatio = parseFloat(result.width as string)
              / (parseFloat(result.height as string) - 46);
            electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setAspectRatio', [videoAspectRatio]);
            electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setMinimumSize', [180 * videoAspectRatio, 180]);
            electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setSize', [180 * videoAspectRatio, 180]);
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
          this.$refs.webView.executeJavaScript('document.body.style.cssText = "overflow: hidden";Object.defineProperty(document.body.style, "overflow", {get: function(){return "hidden"}, set: function(){}});document.querySelector("iframe").contentDocument.querySelector(".aside-area").style.display = "none";');
          this.$refs.webView.executeJavaScript('document.querySelector(".game-header").style.display = "none";document.querySelector(".link-navbar").style.display = "none";document.querySelector("iframe").contentDocument.querySelector("#head-info-vm").style.display = "none";document.querySelector("iframe").contentDocument.querySelector(".aside-area-toggle-btn").style.display = "none";document.querySelector(".agile-sidebar").style.display = "none";document.querySelector("iframe").contentDocument.querySelector("#gift-control-vm").style.display = "none"');
          this.$refs.webView.executeJavaScript('var el = document.querySelector("iframe");el.style.cssText = "position: fixed;left: 0;top: 0;";Object.defineProperty(el.style, "position", {get: function(){ return "fixed"},set: function(){}});Object.defineProperty(el.style, "left", {get: function(){ return "0"},set: function(){}});Object.defineProperty(el.style, "top", {get: function(){ return "0"},set: function(){}});');
        }
      });
    },
    bilibiliWatcher(val: number) {
      if (this.bilibiliType === 'video') {
        if (val >= 480) {
          this.$refs.webView.executeJavaScript('document.querySelector(".player").style.width= "100%"; document.querySelector(".player").style.height= "calc(100% + 46px)"');
        } else {
          this.$refs.webView.executeJavaScript('document.querySelector(".player").style.width= "100%"; document.querySelector(".player").style.height= "100%"');
        }
      } else if (this.bilibiliType === 'iframeStreaming') {
        this.$refs.webView.executeJavaScript(`document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.width = "${val}px";document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.height = "${this.browsingWinSize[1]}px";document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.width ="${val}px";document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.height ="${this.browsingWinSize[1]}px"`);
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
        this.$refs.webView.executeJavaScript('Object.defineProperty(document.body.style, "overflow", {value: "scroll",writable: true});document.body.style.cssText = "overflow: scroll";document.querySelector("iframe").contentDocument.querySelector(".aside-area").style.display = "";');
        this.$refs.webView.executeJavaScript('document.querySelector(".game-header").style.display = "";document.querySelector(".link-navbar").style.display = "";document.querySelector("iframe").contentDocument.querySelector("#head-info-vm").style.display = "";document.querySelector("iframe").contentDocument.querySelector(".aside-area-toggle-btn").style.display = "";document.querySelector(".agile-sidebar").style.display = "";document.querySelector("iframe").contentDocument.querySelector("#gift-control-vm").style.display = ""');
        this.$refs.webView.executeJavaScript('var el = document.querySelector("iframe");Object.defineProperty(el.style, "position", {value: "", writable: true});Object.defineProperty(el.style, "left", {value: "", writable: true});Object.defineProperty(el.style, "top", {value: "", writable: true});el.style.cssText = `position: "";left: "";top: "";`');
        this.$refs.webView.executeJavaScript('document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.cssText = `width: "";height: "";`;document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.cssText = `width: "";height: "";`');
      }
    },
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
