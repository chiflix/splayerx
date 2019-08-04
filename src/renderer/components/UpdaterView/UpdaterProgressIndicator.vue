<!--for test-->
<template>
  <div />
</template>

<script>
import { log } from '@/libs/Log';

export default {
  name: 'UpdaterProgressIndicator',
  components: {
    //
  },
  mounted() {
    this.$electron.ipcRenderer.on('update-message-test', (event, text) => {
      log.debug(text);
    });
  },
};
</script>
