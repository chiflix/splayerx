<template>
  <div
    id="app"
    class="application"
  >
    <router-view />
  </div>
</template>

<script lang="ts">
import '@/css/style.scss';
import drag from '@/helpers/drag';

export default {
  name: 'Splayer',
  mounted() {
    this.$electron.ipcRenderer.on('mainCommit', (event: any, commitType: string, commitPayload: any) => {
      this.mainCommitProxy(commitType, commitPayload);
    });
    this.$electron.ipcRenderer.on('mainDispatch', (event: any, actionType: string, actionPayload: any) => {
      this.mainDispatchProxy(actionType, actionPayload);
    });
    this.$electron.ipcRenderer.send('windowInit');
    this.$electron.ipcRenderer.on('thumbnail-saved', (event: any, src: string) => {
      this.$bus.$emit('set-thumbnail-src', src);
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
