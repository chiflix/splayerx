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
            :title="item.category === 'customized' && index !== 0 ? item.title : $t(item.title)"
            v-for="(item, index) in allChannels.get(category.type).channels"
            @mouseover="handleMouseover(index, category.type)"
            @mouseleave="handleMouseleave"
            @mousedown.stop="handleMousedown($event, item, index)"
            class="channel-details"
          >
            <div
              :ref="item.channel"
              v-show="showCustomizedManage === item.channel"
              @blur="handleBlur(item.channel)"
              tabindex="0"
              class="channel-menu"
            >
              <div
                @mousedown.stop="handleCustomizedEdit(item, index)"
                class="customized-edit"
              >
                <span>{{ $t('browsing.edit') }}</span>
              </div>
              <div
                @mousedown.stop="handleCustomizedDelete(item, index)"
                class="customized-delete"
              >
                <span>{{ $t('browsing.delete') }}</span>
              </div>
            </div>
            <div
              v-show="showCustomizedManage === item.channel"
              class="manage-triangle"
            >
              <div class="manage-triangleInner" />
            </div>
            <div
              v-show="availableChannels.includes(item.channel)"
              class="channel-selected"
            >
              <Icon type="channelSelected" />
            </div>
            <div
              :style="{
                border: '1px solid #F1F0F3',
                opacity: (index === hoverIndex && category.type === hoverCategory
                  && !showCustomizedManage) || showCustomizedManage === item.channel ? 1 : 0,
              }"
              class="channel-mask hover-channel"
            >
              <div
                :style="{
                  background: showCustomizedManage === item.channel ? '#F5F6F8' : '',
                  border: '1px solid #F1F0F3',
                  opacity: (hoverCategory === 'customized' && hoverIndex !== 0
                    && !showCustomizedManage)
                    || showCustomizedManage === item.channel ? '1' : '0',
                  pointerEvents: (hoverCategory === 'customized' && hoverIndex !== 0
                    && !showCustomizedManage)
                    || showCustomizedManage === item.channel ? 'auto' : 'none',
                }"
                @mousedown.stop="handleCustomizedManage(item.channel)"
                class="customized-manage"
              >
                <div class="manage-icon">
                  <div />
                  <div />
                  <div />
                </div>
              </div>
            </div>
            <div
              :style="{
                border: borderChannels.includes(item.channel) ? '1px solid #F2F1F4' : ''
              }"
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
      borderChannels: ['youku.com', 'qq.com', 'huya.com', 'douyu.com', 'sportsqq.com', 'study163.com', 'icourse163.com'],
      showCustomizedManage: '',
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
    handleBlur(channel: string) {
      if (channel === this.showCustomizedManage) this.showCustomizedManage = '';
    },
    handleCustomizedEdit(item: channelDetails, index: number) {
      if (item.category === 'customized' && index !== 0) {
        this.showAddChannel = true;
        this.title = item.title;
        this.url = item.url;
        this.updateBookmarkSelectedIndex(item.style);
      }
      this.showCustomizedManage = '';
    },
    handleCustomizedDelete(item: channelDetails, index: number) {
      if (item.category === 'customized' && index !== 0) {
        this.availableChannels = BrowsingChannelManager.getAllAvailableChannels()
          .map(item => item.channel);
        this.$bus.$emit('delete-channel', item.channel);
        this.updateBookmarkSelectedIndex(item.style);
      }
      this.showCustomizedManage = '';
    },
    handleMouseover(index: number, category: string) {
      this.hoverIndex = index;
      this.hoverCategory = category;
    },
    handleMouseleave() {
      this.hoverIndex = -1;
      this.hoverCategory = '';
    },
    handleCustomizedManage(channel: string) {
      this.showCustomizedManage = this.showCustomizedManage ? '' : channel;
      setTimeout(() => {
        this.$nextTick(() => {
          if (this.showCustomizedManage) {
            this.$refs[`${channel}`][0].focus();
          }
        });
      }, 0);
    },
    handleMousedown(e: MouseEvent, item: channelDetails, index: number) {
      if (!this.showCustomizedManage) {
        if (item.category === 'customized' && index === 0) {
          this.showAddChannel = true;
        } else {
          const isAvailable = this.availableChannels.includes(item.channel);
          BrowsingChannelManager.setChannelAvailable(item.channel, !isAvailable).then(() => {
            if (isAvailable) this.$electron.ipcRenderer.send('clear-browsers-by-channel', item.channel);
            this.availableChannels = BrowsingChannelManager
              .getAllAvailableChannels().map(item => item.channel);
          });
        }
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
    padding: 36px 45px 0 45px;
    width: calc(100% - 90px);
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
      }
      .channel-container {
        display: flex;
        width: 100%;
        flex-direction: row;
        flex-wrap: wrap;
        align-content: start;
        padding-bottom: 66px;
        .channel-selected {
          position: absolute;
          width: 15px;
          height: 15px;
          top: 12px;
          right: 37px;
          z-index: 0;
        }
        .channel-menu {
          width: 93px;
          height: 63px;
          position: absolute;
          background: #FFFFFF;
          border-radius: 2px;
          border: 1px solid #F1F0F3;
          z-index: 11;
          top: 30px;
          left: 30px;
          display: flex;
          flex-direction: column;
          outline: none;
          .customized-edit {
            width: 93px;
            height: 27px;
            margin: 4.5px auto 0 auto;
            transition: background-color 100ms linear;
            display: flex;
            span {
              margin: auto;
              color: #747282;
              font-size: 12px;
            }
            &:hover {
              background: #F5F6F8;
            }
          }
          .customized-delete {
            width: 93px;
            height: 27px;
            margin: 0 auto 4.5px auto;
            transition: background-color 100ms linear;
            display: flex;
            span {
              margin: auto;
              font-size: 12px;
              color: #747282;
            }
            &:hover {
              background: #F5F6F8;
            }
          }
        }
        .manage-triangle{
          margin: 0;
          border-width: 6px;
          border-style: solid;
          border-color: transparent transparent #F1F0F3 transparent;
          padding: 0;
          width: 0;
          height: 0;
          top: 19px;
          right: 6px;
          position: absolute;
          z-index: 11;
        }
        .manage-triangleInner{
          margin: 0;
          border-width: 5px;
          border-style: solid;
          border-color: transparent transparent #FFFFFF transparent;
          padding: 0;
          width: 0;
          height: 0;
          right: -5px;
          top: -3px;
          position: absolute;
        }
        .channel-details {
          width: 120px;
          height: 110px;
          display: flex;
          flex-direction: column;
          margin-top: 20px;
          position: relative;
          cursor: pointer;
          .channel-mask {
            position: absolute;
            width: 100%;
            height: 100%;
            .customized-manage {
              width: 22px;
              height: 22px;
              border-radius: 4px;
              display: flex;
              position: absolute;
              top: -1px;
              right: -1px;
              transition: all 100ms linear;
              .manage-icon {
                width: 11.8px;
                height: 2.4px;
                margin: auto;
                display: flex;
                justify-content: space-between;
                div {
                  width: 2.4px;
                  height: 2.4px;
                  border-radius: 100%;
                  background: #7E808F;
                }
              }
              &:hover {
                background: #F5F6F8;
              }
            }
          }
          .hover-channel {
            border-radius: 4px;
            box-shadow: 0 2px 6px #EBEAEF;
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
