<!--for test-->
<template>
    <div>
    </div>
</template>

<script>
  export default {
    name: 'UpdaterProgressIndicator',
    components: {
      //
    },
    mounted() {
      this.$electron.ipcRenderer.on('update-message', (event, text) => {
        console.log(text);
      });
    },
  };
</script>