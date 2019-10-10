<template>
  <div
    class="side-bar"
  >
    <div
      :style="{ boxShadow: topMask ? '0 2px 10px 0 rgba(0,0,0,0.50)' : '' }"
      class="top-mask"
    />
    <div
      :class="{ 'win': !isDarwin }"
      :style="{
        height: `${maxHeight}px`,
      }"
      class="icon-box no-drag"
    >
      <SidebarIcon
        v-for="(info, index) in channelsDetail"
        :index="index"
        :key="info.url"
        :title="info.title"
        :icon="info.icon"
        :selected="info.type === currentChannel"
        :style="{
          margin: index !== channelsDetail.length - 1 ? '0 auto 12px auto' : '0 auto 0 auto',
        }"
        @click.native="handleSidebarIcon(info.url, index)"
      />
    </div>
    <div
      :style="{
        boxShadow: bottomMask ? '0 -2px 10px 0 rgba(0,0,0,0.50)' : '',
        height: showFileIcon ? '66px' : '',
      }"
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
import { setElementStyle } from '@/libs/dom';

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
      channels: ['https://www.bilibili.com/', 'https://www.iqiyi.com/', 'https://www.douyu.com/', 'https://www.huya.com/', 'https://v.qq.com/', 'https://www.youku.com/', 'https://www.youtube.com/'],
      showFileIcon: false,
      mousedown: NaN,
      topMask: false,
      bottomMask: false,
    };
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos', 'isHistory', 'currentChannel', 'winHeight']),
    totalHeight() {
      return this.channels.length * 44 + (this.channels.length - 1) * 12;
    },
    maxHeight() {
      const bottomHeight = this.showFileIcon ? 66 : 0;
      return this.winHeight - 42 - bottomHeight;
    },
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
    winHeight() {
      const scrollTop = (document.querySelector('.icon-box') as HTMLElement).scrollTop;
      this.topMask = scrollTop !== 0;
      this.bottomMask = scrollTop + this.maxHeight < this.totalHeight;
    },
  },
  mounted() {
    this.topMask = false;
    this.bottomMask = this.maxHeight < this.totalHeight;
    (document.querySelector('.icon-box') as HTMLElement).addEventListener('wheel', () => {
      const scrollTop = (document.querySelector('.icon-box') as HTMLElement).scrollTop;
      this.topMask = scrollTop !== 0;
      this.bottomMask = scrollTop + this.maxHeight < this.totalHeight;
    });
  },
  methods: {
    ...mapActions({
      updateIsHistoryPage: browsingActions.UPDATE_IS_HISTORY,
      updateCurrentChannel: browsingActions.UPDATE_CURRENT_CHANNEL,
    }),
    handleMousedown(index: number, e) {
      console.log('mousedown', index, e);
      this.mousedown = index;
      document.addEventListener('mousemove', this.handleMousemove);
      document.addEventListener('mouseup', this.handleMouseup);
    },
    handleMousemove(e: MouseEvent) {
      console.log('mousemove');
      setElementStyle(this.$refs.sidebar[this.mousedown].$el, 'transform', 'translateX(-10px)');
    },
    handleMouseup(index: number) {
      document.removeEventListener('mousemove', this.handleMousemove);
      console.log('mouseup');
    },
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
::-webkit-scrollbar {
  width: 0;
}
.side-bar {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #3B3B41;
  z-index: 0;
  left: 0;
  width: 76px;
  height: 100%;
  transition: width 100ms ease-out;
  will-change: width;

  .top-mask {
    width: 100%;
    height: 42px;
  }
  .icon-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
  }
  .bottom-icon {
    display:flex;
    flex-direction: column;
    width: 100%;
  }
  .icon-hover {
    margin: auto;
  }
  .win {
    margin-top: 16px;
  }
}
</style>
