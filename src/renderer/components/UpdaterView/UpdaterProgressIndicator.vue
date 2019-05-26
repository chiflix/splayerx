<!--for test-->
<template>
  <div />
</template>

<script>
export default {
  name: 'UpdaterProgressIndicator',
  components: {
    //
  },
  mounted() {
    this.$electron.ipcRenderer.on('update-message-test', (event, text) => {
      console.log(text);
    });
  },
};
</script>
