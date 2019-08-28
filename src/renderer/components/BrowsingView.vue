<template>
  <div
    :style="{
      pointerEvents: isFocused ? 'auto' : 'none',
      webkitAppRegion: 'no-drag',
    }"
    class="browsing"
  >
    <browsing-header
      ref="browsingHeader"
      :handle-enter-pip="handleEnterPip"
      :handle-url-reload="handleUrlReload"
      :handle-url-back="handleUrlBack"
      :handle-url-forward="handleUrlForward"
      :handle-bookmark-open="handleBookmarkOpen"
      :style="{ webkitAppRegion: isDarwin ? 'drag' : 'no-drag' }"
      v-show="headerToShow"
    />
    <div
      :style="{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'rgba(255, 255, 255, 0.18)',
        zIndex: '999'
      }"
      v-show="maskToShow"
    />
    <div
      v-show="loadingState && headerToShow"
      class="loading-state loading-animation"
    />
    <NotificationBubble />
  </div>
</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import fs from 'fs';
// @ts-ignore
import urlParseLax from 'url-parse-lax';
// @ts-ignore
import getVideoId from 'get-video-id';
import { windowRectService } from '@/services/window/WindowRectService';
import { Browsing as browsingActions } from '@/store/actionTypes';
import BrowsingHeader from '@/components/BrowsingView/BrowsingHeader.vue';
import asyncStorage from '@/helpers/asyncStorage';
import NotificationBubble from '@/components/NotificationBubble.vue';
import { bilibili, bilibiliFindType, bilibiliBarrageAdapt } from '../../shared/pip/bilibili';
import youtube from '../../shared/pip/youtube';
import iqiyi, { iqiyiBarrageAdapt } from '../../shared/pip/iqiyi';
import globalPip from '../../shared/pip/others';
import { getValidVideoRegex, getValidSubtitleRegex } from '../../shared/utils';
import MenuService from '@/services/menu/MenuService';

export default {
  name: 'BrowsingView',
  components: {
    'browsing-header': BrowsingHeader,
    NotificationBubble,
  },
  data() {
    return {
      quit: false,
      loadingState: false,
      startTime: 0,
      pipType: '',
      bilibiliType: 'video',
      supportedRecordHost: ['www.youtube.com', 'www.bilibili.com', 'www.iqiyi.com'],
      preload: `file:${require('path').resolve(__static, 'pip/preload.js')}`,
      maskToShow: false,
      dropFiles: [],
      hasVideo: false,
      calculateVideoNum: 'var iframe = document.querySelector("iframe");if (iframe && iframe.contentDocument) {document.getElementsByTagName("video").length + iframe.contentDocument.getElementsByTagName("video").length} else {document.getElementsByTagName("video").length}',
      getVideoStyle: 'getComputedStyle(document.querySelector("video") || document.querySelector("iframe").contentDocument.querySelector("video"))',
      pipBtnsKeepShow: false,
      asyncTasksDone: false,
      headerToShow: true,
      pipRestore: false,
      acceleratorAvailable: true,
      oldDisplayId: -1,
      backToLandingView: false,
      browserIds: [1, 2],
      menuService: null,
      currentUrl: '',
      canGoBack: false,
      canGoForward: false,
      adaptFinished: false,
      pipInfo: {},
    };
  },
  computed: {
    ...mapGetters(['winPos', 'isFullScreen', 'initialUrl', 'winWidth', 'winSize', 'browsingSize', 'pipSize', 'pipPos', 'barrageOpen', 'browsingPos', 'isFullScreen', 'isFocused', 'isPip']),
    isDarwin() {
      return process.platform === 'darwin';
    },
    iqiyiPip() {
      return iqiyi(this.barrageOpen, this.pipSize);
    },
    iqiyiBarrage() {
      return iqiyiBarrageAdapt(this.barrageOpen);
    },
    bilibiliPip() {
      return bilibili(
        this.bilibiliType,
        this.barrageOpen,
        this.pipSize,
      );
    },
    bilibiliBarrage() {
      return bilibiliBarrageAdapt(this.bilibiliType, this.barrageOpen);
    },
    othersPip() {
      return globalPip(this.pipSize);
    },
  },
  watch: {
    hasVideo(val: boolean) {
      this.$refs.browsingHeader.updateWebInfo({
        hasVideo: val,
      });
      this.updatePipState(val);
    },
    adaptFinished(val: boolean) {
      if (val) {
        const opacity = ['youtube', 'others'].includes(this.pipType) || (this.pipType === 'bilibili' && this.bilibiliType === 'others') ? 0.2 : 1;
        this.$electron.ipcRenderer.send(this.isPip ? 'shift-pip' : 'enter-pip', { opacity, barrageOpen: opacity === 1 ? this.barrageOpen : false, pipInfo: this.pipInfo });
        this.updateIsPip(true);
      }
    },
    barrageOpen(val: boolean) {
      this.$electron.ipcRenderer.send('update-danmu-state', val);
    },
    dropFiles(val: string[]) {
      this.backToLandingView = false;
      const onlyFolders = val.every((file: fs.PathLike) => fs.statSync(file).isDirectory());
      if (onlyFolders || val.every((file: fs.PathLike) => getValidVideoRegex()
        .test(file) && !getValidSubtitleRegex().test(file))) {
        val.forEach((file: fs.PathLike) => this.$electron.remote.app.addRecentDocument(file));
        if (onlyFolders) {
          this.openFolder(...val);
        } else {
          this.openFile(...val);
        }
      } else {
        this.$electron.ipcRenderer.send('drop-subtitle', val);
      }
    },
    isPip() {
      this.addListenerToBrowser();
    },
    pipSize() {
      if (this.isPip && this.pipType !== 'youtube') {
        if (this.pipType === 'iqiyi') {
          this.iqiyiWatcher();
        } else if (this.pipType === 'bilibili') {
          this.bilibiliWatcher();
        } else {
          this.othersWatcher();
        }
      }
    },
    loadingState(val: boolean) {
      const loadUrl = this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.getURL();
      const recordIndex = this.supportedRecordHost.indexOf(urlParseLax(loadUrl).hostname);
      this.updateCanGoBack(this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.canGoBack());
      this.updateCanGoForward(this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.canGoForward());
      if (val) {
        this.hasVideo = false;
      } else {
        if (this.pipRestore) {
          this.pipAdapter();
          this.pipRestore = false;
        }
        this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents
          .executeJavaScript(this.calculateVideoNum, (r: number) => {
            this.hasVideo = recordIndex === 0 && !getVideoId(loadUrl).id ? false : !!r;
          });
      }
    },
    headerToShow(val: boolean) {
      const currentView = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      if (!val) {
        currentView.setBounds({
          x: 0, y: 0, width: window.screen.width, height: window.screen.height,
        });
      } else {
        currentView.setBounds({
          x: 0, y: 36, width: this.browsingSize[0], height: this.browsingSize[1],
        });
      }
    },
  },
  created() {
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [570, 375]);
    windowRectService.calculateWindowRect(
      this.browsingSize,
      true,
      this.winPos.concat(this.winSize),
    );
    this.$store.dispatch('updateBrowsingPos', this.winPos);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [0]);
  },
  mounted() {
    this.menuService = new MenuService();
    this.$bus.$on('toggle-reload', this.handleUrlReload);
    this.$bus.$on('toggle-back', this.handleUrlBack);
    this.$bus.$on('toggle-forward', this.handleUrlForward);
    this.$bus.$on('toggle-pip', () => {
      const focusedOnMainWindow = this.$electron.remote.getCurrentWindow().isFocused();
      setTimeout(() => {
        if (this.acceleratorAvailable) {
          if (!focusedOnMainWindow) {
            this.handleExitPip();
          } else {
            this.handleEnterPip();
          }
        } else {
          this.acceleratorAvailable = true;
        }
      }, 0);
    });
    window.addEventListener('focus', this.focusHandler);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.$bus.$on('back-to-landingview', () => {
      this.removeListener();
      this.backToLandingView = true;
      this.$bus.$off();
      this.$router.push({
        name: 'landing-view',
      });
    });
    this.$electron.ipcRenderer.on('handle-exit-pip', () => {
      this.handleExitPip();
    });
    this.$electron.ipcRenderer.on('handle-danmu-display', () => {
      this.handleDanmuDisplay();
    });
    this.$electron.ipcRenderer.on('quit', () => {
      this.quit = true;
    });
    this.$electron.ipcRenderer.on('update-header-to-show', (e: Event, headerToShow: boolean) => {
      this.headerToShow = headerToShow;
    });
    this.$electron.ipcRenderer.on('update-pip-state', (e: Event, info: { size: number[], position: number[] }) => {
      this.$store.dispatch('updatePipPos', info.position);
      this.$store.dispatch('updatePipSize', info.size);
      this.updateIsPip(false);
    });
    this.$electron.ipcRenderer.on('update-browser-state', (e: Event, state: { url: string, canGoBack: boolean, canGoForward: boolean }) => {
      this.currentUrl = state.url;
      this.removeListener();
      this.addListenerToBrowser();
      this.canGoBack = state.canGoBack;
      this.canGoForward = state.canGoForward;
      const loadUrl = this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.getURL();
      const recordIndex = this.supportedRecordHost.indexOf(urlParseLax(loadUrl).hostname);
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents
        .executeJavaScript(this.calculateVideoNum, (r: number) => {
          this.hasVideo = recordIndex === 0 && !getVideoId(loadUrl).id ? false : !!r;
        });
      this.$bus.$emit('update-web-info', {
        canGoBack: state.canGoBack,
        canGoForward: state.canGoForward,
      });
    });
  },
  beforeDestroy() {
    this.removeListener();
    this.$store.dispatch('updateBrowsingSize', this.winSize);
    this.$store.dispatch('updateBrowsingPos', this.winPos);
    this.updateIsPip(false);
    asyncStorage.set('browsing', {
      browsingSize: this.browsingSize,
      browsingPos: this.browsingPos,
      barrageOpen: this.barrageOpen,
    }).finally(() => {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      window.removeEventListener('focus', this.focusHandler);
      if (this.backToLandingView) {
        this.$electron.ipcRenderer.send('remove-browser');
        windowRectService.uploadWindowBy(false, 'landing-view');
      }
    });
  },
  methods: {
    ...mapActions({
      updateRecordUrl: browsingActions.UPDATE_RECORD_URL,
      updateBarrageOpen: browsingActions.UPDATE_BARRAGE_OPEN,
      updateIsPip: browsingActions.UPDATE_IS_PIP,
    }),
    focusHandler() {
      this.menuService.updateFocusedWindow(true);
      this.updatePipState(this.hasVideo);
      this.updateCanGoBack(this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.canGoBack());
      this.updateCanGoForward(this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.canGoForward());
      this.updateReload(true);
      const loadUrl = this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.getURL();
      const recordIndex = this.supportedRecordHost.indexOf(urlParseLax(loadUrl).hostname);
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents
        .executeJavaScript(this.calculateVideoNum, (r: number) => {
          this.hasVideo = recordIndex === 0 && !getVideoId(loadUrl).id ? false : !!r;
        });
    },
    beforeUnloadHandler(e: BeforeUnloadEvent) {
      this.removeListener();
      this.$electron.ipcRenderer.send('remove-browser');
      if (!this.asyncTasksDone) {
        e.returnValue = false;
        this.$store.dispatch('updateBrowsingSize', this.winSize);
        this.$store.dispatch('updateBrowsingPos', this.winPos);
        asyncStorage.set('browsing', {
          browsingSize: this.browsingSize,
          browsingPos: this.browsingPos,
          barrageOpen: this.barrageOpen,
        }).finally(() => {
          this.asyncTasksDone = true;
          window.close();
        });
      } else if (this.quit) {
        this.$electron.remote.app.quit();
      }
    },
    updateReload(val: boolean) {
      if (this.$electron.remote.getCurrentWindow().isFocused()) {
        this.$electron.ipcRenderer.send('update-enabled', 'history.reload', val);
      }
    },
    updatePipState(available: boolean) {
      if (this.$electron.remote.getCurrentWindow().isFocused()) {
        this.menuService.updateMenuItemEnabled('browsing.window.pip', available);
      }
    },
    updateCanGoBack(val: boolean) {
      if (this.$electron.remote.getCurrentWindow().isFocused()) {
        this.$electron.ipcRenderer.send('update-enabled', 'history.back', val);
      }
    },
    updateCanGoForward(val: boolean) {
      if (this.$electron.remote.getCurrentWindow().isFocused()) {
        this.$electron.ipcRenderer.send('update-enabled', 'history.forward', val);
      }
    },
    handleBookmarkOpen(url: string) {
      if (urlParseLax(this.currentUrl).hostname !== urlParseLax(url).hostname) {
        this.removeListener();
        this.hasVideo = false;
        this.$electron.ipcRenderer.send('change-channel', { url });
      }
    },
    addListenerToBrowser() {
      const view = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      view.webContents.addListener('ipc-message', (evt: Event, channel: string, args: any) => {
        this.ipcMessage(channel, args);
      });
      view.webContents.addListener('dom-ready', this.domReady);
      view.webContents.addListener('new-window', (e: Event, url: string, disposition: string) => {
        this.newWindow(url, disposition);
      });
      view.webContents.addListener('did-start-loading', this.didStartLoading);
      view.webContents.addListener('did-stop-loading', this.didStopLoading);
      view.webContents.addListener('will-navigate', (e: Event, url: string) => {
        this.willNavigate(url);
      });
    },
    removeListener() {
      const currentBrowserViews = this.$electron.remote.getCurrentWindow().getBrowserViews();
      if (currentBrowserViews.length) {
        const currentWebContents = currentBrowserViews[0].webContents;
        currentWebContents.removeListener('did-stop-loading', this.didStopLoading);
        currentWebContents.removeListener('dom-ready', this.domReady);
        currentWebContents.removeListener('ipc-message', this.ipcMessage);
        currentWebContents.removeListener('did-start-loading', this.didStartLoading);
        currentWebContents.removeListener('new-window', this.newWindow);
        currentWebContents.removeListener('will-navigate', this.willNavigate);
      }
    },
    newWindow(url: string, disposition: string) {
      if (disposition !== 'new-window') {
        this.handleOpenUrl({ url });
      }
    },
    willNavigate(url: string) {
      if (!url || url === 'about:blank' || urlParseLax(this.currentUrl).href === urlParseLax(url).href) return;
      this.currentUrl = urlParseLax(url).href;
      this.startTime = new Date().getTime();
      this.loadingState = true;
      this.$electron.ipcRenderer.send('create-browser-view', { url });
      this.removeListener();
    },
    didStartLoading() {
      const url = this.$electron.remote.getCurrentWindow()
        .getBrowserView().webContents.getURL();
      if (!url || url === 'about:blank' || urlParseLax(this.currentUrl).href === urlParseLax(url).href) return;
      this.currentUrl = urlParseLax(url).href;
      this.startTime = new Date().getTime();
      this.loadingState = true;
      this.$electron.ipcRenderer.send('create-browser-view', { url });
      this.removeListener();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcMessage(channel: string, args: any) {
      switch (channel) {
        case 'open-url':
          this.handleOpenUrl(args);
          break;
        case 'dragover':
        case 'dragleave':
          this.maskToShow = args.dragover;
          break;
        case 'drop':
          this.maskToShow = false;
          if ((args.files as string[]).length) {
            this.$electron.remote.getCurrentWindow().getBrowserViews()[0].setBounds({
              x: 0, y: 36, width: 0, height: 0,
            });
            this.dropFiles = args.files;
          }
          break;
        case 'left-drag':
          if (this.isPip) {
            if (args.windowSize) {
              this.$electron.ipcRenderer.send('callBrowsingWindowMethod', 'setBounds', [{
                x: args.x,
                y: args.y,
                width: args.windowSize[0],
                height: args.windowSize[1],
              }]);
            } else {
              this.$electron.ipcRenderer.send('callBrowsingWindowMethod', 'setPosition', [args.x, args.y]);
            }
          }
          break;
        case 'fullscreenchange':
          if (!this.isPip) {
            this.headerToShow = !args.isFullScreen;
          }
          break;
        case 'keydown':
          if (['INPUT', 'TEXTAREA'].includes(args.targetName as string)) {
            this.acceleratorAvailable = false;
          }
          break;
        default:
          break;
      }
    },
    domReady() {
      window.focus();
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.focus();
    },
    didStopLoading() {
      const loadingTime: number = new Date().getTime() - this.startTime;
      if (loadingTime % 3000 === 0) {
        this.loadingState = false;
      } else {
        setTimeout(() => {
          this.loadingState = false;
        }, 3000 - (loadingTime % 3000));
      }
    },
    handleOpenUrl({ url }: { url: string }) {
      if (!url || url === 'about:blank' || urlParseLax(url).href === urlParseLax(this.currentUrl).href) return;
      this.loadingState = true;
      this.currentUrl = urlParseLax(url).href;
      this.$electron.ipcRenderer.send('create-browser-view', { url: urlParseLax(url).href });
    },
    pipAdapter() {
      const parseUrl = urlParseLax(this.currentPipBrowserView().webContents.getURL());
      if (parseUrl.hostname.includes('youtube')) {
        this.pipType = 'youtube';
        this.youtubeAdapter();
      } else if (parseUrl.hostname.includes('bilibili')) {
        this.pipType = 'bilibili';
        this.bilibiliAdapter();
      } else if (parseUrl.hostname.includes('iqiyi')) {
        this.pipType = 'iqiyi';
        this.iqiyiAdapter();
      } else {
        this.pipType = 'others';
        this.othersAdapter();
      }
    },
    currentPipBrowserView() {
      return this.$electron.remote.getCurrentWindow().getBrowserView();
    },
    handleWindowChangeEnterPip() {
      const newDisplayId = this.$electron.remote.screen
        .getDisplayNearestPoint({ x: this.winPos[0], y: this.winPos[1] }).id;
      const useDefaultPosition = !this.pipPos.length
        || (this.oldDisplayId !== newDisplayId && this.oldDisplayId !== -1);
      this.oldDisplayId = newDisplayId;
      this.currentPipBrowserView().webContents
        .executeJavaScript(this.getVideoStyle).then((result: CSSStyleDeclaration) => {
          const videoAspectRatio = parseFloat(result.width as string)
            / parseFloat(result.height as string);
          if (useDefaultPosition) {
            this.$store.dispatch('updatePipPos', [window.screen.availLeft + 70,
              window.screen.availTop + window.screen.availHeight - 236 - 70])
              .then(() => {
                this.$electron.ipcRenderer.send('callBrowsingWindowMethod', 'setPosition', [window.screen.availLeft + 70,
                  window.screen.availTop + window.screen.availHeight - 236 - 70]);
              });
          }
          const calculateSize = this.pipSize[0] / this.pipSize[1] >= videoAspectRatio
            ? [this.pipSize[0], Math.round(this.pipSize[0] / videoAspectRatio)]
            : [Math.round(this.pipSize[1] * videoAspectRatio), this.pipSize[1]];
          this.pipInfo = {
            aspectRatio: videoAspectRatio,
            minimumSize: [420, Math.round(420 / videoAspectRatio)],
            pipSize: calculateSize,
            pipPos: this.pipPos,
          };
        });
    },
    handleWindowChangeExitPip() {
      const newDisplayId = this.$electron.remote.screen
        .getDisplayNearestPoint({ x: this.winPos[0], y: this.winPos[1] }).id;
      this.oldDisplayId = newDisplayId;
    },
    handleDanmuDisplay() {
      if (this.pipType === 'iqiyi') {
        this.updateBarrageOpen(!this.barrageOpen);
        this.currentPipBrowserView().webContents.executeJavaScript(this.iqiyiBarrage);
      } else if (this.pipType === 'bilibili') {
        this.updateBarrageOpen(!this.barrageOpen);
        this.currentPipBrowserView().webContents.executeJavaScript(this.bilibiliBarrage);
      }
    },
    handleUrlForward() {
      if (this.canGoForward) {
        this.removeListener();
        this.$electron.ipcRenderer.send('go-to-offset', 1);
      }
    },
    handleUrlBack() {
      if (this.canGoBack) {
        this.removeListener();
        this.$electron.ipcRenderer.send('go-to-offset', -1);
      }
    },
    handleUrlReload() {
      if (this.isPip) {
        this.pipRestore = true;
        this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.reload();
      } else {
        this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.reload();
      }
    },
    enterPipOperation() {
      this.$store.dispatch('updateBrowsingSize', this.winSize);
      this.$store.dispatch('updateBrowsingPos', this.winPos);
      this.pipAdapter();
    },
    exitPipOperation() {
      this.$electron.ipcRenderer.send('exit-pip');
      this.handleWindowChangeExitPip();
      if (this.pipType === 'youtube') {
        this.youtubeRecover();
      } else if (this.pipType === 'bilibili') {
        this.bilibiliRecover();
      } else if (this.pipType === 'iqiyi') {
        this.iqiyiRecover();
      } else {
        this.othersRecover();
      }
    },
    handleEnterPip() {
      if (this.hasVideo) {
        this.hasVideo = false;
        this.adaptFinished = false;
        this.enterPipOperation();
        this.updatePipState(false);
      }
    },
    handleExitPip() {
      if (this.isPip) {
        this.exitPipOperation();
        this.updateIsPip(false);
        const loadUrl = this.$electron.remote.getCurrentWindow()
          .getBrowserViews()[0].webContents.getURL();
        const recordIndex = this.supportedRecordHost.indexOf(urlParseLax(loadUrl).hostname);
        this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents
          .executeJavaScript(this.calculateVideoNum, (r: number) => {
            this.hasVideo = recordIndex === 0 && !getVideoId(loadUrl).id ? false : !!r;
          });
      }
    },
    othersAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentPipBrowserView().webContents.executeJavaScript(this.othersPip.adapter)
        .then(() => {
          this.adaptFinished = true;
        });
    },
    othersWatcher() {
      this.$electron.ipcRenderer.send('pip-watcher', this.othersPip.watcher);
    },
    othersRecover() {
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.executeJavaScript(this.othersPip.recover);
    },
    iqiyiAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentPipBrowserView().webContents.executeJavaScript(this.iqiyiPip.adapter).then(() => {
        this.adaptFinished = true;
      });
    },
    iqiyiWatcher() {
      this.$electron.ipcRenderer.send('pip-watcher', this.iqiyiPip.watcher);
    },
    iqiyiRecover() {
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.executeJavaScript(this.iqiyiPip.recover);
    },
    youtubeAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentPipBrowserView().webContents.executeJavaScript(youtube.adapter).then(() => {
        this.adaptFinished = true;
      });
    },
    youtubeRecover() {
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.executeJavaScript(youtube.recover);
    },
    bilibiliAdapter() {
      this.currentPipBrowserView().webContents
        .executeJavaScript(bilibiliFindType).then((r: (HTMLElement | null)[]) => {
          this.bilibiliType = ['bangumi', 'videoStreaming', 'iframeStreaming', 'video'][r.findIndex(i => i)] || 'others';
        }).then(() => {
          this.handleWindowChangeEnterPip();
          this.currentPipBrowserView().webContents.executeJavaScript(this.bilibiliPip.adapter);
        }).then(() => {
          this.adaptFinished = true;
        });
    },
    bilibiliWatcher() {
      this.$electron.ipcRenderer.send('pip-watcher', this.bilibiliPip.watcher);
    },
    bilibiliRecover() {
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.executeJavaScript(this.bilibiliPip.recover);
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
  background: rgba(255, 255, 255, 1);
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
