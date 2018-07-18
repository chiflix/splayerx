<template>
  <div id="app" class="application">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'splayer',
    methods: {
      mainCommitProxy(commitType, commitPayload) {
        this.$store.commit(commitType, commitPayload);
      },
      mainDispatchProxy(actionType, actionPayload) {
        this.$store.dispatch(actionType, actionPayload);
      },
    },
    mounted() {
      /* eslint-disable no-unused-vars */
      this.$electron.ipcRenderer.on('mainCommit', (event, commitType, commitPayload) => {
        this.mainCommitProxy(commitType, commitPayload);
      });
      this.$electron.ipcRenderer.on('mainDispatch', (event, actionType, actionPayload) => {
        this.mainDispatchProxy(actionType, actionPayload);
      });
    },
  };
</script>

<style lang="scss">
// global scss
@import url('~@/css/style.scss');

</style>
