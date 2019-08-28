<template>
  <div
    :style="{
      webkitAppRegion: isDarwin ? 'drag' : 'no-drag',
    }"
    class="pip"
  />
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
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  mounted() {
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
};
</script>

<style scoped>
.pip {
  width: 100%;
  height: 36px;
  position: absolute;
  top: 0;
}
</style>
