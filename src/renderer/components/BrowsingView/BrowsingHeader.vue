<template>
  <div class="header">
    <browsing-titlebar></browsing-titlebar>
    <browsing-control class="change-width"></browsing-control>
    <video-control-buttons></video-control-buttons>
  </div>
</template>

<script>
import BrowsingTitlebar from './BrowsingTitlebar.vue';
import VideoControlButtons from './VideoControlButtons.vue';
import BrowsingControl from './BrowsingControl.vue';

export default {
  name: 'BrowsingHeader',
  components: {
    'browsing-titlebar': BrowsingTitlebar,
    'video-control-buttons': VideoControlButtons,
    'browsing-control': BrowsingControl,
  },
};
</script>

<style scoped lang="scss">
.header {
  width: 100%;
  height: 40px;
  display: flex;
  .change-width {
    flex: 1;
  }
}
</style>
