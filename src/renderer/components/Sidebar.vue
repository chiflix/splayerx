<template>
  <div
    class="side-bar"
  >
    <div class="icon-box">
      <div
        v-for="(channel, index) in channels"
        @click="handleSidebarIcon(channel)"
        :class="{ selected: selectedIndex === index }"
        class="icon-hover"
      >
        <Icon :type="chanelIcons[index]" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters } from 'vuex';
import Icon from '@/components/BaseIconContainer.vue';
import asyncStorage from '@/helpers/asyncStorage';

export default {
  name: 'Sidebar',
  components: {
    Icon,
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
      channels: ['https://www.bilibili.com/', 'https://www.iqiyi.com/', 'https://www.youtube.com/', 'https://www.douyu.com/'],
      chanelIcons: ['bilibiliSidebar', 'iqiyiSidebar', 'youtubeSidebar', 'douyuSidebar'],
      selectedTypes: ['bilibili', 'iqiyi', 'youtube', 'douyu'],
    };
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos']),
    selectedIndex() {
      return this.selectedTypes.findIndex((type: string) => this.currentUrl.includes(type));
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
    div {
      transition: opacity 100ms ease-in;
      opacity: 0.7;
      width: 44px;
      height: 44px;
      margin-bottom: 12px;
    }
    .icon-hover:hover {
      opacity: 1.0;
    }
    .selected {
      opacity: 1.0;
      &::before {
        content: '';
        position: absolute;
        width: 44px;
        height: 44px;
        border: 2px solid #E0E0EA;
        border-radius: 100%;
        box-sizing: border-box;
      }
    }
  }
}
</style>
