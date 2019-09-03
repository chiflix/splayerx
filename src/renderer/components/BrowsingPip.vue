<template>
  <div class="pip" />
</template>

<script lang="ts">
import { throttle } from 'lodash';
import electron from 'electron';
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
      movePos: [],
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  mounted() {
    electron.ipcRenderer.on('update-mouse-info', (evt: Event, args: { windowSize: number[] | null, offset: number[]}) => {
      this.offset = args.offset;
      this.windowSize = args.windowSize;
    });
    electron.ipcRenderer.on('mouse-left-up', () => {
      this.offset = null;
      this.windowSize = null;
    });
    electron.ipcRenderer.on('mouse-left-drag', (evt: Event, x: number, y: number) => {
      if (!this.offset) {
        const cursorPoint = electron.screen.getCursorScreenPoint();
        const windowPos = electron.remote.getCurrentWindow().getPosition();
        this.offset = [cursorPoint.x - windowPos[0], cursorPoint.y - windowPos[1]];
        if (this.getRatio() !== 1) {
          this.windowSize = electron.remote.getCurrentWindow().getSize();
        }
      }
      x = Math.round((x / this.getRatio()) - this.offset[0]);
      y = Math.round((y / this.getRatio()) - this.offset[1]);
      if (this.isDarwin) {
        electron.ipcRenderer.send('callBrowsingWindowMethod', 'setPosition', [x || 0, y || 0]);
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
    window.addEventListener('focus', () => {
      this.menuService.updateFocusedWindow(false);
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
  },
};
</script>

<style scoped>
.pip {
  width: 100%;
  height: 36px;
  position: absolute;
  top: 0;
  -webkit-app-region: no-drag;
}
</style>
