<template>
  <div class="header">
    <browsing-favicons v-show="!showOpenUrl" />
    <browsing-input v-show="showOpenUrl" />
  </div>
</template>

<script>
import BrowsingFavicons from './BrowsingFavicons.vue';
import BrowsingInput from './BrowsingInput.vue';

export default {
  name: 'BrowsingHeader',
  components: {
    'browsing-favicons': BrowsingFavicons,
    'browsing-input': BrowsingInput,
  },
  data() {
    return {
      showOpenUrl: false,
    };
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
