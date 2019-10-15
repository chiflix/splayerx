<template>
  <div class="channel-manager no-drag">
    <div class="manager-container">
      <div
        v-if="allChannels.get(category.type).channels.length"
        v-for="category in categories"
        class="category-part"
      >
        <span>{{ category.locale }}</span>
        <div class="channel-container">
          <div
            v-for="(item, index) in allChannels.get(category.type).channels"
            @mouseover="handleMouseover(index)"
            @mouseleave="handleMouseleave"
            @click="handleMouseClick(category.type, item.channel)"
            :style="{
              backgroundColor: availableChannels.includes(item.channel) ? '#FBFBFD' : '',
            }"
            class="channel-details"
          >
            <div
              v-show="index === hoverIndex || availableChannels.includes(item.channel)"
              class="channel-mask hover-channel"
            >
              <div
                class="available-check"
              >
                <Icon
                  v-show="availableChannels.includes(item.channel)"
                  type="channelSelected"
                  class="channel-selected"
                />
              </div>
            </div>
            <div class="icon-container">
              <Icon
                :type="item.icon"
              />
            </div>
            <span class="title">{{ $t(item.title) }}</span>
            <span class="path">{{ item.path }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TODO 添加自定义站点 -->
    <div
      v-if="false"
      class="add-channel"
    />
  </div>
</template>

<script lang="ts">
import BrowsingChannelManager from '@/services/browsing/BrowsingChannelManager';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingChannelManager',
  components: {
    Icon,
  },
  data() {
    return {
      hoverIndex: -1,
      availableChannels: [],
    };
  },
  computed: {
    categories() {
      return BrowsingChannelManager.getAllCategories();
    },
    allChannels() {
      return BrowsingChannelManager.getAllChannels();
    },
  },
  watch: {
    availableChannels() {
      this.$bus.$emit('available-channel-update');
    },
  },
  created() {
    this.availableChannels = BrowsingChannelManager
      .getAllAvailableChannels().map(item => item.channel);
  },
  methods: {
    handleMouseover(index: number) {
      this.hoverIndex = index;
    },
    handleMouseleave() {
      this.hoverIndex = -1;
    },
    handleMouseClick(category: string, channel: string) {
      const isAvailable = this.availableChannels.includes(channel);
      BrowsingChannelManager.setChannelAvailable(category, channel, !isAvailable);
      if (isAvailable) this.$electron.ipcRenderer.send('clear-browsers-by-channel', channel);
      this.availableChannels = BrowsingChannelManager
        .getAllAvailableChannels().map(item => item.channel);
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
  height: calc(100% - 38px);
  top: 38px;
  display: flex;
  position: absolute;
  .manager-container {
    margin: 36px 40px 0 20px;
    width: calc(100% - 60px);
    height: calc(100% - 36px);
    overflow: scroll;
    .category-part {
      width: 100%;
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
        margin-bottom: 30px;
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
              border: 1px solid rgba(242, 241, 244, 100);
              display: flex;
              position: absolute;
              top: -1px;
              left: -1px;
              .channel-selected {
                margin: auto;
              }
            }
          }
          .hover-channel {
            border: 1px solid rgba(241, 240, 243, 1);
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(235, 234, 239, 0.28);
            box-sizing: border-box;
          }
          .icon-container {
            margin: 13px auto 10px auto;
            width: 44px;
            height: 44px;
          }
          .title {
            margin: 0 auto 0 auto;
            font-size: 14px;
            color: rgba(18, 28, 68, 0.6);
          }
          .path {
            margin: 0 auto auto auto;
            font-size: 11px;
            color: rgba(184, 186, 204, 0.71);
          }
        }
      }
    }
  }
  .add-channel {
    width: 300px;
    height: 100%;
  }
}
</style>
