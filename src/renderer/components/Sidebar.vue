<template>
  <div
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
      :class="{ 'win': !isDarwin }"
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
        :selected="info.type === currentChannel"
        :select-sidebar="handleSidebarIcon"
        :style="{
          margin: '0 auto 12px auto',
        }"
        @index-of-moving-item="indexOfMovingItem = $event"
        @index-of-moving-to="indexOfMovingTo = $event"
        @is-dragging="isDragging = $event"
      />
    </div>
    <div
      v-if="!showFileIcon"
      :style="{ boxShadow: bottomMask ? '0 -3px 8px 0 rgba(0,0,0,0.60)' : '' }"
      class="bottom-mask"
    />
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
      showFileIcon: false,
      mousedown: NaN,
      topMask: false,
      bottomMask: false,
      indexOfMovingItem: NaN,
      indexOfMovingTo: NaN,
      isDragging: false,
    };
  },
  computed: {
    ...mapGetters(['pipSize', 'pipPos', 'isHistory', 'currentChannel', 'winHeight', 'channels']),
    totalHeight() {
      return this.channels.length * 56;
    },
    maxHeight() {
      const bottomHeight = this.showFileIcon ? 66 : 0;
      return this.winHeight - (this.isDarwin ? 42 : 0) - bottomHeight;
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
    isDragging(val: boolean, oldVal: boolean) {
      if (oldVal && !val) {
        this.$store.dispatch('repositionChannels',
          { from: this.indexOfMovingItem, to: this.indexOfMovingTo },
        );
      }
    },
    currentUrl(val: string) {
      this.showFileIcon = !!val;
    },
    winHeight() {
      const scrollTop = (document.querySelector('.icon-box') as HTMLElement).scrollTop;
      this.topMask = this.maxHeight >= this.totalHeight ? false : scrollTop !== 0;
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
    openHistory() {
      this.updateIsHistoryPage(!this.isHistory);
    },
    handleSidebarIcon(url: string, type: string) {
      const newChannel = type;
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
  .bottom-icon {
    display:flex;
    flex-direction: column;
    width: 100%;
  }
  .icon-hover {
    margin: auto;
  }
  .win {
    padding-top: 16px;
  }
}
</style>
