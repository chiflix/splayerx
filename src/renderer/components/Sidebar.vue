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
      ref="iconBox"
      :class="{ win: !isDarwin }"
      :style="{
        height: `${maxHeight}px`,
      }"
      class="icon-box"
    >
      <transition-group name="fade-100">
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
          :selected-index="info.style"
          :style="{
            margin: '0 auto 12px auto',
          }"
          @index-of-moving-item="indexOfMovingItem = $event"
          @index-of-moving-to="indexOfMovingTo = $event"
          @is-dragging="isDragging = $event"
        />
      </transition-group>
      <div
        :title="$t('browsing.siteTip')"
        :class="{ 'channel-opacity': currentPage === 'channelManager'
          && currentRouteName === 'browsing-view'}"
        @click="handleChannelManage"
        class="channel-manage no-drag"
      >
        <Icon
          type="channelManage"
          class="sidebar-icon"
        />
        <div
          :class="{ selected: currentPage === 'channelManager'
            && currentRouteName === 'browsing-view' }"
          class="mask"
        />
      </div>
    </div>
    <div
      :style="{
        boxShadow: bottomMask ? '0 -2px 10px 0 rgba(0,0,0,0.50)' : '',
        height: 'auto',
      }"
      class="bottom-icon no-drag"
    >
      <transition name="fade-300">
        <div
          v-if="showFileIcon || $route.name === 'landing-view'"
          @click="openHomePage"
          :title="$t('browsing.homepage.tips')"
          class="icon"
        >
          <Icon type="homePage" />
        </div>
      </transition>
      <transition name="fade-300">
        <div
          v-if="showFileIcon"
          @click="openFilesByDialog"
          :title="$t('browsing.openLocalFile')"
          class="icon"
        >
          <Icon type="open" />
        </div>
      </transition>
      <transition name="fade-300">
        <div
          v-if="showFileIcon"
          @click="backToLanding"
          :title="$t('tips.exit')"
          class="icon"
        >
          <Icon type="exit" />
        </div>
      </transition>
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
import { channelDetails } from '@/interfaces/IBrowsingChannelManager';
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
      bottomIconHeight: 62,
    };
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos', 'isHomePage', 'currentChannel', 'winHeight', 'showSidebar', 'displayLanguage', 'currentPage']),
    currentRouteName() {
      return this.$route.name;
    },
    showChannelManager() {
      return !this.currentChannel;
    },
    showFileIcon() {
      return this.$route.name === 'playing-view' || !!this.currentUrl;
    },
    totalHeight() {
      const channelsNum = this.channelsDetail.length + 1;
      return channelsNum * 56;
    },
    maxHeight() {
      const bottomHeight = this.bottomIconHeight;
      return this.winHeight - (this.isDarwin ? 42 : 16) - bottomHeight;
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  watch: {
    showFileIcon() {
      this.bottomIconHeight = this.$route.name === 'landing-view' ? 62 : 122;
    },
    currentChannel(val: string) {
      if (val) {
        this.updateCurrentPage('webPage');
      }
    },
    isDragging(val: boolean, oldVal: boolean) {
      if (oldVal && !val) {
        this.channelsDetail = BrowsingChannelManager
          .repositionChannels(this.indexOfMovingItem, this.indexOfMovingTo);
      }
    },
    channelsDetail(val: channelDetails[], oldVal: channelDetails[]) {
      if (val.length > oldVal.length) {
        setTimeout(() => {
          const scrollHeight = this.$refs.iconBox.scrollHeight;
          this.$refs.iconBox.scrollTop = scrollHeight;
          this.topMask = this.maxHeight >= this.totalHeight ? false : scrollHeight !== 0;
          this.bottomMask = scrollHeight + this.maxHeight < this.totalHeight;
        }, 100);
      }
      asyncStorage.set('channels', { channels: val });
      this.$bus.$emit('update-browsing-playlist');
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
    asyncStorage.get('channels').then(async (data) => {
      if (data.channels) {
        this.channelsDetail = BrowsingChannelManager.initAvailableChannels(data.channels);
      } else {
        this.channelsDetail = await BrowsingChannelManager
          .getDefaultChannelsByCountry(this.displayLanguage);
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
      BrowsingChannelManager.deleteCustomizedByChannel(channel);
      this.$electron.ipcRenderer.send('clear-browsers-by-channel', channel);
      this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
    });
    this.$electron.ipcRenderer.on('remove-channel', async (e: Event, channel: string) => {
      if (this.currentChannel === channel) {
        if (this.channelsDetail.length <= 1) {
          if (this.currentRouteName === 'browsing-view') {
            this.$bus.$emit('channel-manage');
          }
        } else {
          this.channelsDetail.forEach((i: channelDetails, index: number) => {
            if (i.channel === channel) {
              const currentIndex = index === this.channelsDetail.length - 1 ? 0 : index + 1;
              this.handleSidebarIcon(this.channelsDetail[currentIndex].url,
                this.channelsDetail[currentIndex].channel,
                this.channelsDetail[currentIndex].category);
            }
          });
        }
      }
      await BrowsingChannelManager.setChannelAvailable(channel, false);
      this.$electron.ipcRenderer.send('clear-browsers-by-channel', channel);
      this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
    });
  },
  methods: {
    ...mapActions({
      updateCurrentChannel: browsingActions.UPDATE_CURRENT_CHANNEL,
      updateCurrentPage: browsingActions.UPDATE_CURRENT_PAGE,
      updateCurrentCategory: browsingActions.UPDATE_CURRENT_CATEGORY,
    }),
    backToLanding() {
      this.updateCurrentPage('');
      this.$router.push({ name: 'landing-view' });
    },
    openHomePage() {
      this.updateCurrentPage('homePage');
      if (this.currentRouteName !== 'browsing-view') {
        this.$router.push({ name: 'browsing-view' });
      } else {
        this.$bus.$emit('show-homepage');
      }
    },
    handleChannelManage() {
      this.updateCurrentPage('channelManager');
      if (this.currentRouteName !== 'browsing-view') {
        this.$router.push({ name: 'browsing-view' });
      }
      this.$bus.$emit('channel-manage');
    },
    handleSidebarIcon(url: string, type: string, category: string) {
      const newChannel = type;
      if (this.currentRouteName === 'browsing-view') {
        this.$bus.$emit('sidebar-selected', {
          url, currentChannel: this.currentChannel, newChannel, category,
        });
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
      this.updateCurrentCategory(category);
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
.fade-100 {
  &-enter, &-leave-to {
    opacity: 0;
  }
  &-enter-active {
    transition: opacity 100ms ease-out 100ms;
  }
  &-leave-active {
    transition: opacity 100ms ease-out;
  }
}
::-webkit-scrollbar {
  width: 0;
}
.sidebar-icon {
  width: 44px;
  height: 44px;
}
.side-bar {
  position: absolute;
  background-color: #3B3B41;
  left: 0;
  width: 76px;
  height: 100%;
  transition: width 100ms ease-out;
  will-change: width;
  overflow: hidden;

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
  .icon-box {
    width: 100%;
    flex-direction: column;
    overflow-y: scroll;
    scroll-behavior: smooth;
  }
  .channel-manage {
    width: 44px;
    height: 44px;
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
    .icon {
      width: 30px;
      height: 30px;
      margin: auto;
    }
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
