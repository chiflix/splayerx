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
  import {
    FILE_NON_EXIST,
    EMPTY_FOLDER,
    OPEN_FAILED,
    ONLINE_LOADING,
    NOT_SUPPORTED_SUBTITLE,
    REQUEST_TIMEOUT,
    SUBTITLE_OFFLINE,
    SUBTITLE_UPLOAD,
    UPLOAD_SUCCESS,
    UPLOAD_FAILED,
    ADD_NO_VIDEO,
  } from '../shared/notificationcodes';
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
      this.$electron.ipcRenderer.on('addMessages', (event, code) => { // eslint-disable-line complexity
        switch (code) {
          case FILE_NON_EXIST:
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('errorFile.fileNonExist.title'),
              content: this.$t('errorFile.fileNonExist.content'),
              dismissAfter: 5000,
              cb: () => {
                this.$bus.$emit('delete-file');
              },
            });
            break;
          case ADD_NO_VIDEO:
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('errorFile.addNoVideo.title'),
              content: this.$t('errorFile.addNoVideo.content'),
              dismissAfter: 5000,
            });
            break;
          case EMPTY_FOLDER:
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('errorFile.emptyFolder.title'),
              content: this.$t('errorFile.emptyFolder.content'),
              dismissAfter: 5000,
            });
            break;
          case OPEN_FAILED:
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('errorFile.default.title'),
              content: this.$t('errorFile.default.content'),
              dismissAfter: 5000,
            });
            break;
          case ONLINE_LOADING:
            if (this.$route.name !== 'playing-view') break;
            this.$store.dispatch('addMessages', {
              type: 'state',
              title: '',
              content: this.$t('loading.content'),
              dismissAfter: 2000,
            });
            break;
          case SUBTITLE_OFFLINE:
            if (this.$route.name !== 'playing-view') break;
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('errorFile.offLine.title'),
              content: this.$t('errorFile.offLine.content'),
              dismissAfter: 5000,
            });
            break;
          case NOT_SUPPORTED_SUBTITLE:
            if (this.$route.name !== 'playing-view') break;
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('errorFile.loadFailed.title'),
              content: this.$t('errorFile.loadFailed.content'),
              dismissAfter: 5000,
            });
            break;
          case REQUEST_TIMEOUT:
            if (this.$route.name !== 'playing-view') break;
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('errorFile.timeout.title'),
              content: this.$t('errorFile.timeout.content'),
              dismissAfter: 5000,
            });
            break;
          case SUBTITLE_UPLOAD:
            if (this.$route.name !== 'playing-view') break;
            this.$store.dispatch('addMessages', {
              type: 'state',
              title: '',
              content: this.$t('uploading.content'),
              dismissAfter: 2000,
            });
            break;
          case UPLOAD_SUCCESS:
            if (this.$route.name !== 'playing-view') break;
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('uploadingSuccess.title'),
              content: this.$t('uploadingSuccess.content'),
              dismissAfter: 5000,
            });
            break;
          case UPLOAD_FAILED:
            if (this.$route.name !== 'playing-view') break;
            this.$store.dispatch('addMessages', {
              type: 'result',
              title: this.$t('uploadingFailed.title'),
              content: this.$t('uploadingFailed.content'),
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
      this.$electron.ipcRenderer.on('thumbnail-saved', (event, src) => {
        this.$bus.$emit('set-thumbnail-src', src);
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
