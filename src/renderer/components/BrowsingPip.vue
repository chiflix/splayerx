<template>
  <div class="pip" />
</template>

<script lang="ts">
import { throttle } from 'lodash';
import electron from 'electron';
// @ts-ignore
import urlParseLax from 'url-parse-lax';
import MenuService from '@/services/menu/MenuService';
import asyncStorage from '@/helpers/asyncStorage';

export default {
  name: 'BrowsingPip',
  data() {
    return {
      supportedRecordHost: ['www.youtube.com', 'www.bilibili.com', 'www.iqiyi.com'],
      menuService: null,
      asyncTasksDone: false,
      windowSize: [],
      offset: [],
      currentUrl: '',
      canListenUrlChange: false,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  beforeDestroy() {
    const view = electron.remote.getCurrentWindow().getBrowserViews()[0];
    if (view) {
      view.webContents.removeAllListeners();
    }
  },
  mounted() {
    electron.ipcRenderer.on('remove-pip-listener', () => {
      const view = electron.remote.getCurrentWindow().getBrowserViews()[0];
      if (view) {
        if (this.canListenUrlChange) {
          view.webContents.removeListener('dom-ready', this.handleDomReady);
        } else {
          view.webContents.removeListener('did-start-loading', this.handleStartLoading);
        }
        view.webContents.removeListener('new-window', this.handleNewWindow);
        view.webContents.removeListener('ipc-message', this.handleIpcMessage);
      }
    });
    electron.ipcRenderer.on('update-pip-listener', () => {
      this.currentUrl = electron.remote.getCurrentWindow()
        .getBrowserViews()[0].webContents.getURL();
      this.canListenUrlChange = this.currentUrl.includes('iqiyi') || this.currentUrl.includes('youtube');
      const view = electron.remote.getCurrentWindow().getBrowserViews()[0];
      if (this.canListenUrlChange) {
        view.webContents.addListener('dom-ready', this.handleDomReady);
      } else {
        view.webContents.addListener('did-start-loading', this.handleStartLoading);
      }
      view.webContents.addListener('new-window', this.handleNewWindow);
      view.webContents.addListener('ipc-message', this.handleIpcMessage);
    });
    electron.ipcRenderer.on('update-mouse-info', (evt: Event, args: { windowSize: number[] | null, offset: number[]}) => {
      this.offset = args.offset;
      this.windowSize = args.windowSize;
    });
    electron.ipcRenderer.on('mouse-left-up', () => {
      this.offset = null;
      this.windowSize = null;
    });
    window.addEventListener('blur', () => {
      this.offset = null;
      this.windowSize = null;
    });
    window.addEventListener('focus', () => {
      const cursorPoint = electron.remote.screen.getCursorScreenPoint();
      const windowPos = electron.remote.getCurrentWindow().getPosition();
      this.offset = [cursorPoint.x - windowPos[0], cursorPoint.y - windowPos[1]];
      if (this.getRatio() !== 1) {
        this.windowSize = electron.remote.getCurrentWindow().getSize();
      }
    });
    electron.ipcRenderer.on('mouse-left-drag', (evt: Event, x: number, y: number) => {
      if (!this.offset || !this.offset.length) return;
      x = Math.round((x / this.getRatio()) - this.offset[0]) === 0
        ? 0 : Math.round((x / this.getRatio()) - this.offset[0]);
      y = Math.round((y / this.getRatio()) - this.offset[1]) === 0
        ? 0 : Math.round((y / this.getRatio()) - this.offset[1]);
      if (this.isDarwin) {
        electron.ipcRenderer.send('callBrowsingWindowMethod', 'setPosition', [x, y]);
      } else if (this.windowSize) {
        electron.ipcRenderer.send('callBrowsingWindowMethod', 'setBounds', [{
          x, y, width: this.windowSize[0], height: this.windowSize[1],
        }]);
      } else {
        electron.ipcRenderer.send('callBrowsingWindowMethod', 'setPosition', [x, y]);
      }
    });
    this.menuService = new MenuService();
    electron.remote.getCurrentWindow().addListener('enter-html-full-screen', () => {
      electron.ipcRenderer.send('mouseup', 'full');
    });
    window.addEventListener('resize', throttle(() => {
      const size = electron.remote.getCurrentWindow().getSize();
      electron.ipcRenderer.send('update-pip-size', size);
      electron.ipcRenderer.send('set-bounds', {
        titlebar: {
          x: 0,
          y: 0,
          width: size[0],
          height: 36,
        },
        control: {
          x: Math.round(size[0] - 65),
          y: Math.round(size[1] / 2 - 54),
          width: 50,
          height: 104,
        },
      });
    }, 100));
    window.addEventListener('beforeunload', (e) => {
      if (!this.asyncTasksDone) {
        e.returnValue = false;
        const size = electron.remote.getCurrentWindow().getSize();
        const position = electron.remote.getCurrentWindow().getPosition();

        asyncStorage.set('browsingPip', {
          pipSize: size,
          pipPos: position,
        }).then(() => {
          electron.ipcRenderer.send('pip-window-close', { size, position });
        }).finally(() => {
          this.asyncTasksDone = true;
          window.close();
        });
      }
    });
  },
  methods: {
    getRatio() {
      return process.platform === 'win32' ? window.devicePixelRatio || 1 : 1;
    },
    handleUrlChange(url: string) {
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
      if (url !== this.currentUrl) {
        if (newChannel === oldChannel) {
          this.currentUrl = url;
          const view = electron.remote.getCurrentWindow().getBrowserViews()[0];
          if (this.canListenUrlChange) {
            view.webContents.removeListener('dom-ready', this.handleDomReady);
          } else {
            view.webContents.removeListener('did-start-loading', this.handleStartLoading);
          }
          view.webContents.removeListener('new-window', this.handleNewWindow);
          view.webContents.removeListener('ipc-message', this.handleIpcMessage);
          electron.ipcRenderer.send('pip');
        } else {
          electron.shell.openExternal(url);
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleIpcMessage(evt: Event, channel: string, args: any) {
      if (channel === 'open-url') {
        this.handleUrlChange(args.url);
      }
    },
    handleDomReady() {
      const views = electron.remote.getCurrentWindow().getBrowserViews();
      if (views[0]) {
        const url = views[0].webContents.getURL();
        this.handleUrlChange(url);
      }
    },
    handleNewWindow(e: Event, url: string) {
      this.handleUrlChange(url);
    },
    handleStartLoading() {
      const views = electron.remote.getCurrentWindow().getBrowserViews();
      if (views[0]) {
        const url = views[0].webContents.getURL();
        this.handleUrlChange(url);
      }
    },
  },
};
</script>

<style scoped>
.pip {
  width: 100%;
  height: 0;
  position: absolute;
  top: 0;
  -webkit-app-region: no-drag;
}
</style>
