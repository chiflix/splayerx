<template>
  <div class="container">
    <iframe
      :src="`https://www.splayer.org/${locale}/whatsnew`"
      class="iframe"
      frameborder="0"
    />
  </div>
</template>

<script>
import electron from 'electron';

function handleLink(evt) {
  const { link } = evt.data ? JSON.parse(evt.data) : {};
  console.log({link, data:evt.data}); // eslint-disable-line
  if (link) electron.shell.openExternal(link);
}

export default {
  name: 'Whatsnew',
  components: {},
  data() {
    return {
    };
  },
  computed: {
    locale() {
      const locale = this.$i18n.locale;
      if (locale === 'en' || locale === 'zh-Hans' || locale === 'zh-Hant') return locale;
      return 'en';
    },
  },
  mounted() {
    window.addEventListener('message', handleLink);
  },
  beforeDestroy() {
    window.removeEventListener('message', handleLink);
  },
};
</script>
<style scoped lang="scss">
.container {
  background-color: #434348;
  box-sizing: border-box;
  overflow: hidden;
  border: 7px solid #434348;
  width: 100%;
  height: 100%;
  display: flex;
}
.iframe {
  flex: 1;
  border-radius: 4px;
  background: white;
  box-sizing: border-box;
  border: none;
  margin: 0;
  padding: 0;
}
</style>
