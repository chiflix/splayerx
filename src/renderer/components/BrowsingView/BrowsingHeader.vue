<template>
  <div class="header">
    <browsing-favicons
      v-show="!showOpenUrl"
      :record-url="recordUrl"
      :update-initial-url="updateInitialUrl"
    />
    <browsing-input
      v-show="showOpenUrl"
      :close-url-input="closeUrlInput"
      :play-file-with-playing-view="playFileWithPlayingView"
    />
  </div>
</template>

<script lang="ts">
import electron from 'electron';
import { mapActions, mapGetters } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
import BrowsingFavicons from '@/components/BrowsingView/BrowsingFavicons.vue';
import BrowsingInput from '@/components/BrowsingView/BrowsingInput.vue';

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
  computed: {
    ...mapGetters(['recordUrl']),
  },
  mounted() {
    this.$bus.$on('open-url-show', (val: boolean) => {
      this.showOpenUrl = val;
    });
  },
  methods: {
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
    }),
    closeUrlInput() {
      this.$bus.$emit('open-url-show', false);
    },
    playFileWithPlayingView(inputUrl: string) {
      if (this.openFileByPlayingView(inputUrl)) {
        electron.ipcRenderer.send('open-file-by-playing', inputUrl);
      } else {
        this.updateInitialUrl(inputUrl);
      }
    },
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
