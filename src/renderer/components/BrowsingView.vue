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
      :style="{ webkitAppRegion: 'drag' }"
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
      browsingWindowClose: false,
      browserIds: [1, 2],
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
      this.$electron.ipcRenderer.send('update-enabled', 'history.back', this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.canGoBack());
      this.$electron.ipcRenderer.send('update-enabled', 'history.forward', this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.canGoForward());
      if (val) {
        this.hasVideo = false;
        this.$electron.ipcRenderer.send('update-enabled', 'window.pip', false);
        this.$refs.browsingHeader.updateWebInfo({
          hasVideo: this.hasVideo,
          url: loadUrl,
          canGoBack: this.$electron.remote.getCurrentWindow()
            .getBrowserViews()[0].webContents.canGoBack(),
          canGoForward: this.$electron.remote.getCurrentWindow()
            .getBrowserViews()[0].webContents.canGoForward(),
        });
      } else {
        if (this.pipRestore) {
          this.pipAdapter();
          this.pipRestore = false;
        }
        this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents
          .executeJavaScript(this.calculateVideoNum, (r: number) => {
            this.hasVideo = recordIndex === 0 && !getVideoId(loadUrl).id ? false : !!r;
            this.$electron.ipcRenderer.send('update-enabled', 'window.pip', this.hasVideo);
            this.$refs.browsingHeader.updateWebInfo({
              hasVideo: this.hasVideo,
              url: loadUrl,
              canGoBack: this.$electron.remote.getCurrentWindow()
                .getBrowserViews()[0].webContents.canGoBack(),
              canGoForward: this.$electron.remote.getCurrentWindow()
                .getBrowserViews()[0].webContents.canGoForward(),
            });
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
    this.initialBrowserViewRect();
  },
  mounted() {
    this.$bus.$on('toggle-reload', this.handleUrlReload);
    this.$bus.$on('toggle-back', this.handleUrlBack);
    this.$bus.$on('toggle-forward', this.handleUrlForward);
    this.$bus.$on('toggle-pip', () => {
      const focusedOnMainWindow = this.$electron.remote.getCurrentWindow().isFocused();
      setTimeout(() => {
        if (this.acceleratorAvailable) {
          if (!focusedOnMainWindow) {
            this.updateIsPip(false);
            this.exitPipOperation();
          } else if (this.hasVideo) {
            if (this.isPip) {
              this.shiftPipOperation();
            } else {
              this.updateIsPip(true);
              this.enterPipOperation();
            }
          }
        } else {
          this.acceleratorAvailable = true;
        }
      }, 0);
    });
    window.addEventListener('focus', () => {
      this.$electron.ipcRenderer.send('update-focused-window', true);
      this.$electron.ipcRenderer.send('update-enabled', 'history.back', this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.canGoBack());
      this.$electron.ipcRenderer.send('update-enabled', 'history.forward', this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.canGoForward());
      this.$electron.ipcRenderer.send('update-enabled', 'window.keepPlayingWindowFront', false);
      const loadUrl = this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.getURL();
      const recordIndex = this.supportedRecordHost.indexOf(urlParseLax(loadUrl).hostname);
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents
        .executeJavaScript(this.calculateVideoNum, (r: number) => {
          this.hasVideo = recordIndex === 0 && !getVideoId(loadUrl).id ? false : !!r;
          this.$electron.ipcRenderer.send('update-enabled', 'window.pip', this.hasVideo);
        });
    });
    window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
      this.$electron.ipcRenderer.send('remove-browser');
      this.removeListener();
      if (!this.asyncTasksDone) {
        e.returnValue = false;
        if (this.isPip) {
          this.$electron.ipcRenderer.send('store-pip-pos');
        } else {
          this.$store.dispatch('updateBrowsingSize', this.winSize);
          this.$store.dispatch('updateBrowsingPos', this.winPos);
        }
        asyncStorage.set('browsing', {
          pipSize: this.pipSize,
          pipPos: this.pipPos,
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
    });
    this.$bus.$on('back-to-landingview', () => {
      this.backToLandingView = true;
      this.$bus.$off();
      this.$router.push({
        name: 'landing-view',
      });
    });
    this.$electron.ipcRenderer.on('current-browser-id', (e: Event, ids: number[]) => {
      this.browserIds = ids;
    });
    this.$electron.ipcRenderer.on('update-browser-view', (e: Event, isShift: boolean) => {
      this.initialBrowserViewRect();
      this.addListenerToBrowser();
      if (isShift) {
        const loadUrl = this.$electron.remote.getCurrentWindow()
          .getBrowserViews()[0].webContents.getURL();
        const recordIndex = this.supportedRecordHost.indexOf(urlParseLax(loadUrl).hostname);
        this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents
          .executeJavaScript(this.calculateVideoNum, (r: number) => {
            this.hasVideo = recordIndex === 0 && !getVideoId(loadUrl).id ? false : !!r;
            this.$electron.ipcRenderer.send('update-enabled', 'window.pip', this.hasVideo);
            this.$refs.browsingHeader.updateWebInfo({
              hasVideo: this.hasVideo,
              url: loadUrl,
              canGoBack: this.$electron.remote.getCurrentWindow()
                .getBrowserViews()[0].webContents.canGoBack(),
              canGoForward: this.$electron.remote.getCurrentWindow()
                .getBrowserViews()[0].webContents.canGoForward(),
            });
          });
      }
    });
    this.$electron.ipcRenderer.on('handle-exit-pip', () => {
      this.handleExitPip();
    });
    this.$electron.ipcRenderer.on('handle-danmu-display', () => {
      this.handleDanmuDisplay();
    });
    this.$electron.ipcRenderer.on('store-pip-pos', (e: Event, pos: number[]) => {
      this.$store.dispatch('updatePipPos', pos);
    });
    this.$electron.ipcRenderer.on('pip-window-size', (e: Event, size: number[]) => {
      this.$store.dispatch('updatePipSize', size);
    });
    this.$electron.ipcRenderer.on('quit', () => {
      this.quit = true;
    });
    this.$electron.ipcRenderer.on('update-header-to-show', (ev: Event, headerToShow: boolean) => {
      this.headerToShow = headerToShow;
    });
    this.$electron.ipcRenderer.on('update-pip-state', () => {
      this.browsingWindowClose = true;
      this.updateIsPip(false);
    });
    this.addListenerToBrowser();
  },
  beforeDestroy() {
    this.$electron.ipcRenderer.send('remove-browser');
    asyncStorage.set('browsing', {
      pipSize: this.pipSize,
      pipPos: this.pipPos,
      browsingSize: this.browsingSize,
      browsingPos: this.browsingPos,
      barrageOpen: this.barrageOpen,
    }).then(() => {
      if (this.isPip) {
        this.$electron.ipcRenderer.send('store-pip-pos');
      } else {
        this.$store.dispatch('updateBrowsingSize', this.winSize);
        this.$store.dispatch('updateBrowsingPos', this.winPos);
      }
      this.updateIsPip(false);
    }).finally(() => {
      if (this.backToLandingView) {
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
    handleBookmarkOpen(url: string) {
      this.removeListener();
      this.hasVideo = false;
      this.$electron.ipcRenderer.send('update-enabled', 'window.pip', false);
      this.$refs.browsingHeader.updateWebInfo({
        hasVideo: this.hasVideo,
      });
      this.$electron.ipcRenderer.send('shift-page-tab', url);
    },
    addListenerToBrowser() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.addListener('ipc-message', (evt: Event, channel: string, args: any) => {
        this.ipcMessage(channel, args);
      });
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.addListener('dom-ready', this.domReady);
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.addListener('new-window', (e: Event, url: string, disposition: string) => {
        this.newWindow(url, disposition);
      });
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.addListener('did-start-navigation', (e: Event, url: string) => {
        this.didStartNavigation(url);
      });
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.addListener('did-stop-loading', this.didStopLoading);
    },
    removeListener() {
      const currentWebContents = this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents;
      currentWebContents.removeListener('did-stop-loading', this.didStopLoading);
      currentWebContents.removeListener('dom-ready', this.domReady);
      currentWebContents.removeListener('ipc-message', this.ipcMessage);
      currentWebContents.removeListener('did-start-navigation', this.didStartNavigation);
      currentWebContents.removeListener('new-window', this.newWindow);
    },
    newWindow(url: string, disposition: string) {
      if (disposition !== 'new-window') {
        this.handleOpenUrl({ url });
      }
    },
    initialBrowserViewRect() {
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].setBounds({
        x: 0, y: 36, width: this.browsingSize[0], height: this.browsingSize[1] - 36,
      });
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].setAutoResize({ width: true, height: true });
    },
    didStartNavigation(url: string) {
      if (!url || url === 'about:blank') return;
      this.startTime = new Date().getTime();
      this.loadingState = true;
      const loadUrl = this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.getURL();
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
          console.warn(`Unhandled ipc-message: ${channel}`, args);
          break;
      }
    },
    domReady() {
      window.focus();
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.focus();
      if (process.env.NODE_ENV === 'development') this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.openDevTools();
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
      if (!url || url === 'about:blank') return;
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.loadURL(urlParseLax(url).protocol ? url : `https:${url}`);
    },
    pipAdapter() {
      const parseUrl = urlParseLax(this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.getURL());
      if (parseUrl.host.includes('youtube')) {
        this.pipType = 'youtube';
        this.youtubeAdapter();
      } else if (parseUrl.host.includes('bilibili')) {
        this.pipType = 'bilibili';
        this.bilibiliAdapter();
      } else if (parseUrl.host.includes('iqiyi')) {
        this.pipType = 'iqiyi';
        this.iqiyiAdapter();
      } else {
        this.pipType = 'others';
        this.othersAdapter();
      }
    },
    currentPipBrowserView() {
      const currentBrowserView = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      return this.$electron.remote.BrowserView
        .fromId(this.browserIds.find((id: number) => id !== currentBrowserView.id));
    },
    handleWindowChangeEnterPip() {
      const currentBrowserView = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      const newDisplayId = this.$electron.remote.screen
        .getDisplayNearestPoint({ x: this.winPos[0], y: this.winPos[1] }).id;
      const useDefaultPosition = !this.pipPos.length
        || (this.oldDisplayId !== newDisplayId && this.oldDisplayId !== -1);
      this.oldDisplayId = newDisplayId;
      currentBrowserView.setBounds({
        x: 0, y: 36, width: this.winSize[0], height: this.winSize[1] - 36,
      });
      currentBrowserView.setAutoResize({ width: true, height: true });
      this.currentPipBrowserView().webContents
        .executeJavaScript(this.getVideoStyle, (result: CSSStyleDeclaration) => {
          const videoAspectRatio = parseFloat(result.width as string)
            / parseFloat(result.height as string);
          this.$electron.ipcRenderer.send('callBrowsingWindowMethod', 'setAspectRatio', [videoAspectRatio]);
          this.$electron.ipcRenderer.send('callBrowsingWindowMethod', 'setMinimumSize', [420, Math.round(420 / videoAspectRatio)]);
          if (useDefaultPosition) {
            this.$store.dispatch('updatePipPos', [window.screen.availLeft + 70,
              window.screen.availTop + window.screen.availHeight - 236 - 70])
              .then(() => {
                this.$electron.ipcRenderer.send('callBrowsingWindowMethod', 'setPosition', [window.screen.availLeft + 70,
                  window.screen.availTop + window.screen.availHeight - 236 - 70]);
              });
          } else {
            this.$electron.ipcRenderer.send('callBrowsingWindowMethod', 'setPosition', this.pipPos);
          }
          const calculateSize = this.pipSize[0] / this.pipSize[1] >= videoAspectRatio
            ? [this.pipSize[0], Math.round(this.pipSize[0] / videoAspectRatio)]
            : [Math.round(this.pipSize[1] * videoAspectRatio), this.pipSize[1]];
          this.$electron.ipcRenderer.send('callBrowsingWindowMethod', 'setSize', calculateSize);
          this.$electron.ipcRenderer.send('set-control-bounds', {
            x: Math.round(calculateSize[0] - 65),
            y: Math.round(calculateSize[1] / 2 - 54),
            width: 50,
            height: 104,
          });
          this.currentPipBrowserView().setBounds({
            x: 0, y: 0, width: Math.round(calculateSize[0]), height: Math.round(calculateSize[1]),
          });
        });
    },
    handleWindowChangeExitPip() {
      const newDisplayId = this.$electron.remote.screen
        .getDisplayNearestPoint({ x: this.winPos[0], y: this.winPos[1] }).id;
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].setAutoResize({ width: false, height: false });
      this.$electron.remote.getCurrentWindow().getBrowserViews()[0].setBounds({
        x: 0, y: 36, width: this.winSize[0], height: this.winSize[1] - 36,
      });
      // if (this.oldDisplayId !== newDisplayId) {
      //   windowRectService.calculateWindowRect(
      //     this.browsingSize,
      //     true,
      //     this.winPos.concat(this.winSize),
      //   );
      // } else {
      //   this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', this.browsingSize);
      //   this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', this.browsingPos);
      // }
      this.oldDisplayId = newDisplayId;
      // this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [0]);
      // this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [570, 375]);
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].setAutoResize({ width: true, height: true });
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
      if (this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.canGoForward()) {
        this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.goForward();
      }
    },
    handleUrlBack() {
      if (this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.canGoBack()) {
        this.$electron.remote.getCurrentWindow().getBrowserViews()[0].webContents.goBack();
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
    shiftPipOperation() {
      this.$electron.ipcRenderer.send('shift-pip');
      this.$store.dispatch('updateBrowsingSize', this.winSize);
      this.$store.dispatch('updateBrowsingPos', this.winPos);
      this.pipAdapter();
      const opacity = ['youtube', 'others'].includes(this.pipType) || (this.pipType === 'bilibili' && this.bilibiliType === 'others') ? 0.2 : 1;
      this.$electron.ipcRenderer.send('init-danmu-state', { opacity, barrageOpen: opacity === 1 ? this.barrageOpen : false });
    },
    enterPipOperation() {
      this.$electron.ipcRenderer.send('enter-pip');
      this.$store.dispatch('updateBrowsingSize', this.winSize);
      this.$store.dispatch('updateBrowsingPos', this.winPos);
      this.pipAdapter();
      const opacity = ['youtube', 'others'].includes(this.pipType) || (this.pipType === 'bilibili' && this.bilibiliType === 'others') ? 0.2 : 1;
      this.$electron.ipcRenderer.send('init-danmu-state', { opacity, barrageOpen: opacity === 1 ? this.barrageOpen : false });
    },
    exitPipOperation() {
      if (!this.browsingWindowClose) {
        this.$electron.ipcRenderer.send('exit-pip');
        this.$electron.ipcRenderer.send('store-pip-pos');
        this.handleWindowChangeExitPip();
      }
      this.browsingWindowClose = false;
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
        if (this.isPip) {
          this.shiftPipOperation();
        } else {
          this.updateIsPip(true);
          this.enterPipOperation();
        }
      }
    },
    handleExitPip() {
      if (this.isPip) {
        this.exitPipOperation();
        this.updateIsPip(false);
      }
    },
    othersAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentPipBrowserView().webContents.executeJavaScript(this.othersPip.adapter);
    },
    othersWatcher() {
      this.currentPipBrowserView().webContents.executeJavaScript(this.othersPip.watcher);
    },
    othersRecover() {
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.executeJavaScript(this.othersPip.recover);
    },
    iqiyiAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentPipBrowserView().webContents.executeJavaScript(this.iqiyiPip.adapter);
    },
    iqiyiWatcher() {
      this.currentPipBrowserView().webContents.executeJavaScript(this.iqiyiPip.watcher);
    },
    iqiyiRecover() {
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.executeJavaScript(this.iqiyiPip.recover);
    },
    youtubeAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentPipBrowserView().webContents.executeJavaScript(youtube.adapter);
    },
    youtubeRecover() {
      this.$electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.executeJavaScript(youtube.recover);
    },
    bilibiliAdapter() {
      this.currentPipBrowserView().webContents
        .executeJavaScript(bilibiliFindType, (r: (HTMLElement | null)[]) => {
          this.bilibiliType = ['bangumi', 'videoStreaming', 'iframeStreaming', 'video'][r.findIndex(i => i)] || 'others';
        }).then(() => {
          this.handleWindowChangeEnterPip();
          this.currentPipBrowserView().webContents.executeJavaScript(this.bilibiliPip.adapter);
        });
    },
    bilibiliWatcher() {
      this.currentPipBrowserView().webContents.executeJavaScript(this.bilibiliPip.watcher);
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
