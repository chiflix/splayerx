<template>
  <div
    class="side-bar"
  >
    <div
      :class="{ 'win': !isDarwin }"
      class="icon-box no-drag"
    >
      <SidebarIcon
        v-for="(info, index) in channelsDetail"
        :key="info.url"
        :title="info.title"
        :icon="info.icon"
        :selected="info.type === currentChannel"
        @click.native="handleSidebarIcon(info.url, index)"
      />
    </div>
    <div
      v-if="showFileIcon"
      class="bottom-icon no-drag"
    >
      <div
        @click="openFilesByDialog"
        :title="$t('browsing.openLocalFile')"
        class="icon-hover"
      >
        <Icon type="open" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
import asyncStorage from '@/helpers/asyncStorage';
import Icon from '@/components/BaseIconContainer.vue';
import SidebarIcon from '@/components/SidebarIcon.vue';

export default {
  name: 'Sidebar',
  components: {
    Icon,
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
      channels: ['https://www.bilibili.com/', 'https://www.iqiyi.com/', 'https://www.douyu.com/', 'https://www.huya.com/', 'https://v.qq.com/', 'https://www.youtube.com/'],
      showFileIcon: false,
    };
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos', 'isHistory', 'currentChannel']),
    isDarwin() {
      return process.platform === 'darwin';
    },
    channelsDetail() {
      return this.channels.map((channel: string) => {
        const basename = channel.slice(channel.indexOf('.') + 1, channel.lastIndexOf('.'));
        return {
          url: channel,
          icon: `${basename}Sidebar`,
          title: `browsing.${basename}`,
          type: `${basename}.com`,
        };
      });
    },
  },
  watch: {
    currentUrl(val: string) {
      this.showFileIcon = !!val;
    },
  },
  methods: {
    ...mapActions({
      updateIsHistoryPage: browsingActions.UPDATE_IS_HISTORY,
      updateCurrentChannel: browsingActions.UPDATE_CURRENT_CHANNEL,
    }),
    openHistory() {
      this.updateIsHistoryPage(!this.isHistory);
    },
    handleSidebarIcon(url: string, index: number) {
      const newChannel = this.channelsDetail[index].type;
      if (this.$route.name === 'browsing-view') {
        this.$bus.$emit('sidebar-selected', { url, currentChannel: this.currentChannel, newChannel });
      } else {
        asyncStorage.get('browsingPip').then((data) => {
          this.$store.dispatch('updatePipSize', data.pipSize || this.pipSize);
          this.$store.dispatch('updatePipPos', data.pipPos || this.pipPos);
          this.$electron.ipcRenderer.send('add-browsing', { size: data.pipSize || this.pipSize, position: data.pipPos || this.pipPos });
        });
        this.$electron.ipcRenderer.send('change-channel', { url, channel: newChannel });
        if (this.$router.currentRoute.name !== 'browsing-view') this.$router.push({ name: 'browsing-view' });
      }
      this.updateCurrentChannel(newChannel);
    },
  },
};
</script>
<style lang="scss" scoped>
.side-bar {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background-color: #3B3B41;
  z-index: 0;
  left: 0;
  width: 76px;
  height: 100%;
  transition: width 100ms ease-out;
  will-change: width;

  .icon-box {
    width: 44px;
    margin-top: 42px;
    display: flex;
    flex-direction: column;
  }
  .bottom-icon {
    display:flex;
    flex-direction: column;
    margin-bottom: 18px;
  }
  .win {
    margin-top: 16px;
  }
}
</style>
