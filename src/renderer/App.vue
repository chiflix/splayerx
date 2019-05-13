<template>
  <div id="app" class="application">
    <router-view></router-view>
    <!--lyctest-->
    <UpdaterProgressIndicator> </UpdaterProgressIndicator>
    <!--lyctest-->
      <UpdaterNotification></UpdaterNotification>
  </div>
</template>

<script>
  // import { throttle } from 'lodash';
  import '@/css/style.scss';
  import drag from '@/helpers/drag';

  import UpdaterProgressIndicator from './components/UpdaterView/UpdaterProgressIndicator.vue';
  import UpdaterNotification from './components/UpdaterView/UpdaterNotification.vue';

  export default {
    name: 'splayer',
    // -> for test todo need delete lyctest
    components: {
      UpdaterProgressIndicator,
      UpdaterNotification,
    },
    // <-for test todo need delete lyctest
    methods: {
      mainCommitProxy(commitType, commitPayload) {
        this.$store.commit(commitType, commitPayload);
      },
      mainDispatchProxy(actionType, actionPayload) {
        this.$store.dispatch(actionType, actionPayload);
      },
      handleWindowSizeChange(windowSize) {
        this.$store.commit('windowSize', windowSize);
      },
    },
    mounted() {
      this.$electron.ipcRenderer.on('mainCommit', (event, commitType, commitPayload) => {
        this.mainCommitProxy(commitType, commitPayload);
      });
      this.$electron.ipcRenderer.on('mainDispatch', (event, actionType, actionPayload) => {
        this.mainDispatchProxy(actionType, actionPayload);
      });
      this.$electron.ipcRenderer.send('windowInit');
      this.$electron.ipcRenderer.on('thumbnail-saved', (event, src) => {
        this.$bus.$emit('set-thumbnail-src', src);
      });
      this.$electron.ipcRenderer.on('play-file-with-url', (event, url) => {
        this.openUrlFile(url);
      });
      drag(this.$el);
      this.$ga.event('app', 'mounted');
      setInterval(() => {
        this.$ga.event('app', 'heartbeat');
      }, 1500000); // keep alive every 25 min.
    },
  };
</script>

<style lang="scss">
// global scss
// @import "@/css/style.scss";
</style>
