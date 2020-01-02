<template>
  <div
    :style="{
      zIndex: isDarwin ? 0 : 7,
      background: isDarkMode ? '#35353A' : '#3B3B41',
    }"
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
      <SidebarIcon
        v-for="(info, index) in channelsDetail"
        v-show="info.category !== 'temporary' || temporaryChannels.length > 1"
        v-bind="info"
        :key="index"
        :index="index"
        :item-dragging="isDragging"
        :index-of-moving-to.sync="indexOfMovingTo"
        :index-of-moving-item.sync="indexOfMovingItem"
        :selected="info.channel === currentChannel && !showChannelManager"
        :select-sidebar="handleSidebarIcon"
        :selected-index="info.style"
        :channels-length="channelsDetail.length"
        :temporary-channels-length="temporaryChannels.length"
        :handle-menu="handleChannelMenu"
        :channel-info="info"
        :is-dark-mode="isDarkMode"
        :getting-view-info="gettingTemporaryViewInfo"
        :style="{
          margin: '0 auto 12px auto',
        }"
        @is-dragging="isDragging = $event"
      />
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
          <Icon :type="isDarkMode ? 'homePageDark' : 'homePage'" />
        </div>
      </transition>
      <transition name="fade-300">
        <div
          v-if="showFileIcon"
          @click="openFilesByDialog"
          :title="$t('browsing.openLocalFile')"
          class="icon"
        >
          <Icon :type="isDarkMode ? 'openDark' : 'open'" />
        </div>
      </transition>
      <transition name="fade-300">
        <div
          v-if="showFileIcon"
          @click="backToLanding"
          :title="$t('tips.exit')"
          class="icon"
        >
          <Icon :type="isDarkMode ? 'exitDark' : 'exit'" />
        </div>
      </transition>
    </div>
  </div>
</template>
<script lang="ts">
import { difference } from 'lodash';
// @ts-ignore
import urlParseLax from 'url-parse-lax';
import { mapGetters, mapActions } from 'vuex';
import { Browsing as browsingActions } from '@/store/actionTypes';
import { channelDetails } from '@/interfaces/IBrowsingChannelManager';
import asyncStorage from '@/helpers/asyncStorage';
import Icon from '@/components/BaseIconContainer.vue';
import SidebarIcon from '@/components/SidebarIcon.vue';
import BrowsingChannelManager from '@/services/browsing/BrowsingChannelManager';
import { log } from '@/libs/Log';
import BrowsingChannelMenu from '@/services/browsing/BrowsingChannelMenu';
import { calcCurrentChannel } from '../../shared/utils';
import { BrowsingHistoryItem } from '@/helpers/browsingDB';

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
      temporaryChannels: [],
      channelInfo: {},
      openUrlTimer: 0,
    };
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos', 'isHomePage', 'currentChannel', 'winHeight', 'showSidebar', 'displayLanguage', 'currentPage', 'gettingTemporaryViewInfo', 'isDarkMode']),
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
      const channelsNum = this.channelsDetail.length;
      const separatorHeight = this.temporaryChannels.length <= 1 ? 0 : 21;
      return channelsNum * 56 + separatorHeight;
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
        if ((this.indexOfMovingItem >= this.temporaryChannels.length
          && this.indexOfMovingTo >= this.temporaryChannels.length)
          || (this.indexOfMovingItem < this.temporaryChannels.length - 1
            && this.indexOfMovingTo < this.temporaryChannels.length - 1)
        ) {
          this.channelsDetail = BrowsingChannelManager
            .repositionChannels(this.indexOfMovingItem, this.indexOfMovingTo);
        } else if (
          this.indexOfMovingItem < this.temporaryChannels.length - 1
          && this.indexOfMovingTo >= this.temporaryChannels.length - 1
        ) {
          BrowsingChannelManager.storeTemporaryChannel(this.channelsDetail[this.indexOfMovingItem],
            this.indexOfMovingTo).then((info: { channel: string, category: string }) => {
            this.temporaryChannels = BrowsingChannelManager.getTemporaryChannels();
            this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
            this.updateCurrentChannel(info.channel);
            this.updateCurrentCategory(info.category);
            this.$bus.$emit('update-customized-channel');
            log.info('temporary to customized', info.channel);
          });
        } else {
          log.info('customized can not move to temporary', this.channelsDetail[this.indexOfMovingItem].channel);
        }
      }
    },
    channelsDetail(val: channelDetails[], oldVal: channelDetails[]) {
      if (val.length > oldVal.length) {
        setTimeout(() => {
          if (this.$refs.iconBox) {
            const scrollHeight = val.findIndex(i => i === difference(val, oldVal)[0]) === 0
              ? 0 : this.$refs.iconBox.scrollHeight;
            this.$refs.iconBox.scrollTop = scrollHeight;
            this.topMask = this.maxHeight >= this.totalHeight ? false : scrollHeight !== 0;
            this.bottomMask = scrollHeight + this.maxHeight < this.totalHeight;
          }
        }, 100);
      }
      asyncStorage.set('channels', { channels: val.filter(i => i.category !== 'temporary') });
      this.$electron.ipcRenderer.send('update-available-channels', val);
      this.$bus.$emit('update-browsing-playlist');
    },
    winHeight() {
      const scrollTop = this.$refs.iconBox.scrollTop;
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
    this.$refs.iconBox.addEventListener('scroll', () => {
      const scrollTop = this.$refs.iconBox.scrollTop;
      this.topMask = scrollTop !== 0;
      this.bottomMask = scrollTop + this.maxHeight < this.totalHeight;
    });
    this.$electron.ipcRenderer.on('send-url', (event: Event, urlInfo: { url: string, username: string, password: string }) => {
      this.handleUrl(urlInfo);
    });
    this.$bus.$on('available-channel-update', () => {
      this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
      const scrollTop = this.$refs.iconBox.scrollTop;
      this.topMask = this.maxHeight >= this.totalHeight ? false : scrollTop !== 0;
      this.bottomMask = scrollTop + this.maxHeight < this.totalHeight;
    });
    this.$bus.$on('delete-channel', (channel: string) => {
      BrowsingChannelManager.deleteCustomizedByChannel(channel);
      this.$electron.ipcRenderer.send('clear-browsers-by-channel', channel);
      this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
    });
    this.$bus.$on('add-temporary-site', async (url: string) => {
      await this.handleUrl({ url, username: '', password: '' });
    });
    this.$electron.ipcRenderer.on('add-temporary-site', async (e: Event, args: BrowsingHistoryItem) => {
      await this.handleUrl({ url: args.url, username: '', password: '' });
    });
    this.$electron.ipcRenderer.on('store-temporary-channel', (e: Event, item: channelDetails) => {
      BrowsingChannelManager.storeTemporaryChannel(item, this.temporaryChannels.length - 1)
        .then((info: { channel: string, category: string }) => {
          this.temporaryChannels = BrowsingChannelManager.getTemporaryChannels();
          this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
          this.updateCurrentChannel(info.channel);
          this.updateCurrentCategory(info.category);
          this.$bus.$emit('update-customized-channel');
          log.info('temporary to customized', info.channel);
        });
    });
    this.$electron.ipcRenderer.on('remove-channel', async (e: Event, channel: string) => {
      if (this.currentChannel === channel) {
        if (this.channelsDetail.length <= 2) {
          if (this.currentRouteName === 'browsing-view') {
            this.$bus.$emit('channel-manage');
          }
        } else {
          const removeIndex = this.channelsDetail
            .findIndex((i: channelDetails) => i.channel === channel);
          if (removeIndex <= this.temporaryChannels.length - 1) {
            if (this.temporaryChannels.length <= 2) {
              this.handleSidebarIcon(this.channelsDetail[this.temporaryChannels.length].url,
                this.channelsDetail[this.temporaryChannels.length].channel,
                this.channelsDetail[this.temporaryChannels.length].category);
            } else {
              const offset = removeIndex >= this.temporaryChannels.length - 2 ? -1 : 1;
              this.handleSidebarIcon(this.channelsDetail[removeIndex + offset].url,
                this.channelsDetail[removeIndex + offset].channel,
                this.channelsDetail[removeIndex + offset].category);
            }
          } else if (this.channelsDetail.length - this.temporaryChannels.length <= 1) {
            this.handleSidebarIcon(this.channelsDetail[0].url,
              this.channelsDetail[0].channel,
              this.channelsDetail[0].category);
          } else {
            const offset = removeIndex >= this.channelsDetail.length - 1 ? -1 : 1;
            this.handleSidebarIcon(this.channelsDetail[removeIndex + offset].url,
              this.channelsDetail[removeIndex + offset].channel,
              this.channelsDetail[removeIndex + offset].category);
          }
        }
      }
      await BrowsingChannelManager.setChannelAvailable(channel, false);
      this.$electron.ipcRenderer.send('clear-browsers-by-channel', channel);
      this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
      this.temporaryChannels = BrowsingChannelManager.getTemporaryChannels();
    });
  },
  methods: {
    ...mapActions({
      updateCurrentChannel: browsingActions.UPDATE_CURRENT_CHANNEL,
      updateCurrentPage: browsingActions.UPDATE_CURRENT_PAGE,
      updateCurrentCategory: browsingActions.UPDATE_CURRENT_CATEGORY,
      updateGettingTemporaryViewInfo: browsingActions.UPDATE_GETTING_TEMPORARY_VIEW_INFO,
    }),
    handleChannelMenu(index: number, info: channelDetails) {
      if (this.isDarwin) {
        if (index >= this.temporaryChannels.length) {
          BrowsingChannelMenu.createChannelMenu(info.channel);
        } else {
          BrowsingChannelMenu
            .createTemporaryChannelMenu(info.channel, info, this.gettingTemporaryViewInfo);
        }
      } else {
        this.$bus.$emit('open-channel-menu', { channel: info.channel, info });
      }
    },
    async handleUrl({ url }: { url: string, username: string, password: string }) {
      // TODO m3u8 need user info
      if (!url) return;
      const view = new this.$electron.remote.BrowserView();
      const parseInfo = urlParseLax(/^(\w+):\/\//.test(url) ? url : `http://${url}`);
      this.channelInfo = {
        category: 'temporary',
        url: parseInfo.href,
        path: parseInfo.hostname,
        channel: parseInfo.href,
        title: url,
        icon: '',
        style: 0,
      };
      await BrowsingChannelManager.addTemporaryChannel(this.channelInfo);
      this.temporaryChannels = BrowsingChannelManager.getTemporaryChannels();
      this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
      const allChannels = this.channelsDetail.map((i: { channel: string }) => i.channel);
      let selectChannel = `${this.channelInfo.channel}#temporary`;
      if (allChannels.includes(calcCurrentChannel(this.channelInfo.url))) {
        selectChannel = calcCurrentChannel(this.channelInfo.url);
      } else if (allChannels.includes(this.channelInfo.channel)) {
        selectChannel = this.channelInfo.channel;
      }
      this.handleSidebarIcon(this.channelInfo.url, selectChannel, this.channelInfo.category);
      this.updateGettingTemporaryViewInfo(true);
      view.webContents.addListener('did-finish-load', () => {
        view.webContents.removeAllListeners();
        const title = view.webContents.getTitle();
        this.channelInfo.icon = (title.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u) as string[])[0].toUpperCase() || 'O';
        BrowsingChannelManager.updateTemporaryChannel({
          channel: this.channelInfo.channel, icon: this.channelInfo.icon, title,
        });
        this.temporaryChannels = BrowsingChannelManager.getTemporaryChannels();
        this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
        view.destroy();
        this.updateGettingTemporaryViewInfo(false);
        log.info('open-url-success: load finished', this.channelInfo);
      });
      view.webContents.addListener('did-fail-load', async (e: Event, errorCode: number, errorDescription: string, validatedURL: string) => {
        log.info('open-url-error', `code: ${errorCode}, description: ${errorDescription}, url: ${validatedURL}`);
        view.webContents.removeAllListeners();
        this.channelInfo.icon = (url.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u) as string[])[0].toUpperCase() || 'O';
        BrowsingChannelManager.updateTemporaryChannel({
          channel: this.channelInfo.channel, icon: this.channelInfo.icon,
        });
        this.temporaryChannels = BrowsingChannelManager.getTemporaryChannels();
        this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
        view.destroy();
        this.updateGettingTemporaryViewInfo(false);
        log.info('open-url-success: load failed', this.channelInfo);
      });

      view.webContents.addListener('page-title-updated', async (e: Event, title: string) => {
        view.webContents.removeAllListeners();
        title = title || 'O';
        this.channelInfo.title = title;
        const name = title.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u);
        this.channelInfo.icon = name ? name[0].toUpperCase() : 'O';
        BrowsingChannelManager.updateTemporaryChannel({
          channel: this.channelInfo.channel,
          icon: this.channelInfo.icon,
          title: this.channelInfo.title,
        });
        this.temporaryChannels = BrowsingChannelManager.getTemporaryChannels();
        this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
        view.destroy();
        this.updateGettingTemporaryViewInfo(false);
        log.info('open-url-success: normal', this.channelInfo);
      });
      const loadUrl = parseInfo.href;
      view.webContents.loadURL(loadUrl);
      clearTimeout(this.openUrlTimer);
      this.openUrlTimer = setTimeout(async () => {
        if (view && !view.isDestroyed()) {
          view.webContents.removeAllListeners();
          this.channelInfo.icon = (url.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u) as string[])[0].toUpperCase() || 'O';
          BrowsingChannelManager.updateTemporaryChannel({
            channel: this.channelInfo.channel, icon: this.channelInfo.icon,
          });
          this.temporaryChannels = BrowsingChannelManager.getTemporaryChannels();
          this.channelsDetail = BrowsingChannelManager.getAllAvailableChannels();
          view.destroy();
          this.updateGettingTemporaryViewInfo(false);
          log.info('open-url-success: time out', this.channelInfo);
        }
      }, 5000);
      const scrollTop = this.$refs.iconBox.scrollTop;
      this.topMask = this.maxHeight >= this.totalHeight ? false : scrollTop !== 0;
      this.bottomMask = scrollTop + this.maxHeight < this.totalHeight;
    },
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
  left: 0;
  width: 76px;
  height: 100%;
  transition: width 100ms ease-out;
  will-change: width;
  overflow: hidden;

  .separator {
    border-top: 1px solid #6F7078;
    margin-top: 4px;
    margin-bottom: 16px;
    margin-left: auto;
    margin-right: auto;
    width: 52px;
  }

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
