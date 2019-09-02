<template>
  <div
    class="side-bar"
  >
    <div class="icon-box">
      <div @mouseup="handleSidebarIcon('bilibili')">
        <BilibiliSidebarIcon />
      </div>
      <div @mouseup="handleSidebarIcon('iqiyi')">
        <iQiyiSidebarIcon />
      </div>
      <div @mouseup="handleSidebarIcon('youtube')">
        <YoutubeSidebarIcon />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
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
  },
  methods: {
    handleSidebarIcon(site: string) {
      asyncStorage.get('browsingPip').then((data) => {
        this.$store.dispatch('updatePipSize', data.pipSize || this.pipSize);
        this.$store.dispatch('updatePipPos', data.pipPos || this.pipPos);
        this.$electron.ipcRenderer.send('add-browsing', { size: data.pipSize || this.pipSize, position: data.pipPos || this.pipPos });
      });
      const url = `https://www.${site}.com`;
      this.$electron.ipcRenderer.send('change-channel', { url });
      if (this.$router.currentRoute.name !== 'browsing-view') this.$router.push({ name: 'browsing-view' });
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
    width: 40px;
    margin-top: 46px;
    margin-left: 18px;
    margin-right: 18px;
    display: flex;
    flex-direction: column;
    div {
      width: 40px;
      height: 40px;
      margin-bottom: 16px;
    }
  }
}
</style>
