<template>
  <div
    class="side-bar"
  >
    <div class="icon-box">
      <BilibiliSidebarIcon
        :selected="currentUrl.includes('bilibili')"
        :url="'https://www.bilibili.com/'"
        :mouseup-on-icon="handleSidebarIcon"
      />
      <iQiyiSidebarIcon
        :selected="currentUrl.includes('iqiyi')"
        :url="'https://www.iqiyi.com/'"
        :mouseup-on-icon="handleSidebarIcon"
      />
      <YoutubeSidebarIcon
        :selected="currentUrl.includes('youtube')"
        :url="'https://www.youtube.com/'"
        :mouseup-on-icon="handleSidebarIcon"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters } from 'vuex';
import BilibiliSidebarIcon from '@/components/LandingView/BilibiliSidebarIcon.vue';
import iQiyiSidebarIcon from '@/components/LandingView/iQiyiSidebarIcon.vue';
import YoutubeSidebarIcon from '@/components/LandingView/YoutubeSidebarIcon.vue';
import asyncStorage from '@/helpers/asyncStorage';

export default {
  name: 'Sidebar',
  components: {
    BilibiliSidebarIcon,
    iQiyiSidebarIcon,
    YoutubeSidebarIcon,
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: false,
    },
    currentUrl: {
      type: String,
      default: '',
    },
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos']),
  },
  methods: {
    handleSidebarIcon(url: string) {
      if (this.$route.name === 'browsing-view') {
        this.$bus.$emit('sidebar-selected', url);
      } else {
        asyncStorage.get('browsingPip').then((data) => {
          this.$store.dispatch('updatePipSize', data.pipSize || this.pipSize);
          this.$store.dispatch('updatePipPos', data.pipPos || this.pipPos);
          this.$electron.ipcRenderer.send('add-browsing', { size: data.pipSize || this.pipSize, position: data.pipPos || this.pipPos });
        });
        this.$electron.ipcRenderer.send('change-channel', { url, sidebar: this.showSidebar });
        if (this.$router.currentRoute.name !== 'browsing-view') this.$router.push({ name: 'browsing-view' });
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.side-bar {
  position: absolute;
  background-color: #39383F;
  z-index: 0;
  left: 0;
  width: 76px;
  height: 100%;
  transition: width 100ms ease-out;
  will-change: width;

  .icon-box {
    width: 44px;
    margin-top: 46px;
    margin-left: 18px;
    margin-right: 18px;
    display: flex;
    flex-direction: column;
    div {
      width: 44px;
      height: 44px;
      margin-bottom: 16px;
    }
  }
}
</style>
