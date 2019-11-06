<template>
  <div class="browsing-history">
    <div
      :style="{
        marginLeft: `${padding}px`,
        color: '#3B3B41',
        marginBottom: `${playlistBottom[currentPhase]}px`,
      }"
      class="history-container"
    >
      <div class="title">
        <span
          :style="{
            fontSize: `${playlistFontSize[currentPhase]}px`,
            fontWeight: 'bold',
          }"
        >
          {{ $t('browsing.homepage.history') }}</span>
        <span
          :style="{ fontSize: `${blankTitleFontSize[currentPhase]}px` }"
          v-if="histories.length >= 1"
        >
          <span class="slash">&nbsp;|&nbsp;</span>
          <span
            :style="{ fontSize: `${itemDetailFontSize[currentPhase]}px` }"
            @click="handleClear"
            class="clear"
          >{{ $t('browsing.homepage.clear') }}</span>
        </span>
        <div
          v-else
          :style="{
            fontSize: `${descriptionSize[currentPhase]}px`,
            marginTop: `${titleBottom[currentPhase]}px`,
          }"
          class="description"
        >
          {{ $t('browsing.homepage.historyInfo') }}
        </div>
      </div>
      <div
        :style="{
          width: `${winWidth - (showSidebar ? 76 : 0) - padding * 2}px`,
          maxWidth: '1321px',
          height: histories.length < 1 ? `${contentHeight[currentPhase]}px` : 'auto',
          borderBottom: '1px solid #EEEEEE',
          margin: `0 0 ${historyBottom[currentPhase]}px 0`,
          padding: histories.length < 1 ? '' :
            `${titleBottom[currentPhase]}px 0 ${titleBottom[currentPhase]}px 0`,
        }"
        class="content"
      >
        <div
          v-if="histories.length < 1"
          :style="{
            marginLeft: `${placeholderPos[currentPhase]}px`,
            width: `calc(100% - ${placeholderPos[currentPhase]}px)`,
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
                background: '#E6E7ED',
                borderRadius: '100%',
              }"
            />
            <div
              :style="{
                width: '100%',
                height: `${placeholderPreWidth[currentPhase]}px`,
                background: '#E6E7ED',
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
          :font-size="itemDetailFontSize[currentPhase]"
          :icon-size="iconSize[currentPhase]"
          :selected-height="selectedHeight[currentPhase]"
          :icon-pos="iconPos[currentPhase]"
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
    selectedHeight() {
      return [48 * 888 / 1030, 48 * this.winWidth / 1030, 48];
    },
    iconSize() {
      return [24 * 888 / 1030, 24 * this.winWidth / 1030, 24];
    },
    playlistBottom() {
      return [20 * 888 / 1030, 20 * this.winWidth / 1030, 20];
    },
    placeholderHeight() {
      return [66 * 888 / 1030, 66 * this.winWidth / 1030, 66];
    },
    contentHeight() {
      const defaultHeight = this.histories.length ? 160 : 110;
      return [defaultHeight * 888 / 1030, defaultHeight * this.winWidth / 1030, defaultHeight];
    },
    historyBottom() {
      return [30 * 888 / 1030, 30 * this.winWidth / 1030, 30];
    },
    blankTitleFontSize() {
      return [19 * 888 / 1030, 19 * this.winWidth / 1030, 19];
    },
    placeholderPreWidth() {
      return [26 * 888 / 1030, 26 * this.winWidth / 1030, 26];
    },
    itemDetailFontSize() {
      return [15 * 888 / 1030, 15 * this.winWidth / 1030, 15];
    },
    titleBottom() {
      return [10 * 888 / 1030, 10 * this.winWidth / 1030, 10];
    },
    iconPos() {
      return [16 * 888 / 1030, 16 * this.winWidth / 1030, 16];
    },
    descriptionSize() {
      return [17 * 888 / 1030, 17 * this.winWidth / 1030, 17];
    },
    placeholderPos() {
      return [13 * 888 / 1030, 13 * this.winWidth / 1030, 13];
    },
  },
  watch: {
    showHomePage(val: boolean) {
      if (val) this.updateHistory();
    },
  },
  mounted() {
    this.$electron.ipcRenderer.on('update-current-channel', (evt: Event, channel: string) => {
      this.updateCurrentChannel(channel);
    });
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
      &:hover {
        color: rgb(59, 59, 65);
      }
    }
    .description {
      font-size: 19px;
      color: #B5B6BF;
    }
  }
  .content {
    min-width: 710.6px;
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
