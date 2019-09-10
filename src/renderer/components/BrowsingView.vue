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
      :show-sidebar="showSidebar"
      :title="title"
      :is-loading="loadingState"
      :web-info="webInfo"
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
      v-show="showProgress"
      :style="{
        width: `${progress}%`,
      }"
      class="progress"
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
import { getValidVideoRegex, getValidSubtitleRegex } from '../../shared/utils';
import MenuService from '@/services/menu/MenuService';
import InjectJSManager from '../../shared/pip/InjectJSManager';

export default {
  name: 'BrowsingView',
  components: {
    'browsing-header': BrowsingHeader,
    NotificationBubble,
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      quit: false,
      loadingState: false,
      pipType: '',
      bilibiliType: 'video',
      preload: `file:${require('path').resolve(__static, 'pip/preload.js')}`,
      maskToShow: false,
      dropFiles: [],
      pipBtnsKeepShow: false,
      asyncTasksDone: false,
      headerToShow: true,
      acceleratorAvailable: true,
      oldDisplayId: -1,
      backToLandingView: false,
      // touchbar buttons
      sidebarButton: null,
      backwardButton: null,
      forwardButton: null,
      refreshButton: null,
      pipButton: null,
      browserIds: [1, 2],
      menuService: null,
      currentUrl: '',
      adaptFinished: false,
      pipInfo: {},
      isGlobal: false,
      startLoading: false,
      title: 'Splayer',
      progress: 0,
      showProgress: false,
      readyState: '',
      oauthRegex: [
        /^https:\/\/cnpassport.youku.com\//i,
        /^https:\/\/passport.iqiyi.com\/apis\/thirdparty/i,
        /^https:\/\/api.weibo.com\/oauth2/i,
        /^https:\/\/graph.qq.com\//i,
        /^https:\/\/open.weixin.qq.com\//i,
        /^https:\/\/openapi.baidu.com\//i,
        /^https:\/\/auth.alipay.com\/login\//i,
        /^https:\/\/account.xiaomi.com\/pass\//i,
      ],
      webInfo: {
        hasVideo: false,
        url: '',
        canGoForward: false,
        canGoBack: false,
      },
    };
  },
  computed: {
    ...mapGetters([
      'winPos',
      'isFullScreen',
      'initialUrl',
      'winWidth',
      'winSize',
      'browsingSize',
      'pipSize',
      'pipPos',
      'barrageOpen',
      'browsingPos',
      'isFullScreen',
      'isFocused',
      'isPip',
      'pipMode',
    ]),
    isDarwin() {
      return process.platform === 'darwin';
    },
    youtubePip() {
      return InjectJSManager.getPipByChannel('youtube');
    },
    iqiyiPip() {
      return InjectJSManager.getPipByChannel('iqiyi', this.barrageOpen, this.pipSize);
    },
    iqiyiBarrage() {
      return InjectJSManager.getPipBarrage('iqiyi', this.barrageOpen);
    },
    bilibiliPip() {
      return InjectJSManager.getPipByChannel('bilibili', this.bilibiliType, this.barrageOpen, this.pipSize);
    },
    bilibiliBarrage() {
      return InjectJSManager.getPipBarrage('bilibili', this.barrageOpen, this.bilibiliType);
    },
    othersPip() {
      return InjectJSManager.getPipByChannel('others', this.pipSize);
    },
    hasVideo() {
      return this.webInfo.hasVideo;
    },
  },
  watch: {
    currentUrl(val: string) {
      this.$emit('update-current-url', val);
    },
    showSidebar(val: boolean) {
      const browserView = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      if (!val) {
        setTimeout(() => {
          browserView.setBounds({
            x: val ? 76 : 0,
            y: 40,
            width: val ? window.innerWidth - 76 : window.innerWidth,
            height: window.innerHeight - 40,
          });
        }, 100);
      } else {
        browserView.setBounds({
          x: val ? 76 : 0,
          y: 40,
          width: val ? window.innerWidth - 76 : window.innerWidth,
          height: window.innerHeight - 40,
        });
      }
    },
    hasVideo(val: boolean) {
      this.updatePipState(val);
      this.createTouchBar(val);
    },
    adaptFinished(val: boolean) {
      if (val) {
        const opacity = ['youtube', 'others'].includes(this.pipType)
          || (this.pipType === 'bilibili' && this.bilibiliType === 'others')
          ? 0.2
          : 1;
        this.$electron.ipcRenderer.send(
          this.isPip ? 'shift-pip' : 'enter-pip',
          {
            isGlobal: this.isGlobal,
            opacity,
            barrageOpen: opacity === 1 ? this.barrageOpen : false,
            pipInfo: this.pipInfo,
          },
        );
        this.updateIsPip(true);
      }
    },
    barrageOpen(val: boolean) {
      this.$electron.ipcRenderer.send('update-danmu-state', val);
    },
    dropFiles(val: string[]) {
      this.backToLandingView = false;
      const onlyFolders = val.every((file: fs.PathLike) => fs.statSync(file).isDirectory());
      if (
        onlyFolders
        || val.every(
          (file: fs.PathLike) => getValidVideoRegex().test(file)
            && !getValidSubtitleRegex().test(file),
        )
      ) {
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
      if (val) {
        this.webInfo.hasVideo = false;
        this.createTouchBar(false);
        if (this.refreshButton) {
          this.refreshButton.icon = this.createIcon('touchBar/stopRefresh.png');
        }
        this.showProgress = true;
        this.progress = 70;
      } else {
        if (this.refreshButton) {
          this.refreshButton.icon = this.createIcon('touchBar/refresh.png');
        }
        this.progress = 100;
        setTimeout(() => {
          this.showProgress = false;
          this.progress = 0;
          const loadUrl = this.$electron.remote
            .getCurrentWindow()
            .getBrowserViews()[0]
            .webContents.getURL();
          const hostname = urlParseLax(loadUrl).hostname;
          let channel = hostname.slice(
            hostname.indexOf('.') + 1,
            hostname.length,
          );
          if (loadUrl.includes('youtube')) {
            channel = 'youtube.com';
          }
          this.$electron.remote
            .getCurrentWindow()
            .getBrowserViews()[0]
            .webContents.executeJavaScript(
              InjectJSManager.calcVideoNum(),
              (r: number) => {
                this.webInfo.hasVideo = channel === 'youtube.com' && !getVideoId(loadUrl).id
                  ? false
                  : !!r;
              },
            );
        }, 1000);
      }
    },
    headerToShow(val: boolean) {
      const currentView = this.$electron.remote
        .getCurrentWindow()
        .getBrowserViews()[0];
      if (!val) {
        currentView.setBounds({
          x: 0,
          y: 0,
          width: window.screen.width,
          height: window.screen.height,
        });
      } else {
        currentView.setBounds({
          x: this.showSidebar ? 76 : 0,
          y: 40,
          width: this.showSidebar ? this.winSize[0] - 76 : this.winSize[0],
          height: this.winSize[1] - 40,
        });
      }
    },
  },
  created() {
    this.loadingState = true;
    this.createTouchBar(false);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [
      570,
      375,
    ]);
    this.$electron.ipcRenderer.send(
      'callMainWindowMethod',
      'setSize',
      this.browsingSize,
    );
    this.$electron.ipcRenderer.send(
      'callMainWindowMethod',
      'setPosition',
      this.browsingPos,
    );
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [
      0,
    ]);
  },
  mounted() {
    this.menuService = new MenuService();

    this.title = this.$electron.remote.getCurrentWindow()
      .getBrowserViews()[0].webContents.getTitle();

    this.$bus.$on('toggle-reload', this.handleUrlReload);
    this.$bus.$on('toggle-back', this.handleUrlBack);
    this.$bus.$on('toggle-forward', this.handleUrlForward);
    this.$bus.$on('toggle-pip', (isGlobal: boolean) => {
      const focusedOnMainWindow = this.$electron.remote.getCurrentWindow().isVisible()
        && this.$electron.remote.getCurrentWindow().isFocused();
      setTimeout(() => {
        if (this.acceleratorAvailable) {
          if (!focusedOnMainWindow || this.isGlobal) {
            this.handleExitPip();
          } else {
            this.handleEnterPip(isGlobal);
          }
        } else {
          this.acceleratorAvailable = true;
        }
      }, 0);
    });
    this.$bus.$on('sidebar-selected', this.handleBookmarkOpen);
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
    this.$electron.ipcRenderer.on(
      'update-pip-size',
      (e: Event, args: number[]) => {
        this.$store.dispatch('updatePipSize', args);
      },
    );
    this.$electron.ipcRenderer.on(
      'update-pip-state',
      (e: Event, info: { size: number[]; position: number[] }) => {
        this.$store.dispatch('updatePipPos', info.position);
        this.$store.dispatch('updatePipSize', info.size);
        this.updateIsPip(false);
      },
    );
    this.$electron.ipcRenderer.on(
      'update-browser-state',
      (
        e: Event,
        state: { url: string; canGoBack: boolean; canGoForward: boolean },
      ) => {
        this.title = this.$electron.remote.getCurrentWindow()
          .getBrowserViews()[0].webContents.getTitle();
        this.currentUrl = urlParseLax(state.url).href;
        this.removeListener();
        this.addListenerToBrowser();
        this.webInfo.canGoBack = state.canGoBack;
        this.webInfo.canGoForward = state.canGoForward;
        this.updateCanGoBack(this.webInfo.canGoBack);
        this.updateCanGoForward(this.webInfo.canGoForward);
        const loadUrl = this.$electron.remote
          .getCurrentWindow()
          .getBrowserViews()[0]
          .webContents.getURL();
        const hostname = urlParseLax(loadUrl).hostname;
        let channel = hostname.slice(
          hostname.indexOf('.') + 1,
          hostname.length,
        );
        if (loadUrl.includes('youtube')) {
          channel = 'youtube.com';
        }
        this.startLoading = false;
        if (!this.$electron.remote.getCurrentWindow()
          .getBrowserViews()[0].webContents.isLoading()) {
          this.$electron.remote
            .getCurrentWindow()
            .getBrowserViews()[0]
            .webContents.executeJavaScript(
              InjectJSManager.calcVideoNum(),
              (r: number) => {
                this.webInfo.hasVideo = channel === 'youtube.com' && !getVideoId(loadUrl).id
                  ? false
                  : !!r;
              },
            );
        }
        this.createTouchBar(this.webInfo.hasVideo);
      },
    );
  },
  beforeDestroy() {
    this.removeListener();
    this.$store.dispatch('updateBrowsingSize', this.winSize);
    this.$store.dispatch('updateBrowsingPos', this.winPos);
    this.updateIsPip(false);
    asyncStorage
      .set('browsing', {
        browsingSize: this.browsingSize,
        browsingPos: this.browsingPos,
        barrageOpen: this.barrageOpen,
        pipMode: this.pipMode,
      })
      .finally(() => {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        window.removeEventListener('focus', this.focusHandler);
        this.$electron.ipcRenderer.send('remove-browser');
        if (this.backToLandingView) {
          setTimeout(() => {
            windowRectService.uploadWindowBy(false, 'landing-view', undefined, undefined, this.winSize, this.winPos, this.isFullScreen);
          }, 200);
        }
      });
  },
  methods: {
    ...mapActions({
      updateRecordUrl: browsingActions.UPDATE_RECORD_URL,
      updateBarrageOpen: browsingActions.UPDATE_BARRAGE_OPEN,
      updateIsPip: browsingActions.UPDATE_IS_PIP,
    }),
    handlePageTitle(e: Event, title: string) {
      this.title = title;
    },
    focusHandler() {
      this.menuService.updateFocusedWindow(true);
      this.updatePipState(this.webInfo.hasVideo);
      this.updateCanGoBack(this.webInfo.canGoBack);
      this.updateCanGoForward(this.webInfo.canGoForward);
      this.updateReload(true);
      const loadUrl = this.$electron.remote
        .getCurrentWindow()
        .getBrowserViews()[0]
        .webContents.getURL();
      const hostname = urlParseLax(loadUrl).hostname;
      let channel = hostname.slice(hostname.indexOf('.') + 1, hostname.length);
      if (loadUrl.includes('youtube')) {
        channel = 'youtube.com';
      }
      const view = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      if (view) {
        view.webContents.executeJavaScript(InjectJSManager.calcVideoNum(), (r: number) => {
          this.webInfo.hasVideo = channel === 'youtube.com' && !getVideoId(loadUrl).id ? false : !!r;
        });
      }
    },
    beforeUnloadHandler(e: BeforeUnloadEvent) {
      this.removeListener();
      if (!this.asyncTasksDone) {
        e.returnValue = false;
        this.$store.dispatch('updateBrowsingSize', this.winSize);
        this.$store.dispatch('updateBrowsingPos', this.winPos);
        asyncStorage
          .set('browsing', {
            browsingSize: this.browsingSize,
            browsingPos: this.browsingPos,
            barrageOpen: this.barrageOpen,
            pipMode: this.pipMode,
          })
          .finally(() => {
            if (!this.isPip) {
              this.asyncTasksDone = true;
              this.$electron.ipcRenderer.send('remove-browser');
              window.close();
            } else {
              this.isGlobal = true;
              this.$electron.ipcRenderer.send('remove-main-window');
            }
          });
      } else if (this.quit) {
        this.$electron.remote.app.quit();
      }
    },
    updateReload(val: boolean) {
      if (this.$electron.remote.getCurrentWindow().isFocused()) {
        this.$electron.ipcRenderer.send(
          'update-enabled',
          'history.reload',
          val,
        );
      }
    },
    updatePipState(available: boolean) {
      if (this.$electron.remote.getCurrentWindow().isFocused()) {
        this.menuService.updateMenuItemEnabled(
          'browsing.window.pip',
          available,
        );
        this.menuService.updateMenuItemEnabled(
          'browsing.window.playInNewWindow',
          available,
        );
      }
    },
    updateCanGoBack(val: boolean) {
      if (this.$electron.remote.getCurrentWindow().isFocused()) {
        this.menuService.updateMenuItemEnabled(
          'history.back',
          val,
        );
      }
    },
    updateCanGoForward(val: boolean) {
      if (this.$electron.remote.getCurrentWindow().isFocused()) {
        this.menuService.updateMenuItemEnabled(
          'history.forward',
          val,
        );
      }
    },
    handleBookmarkOpen(url: string) {
      const supportedPage = [
        'https://www.youtube.com/',
        'https://www.bilibili.com/',
        'https://www.iqiyi.com/',
      ];
      const newHostname = urlParseLax(url).hostname;
      const oldHostname = urlParseLax(this.currentUrl).hostname;
      let newChannel = newHostname.slice(
        newHostname.indexOf('.') + 1,
        newHostname.length,
      );
      let oldChannel = oldHostname.slice(
        oldHostname.indexOf('.') + 1,
        oldHostname.length,
      );
      if (url.includes('youtube')) {
        newChannel = 'youtube.com';
      }
      if (this.currentUrl.includes('youtube')) {
        oldChannel = 'youtube.com';
      }
      this.webInfo.hasVideo = false;
      if (newChannel !== oldChannel) {
        this.removeListener();
        this.$electron.ipcRenderer.send('change-channel', { url });
      } else if (
        this.currentUrl === url
        && supportedPage.includes(this.currentUrl)
      ) {
        this.currentMainBrowserView().webContents.reload();
      } else {
        const homePage = urlParseLax(`https://www.${newChannel}`).href;
        this.$electron.ipcRenderer.send('create-browser-view', {
          url: homePage, isNewWindow: true,
        });
      }
    },
    addListenerToBrowser() {
      const view = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      if (view) {
        view.webContents.addListener('ipc-message', this.ipcMessage);
        view.webContents.addListener('page-title-updated', this.handlePageTitle);
        view.webContents.addListener('dom-ready', this.domReady);
        view.webContents.addListener('new-window', this.newWindow);
        view.webContents.addListener('did-start-loading', this.didStartLoading);
        view.webContents.addListener('did-stop-loading', this.didStopLoading);
        view.webContents.addListener('will-navigate', this.willNavigate);
      }
    },
    removeListener() {
      const view = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      if (view) {
        view.webContents.removeListener(
          'did-stop-loading',
          this.didStopLoading,
        );
        view.webContents.removeListener('page-title-updated', this.handlePageTitle);
        view.webContents.removeListener('dom-ready', this.domReady);
        view.webContents.removeListener('ipc-message', this.ipcMessage);
        view.webContents.removeListener(
          'did-start-loading',
          this.didStartLoading,
        );
        view.webContents.removeListener('new-window', this.newWindow);
        view.webContents.removeListener('will-navigate', this.willNavigate);
      }
    },
    newWindow(e: Event, url: string, disposition: string) {
      if (disposition !== 'new-window') {
        this.handleOpenUrl({ url });
      }
    },
    willNavigate(e: Event, url: string) {
      if (!this.startLoading) {
        this.startLoading = true;
        if (
          !url
          || url === 'about:blank'
          || urlParseLax(this.currentUrl).href === urlParseLax(url).href
        ) return;
        this.currentUrl = urlParseLax(url).href;
        this.loadingState = true;
        this.$electron.ipcRenderer.send('create-browser-view', { url });
      }
    },
    didStartLoading() {
      if (!this.startLoading) {
        const url = this.$electron.remote
          .getCurrentWindow()
          .getBrowserView()
          .webContents.getURL();
        if (
          !url
          || url === 'about:blank'
          || urlParseLax(this.currentUrl).href === urlParseLax(url).href
        ) return;
        this.currentUrl = urlParseLax(url).href;
        this.loadingState = true;
        this.$electron.ipcRenderer.send('create-browser-view', { url });
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcMessage(evt: Event, channel: string, args: any) {
      switch (channel) {
        case 'open-url':
          this.handleOpenUrl(args);
          break;
        case 'dragover':
        case 'dragleave':
          // TODO drag local files to play
          // this.maskToShow = args.dragover;
          break;
        case 'drop':
          // TODO drag local files to play
          // this.maskToShow = false;
          // if ((args.files as string[]).length) {
          //   this.$electron.remote.getCurrentWindow().getBrowserViews()[0].setBounds({
          //     x: 0, y: 36, width: 0, height: 0,
          //   });
          //   this.dropFiles = args.files;
          // }
          break;
        case 'fullscreenchange':
          this.headerToShow = !args.isFullScreen;
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
      this.$electron.remote
        .getCurrentWindow()
        .getBrowserViews()[0]
        .webContents.focus();
    },
    didStopLoading() {
      this.loadingState = false;
    },
    handleOpenUrl({ url }: { url: string }) {
      if (!this.startLoading) {
        this.startLoading = true;
        const protocol = urlParseLax(url).protocol;
        const openUrl = protocol ? url : `https:${url}`;
        if (
          !url
          || url === 'about:blank'
          || urlParseLax(openUrl).href === urlParseLax(this.currentUrl).href
        ) return;
        this.loadingState = true;
        const newHostname = urlParseLax(openUrl).hostname;
        const oldHostname = urlParseLax(this.currentUrl).hostname;
        let newChannel = newHostname.slice(
          newHostname.indexOf('.') + 1,
          newHostname.length,
        );
        let oldChannel = oldHostname.slice(
          oldHostname.indexOf('.') + 1,
          oldHostname.length,
        );
        if (openUrl.includes('youtube')) {
          newChannel = 'youtube.com';
        }
        if (this.currentUrl.includes('youtube')) {
          oldChannel = 'youtube.com';
        }
        if (this.oauthRegex.some((re: RegExp) => re.test(url))) return;
        if (oldChannel === newChannel) {
          this.loadingState = true;
          this.currentUrl = urlParseLax(openUrl).href;
          this.$electron.ipcRenderer.send('create-browser-view', {
            url: openUrl,
            isNewWindow: true,
          });
        } else {
          this.$electron.shell.openExternal(openUrl);
        }
      }
    },
    createTouchBar() {
      const { TouchBar } = this.$electron.remote;
      const { TouchBarButton, TouchBarSpacer } = TouchBar;

      this.sidebarButton = new TouchBarButton({
        icon: this.createIcon('touchBar/sidebar.png'),
        click: () => {
          this.$event.emit('side-bar-mouseup');
        },
      });
      this.backwardButton = new TouchBarButton({
        icon: this.createIcon(`touchBar/${this.webInfo.canGoBack ? 'backward' : 'backward-disabled'}.png`),
        click: () => {
          this.$bus.$emit('toggle-back');
        },
      });
      this.forwardButton = new TouchBarButton({
        icon: this.createIcon(`touchBar/${this.webInfo.canGoForward ? 'forward' : 'forward-disabled'}.png`),
        click: () => {
          this.$bus.$emit('toggle-forward');
        },
      });
      this.refreshButton = new TouchBarButton({
        icon: this.createIcon('touchBar/refresh.png'),
        click: this.handleUrlReload,
      });
      // this.pipButton = enablePip ? new TouchBarButton({
      //   icon: this.createIcon('touchBar/pip.png'),
      //   click: () => {
      //     this.$bus.$emit('toggle-pip');
      //   },
      // }) : null;
      const touchbarItems = [
        this.sidebarButton,
        new TouchBarSpacer({ size: 'large' }),
        this.backwardButton,
        this.forwardButton,
        this.refreshButton,
        new TouchBarSpacer({ size: 'large' }),
      ];
      // if (enablePip) touchbarItems.push(this.pipButton);
      this.touchBar = new TouchBar({ items: touchbarItems });
      this.$electron.remote.getCurrentWindow().setTouchBar(this.touchBar);
    },
    pipAdapter() {
      const parseUrl = urlParseLax(
        this.currentMainBrowserView().webContents.getURL(),
      );
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
    currentMainBrowserView() {
      return this.$electron.remote.getCurrentWindow().getBrowserView();
    },
    handleWindowChangeEnterPip() {
      const newDisplayId = this.$electron.remote.screen.getDisplayNearestPoint({
        x: this.winPos[0],
        y: this.winPos[1],
      }).id;
      const useDefaultPosition = !this.pipPos.length
        || (this.oldDisplayId !== newDisplayId && this.oldDisplayId !== -1);
      this.oldDisplayId = newDisplayId;
      this.currentMainBrowserView()
        .webContents.executeJavaScript(InjectJSManager.getVideoStyle())
        .then((result: CSSStyleDeclaration) => {
          const videoAspectRatio = parseFloat(result.width as string)
            / parseFloat(result.height as string);
          if (useDefaultPosition) {
            this.$store
              .dispatch('updatePipPos', [
                window.screen.availLeft + 70,
                window.screen.availTop + window.screen.availHeight - 236 - 70,
              ])
              .then(() => {
                this.$electron.ipcRenderer.send(
                  'callBrowsingWindowMethod',
                  'setPosition',
                  [
                    window.screen.availLeft + 70,
                    window.screen.availTop
                      + window.screen.availHeight
                      - 236
                      - 70,
                  ],
                );
              });
          }
          const calculateSize = this.pipSize[0] / this.pipSize[1] >= videoAspectRatio
            ? [
              this.pipSize[0],
              Math.round(this.pipSize[0] / videoAspectRatio),
            ]
            : [
              Math.round(this.pipSize[1] * videoAspectRatio),
              this.pipSize[1],
            ];
          this.pipInfo = {
            aspectRatio: videoAspectRatio,
            minimumSize: [420, Math.round(420 / videoAspectRatio)],
            pipSize: calculateSize,
            pipPos: this.pipPos,
          };
        });
    },
    handleWindowChangeExitPip() {
      const newDisplayId = this.$electron.remote.screen.getDisplayNearestPoint({
        x: this.winPos[0],
        y: this.winPos[1],
      }).id;
      this.oldDisplayId = newDisplayId;
    },
    handleDanmuDisplay() {
      if (this.pipType === 'iqiyi') {
        this.updateBarrageOpen(!this.barrageOpen);
        this.$electron.ipcRenderer.send(
          'handle-danmu-display',
          this.iqiyiBarrage,
        );
      } else if (this.pipType === 'bilibili') {
        this.updateBarrageOpen(!this.barrageOpen);
        this.$electron.ipcRenderer.send(
          'handle-danmu-display',
          this.bilibiliBarrage,
        );
      }
    },
    handleUrlForward() {
      if (this.webInfo.canGoForward) {
        this.removeListener();
        this.$electron.ipcRenderer.send('go-to-offset', 1);
      }
    },
    handleUrlBack() {
      if (this.webInfo.canGoBack) {
        this.removeListener();
        this.$electron.ipcRenderer.send('go-to-offset', -1);
      }
    },
    handleUrlReload() {
      const view = this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
      if (view) {
        if (!this.loadingState) {
          this.loadingState = true;
          view.webContents.reload();
        } else {
          this.loadingState = false;
          view.webContents.stop();
        }
      }
    },
    enterPipOperation() {
      this.handleWindowChangeEnterPip();
      this.$store.dispatch('updateBrowsingSize', this.winSize);
      this.$store.dispatch('updateBrowsingPos', this.winPos);
      this.pipAdapter();
    },
    exitPipOperation() {
      this.$electron.ipcRenderer.send('exit-pip');
      this.asyncTasksDone = false;
      this.isGlobal = false;
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
    handleEnterPip(isGlobal: boolean) {
      if (this.webInfo.hasVideo) {
        this.isGlobal = isGlobal;
        this.removeListener();
        this.webInfo.hasVideo = false;
        this.adaptFinished = false;
        this.enterPipOperation();
        this.updatePipState(false);
      }
    },
    handleExitPip() {
      if (this.isPip) {
        this.exitPipOperation();
        this.updateIsPip(false);
      }
    },
    othersAdapter() {
      this.currentMainBrowserView()
        .webContents.executeJavaScript(this.othersPip.adapter)
        .then(() => {
          this.adaptFinished = true;
        });
    },
    othersWatcher() {
      this.$electron.ipcRenderer.send('pip-watcher', this.othersPip.watcher);
    },
    othersRecover() {
      this.$electron.remote
        .getCurrentWindow()
        .getBrowserViews()[0]
        .webContents.executeJavaScript(this.othersPip.recover);
    },
    iqiyiAdapter() {
      this.currentMainBrowserView()
        .webContents.executeJavaScript(this.iqiyiPip.adapter)
        .then(() => {
          this.adaptFinished = true;
        });
    },
    iqiyiWatcher() {
      this.$electron.ipcRenderer.send('pip-watcher', this.iqiyiPip.watcher);
    },
    iqiyiRecover() {
      this.$electron.remote
        .getCurrentWindow()
        .getBrowserViews()[0]
        .webContents.executeJavaScript(this.iqiyiPip.recover);
    },
    youtubeAdapter() {
      this.currentMainBrowserView()
        .webContents.executeJavaScript(this.youtubePip.adapter)
        .then(() => {
          this.adaptFinished = true;
        });
    },
    youtubeRecover() {
      this.$electron.remote
        .getCurrentWindow()
        .getBrowserViews()[0]
        .webContents.executeJavaScript(this.youtubePip.recover);
    },
    bilibiliAdapter() {
      this.currentMainBrowserView()
        .webContents.executeJavaScript(InjectJSManager.bilibiliFindType())
        .then((r: (HTMLElement | null)[]) => {
          this.bilibiliType = [
            'bangumi',
            'videoStreaming',
            'iframeStreaming',
            'iframeStreaming',
            'video',
          ][r.findIndex(i => i)] || 'others';
        })
        .then(() => {
          this.currentMainBrowserView().webContents.executeJavaScript(
            this.bilibiliPip.adapter,
          );
        })
        .then(() => {
          this.adaptFinished = true;
        });
    },
    bilibiliWatcher() {
      this.$electron.ipcRenderer.send('pip-watcher', this.bilibiliPip.watcher);
    },
    bilibiliRecover() {
      this.$electron.remote
        .getCurrentWindow()
        .getBrowserViews()[0]
        .webContents.executeJavaScript(this.bilibiliPip.recover);
    },
  },
};
</script>

<style scoped lang="scss">
.browsing {
  transition: width 100ms linear;
  position: absolute;
  right: 0;
  border-top-left-radius: 4px;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 1);
  border-bottom: 1px solid #F2F1F4;
  .web-view {
    flex: 1;
    background: rgba(255, 255, 255, 1);
  }
  .loading-state {
    width: 100%;
    height: 36px;
    position: absolute;
    background-image: linear-gradient(
      -90deg,
      #414141 18%,
      #555555 34%,
      #626262 51%,
      #626262 56%,
      #555555 69%,
      #414141 86%
    );
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
.progress {
  position: absolute;
  left: 0;
  top: 38px;
  z-index: 6;
  height: 2px;
  transition-property: width;
  transition-timing-function: ease-out;
  transition-duration: 500ms;
  background-color: #FF672D;
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
  0% {
    transform: translateX(-100%);
  }
  25% {
    transform: translateX(-50%);
  }
  50% {
    transform: translateX(0%);
  }
  75% {
    transform: translateX(50%);
  }
  100% {
    transform: translateX(100%);
  }
}
@keyframes control-show {
  0% {
    transform: translate(-50%, 110px);
  }
  50% {
    transform: translate(-50%, 55px);
  }
  100% {
    transform: translate(-50%, 0px);
  }
}
@keyframes control-hide {
  0% {
    transform: translate(-50%, 0px);
  }
  50% {
    transform: translate(-50%, 55px);
  }
  100% {
    transform: translate(-50%, 110px);
  }
}
</style>
