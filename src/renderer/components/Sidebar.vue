<template>
  <div
    :style="{ zIndex: isDarwin ? 0 : 7 }"
    class="side-bar"
  >
    <div
      :style="{
        boxShadow: topMask ?
          isDarwin ? '0 2px 10px 0 rgba(0,0,0,0.50)' : '0 -3px 8px 0 rgba(0,0,0,0.60)'
          : ''
      }"
      :class="isDarwin ? 'top-mask' : 'top-mask-win'"
    />
    <div
      :class="{ win: !isDarwin }"
      :style="{
        height: `${maxHeight}px`,
      }"
      class="icon-box"
    >
      <SidebarIcon
        v-for="(info, index) in channelsDetail"
        v-bind="info"
        :index="index"
        :key="info.url"
        :item-dragging="isDragging"
        :index-of-moving-to="indexOfMovingTo"
        :index-of-moving-item="indexOfMovingItem"
        :selected="info.channel === currentChannel && !showChannelManager"
        :select-sidebar="handleSidebarIcon"
        :style="{
          margin: '0 auto 12px auto',
        }"
        @index-of-moving-item="indexOfMovingItem = $event"
        @index-of-moving-to="indexOfMovingTo = $event"
        @is-dragging="isDragging = $event"
      />
      <div
        :title="$t('browsing.siteTip')"
        :class="{ 'channel-opacity': showChannelManager && currentRouteName === 'browsing-view'}"
        @click="handleChannelManage"
        class="channel-manage no-drag"
      >
        <Icon
          type="channelManage"
        />
        <div
          :class="{ selected: showChannelManager && currentRouteName === 'browsing-view' }"
          class="mask"
        />
      </div>
    </div>
    <div
      v-if="!showFileIcon"
      :style="{ boxShadow: bottomMask ? '0 -3px 8px 0 rgba(0,0,0,0.60)' : '' }"
      class="bottom-mask"
    />
    <transition name="fade-300">
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
        <div
          @click="openHomePage"
          class="icon-hover"
        >
          <Icon type="home" />
        </div>
      </div>
    </transition>
  </div>
</template>
<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
import asyncStorage from '@/helpers/asyncStorage';
import Icon from '@/components/BaseIconContainer.vue';
import SidebarIcon from '@/components/SidebarIcon.vue';
import BrowsingChannelManager from '@/services/browsing/BrowsingChannelManager';

export default {
  name: 'Sidebar',
  components: {
    Icon,
    SidebarIcon,
  },
  props: {
    currentUrl: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      mousedown: NaN,
      topMask: false,
      bottomMask: false,
      indexOfMovingItem: NaN,
      indexOfMovingTo: NaN,
      isDragging: false,
      channelsDetail: [],
    };
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos', 'isHistory', 'currentChannel', 'winHeight', 'showSidebar']),
    currentRouteName() {
      return this.$route.name;
    },
    showChannelManager() {
      return !this.currentChannel;
    },
    showFileIcon() {
      return this.$route.name === 'playing-view' || this.$route.name === 'browsing-view';
    },
    totalHeight() {
      const channelsNum = this.channelsDetail.length + 1;
      return channelsNum * 56;
    },
    bottomIconHeight() {
      return 98;
    },
    maxHeight() {
      const bottomHeight = this.showFileIcon ? this.bottomIconHeight : 0;
      return this.winHeight - (this.isDarwin ? 42 : 0) - bottomHeight;
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  watch: {
    isDragging(val: boolean, oldVal: boolean) {
      if (oldVal && !val) {
        this.channelsDetail = BrowsingChannelManager
          .repositionChannels(this.indexOfMovingItem, this.indexOfMovingTo);
      }
    },
    channelsDetail: {
      handler: (val: { url: string, channel: string,
        icon: string, title: string, path: string }[]) => {
        asyncStorage.set('channels', { channels: val });
      },
      deep: true,
    },
    currentRouteName(val: string) {
      if (val !== 'browsing-view') {
        this.$bus.$on('available-channel-update', () => {
          this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
        });
      }
    },
    winHeight() {
      const scrollTop = (document.querySelector('.icon-box') as HTMLElement).scrollTop;
      this.topMask = this.maxHeight >= this.totalHeight ? false : scrollTop !== 0;
      this.bottomMask = scrollTop + this.maxHeight < this.totalHeight;
    },
  },
  created() {
    asyncStorage.get('channels').then((data) => {
      if (data.channels) {
        this.channelsDetail = BrowsingChannelManager.initAvailableChannels(data.channels);
      } else {
        this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
      }
    });
  },
  mounted() {
    this.topMask = false;
    this.bottomMask = this.maxHeight < this.totalHeight;
    (document.querySelector('.icon-box') as HTMLElement).addEventListener('scroll', () => {
      const scrollTop = (document.querySelector('.icon-box') as HTMLElement).scrollTop;
      this.topMask = scrollTop !== 0;
      this.bottomMask = scrollTop + this.maxHeight < this.totalHeight;
    });
    this.$bus.$on('available-channel-update', () => {
      this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
      const scrollTop = (document.querySelector('.icon-box') as HTMLElement).scrollTop;
      this.topMask = this.maxHeight >= this.totalHeight ? false : scrollTop !== 0;
      this.bottomMask = scrollTop + this.maxHeight < this.totalHeight;
    });
    this.$electron.ipcRenderer.on('delete-channel', (e: Event, channel: string) => {
      if (this.currentChannel === channel) {
        if (this.channelsDetail.length <= 1) {
          if (this.currentRouteName === 'browsing-view') {
            this.$bus.$emit('channel-manage');
          }
        } else {
          this.channelsDetail.forEach((i: {
            url: string, channel: string,
            icon: string, title: string, path: string
          }, index: number) => {
            if (i.channel === channel) {
              const currentIndex = index === this.channelsDetail.length - 1 ? 0 : index + 1;
              this.handleSidebarIcon(this.channelsDetail[currentIndex].url,
                this.channelsDetail[currentIndex].channel);
            }
          });
        }
      }
      BrowsingChannelManager.setChannelAvailable(channel, false);
      this.$electron.ipcRenderer.send('clear-browsers-by-channel', channel);
      this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
    });
  },
  methods: {
    ...mapActions({
      updateIsHistoryPage: browsingActions.UPDATE_IS_HISTORY,
      updateCurrentChannel: browsingActions.UPDATE_CURRENT_CHANNEL,
    }),
    openHomePage() {
      this.$bus.$emit('back-to-landingview');
    },
    handleChannelManage() {
      if (this.currentRouteName !== 'browsing-view') {
        this.$router.push({ name: 'browsing-view' });
      }
      this.$bus.$emit('channel-manage');
    },
    openHistory() {
      this.updateIsHistoryPage(!this.isHistory);
    },
    handleSidebarIcon(url: string, type: string) {
      const newChannel = type;
      if (this.currentRouteName === 'browsing-view') {
        this.$bus.$emit('sidebar-selected', { url, currentChannel: this.currentChannel, newChannel });
      } else {
        asyncStorage.get('browsingPip').then((data) => {
          this.$store.dispatch('updatePipSize', data.pipSize || this.pipSize);
          this.$store.dispatch('updatePipPos', data.pipPos || this.pipPos);
          this.$electron.ipcRenderer.send('add-browsing', { size: data.pipSize || this.pipSize, position: data.pipPos || this.pipPos });
        });
        this.$router.push({ name: 'browsing-view' }).then(() => {
          this.$electron.ipcRenderer.send('change-channel', { url, channel: newChannel });
        });
      }
      this.updateCurrentChannel(newChannel);
    },
  },
};
</script>
<style lang="scss" scoped>
.fade-300 {
  &-enter, &-leave-to {
    opacity: 0;
  }
  &-enter-active {
    transition: opacity 200ms ease-out 200ms;
  }
  &-leave-active {
    transition: opacity 200ms ease-out;
  }
}
::-webkit-scrollbar {
  width: 0;
}
.side-bar {
  position: absolute;
  background-color: #3B3B41;
  left: 0;
  width: 76px;
  height: 100%;
  transition: width 100ms ease-out;
  will-change: width;

  .top-mask {
    width: 100%;
    height: 42px;
  }
  .top-mask-win {
    width: 100%;
    height: 42px;
    position: absolute;
    top: -42px;
  }
  .bottom-mask {
    position: absolute;
    width: 100%;
    height: 42px;
    bottom: -42px;
  }
  .icon-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
  }
  .channel-manage {
    margin: 0 auto 12px auto;
    position: relative;
    opacity: 0.7;
    transition: opacity 100ms ease-in;
    &:hover {
      opacity: 1;
    }
  }
  .channel-opacity {
    opacity: 1;
  }
  .bottom-icon {
    position: absolute;
    bottom: 0;
    padding-top: 16px;
    padding-bottom: 16px;
    display:flex;
    flex-direction: column;
    width: 100%;
  }
  .icon-hover {
    margin: auto;
  }
  .mask {
    width: 44px;
    height: 44px;
    position: absolute;
    top: 0;
  }
  .selected {
    opacity: 1;
    border: 2px solid #E0E0EA;
    border-radius: 100%;
    box-sizing: border-box;
  }
  .win {
    padding-top: 16px;
  }
}
</style>
