<template>
  <div class="browsing">
    <browsing-header v-show="!isPip" />
    <div
      v-show="loadingState && !isPip"
      class="loading-state loading-animation"
    />
    <div
      ref="preventEventLayer"
      :style="{
        width: '100%',
        height: '100%',
        zIndex: '10',
        position: 'absolute',
      }"
      v-show="isPip && isDragging"
    />
    <div
      v-show="isPip"
      class="pip-buttons"
    >
      <Icon
        :style="{ marginBottom: '12px' }"
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
// @ts-ignore
import urlParseLax from 'url-parse-lax';
import { windowRectService } from '@/services/window/WindowRectService';
import { Browsing as browsingActions } from '@/store/actionTypes';
import BrowsingHeader from '@/components/BrowsingView/BrowsingHeader.vue';
import BrowsingControl from '@/components/BrowsingView/BrowsingControl.vue';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingView',
  components: {
    'browsing-header': BrowsingHeader,
    'browsing-control': BrowsingControl,
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
      isDragging: false,
      upOnBrowsing: false,
    };
  },
  computed: {
    ...mapGetters(['winPos', 'isFullScreen', 'initialUrl', 'winWidth', 'winSize', 'browsingSize']),
    availableUrl() {
      const parsedUrl = urlParseLax(this.initialUrl);
      return parsedUrl.protocol ? parsedUrl.href : `http://${this.initialUrl}`;
    },
  },
  watch: {
    winWidth(val: number) {
      if (this.isPip) {
        if (this.pipType === 'iqiyi') {
          this.iqiyiWatcher(val);
        } else if (this.pipType === 'bilibili') {
          this.bilibiliWatcher(val);
        }
      }
    },
    windowScrollY(val: number, oldVal: number) {
      this.controlToShow = oldVal > val;
    },
    initialUrl() {
      this.controlToShow = true;
    },
    controlToShow(val: boolean) {
      if (!val) {
        setTimeout(() => {
          this.$refs.browsingControl.$el.style.display = 'none';
        }, 100);
      } else if (!this.isPip) {
        this.$refs.browsingControl.$el.style.display = '';
      }
    },
  },
  created() {
    windowRectService.calculateWindowRect(
      this.browsingSize,
      true,
      this.winPos.concat(this.winSize),
    );
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [0]);
  },
  beforeDestroy() {
    this.$store.dispatch('updateBrowsingSize', this.isPip ? [1200, 900] : this.winSize);
  },
  mounted() {
    this.$refs.preventEventLayer.addEventListener('mousedown', () => {
      if (this.isPip) {
        this.upOnBrowsing = false;
        this.isDragging = false;
      }
    });
    this.$refs.preventEventLayer.addEventListener('mouseup', () => {
      if (this.isPip && this.isDragging) {
        this.upOnBrowsing = true;
      }
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
      const { channel, args }: { channel: string, args:
      { windowScrollY?: number, isDragging?: boolean }[] } = evt;
      switch (channel) {
        case 'scroll':
          this.windowScrollY = args[0].windowScrollY;
          break;
        case 'mousemove':
          if (!this.upOnBrowsing) {
            this.isDragging = args[0].isDragging;
          }
          break;
        default:
          console.warn(`Unhandled ipc-message: ${channel}`, args);
          break;
      }
    });
    this.$electron.ipcRenderer.on('quit', () => {
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
      this.$refs.webView.executeJavaScript('getComputedStyle(document.querySelector("video"))', (result: CSSStyleDeclaration) => {
        const videoAspectRatio = parseFloat(result.width as string)
                / parseFloat(result.height as string);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [videoAspectRatio]);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [420, Math.round(420 / videoAspectRatio)]);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [420, Math.round(420 / videoAspectRatio)]);
      });
      this.$refs.webView.executeJavaScript('document.body.prepend(document.querySelector("#flashbox"));document.querySelector(".qy-player-absolute").style.display = "none";document.getElementsByName("ttat")[0].style.display = "none";document.getElementsByClassName("iqp-barrage")[1].style.display = "none"');
      this.$refs.webView.executeJavaScript(`document.querySelector("#flashbox").style.width="${this.winWidth}px";document.querySelector("#flashbox").style.height="${this.winSize[1]}px"`);
    },
    iqiyiWatcher(val: number) {
      this.$refs.webView.executeJavaScript(`document.querySelector("#flashbox").style.width="${val}px";document.querySelector("#flashbox").style.height="${this.winSize[1]}px"`);
    },
    iqiyiRecover() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [0, 0]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [720, 405]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [1200, 900]);
      this.$refs.webView.executeJavaScript('document.querySelector("#iframaWrapper").prepend(document.querySelector("#flashbox"));document.querySelector(".qy-player-absolute").style.display = "";document.getElementsByName("ttat")[0].style.display = "";document.getElementsByClassName("iqp-barrage")[1].style.display = ""');
      this.$refs.webView.executeJavaScript('document.querySelector("#flashbox").style.width="100%";document.querySelector("#flashbox").style.height="100%"');
    },
    youtubeAdapter() {
      this.$refs.webView.executeJavaScript('getComputedStyle(document.querySelector("video"))', (result: CSSStyleDeclaration) => {
        const videoAspectRatio = parseFloat(result.width as string)
                / parseFloat(result.height as string);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [videoAspectRatio]);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [420, Math.round(420 / videoAspectRatio)]);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [420, Math.round(420 / videoAspectRatio)]);
      });
      this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.body.appendChild(document.querySelector(".html5-video-player")); if (!isPaused) {document.querySelector("video").play()}');
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.position = "absolute";document.getElementsByTagName("ytd-app")[0].style.display = "none"');
      this.$refs.webView.executeJavaScript('if (document.querySelector(".video-ads")) document.querySelector(".video-ads").style.display = "none"'); // remove youtube ads
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-container").style.width="100%";document.querySelector(".html5-video-container").style.height="100%";');
      this.$refs.webView.executeJavaScript('document.querySelector("video").style.width="100%";document.querySelector("video").style.height="100%";Object.defineProperty(document.querySelector("video").style, "width", {get: function(){return "100%"}, set: function(){}});Object.defineProperty(document.querySelector("video").style, "height", {get: function(){return "100%"}, set: function(){}})');
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.background = "rgba(0, 0, 0, 1)"');
      this.$refs.webView.executeJavaScript('document.querySelector(".ytp-chrome-bottom").style.width="calc(100vw - 24px)";Object.defineProperty(document.querySelector(".ytp-chrome-bottom").style, "width", {get: function(){return "calc(100vw - 24px)"}, set: function(){}});');
    },
    youtubeRecover() {
      this.$refs.webView.executeJavaScript('document.getElementsByTagName("ytd-app")[0].style.display = "";document.querySelector(".html5-video-player").style.position = "";');
      this.$refs.webView.executeJavaScript('Object.defineProperty(document.querySelector("video").style, "width", {value: "100%", writable: true});Object.defineProperty(document.querySelector("video").style, "height", {value: "100%", writable: true});');
      this.$refs.webView.executeJavaScript('Object.defineProperty(document.querySelector(".ytp-chrome-bottom").style, "width", {get: function(){return this._width}, set: function(val){this._width = val;document.querySelector(".ytp-chrome-bottom").style.setProperty("width", val);}});');
      this.$refs.webView.executeJavaScript('document.querySelector(".html5-video-player").style.background = "rgba(255, 255, 255, 1)"');
      this.$refs.webView.executeJavaScript('if (document.querySelector(".video-ads")) document.querySelector(".video-ads").style.display = ""'); // remove youtube ads
      this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.querySelector(".ytd-player").appendChild(document.querySelector(".html5-video-player")); if (!isPaused) {document.querySelector("video").play()}');
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [0, 0]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [720, 405]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [1200, 900]);
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
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [videoAspectRatio]);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [420, Math.round(420 / videoAspectRatio)]);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [420, Math.round(420 / videoAspectRatio)]);
          });
          this.$refs.webView.executeJavaScript('document.querySelector(".bilibili-player-video-danmaku").style.display = "none"');
          this.$refs.webView.executeJavaScript('document.querySelector("#app").style.display = "none"');
          this.$refs.webView.executeJavaScript('document.body.style.overflow = "hidden"');
          this.$refs.webView.executeJavaScript('document.querySelector(".bili-header-m").style.display = "none"');
          this.$refs.webView.executeJavaScript('document.querySelector(".bilibili-player-video-bottom-area").style.display="none"');
        } else if (this.bilibiliType === 'videoStreaming') {
          this.$refs.webView.executeJavaScript('getComputedStyle(document.querySelector("video"))', (result: CSSStyleDeclaration) => {
            const videoAspectRatio = parseFloat(result.width as string)
            / parseFloat(result.height as string);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [videoAspectRatio]);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [420, Math.round(420 / videoAspectRatio)]);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [420, Math.round(420 / videoAspectRatio)]);
          });
          this.$refs.webView.executeJavaScript('document.querySelector(".bilibili-live-player-video-danmaku").style.display = "none"');
          this.$refs.webView.executeJavaScript('document.body.prepend(document.querySelector(".live-player-ctnr"))');
          this.$refs.webView.executeJavaScript('document.querySelector(".live-room-app").style.display = "none"');
        } else {
          this.$refs.webView.executeJavaScript('getComputedStyle(document.querySelector("iframe").contentDocument.querySelector("video"))', (result: CSSStyleDeclaration) => {
            const videoAspectRatio = parseFloat(result.width as string)
                    / parseFloat(result.height as string);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [videoAspectRatio]);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [420, Math.round(420 / videoAspectRatio)]);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [420, Math.round(420 / videoAspectRatio)]);
          });
          this.$refs.webView.executeJavaScript('document.querySelector("iframe").contentDocument.querySelector(".bilibili-live-player-video-danmaku").style.display = "none"');
          this.$refs.webView.executeJavaScript('document.body.style.cssText = "overflow: hidden";Object.defineProperty(document.body.style, "overflow", {get: function(){return "hidden"}, set: function(){}});document.querySelector("iframe").contentDocument.querySelector(".aside-area").style.display = "none";');
          this.$refs.webView.executeJavaScript('document.querySelector(".game-header").style.display = "none";document.querySelector(".link-navbar").style.display = "none";document.querySelector("iframe").contentDocument.querySelector("#head-info-vm").style.display = "none";document.querySelector("iframe").contentDocument.querySelector(".aside-area-toggle-btn").style.display = "none";document.querySelector(".agile-sidebar").style.display = "none";document.querySelector("iframe").contentDocument.querySelector("#gift-control-vm").style.display = "none"');
          this.$refs.webView.executeJavaScript('var el = document.querySelector("iframe");el.style.cssText = "position: fixed;left: 0;top: 0;";Object.defineProperty(el.style, "position", {get: function(){ return "fixed"},set: function(){}});Object.defineProperty(el.style, "left", {get: function(){ return "0"},set: function(){}});Object.defineProperty(el.style, "top", {get: function(){ return "0"},set: function(){}});');
          this.$refs.webView.executeJavaScript(`document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.width = "${this.winWidth}px";document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.height = "${this.winSize[1]}px";document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.width ="${this.winWidth}px";document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.height ="${this.winSize[1]}px"`);
        }
      });
    },
    bilibiliWatcher(val: number) {
      if (this.bilibiliType === 'iframeStreaming') {
        this.$refs.webView.executeJavaScript(`document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.width = "${val}px";document.querySelector("iframe").contentDocument.querySelector(".player-ctnr").style.height = "${this.winSize[1]}px";document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.width ="${val}px";document.querySelector("iframe").contentDocument.querySelector(".live-player-ctnr").style.height ="${this.winSize[1]}px"`);
      }
    },
    bilibiliRecover() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [0, 0]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [720, 405]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', [1200, 900]);
      if (this.bilibiliType === 'video') {
        this.$refs.webView.executeJavaScript('var isPaused = document.querySelector("video").paused;document.querySelector("#bofqi").prepend(document.querySelector(".player")); if (!isPaused) {document.querySelector("video").play()}');
        this.$refs.webView.executeJavaScript('document.querySelector("#app").style.display = ""');
        this.$refs.webView.executeJavaScript('document.querySelector(".bilibili-player-video-danmaku").style.display = ""');
        this.$refs.webView.executeJavaScript('document.body.style.overflow = ""');
        this.$refs.webView.executeJavaScript('document.querySelector(".bili-header-m").style.display = ""');
        this.$refs.webView.executeJavaScript('document.querySelector(".player").style.height= "100%"');
        this.$refs.webView.executeJavaScript('document.querySelector(".bilibili-player-video-bottom-area").style.display=""');
      } else if (this.bilibiliType === 'videoStreaming') {
        this.$refs.webView.executeJavaScript('document.querySelector(".player-section").prepend(document.querySelector(".live-player-ctnr"))');
        this.$refs.webView.executeJavaScript('document.querySelector(".bilibili-live-player-video-danmaku").style.display = ""');
        this.$refs.webView.executeJavaScript('document.querySelector(".live-room-app").style.display = ""');
      } else if (this.bilibiliType === 'iframeStreaming') {
        this.$refs.webView.executeJavaScript('Object.defineProperty(document.body.style, "overflow", {value: "scroll",writable: true});document.body.style.cssText = "overflow: scroll";document.querySelector("iframe").contentDocument.querySelector(".aside-area").style.display = "";');
        this.$refs.webView.executeJavaScript('document.querySelector(".game-header").style.display = "";document.querySelector(".link-navbar").style.display = "";document.querySelector("iframe").contentDocument.querySelector("#head-info-vm").style.display = "";document.querySelector("iframe").contentDocument.querySelector(".aside-area-toggle-btn").style.display = "";document.querySelector(".agile-sidebar").style.display = "";document.querySelector("iframe").contentDocument.querySelector("#gift-control-vm").style.display = ""');
        this.$refs.webView.executeJavaScript('document.querySelector("iframe").contentDocument.querySelector(".bilibili-live-player-video-danmaku").style.display = ""');
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
    width: 20px;
    height: auto;
    display: flex;
    padding: 22px 15px 22px 15px;
    border-radius: 40px;
    flex-direction: column;
    justify-content: space-between;
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.4);
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
