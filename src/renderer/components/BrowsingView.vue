<template>
 <div class="browsing">
   <browsing-header></browsing-header>
   <webview :src="url" autosize class="webview"></webview>
 </div>
</template>

<script>
import BrowsingHeader from './BrowsingView/BrowsingHeader.vue';

export default {
  name: 'BrowsingView',
  data() {
    return {
      url: 'https://www.youtube.com',
    };
  },
  components: {
    'browsing-header': BrowsingHeader,
  },
  mounted() {
    this.$bus.$on('search-with-url', (url) => {
      this.url = url;
    });
  },
};
</script>

<style scoped lang="scss">
.browsing {
  height: 100vh;
  width: 100vw;
  background-image: url(../assets/gradient-bg.png);
  display: flex;
  flex-direction: column;
  .webview {
    flex: 1;
  }
}
</style>
