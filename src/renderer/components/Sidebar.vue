<template>
  <div
    class="side-bar"
  >
    <div
      :class="{ 'win': !isDarwin }"
      class="icon-box"
    >
      <SidebarIcon
        :key="url"
        v-for="({ url, icon, selected }) in channels"
        :url="url"
        :icon="icon"
        :selected="selected"
        :select-sidebar-icon="handleSidebarIcon"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters } from 'vuex';
import asyncStorage from '@/helpers/asyncStorage';
import SidebarIcon from '@/components/SidebarIcon.vue';

export default {
  name: 'Sidebar',
  components: {
    SidebarIcon,
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
  data() {
    return {
      channels: [
        {
          url: 'https://www.bilibili.com/',
          icon: 'bilibiliSidebar',
          selectedType: 'bilibili',
          selected: false,
        },
        {
          url: 'https://www.iqiyi.com/',
          icon: 'iqiyiSidebar',
          selectedType: 'iqiyi',
          selected: false,
        },
        {
          url: 'https://www.youtube.com/',
          icon: 'youtubeSidebar',
          selectedType: 'youtube',
          selected: false,
        },
      ],
    };
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos']),
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  watch: {
    currentUrl(val: string) {
      this.channels.forEach((channel: { selected: boolean }) => {
        channel.selected = false;
      });
      if (val) {
        const selectedChannel = this.channels.find(
          (channel: { selectedType: string }) => val.includes(channel.selectedType)
        );  
        if (selectedChannel) selectedChannel.selected = true;
      }
    },
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
    margin-top: 42px;
    margin-left: 16px;
    margin-right: 16px;
    display: flex;
    flex-direction: column;
  }
  .win {
    margin-top: 16px;
  }
}
</style>
