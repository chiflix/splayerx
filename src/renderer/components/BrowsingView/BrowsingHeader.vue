<template>
  <div class="header">
    <browsing-favicons v-show="!showOpenUrl"></browsing-favicons>
    <browsing-input v-show="showOpenUrl"></browsing-input>
  </div>
</template>

<script>
import BrowsingTitlebar from './BrowsingTitlebar.vue';
import BrowsingFavicons from './BrowsingFavicons.vue';
import BrowsingInput from './BrowsingInput.vue';

export default {
  name: 'BrowsingHeader',
  data() {
    return {
      showOpenUrl: false,
    };
  },
  components: {
    'browsing-titlebar': BrowsingTitlebar,
    'browsing-favicons': BrowsingFavicons,
    'browsing-input': BrowsingInput,
  },
  mounted() {
    this.$bus.$on('open-url-show', (val) => {
      this.showOpenUrl = val;
    });
  },
};
</script>

<style scoped lang="scss">
.header {
  width: 100%;
  height: 36px;
  display: flex;
  background: rgba(65, 65, 65, 1);
}
</style>
