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
        console.log(`Main Commit ${commitType} with Payload ${commitPayload} success!`);
        console.log(`Final state: ${this.$store.state.WindowState.windowSize}.`);
      },
      mainDispatchProxy(actionType, actionPayload) {
        this.$store.dispatch(actionType, actionPayload);
        console.log(`Main Dispatch ${actionType} with Payload ${actionPayload} success!`);
        console.log(`Final state: ${this.$store.state.WindowState.windowSize}.`);
      },
    },
    mounted() {
      require('electron').ipcRenderer.on('mainCommit', (event, commitType, commitPayload) => {
        console.log(event);
        this.mainCommitProxy(commitType, commitPayload);
      });
      require('electron').ipcRenderer.on('mainDispatch', (event, actionType, actionPayload) => {
        console.log(event);
        this.mainDispatchProxy(actionType, actionPayload);
      });
    },
  };
</script>

<style lang="scss">
// global scss
@import url('~@/css/style.scss');

</style>
