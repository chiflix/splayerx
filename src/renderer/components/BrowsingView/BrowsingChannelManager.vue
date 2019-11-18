<template>
  <div
    :style="{
      pointerEvents: showAddChannel ? 'none' : 'auto',
    }"
    class="channel-manager no-drag"
  >
    <div class="manager-container">
      <div
        v-if="allChannels.get(category.type).channels.length"
        v-for="category in categories"
        class="category-part"
      >
        <span :style="{ fontWeight: 'bold' }">{{ $t(category.locale) }}</span>
        <div class="channel-container">
          <div
            v-for="(item, index) in allChannels.get(category.type).channels"
            @mouseover="handleMouseover(index, category.type)"
            @mouseleave="handleMouseleave"
            @mousedown="handleMousedown($event, item, index)"
            :style="{
              backgroundColor: (index === hoverIndex && category.type === hoverCategory)
                || availableChannels.includes(item.channel) ? '#FBFBFD' : '#FFFFFF',
            }"
            class="channel-details"
          >
            <div
              :style="{
                border: (index === hoverIndex && category.type === hoverCategory)
                  && availableChannels.includes(item.channel) ? '1px solid rgba(224, 224, 224, 1)'
                  : '1px solid rgba(234, 234, 234, 1)',
                opacity: (index === hoverIndex && category.type === hoverCategory)
                  || availableChannels.includes(item.channel) ? 1 : 0,
              }"
              class="channel-mask hover-channel"
            >
              <div
                v-show="index !== 0 || hoverCategory !== 'customized'"
                :style="{
                  backgroundColor: availableChannels.includes(item.channel)
                    && (index === hoverIndex && category.type === hoverCategory) ? '#E9E9E9' : '',
                  border: availableChannels.includes(item.channel)
                    && (index === hoverIndex && category.type === hoverCategory)
                    ? '1px solid rgba(224, 224, 224, 1)' : '1px solid rgba(234, 234, 234, 1)'
                }"
                class="available-check"
              >
                <Icon
                  :style="{
                    opacity: !availableChannels.includes(item.channel)
                      ? 0 : (index === hoverIndex && category.type === hoverCategory) ? 1 : 0.4,
                    transition: 'opacity 100ms linear',
                  }"
                  type="channelSelected"
                  class="channel-selected"
                />
              </div>
            </div>
            <div
              :class="item.icon.length === 1 ? `bookmark-style${item.style}` : ''"
              class="icon-container"
            >
              <span v-if="item.icon.length === 1">{{ item.icon }}</span>
              <img
                :style="{
                  width: '44px',
                  height: '44px',
                  borderRadius: '100%'
                }"
                v-if="item.icon.length > 1 && item.category === 'customized' && index !== 0"
                :src="item.icon"
              >
              <Icon
                v-if="item.icon.length > 1 && (item.category !== 'customized' || index === 0)"
                :type="item.icon"
              />
            </div>
            <span class="title">
              {{ item.category === 'customized' && index !== 0 ? item.title : $t(item.title) }}
            </span>
            <span class="path">{{ item.path }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TODO 添加自定义站点 -->
    <browsing-customized-channel
      v-if="showAddChannel"
      :init-channel-name.sync="title"
      :init-url.sync="url"
      :show-add-channel.sync="showAddChannel"
    />
  </div>
</template>

<script lang="ts">
import { mapActions } from 'vuex';
import BrowsingChannelMenu from '@/services/browsing/BrowsingChannelMenu';
import BrowsingChannelManager from '@/services/browsing/BrowsingChannelManager';
import Icon from '@/components/BaseIconContainer.vue';
import { Browsing as browsingActions } from '@/store/actionTypes';
import { channelDetails } from '@/interfaces/IBrowsingChannelManager';
import BrowsingCustomizedChannel from './BrowsingCustomizedChannel.vue';

export default {
  name: 'BrowsingChannelManager',
  components: {
    Icon,
    'browsing-customized-channel': BrowsingCustomizedChannel,
  },
  data() {
    return {
      hoverIndex: -1,
      availableChannels: [],
      hoverCategory: '',
      showAddChannel: false,
      title: '',
      url: '',
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    categories() {
      return BrowsingChannelManager.getAllCategories();
    },
    allChannels() {
      return BrowsingChannelManager.getAllChannels();
    },
  },
  watch: {
    showAddChannel(val: boolean) {
      this.$bus.$emit('disable-sidebar-shortcut', val);
      if (!val) {
        this.title = '';
        this.url = '';
      }
    },
    availableChannels() {
      this.$bus.$emit('available-channel-update');
    },
  },
  created() {
    this.availableChannels = BrowsingChannelManager
      .getAllAvailableChannels().map(item => item.channel);
  },
  mounted() {
    this.$bus.$on('update-customized-channel', () => {
      this.availableChannels = BrowsingChannelManager
        .getAllAvailableChannels().map(item => item.channel);
    });
    this.$electron.ipcRenderer.on('remove-channel', () => {
      this.availableChannels = BrowsingChannelManager.getAllAvailableChannels()
        .map(item => item.channel);
    });
    this.$electron.ipcRenderer.on('delete-channel', () => {
      this.availableChannels = BrowsingChannelManager.getAllAvailableChannels()
        .map(item => item.channel);
    });
    this.$electron.ipcRenderer.on('edit-channel', (evt: Event, item: channelDetails) => {
      this.showAddChannel = true;
      this.title = item.title;
      this.url = item.url;
    });
  },
  methods: {
    ...mapActions({
      updateBookmarkSelectedIndex: browsingActions.UPDATE_BOOKMARK_SELECTED_INDEX,
    }),
    handleMouseover(index: number, category: string) {
      this.hoverIndex = index;
      this.hoverCategory = category;
    },
    handleMouseleave() {
      this.hoverIndex = -1;
      this.hoverCategory = '';
    },
    handleMousedown(e: MouseEvent, item: channelDetails, index: number) {
      if (e.button === 2) {
        if (item.category === 'customized' && index !== 0) {
          if (this.isDarwin) {
            BrowsingChannelMenu.createCustomizedMenu(item.channel, item);
          } else {
            this.$bus.$emit('open-channel-menu', { channel: item.channel, item });
          }
          this.updateBookmarkSelectedIndex(item.style);
        } else {
          this.$bus.$emit('disable-windows-menu');
        }
      } else if (item.category === 'customized' && index === 0) {
        this.showAddChannel = true;
      } else {
        const isAvailable = this.availableChannels.includes(item.channel);
        BrowsingChannelManager.setChannelAvailable(item.channel, !isAvailable).then(() => {
          if (isAvailable) this.$electron.ipcRenderer.send('clear-browsers-by-channel', item.channel);
          this.availableChannels = BrowsingChannelManager
            .getAllAvailableChannels().map(item => item.channel);
        });
      }
    },
  },
};
</script>

<style scoped lang="scss">
::-webkit-scrollbar {
  width: 0;
}
.channel-manager {
  width: 100%;
  height: calc(100% - 40px);
  top: 40px;
  display: flex;
  position: relative;
  .manager-container {
    padding: 36px 40px 0 20px;
    width: calc(100% - 60px);
    height: 100%;
    overflow: scroll;
    .category-part {
      width: 100%;
      height: auto;
      display: flex;
      flex-direction: column;
      span {
        font-size: 16px;
        letter-spacing: 0.11px;
        margin-left: 20px;
      }
      .channel-container {
        display: flex;
        width: 100%;
        flex-direction: row;
        flex-wrap: wrap;
        align-content: start;
        padding-bottom: 66px;
        .channel-details {
          width: 110px;
          height: 110px;
          display: flex;
          flex-direction: column;
          margin-top: 20px;
          margin-left: 20px;
          position: relative;
          cursor: pointer;
          .channel-mask {
            position: absolute;
            width: 100%;
            height: 100%;
            .available-check {
              width: 22px;
              height: 22px;
              border-radius: 4px;
              display: flex;
              position: absolute;
              top: -1px;
              left: -1px;
              transition: all 100ms linear;
              .channel-selected {
                margin: auto;
              }
            }
          }
          .hover-channel {
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(235, 234, 239, 0.28);
            box-sizing: border-box;
            transition: all 100ms linear;
          }
          .icon-container {
            margin: 13px auto 10px auto;
            width: 44px;
            height: 44px;
            border-radius: 100%;
            display: flex;
            span {
              margin: auto;
              font-size: 20px;
              color: #FFFFFF;
              font-weight: bold;
            }
          }
          .title {
            margin: 0 auto 0 auto;
            font-size: 14px;
            color: rgba(18, 28, 68, 0.6);
            width: 85%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: center;
          }
          .path {
            margin: 0 auto auto auto;
            font-size: 11px;
            color: rgba(184, 186, 204, 0.71);
            width: 85%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: center;
          }
        }
      }
    }
  }
}
</style>
