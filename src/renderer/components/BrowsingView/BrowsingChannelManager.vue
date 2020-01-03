<template>
  <div
    :style="{
      pointerEvents: showAddChannel ? 'none' : 'auto',
      background: isDarkMode ? '#434348' : '#FFFFFF',
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
                opacity: (index === hoverIndex && category.type === hoverCategory
                  && !showCustomizedManage) || showCustomizedManage === item.channel ? 1 : 0,
              }"
              class="channel-mask hover-channel"
            >
              <div
                :style="{
                  background: showCustomizedManage === item.channel
                    ? isDarkMode ? '#54545A' : '#F5F6F8' : '',
                  opacity: (hoverCategory === 'customized' && index !== 0
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
                  <div
                    :style="{ background: showCustomizedManage === item.channel && isDarkMode
                      ? 'rgba(255, 255, 255, 0.7)' : '' }"
                  />
                  <div
                    :style="{ background: showCustomizedManage === item.channel && isDarkMode
                      ? 'rgba(255, 255, 255, 0.7)' : '' }"
                  />
                  <div
                    :style="{ background: showCustomizedManage === item.channel && isDarkMode
                      ? 'rgba(255, 255, 255, 0.7)' : '' }"
                  />
                </div>
              </div>
            </div>
            <div
              :style="{
                border: borderChannels.includes(item.channel) && !isDarkMode
                  ? '1px solid #F2F1F4' : ''
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
                :type="darkIcon.includes(item.icon) && isDarkMode ? `${item.icon}Dark` : item.icon"
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
import { mapActions, mapGetters } from 'vuex';
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
      darkIcon: ['addChannelSidebar', 'youkuSidebar', 'qqSidebar', 'huyaSidebar', 'douyuSidebar', 'sportsqqSidebar', 'study163Sidebar', 'icourse163Sidebar'],
      showCustomizedManage: '',
    };
  },
  computed: {
    ...mapGetters(['isDarkMode']),
    isDarwin() {
      return process.platform === 'darwin';
    },
    categories() {
      return BrowsingChannelManager.getAllCategories().filter(i => i.type !== 'temporary');
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
          this.updateBookmarkSelectedIndex(0);
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

<style scoped lang="scss" src="@/css/darkmode/BrowsingChannelManager.scss"></style>
