<template>
  <div class="browsing-history">
    <div
      :style="{
        fontSize: `${playlistFontSize[currentPhase]}px`,
        marginLeft: `${padding}px`,
        color: '#3B3B41',
        marginBottom: `${playlistBottom[currentPhase]}px`,
      }"
      class="history-container"
    >
      <div class="title">
        <span>{{ $t('browsing.history') }}</span>
        <span v-if="histories.length >= 1">
          <span class="slash">|&nbsp;&nbsp;</span>
          <span
            @click="handleClear"
            class="clear"
          >{{ $t('browsing.clear') }}</span>
        </span>
        <div
          v-else
          :style="{
            fontSize: `${blankTitleFontSize[currentPhase]}px`,
          }"
          class="description"
        >
          在线上播放的视频历史记录将在这里显示，包括页面名称、站点地址和浏览时间
        </div>
      </div>
      <div
        :style="{
          width: `${winWidth - (showSidebar ? 76 : 0) - padding * 2}px`,
          maxWidth: '1664px',
          height: histories.length < 1 ? `${contentHeight[currentPhase]}px` : 'auto',
          borderTop: '1px solid #EEEEEE',
          borderBottom: '1px solid #EEEEEE',
          margin: `${playlistBottom[currentPhase]}px 0 ${historyBottom[currentPhase]}px 0`,
          padding: histories.length < 1 ? '' :
            `${playlistBottom[currentPhase]}px 0 ${playlistBottom[currentPhase]}px 0`,
        }"
        class="content"
      >
        <div
          v-if="histories.length < 1"
          :style="{
            height: `${placeholderHeight[currentPhase]}px`
          }"
          class="placeholder"
        >
          <div
            :style="{
              width: `${placeholderPreWidth[currentPhase]}px`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }"
          >
            <div
              :style="{
                width: '100%',
                height: `${placeholderPreWidth[currentPhase]}px`,
                background: '#CECFDB',
                borderRadius: '100%',
              }"
            />
            <div
              :style="{
                width: '100%',
                height: `${placeholderPreWidth[currentPhase]}px`,
                background: '#CECFDB',
                borderRadius: '100%',
              }"
            />
          </div>
          <div
            :style="{
              flex: '1',
              height: '100%',
              backgroundImage: `url(${require('@/assets/history.png')})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }"
          />
        </div>
        <BrowsingHistoryItem
          v-else
          :key="item.url"
          v-for="item in histories"
          v-bind="item"
          @click.native="handleOpenHistoryItem(item)"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import BrowsingHistoryItem from '@/components/BrowsingView/BrowsingHistoryItem.vue';
import { browsingHistory } from '@/services/browsing/BrowsingHistoryService';
import {
  Browsing as browsingActions,
} from '@/store/actionTypes';

export default {
  components: {
    BrowsingHistoryItem,
  },
  props: {
    padding: {
      type: Number,
      required: true,
    },
    currentPhase: {
      type: Number,
      required: true,
    },
    playlistFontSize: {
      type: Array,
      required: true,
    },
    showHomePage: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      histories: [],
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'showSidebar']),
    playlistBottom() {
      return [20 * 888 / 1176, 20 * this.winWidth / 1176, 20];
    },
    placeholderHeight() {
      return [66 * 888 / 1176, 66 * this.winWidth / 1176, 66];
    },
    contentHeight() {
      return [160 * 888 / 1176, 160 * this.winWidth / 1176, 160];
    },
    historyBottom() {
      return [50 * 888 / 1176, 50 * this.winWidth / 1176, 50];
    },
    blankTitleFontSize() {
      return [19 * 888 / 1176, 19 * this.winWidth / 1176, 19];
    },
    placeholderPreWidth() {
      return [26 * 888 / 1176, 26 * this.winWidth / 1176, 26];
    },
  },
  watch: {
    showHomePage(val: boolean) {
      if (val) this.updateHistory();
    },
  },
  mounted() {
    this.$bus.$on('update-browsing-playlist', () => {
      setTimeout(() => {
        this.updateHistory();
      }, 1000);
    });
  },
  methods: {
    ...mapActions({
      updateCurrentChannel: browsingActions.UPDATE_CURRENT_CHANNEL,
    }),
    async updateHistory() {
      this.histories = await browsingHistory.getHistorys();
    },
    async handleClear() {
      await browsingHistory.clearAllHistorys();
      this.updateHistory();
    },
    handleOpenHistoryItem(item: {
      channel: string,
      icon: string,
      openTime: number,
      title: string,
      url: string
    }) {
      this.$electron.ipcRenderer.send('open-history-item', { url: item.url, channel: item.channel });
      this.updateCurrentChannel(item.channel);
    },
  },
};
</script>
<style lang="scss" scoped>
.browsing-history {
  width: 100%;
  height: auto;
  .title {
    .slash {
      color: #B5B6BF;
      font-size: 19px;
    }
    .clear {
      cursor: pointer;
      height: 26px;
      font-size: 19px;
      color: #B5B6BF;
      letter-spacing: 0.14px;
    }
    .description {
      margin-top: 20px;
      font-size: 19px;
      color: #B5B6BF;
    }
  }
  .content {
    min-width: 732px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    .placeholder {
      width: 100%;
      margin: auto 0 auto 0;
      display: flex;
    }
  }
}
</style>
