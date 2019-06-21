<template>
  <div
    id="app"
    class="application"
  >
    <router-view />
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer, Event } from 'electron';
import '@/css/style.scss';
import drag from '@/helpers/drag';

export default {
  name: 'Splayer',
  mounted() {
    // to-do: specify commitType and commitPayload with vuex typescriptened
    ipcRenderer.on('mainCommit', (event: Event, commitType: string, commitPayload: any) => {
      this.mainCommitProxy(commitType, commitPayload);
    });
    ipcRenderer.on('mainDispatch', (event: Event, actionType: string, actionPayload: any) => {
      this.mainDispatchProxy(actionType, actionPayload);
    });
    ipcRenderer.send('windowInit');
    ipcRenderer.on('thumbnail-saved', (event: Event, src: string) => {
      this.$bus.$emit('set-thumbnail-src', src);
    });
    this.$electron.ipcRenderer.on('play-file-with-url', (event: Event, url: string) => {
      this.openUrlFile(url);
    });
    drag(this.$el);
    this.$ga.event('app', 'mounted');
    setInterval(() => {
      this.$ga.event('app', 'heartbeat');
    }, 1500000); // keep alive every 25 min.
  },
  methods: {
    mainCommitProxy(commitType: string, commitPayload: any) {
      this.$store.commit(commitType, commitPayload);
    },
    mainDispatchProxy(actionType: string, actionPayload: any) {
      this.$store.dispatch(actionType, actionPayload);
    },
    handleWindowSizeChange(windowSize: any) {
      this.$store.commit('windowSize', windowSize);
    },
  },
};
</script>

<style lang="scss">
// global scss
// @import "@/css/style.scss";
</style>
