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
  import drag from '@/helpers/drag';
  import { FILE_NON_EXIST, EMPTY_FOLDER, OPEN_FAILED } from '../shared/errorcodes';
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
      this.$electron.ipcRenderer.on('addMessages', (event, errcode) => {
        switch (errcode) {
          case FILE_NON_EXIST:
            this.$store.dispatch('addMessages', {
              type: 'error',
              title: this.$t('errorFile.fileNonExist.title'),
              content: this.$t('errorFile.fileNonExist.content'),
              dismissAfter: 5000,
              cb: () => {
                this.$bus.$emit('delete-file');
              },
            });
            break;
          case EMPTY_FOLDER:
            this.$store.dispatch('addMessages', {
              type: 'error',
              title: this.$t('errorFile.emptyFolder.title'),
              content: this.$t('errorFile.emptyFolder.content'),
              dismissAfter: 5000,
            });
            break;
          case OPEN_FAILED:
            this.$store.dispatch('addMessages', {
              type: 'error',
              title: this.$t('errorFile.default.title'),
              content: this.$t('errorFile.default.content'),
              dismissAfter: 5000,
            });
            break;
          default:
            break;
        }
      });
      this.$electron.ipcRenderer.on('mainCommit', (event, commitType, commitPayload) => {
        this.mainCommitProxy(commitType, commitPayload);
      });
      this.$electron.ipcRenderer.on('mainDispatch', (event, actionType, actionPayload) => {
        this.mainDispatchProxy(actionType, actionPayload);
      });
      this.$electron.ipcRenderer.send('windowInit');
      this.$el.style.fontFamily = process.platform;
      drag(this.$el);
      this.$ga.event('app', 'mounted');
    },
  };
</script>

<style lang="scss">
// global scss
@import url("~@/css/style.scss");
</style>
