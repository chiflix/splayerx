<template>
  <div class="pip" />
</template>

<script lang="ts">
// @ts-ignore
import urlParseLax from 'url-parse-lax';
import electron from 'electron';

export default {
  name: 'BrowsingPip',
  data() {
    return {
      supportedRecordHost: ['www.youtube.com', 'www.bilibili.com', 'www.iqiyi.com'],
    };
  },
  computed: {
    currentBrowserView() {
      return electron.remote.BrowserView.getAllViews()[0];
    },
  },
  mounted() {
    window.addEventListener('beforeunload', () => {
      electron.ipcRenderer.send('remove-pip-browser');
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              electron.ipcRenderer.send('callBrowsingWindowMethod', 'setBounds', [{
                x: args.x,
                y: args.y,
                width: args.windowSize[0],
                height: args.windowSize[1],
              }]);
            } else {
              electron.ipcRenderer.send('callBrowsingWindowMethod', 'setPosition', [args.x, args.y]);
            }
          }
          break;
        case 'fullscreenchange':
          electron.ipcRenderer.send('update-header-to-show', !args.isFullScreen);
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
            // this.updateRecordUrl({ youtube: loadUrl });
            break;
          case 1:
            // this.updateRecordUrl({ bilibili: loadUrl });
            break;
          case 2:
            // this.updateRecordUrl({ iqiyi: loadUrl });
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
  methods: {
    handleOpenUrl({ url }: { url: string }) {
      if (!url || url === 'about:blank') return;
      this.currentBrowserView.webContents.loadURL(urlParseLax(url).protocol ? url : `https:${url}`);
    },
  },
};
</script>

<style scoped>
.pip {
  width: 100%;
  height: 10px;
  -webkit-app-region: drag;
  position: absolute;
  top: 0;
}
</style>
