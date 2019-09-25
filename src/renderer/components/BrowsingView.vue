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
    <div class="border-bottom" />
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
    <browsing-content
      v-if="isHistory"
      class="browsing-content"
    />
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
import BrowsingContent from '@/components/BrowsingView/BrowsingContent.vue';
import asyncStorage from '@/helpers/asyncStorage';
import NotificationBubble from '@/components/NotificationBubble.vue';
import { getValidVideoRegex, getValidSubtitleRegex } from '../../shared/utils';
import MenuService from '@/services/menu/MenuService';
import InjectJSManager from '../../shared/pip/InjectJSManager';

export default {
  name: 'BrowsingView',
  components: {
    'browsing-header': BrowsingHeader,
    'browsing-content': BrowsingContent,
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
      loadingState: true,
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
      allChannels: ['youtube', 'bilibili', 'iqiyi'],
      hideMainWindow: false,
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
      'isHistory',
    ]),
    isDarwin() {
      return process.platform === 'darwin';
    },
    pipArgs() {
      switch (this.pipType) {
        case 'youtube':
          return { channel: 'youtube' };
        case 'bilibili':
          return {
            channel: 'bilibili', type: this.bilibiliType, barrageState: this.barrageOpen, winSize: this.pipSize,
          };
        case 'iqiyi':
          return { channel: 'iqiyi', barrageState: this.barrageOpen, winSize: this.pipSize };
        case 'others':
          return { channel: 'others', winSize: this.pipSize };
        default:
          return { channel: 'others', winSize: this.pipSize };
      }
    },
    pip() {
      return InjectJSManager.getPipByChannel(this.pipArgs);
    },
    hasVideo() {
      return this.webInfo.hasVideo;
    },
  },
  watch: {
    isHistory() {
      this.$electron.ipcRenderer.send('open-browsing-history');
    },
    isFullScreen(val: boolean) {
      this.$store.dispatch('updateBrowsingSize', this.winSize);
      if (!val && this.hideMainWindow) {
        this.hideMainWindow = false;
        this.$electron.remote.getCurrentWindow().hide();
      }
    },
    currentUrl(val: string) {
      this.$emit('update-current-url', val);
    },
    showSidebar(val: boolean) {
      if (!val) {
        setTimeout(() => {
          this.currentMainBrowserView().setBounds({
            x: val ? 76 : 0,
            y: 40,
            width: val ? window.innerWidth - 76 : window.innerWidth,
            height: window.innerHeight - 40,
          });
        }, 100);
      } else {
        this.currentMainBrowserView().setBounds({
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
      if (this.isPip) {
        this.$electron.ipcRenderer.send('pip-watcher', this.pip.watcher);
      }
    },
    loadingState(val: boolean) {
      if (val) {
        this.webInfo.hasVideo = false;
        this.createTouchBar(false);
        if (this.refreshButton) {
          this.refreshButton.icon = this.createIcon('touchBar/stopRefresh.png');
        }
        if (!this.currentUrl.includes('youtube')) this.showProgress = true;
        this.progress = 70;
      } else {
        if (this.refreshButton) {
          this.refreshButton.icon = this.createIcon('touchBar/refresh.png');
        }
        this.progress = 100;
        setTimeout(() => {
          this.showProgress = false;
          this.progress = 0;
          if (this.currentMainBrowserView()) {
            const loadUrl = this.currentMainBrowserView().webContents.getURL();
            const hostname = urlParseLax(loadUrl).hostname;
            let channel = hostname.slice(
              hostname.indexOf('.') + 1,
              hostname.length,
            );
            if (loadUrl.includes('youtube')) {
              channel = 'youtube.com';
            }
            this.currentMainBrowserView().webContents.executeJavaScript(
              InjectJSManager.calcVideoNum(),
              (r: number) => {
                this.webInfo.hasVideo = channel === 'youtube.com' && !getVideoId(loadUrl).id
                  ? false
                  : !!r;
              },
            );
          }
        }, 1000);
      }
    },
    headerToShow(val: boolean) {
      if (!val) {
        this.currentMainBrowserView().setBounds({
          x: 0,
          y: 0,
          width: window.screen.width,
          height: window.screen.height,
        });
      } else {
        this.currentMainBrowserView().setBounds({
          x: this.showSidebar ? 76 : 0,
          y: 40,
          width: this.showSidebar ? this.winSize[0] - 76 : this.winSize[0],
          height: this.winSize[1] - 40,
        });
      }
    },
  },
  created() {
    this.createTouchBar(false);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [
      570,
      375,
    ]);
    windowRectService.calculateWindowRect(
      this.browsingSize, true, this.winPos.concat(this.winSize),
    );
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [
      0,
    ]);
  },
  mounted() {
    this.menuService = new MenuService();
    this.menuService.updateMenuItemEnabled('splayerx.checkForUpdates', false);
    this.title = this.currentMainBrowserView().webContents.getTitle();

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
    this.$bus.$on('back-to-landingview', this.backToLandingViewHandler);
    this.$electron.ipcRenderer.on('handle-exit-pip', () => {
      this.handleExitPip();
    });
    this.$electron.ipcRenderer.on('handle-danmu-display', () => {
      this.handleDanmuDisplay();
    });
    this.$electron.ipcRenderer.on('update-pip-pos', (e: Event, pos: number[]) => {
      this.$store.dispatch('updatePipPos', pos);
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
        this.title = this.currentMainBrowserView().webContents.getTitle();
        this.currentUrl = urlParseLax(state.url).href;
        this.removeListener();
        this.addListenerToBrowser();
        this.webInfo.canGoBack = state.canGoBack;
        this.webInfo.canGoForward = state.canGoForward;
        this.updateCanGoBack(this.webInfo.canGoBack);
        this.updateCanGoForward(this.webInfo.canGoForward);
        const loadUrl = this.currentMainBrowserView().webContents.getURL();
        const hostname = urlParseLax(loadUrl).hostname;
        let channel = hostname.slice(
          hostname.indexOf('.') + 1,
          hostname.length,
        );
        if (loadUrl.includes('youtube')) {
          channel = 'youtube.com';
        }
        this.startLoading = false;
        if (!this.currentMainBrowserView().webContents.isLoading()) {
          this.currentMainBrowserView().webContents.executeJavaScript(
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
    this.$bus.$off('back-to-landingview', this.backToLandingViewHandler);
    this.$store.dispatch('updateBrowsingSize', this.winSize);
    this.boundBackPosition();
    this.updateIsPip(false);
    asyncStorage
      .set('browsing', {
        browsingSize: this.browsingSize,
        browsingPos: this.browsingPos,
        barrageOpen: this.barrageOpen,
        pipMode: this.pipMode,
      })
      .finally(() => {
        this.menuService.updateMenuItemEnabled('splayerx.checkForUpdates', true);
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        window.removeEventListener('focus', this.focusHandler);
        this.$electron.ipcRenderer.send('remove-browser');
        if (this.backToLandingView) {
          setTimeout(() => {
            windowRectService.uploadWindowBy(false, 'landing-view', undefined, undefined, this.winSize, this.winPos, this.isFullScreen);
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'show');
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
    backToLandingViewHandler() {
      this.removeListener();
      this.backToLandingView = true;
      this.$bus.$off();
      this.$router.push({
        name: 'landing-view',
      });
    },
    handlePageTitle(e: Event, title: string) {
      this.title = title;
    },
    boundBackPosition() {
      const position = this.winPos;
      const size = this.winSize;

      const [boundLeft, boundTop, windowWidth, windowHeight] = [
        window.screen.availLeft, window.screen.availTop,
        window.screen.availWidth, window.screen.availHeight,
      ];

      const boundbackPositon = (
        point: number, length: number,
        edge: number, edgeLength: number,
      ) => {
        if (point < edge) return edge;
        if (point + length > edge + edgeLength) return edge + edgeLength - length;
        return point;
      };

      position[0] = boundbackPositon(position[0], size[0], boundLeft, windowWidth);
      position[1] = boundbackPositon(position[1], size[1], boundTop, windowHeight);


      this.$store.dispatch('updateBrowsingPos', position);
    },
    focusHandler() {
      this.menuService.updateFocusedWindow(true);
      this.updatePipState(this.webInfo.hasVideo);
      this.updateCanGoBack(this.webInfo.canGoBack);
      this.updateCanGoForward(this.webInfo.canGoForward);
      this.updateReload(true);
      const loadUrl = this.currentMainBrowserView().webContents.getURL();
      const hostname = urlParseLax(loadUrl).hostname;
      let channel = hostname.slice(hostname.indexOf('.') + 1, hostname.length);
      if (loadUrl.includes('youtube')) {
        channel = 'youtube.com';
      }
      if (this.currentMainBrowserView()) {
        this.currentMainBrowserView().webContents
          .executeJavaScript(InjectJSManager.calcVideoNum(), (r: number) => {
            this.webInfo.hasVideo = channel === 'youtube.com' && !getVideoId(loadUrl).id ? false : !!r;
          });
      }
    },
    beforeUnloadHandler(e: BeforeUnloadEvent) {
      this.removeListener();
      if (!this.asyncTasksDone) {
        e.returnValue = false;
        this.$store.dispatch('updateBrowsingSize', this.winSize);
        this.boundBackPosition();
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
      const view = this.currentMainBrowserView();
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
      const view = this.currentMainBrowserView();
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
      this.currentMainBrowserView().webContents.focus();
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
        let oldChannel = oldHostname.slice(
          oldHostname.indexOf('.') + 1,
          oldHostname.length,
        );
        if (this.currentUrl.includes('youtube')) {
          oldChannel = 'youtube.com';
        }
        let newChannel = oldChannel;
        if (newHostname.includes(...this.allChannels)) {
          newChannel = newHostname.slice(
            newHostname.indexOf('.') + 1,
            newHostname.length,
          );
          if (openUrl.includes('youtube')) {
            newChannel = 'youtube.com';
          }
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
      const channels = ['youtube', 'bilibili', 'iqiyi'];
      this.pipType = 'others';
      channels.forEach((channel: string) => {
        if (parseUrl.hostname.includes(channel)) this.pipType = channel;
      });
      if (this.pipType === 'bilibili') {
        this.currentMainBrowserView()
          .webContents.executeJavaScript(InjectJSManager.bilibiliFindType())
          .then((r: string) => {
            this.bilibiliType = r;
          })
          .then(() => {
            this.currentMainBrowserView().webContents.executeJavaScript(
              this.pip.adapter,
            );
          })
          .then(() => {
            this.adaptFinished = true;
          });
      } else {
        this.currentMainBrowserView()
          .webContents.executeJavaScript(this.pip.adapter)
          .then(() => {
            this.adaptFinished = true;
          });
      }
    },
    currentMainBrowserView() {
      return this.$electron.remote.getCurrentWindow().getBrowserViews()[0];
    },
    handleWindowChangeEnterPip() {
      if (this.isFullScreen) {
        this.hideMainWindow = this.isGlobal;
        this.currentMainBrowserView().webContents
          .executeJavaScript(InjectJSManager.changeFullScreen(false));
        this.headerToShow = true;
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [false]);
      }
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
          if (useDefaultPosition) {
            this.$store
              .dispatch('updatePipPos', [
                window.screen.availLeft + 70,
                window.screen.availTop + window.screen.availHeight - calculateSize[1] - 70,
              ])
              .then(() => {
                this.$electron.ipcRenderer.send(
                  'callBrowsingWindowMethod',
                  'setPosition',
                  [
                    window.screen.availLeft + 70,
                    window.screen.availTop
                      + window.screen.availHeight
                      - calculateSize[1]
                      - 70,
                  ],
                );
              });
          }
        });
    },
    handleWindowChangeExitPip() {
      const screen = this.$electron.remote.screen.getDisplayNearestPoint({
        x: this.pipPos[0],
        y: this.pipPos[1],
      });
      const rect = screen.workArea;
      const newDisplayId = screen.id;
      if (this.oldDisplayId !== newDisplayId) {
        windowRectService.calculateWindowRect(
          this.browsingSize,
          true,
          this.pipPos.concat(this.pipSize),
          undefined,
          undefined,
          [rect.x, rect.y, rect.width, rect.height],
        );
      } else {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', this.browsingSize);
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', this.browsingPos);
      }
      this.oldDisplayId = newDisplayId;
    },
    handleDanmuDisplay() {
      if (this.pipType === 'iqiyi') {
        this.updateBarrageOpen(!this.barrageOpen);
        this.$electron.ipcRenderer.send(
          'handle-danmu-display',
          this.pip.iqiyiBarrageAdapt(this.barrageOpen),
        );
      } else if (this.pipType === 'bilibili') {
        this.updateBarrageOpen(!this.barrageOpen);
        this.$electron.ipcRenderer.send(
          'handle-danmu-display',
          this.pip.bilibiliBarrageAdapt(this.bilibiliType, this.barrageOpen),
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
      const view = this.currentMainBrowserView();
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
      this.currentMainBrowserView().webContents.executeJavaScript(this.pip.recover);
      this.pipType = '';
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
  .web-view {
    flex: 1;
    background: rgba(255, 255, 255, 1);
  }
  .border-bottom {
    position: absolute;
    top: 39px;
    width: 100vw;
    height: 1px;
    background-color: #F2F1F4;
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
.browsing-content {
  position: absolute;
  top: 38px;
  width: 100%;
  height: 100%;
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
