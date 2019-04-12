<template>
 <div class="browsing">
   <browsing-header :url="url"></browsing-header>
   <webview :src="url" autosize class="web-view" ref="webView"></webview>
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
  computed: {
  },
  components: {
    'browsing-header': BrowsingHeader,
  },
  mounted() {
    this.$bus.$on('search-with-url', (url) => {
      this.$refs.webView.loadURL(url);
    });
    this.$bus.$on('url-back', () => {
      if (this.$refs.webView.canGoBack()) {
        this.$refs.webView.goBack();
      }
    });
    this.$bus.$on('url-forward', () => {
      if (this.$refs.webView.canGoForward()) {
        this.$refs.webView.goForward();
      }
    });
    this.$bus.$on('url-reload', () => {
      this.$refs.webView.loadURL(this.$refs.webView.getURL());
    });
    this.$refs.webView.addEventListener('load-commit', () => {
      this.url = this.$refs.webView.getURL();
      this.$bus.$emit('web-info', { canGoBack: this.$refs.webView.canGoBack(), canGoForward: this.$refs.webView.canGoForward() });
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
  .web-view {
    flex: 1;
  }
}
</style>
