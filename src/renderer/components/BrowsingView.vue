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
    <div
      v-show="isPip && timeout"
      class="pip-buttons"
    >
      <Icon
        :style="{
          marginBottom: '12px',
          cursor: pipType === 'youtube' ? 'default' : 'pointer',
          opacity: danmuIconState,
        }"
        @mouseup.native="handleDanmuDisplay"
        @mouseenter.native="handleMouseenter"
        @mouseleave.native="handleMouseleave"
        :type="danmuType"
      />
      <Icon
        :style="{ cursor: 'pointer' }"
        @mouseup.native="handleExitPip"
        @mouseenter.native="handleMouseenter"
        @mouseleave.native="handleMouseleave"
        type="pipBack"
      />
    </div>
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
import Icon from '@/components/BaseIconContainer.vue';
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
    Icon,
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
      currentUrl: '',
      timeout: false,
      timer: 0,
      calculateVideoNum: 'var iframe = document.querySelector("iframe");if (iframe && iframe.contentDocument) {document.getElementsByTagName("video").length + iframe.contentDocument.getElementsByTagName("video").length} else {document.getElementsByTagName("video").length}',
      getVideoStyle: 'getComputedStyle(document.querySelector("video") || document.querySelector("iframe").contentDocument.querySelector("video"))',
      pipBtnsKeepShow: false,
      asyncTasksDone: false,
      headerToShow: true,
      menuService: null,
      pipRestore: false,
      acceleratorAvailable: true,
      oldDisplayId: -1,
      backToLandingView: false,
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
    danmuType() {
      return this.barrageOpen ? 'danmu' : 'noDanmu';
    },
    danmuIconState() {
      return ['youtube', 'others'].includes(this.pipType) || (this.pipType === 'bilibili' && this.bilibiliType === 'others') ? 0.2 : 1;
    },
    currentBrowserView() {
      return this.$electron.remote.BrowserView.getAllViews()[1];
    },
    currentPipBrowserView() {
      return this.$electron.remote.BrowserView.getAllViews()[0];
    },
  },
  watch: {
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
    isPip(val: boolean) {
      this.menuService.updatePip(val);
      this.$electron.ipcRenderer.send('update-enabled', 'window.pip', true);
      this.$electron.ipcRenderer.send('update-enabled', 'history.back', !val && this.currentBrowserView.webContents.canGoBack());
      this.$electron.ipcRenderer.send('update-enabled', 'history.forward', !val && this.currentBrowserView.webContents.canGoForward());
      if (!val) {
        this.$electron.ipcRenderer.send('exit-pip');
        this.$electron.ipcRenderer.send('store-pip-pos');
        this.$electron.ipcRenderer.send('update-enabled', 'window.keepPlayingWindowFront', false);
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
      } else {
        this.$electron.ipcRenderer.send('enter-pip');
        this.$store.dispatch('updateBrowsingSize', this.winSize);
        this.$store.dispatch('updateBrowsingPos', this.winPos);
        this.$electron.ipcRenderer.send('update-enabled', 'window.keepPlayingWindowFront', true);
        this.timeout = true;
        if (this.timer) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
          this.timeout = false;
        }, 3000);
        this.pipAdapter();
      }
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
      const loadUrl = this.currentBrowserView.webContents.getURL();
      const recordIndex = this.supportedRecordHost.indexOf(urlParseLax(loadUrl).hostname);
      this.$electron.ipcRenderer.send('update-enabled', 'history.back', this.currentBrowserView.webContents.canGoBack());
      this.$electron.ipcRenderer.send('update-enabled', 'history.forward', this.currentBrowserView.webContents.canGoForward());
      if (val) {
        this.hasVideo = false;
        this.$electron.ipcRenderer.send('update-enabled', 'window.pip', false);
        this.$refs.browsingHeader.updateWebInfo({
          hasVideo: this.hasVideo,
          url: loadUrl,
          canGoBack: this.currentBrowserView.webContents.canGoBack(),
          canGoForward: this.currentBrowserView.webContents.canGoForward(),
        });
      } else {
        if (this.pipRestore) {
          this.pipAdapter();
          this.pipRestore = false;
        }
        this.currentBrowserView.webContents
          .executeJavaScript(this.calculateVideoNum, (r: number) => {
            this.hasVideo = recordIndex === 0 && !getVideoId(loadUrl).id ? false : !!r;
            this.$electron.ipcRenderer.send('update-enabled', 'window.pip', this.hasVideo);
            this.$refs.browsingHeader.updateWebInfo({
              hasVideo: this.hasVideo,
              url: loadUrl,
              canGoBack: this.currentBrowserView.webContents.canGoBack(),
              canGoForward: this.currentBrowserView.webContents.canGoForward(),
            });
          });
      }
    },
    headerToShow(val: boolean) {
      const currentView = this.isPip ? this.currentPipBrowserView : this.currentBrowserView;
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
    this.currentBrowserView.setBounds({
      x: 0, y: 36, width: this.browsingSize[0], height: this.browsingSize[1] - 36,
    });
    this.currentBrowserView.setAutoResize({ width: true, height: true });
  },
  mounted() {
    this.menuService = new MenuService();
    this.$bus.$on('toggle-reload', this.handleUrlReload);
    this.$bus.$on('toggle-back', this.handleUrlBack);
    this.$bus.$on('toggle-forward', this.handleUrlForward);
    this.$bus.$on('toggle-pip', () => {
      setTimeout(() => {
        if (this.hasVideo && this.acceleratorAvailable) {
          this.updateIsPip(!this.isPip);
        }
        if (!this.acceleratorAvailable) {
          this.acceleratorAvailable = true;
        }
      }, 0);
    });
    window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
      this.$electron.ipcRenderer.send('remove-browser', this.isPip);
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
    (document.querySelector('#app') as HTMLElement).addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (this.isPip) {
          this.timeout = false;
          if (this.timer) {
            clearTimeout(this.timer);
          }
        }
      }, 50);
    });
    window.addEventListener('mousemove', () => {
      if (this.isPip && !this.pipBtnsKeepShow && this.isFocused) {
        this.timeout = true;
        if (this.timer) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
          this.timeout = false;
        }, 3000);
      }
    });
    this.$bus.$on('back-to-landingview', () => {
      this.backToLandingView = true;
      this.$bus.$off();
      this.$router.push({
        name: 'landing-view',
      });
    });
    this.$electron.ipcRenderer.on('store-pip-pos', (e: Event, pos: number[]) => {
      this.$store.dispatch('updatePipPos', pos);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,complexity
    this.currentBrowserView.webContents.addListener('ipc-message', (evt: any, channel: string, args: any) => { // https://github.com/electron/typescript-definitions/issues/27 fixed in 6.0.0
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
            this.currentBrowserView.setBounds({
              x: 0, y: 36, width: 0, height: 0,
            });
            this.dropFiles = args.files;
          }
          break;
        case 'mousemove':
          if (this.isPip) {
            this.timeout = true;
            if (this.timer) {
              clearTimeout(this.timer);
            }
            this.timer = setTimeout(() => {
              this.timeout = false;
            }, 3000);
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
    });
    this.$electron.ipcRenderer.on('pip-window-size', (e: Event, size: number[]) => {
      this.$store.dispatch('updatePipSize', size);
    });
    this.$electron.ipcRenderer.on('quit', () => {
      this.quit = true;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.$electron.ipcRenderer.on('update-header-to-show', (ev: any, headerToShow: boolean) => {
      this.headerToShow = headerToShow;
    });
    this.$electron.ipcRenderer.on('quit-pip', () => {
      this.isPip = false;
    });
    this.currentBrowserView.webContents.addListener('dom-ready', () => { // for webview test
      window.focus();
      this.currentBrowserView.webContents.focus();
      if (process.env.NODE_ENV === 'development') this.currentBrowserView.webContents.openDevTools();
    });
    // https://github.com/electron/typescript-definitions/issues/27 fixed in 6.0.0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentBrowserView.webContents.addListener('new-window', (e: any, url: string, disposition: string) => {
      if (disposition !== 'new-window') {
        this.handleOpenUrl({ url });
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentBrowserView.webContents.addListener('did-start-navigation', (e: any, url: string) => {
      if (!url || url === 'about:blank') return;
      this.startTime = new Date().getTime();
      this.loadingState = true;
      const loadUrl = this.currentBrowserView.webContents.getURL();
      this.currentUrl = loadUrl;
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
    });
    this.currentBrowserView.webContents.addListener('did-stop-loading', () => {
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
  beforeDestroy() {
    this.$electron.ipcRenderer.send('remove-browser', this.isPip);
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
    handleOpenUrl({ url }: { url: string }) {
      if (!url || url === 'about:blank') return;
      if (this.isPip) {
        this.updateIsPip(false);
      }
      this.currentBrowserView.webContents.loadURL(urlParseLax(url).protocol ? url : `https:${url}`);
    },
    pipAdapter() {
      const parseUrl = urlParseLax(this.currentUrl);
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
    handleMouseenter() {
      this.pipBtnsKeepShow = true;
      this.timeout = true;
      if (this.timer) {
        clearTimeout(this.timer);
      }
    },
    handleMouseleave() {
      this.pipBtnsKeepShow = false;
    },
    handleWindowChangeEnterPip() {
      const newDisplayId = this.$electron.remote.screen
        .getDisplayNearestPoint({ x: this.winPos[0], y: this.winPos[1] }).id;
      const useDefaultPosition = !this.pipPos.length
        || (this.oldDisplayId !== newDisplayId && this.oldDisplayId !== -1);
      this.oldDisplayId = newDisplayId;
      this.currentPipBrowserView.setBounds({
        x: 0, y: 36, width: this.winSize[0], height: this.winSize[1] - 36,
      });
      this.currentPipBrowserView.setAutoResize({ width: true, height: true });
      this.currentBrowserView.webContents
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
          this.currentBrowserView.setBounds({
            x: 0, y: 0, width: calculateSize[0], height: calculateSize[1],
          });
        });
    },
    handleWindowChangeExitPip() {
      const newDisplayId = this.$electron.remote.screen
        .getDisplayNearestPoint({ x: this.winPos[0], y: this.winPos[1] }).id;
      this.currentBrowserView.setAutoResize({ width: false, height: false });
      this.currentBrowserView.setBounds({
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
      this.currentBrowserView.setAutoResize({ width: true, height: true });
    },
    handleDanmuDisplay() {
      if (this.pipType === 'iqiyi') {
        this.updateBarrageOpen(!this.barrageOpen);
        this.currentBrowserView.webContents.executeJavaScript(this.iqiyiBarrage);
      } else if (this.pipType === 'bilibili') {
        this.updateBarrageOpen(!this.barrageOpen);
        this.currentBrowserView.webContents.executeJavaScript(this.bilibiliBarrage);
      }
    },
    handleUrlForward() {
      if (!this.isPip) {
        if (this.currentBrowserView.webContents.canGoForward()) {
          this.currentBrowserView.webContents.goForward();
        }
      } else if (this.currentPipBrowserView.webContents.canGoForward()) {
        this.currentPipBrowserView.webContents.goForward();
      }
    },
    handleUrlBack() {
      if (!this.isPip) {
        if (this.currentBrowserView.webContents.canGoBack()) {
          this.currentBrowserView.webContents.goBack();
        }
      } else if (this.currentPipBrowserView.webContents.canGoBack()) {
        this.currentPipBrowserView.webContents.goBack();
      }
    },
    handleUrlReload() {
      if (this.isPip) {
        this.pipRestore = true;
        this.currentPipBrowserView.webContents.reload();
      } else {
        this.currentBrowserView.webContents.reload();
      }
    },
    handleEnterPip() {
      if (this.hasVideo) {
        this.updateIsPip(true);
      }
    },
    handleExitPip() {
      if (this.isPip) {
        this.updateIsPip(false);
      }
    },
    othersAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentBrowserView.webContents.executeJavaScript(this.othersPip.adapter);
    },
    othersWatcher() {
      this.currentBrowserView.webContents.executeJavaScript(this.othersPip.watcher);
    },
    othersRecover() {
      this.currentBrowserView.webContents.executeJavaScript(this.othersPip.recover);
    },
    iqiyiAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentBrowserView.webContents.executeJavaScript(this.iqiyiPip.adapter);
    },
    iqiyiWatcher() {
      this.currentBrowserView.webContents.executeJavaScript(this.iqiyiPip.watcher);
    },
    iqiyiRecover() {
      this.currentBrowserView.webContents.executeJavaScript(this.iqiyiPip.recover);
    },
    youtubeAdapter() {
      this.handleWindowChangeEnterPip();
      this.currentBrowserView.webContents.executeJavaScript(youtube.adapter);
    },
    youtubeRecover() {
      this.currentBrowserView.webContents.executeJavaScript(youtube.recover);
    },
    bilibiliAdapter() {
      this.currentBrowserView.webContents
        .executeJavaScript(bilibiliFindType, (r: (HTMLElement | null)[]) => {
          this.bilibiliType = ['bangumi', 'videoStreaming', 'iframeStreaming', 'video'][r.findIndex(i => i)] || 'others';
        }).then(() => {
          this.handleWindowChangeEnterPip();
          this.currentBrowserView.webContents.executeJavaScript(this.bilibiliPip.adapter);
        });
    },
    bilibiliWatcher() {
      this.currentBrowserView.webContents.executeJavaScript(this.bilibiliPip.watcher);
    },
    bilibiliRecover() {
      this.currentBrowserView.webContents.executeJavaScript(this.bilibiliPip.recover);
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
