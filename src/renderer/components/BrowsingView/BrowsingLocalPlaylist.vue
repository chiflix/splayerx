<template>
  <div class="playlist-container">
    <span
      :style="{
        fontSize: `${playlistFontSize}px`,
        marginLeft: `${padding}px`,
        color: '#3B3B41',
        marginBottom: `${titleBottom}px`,
        fontWeight: 'bold',
      }"
    >
      {{ $t('browsing.homepage.playlist') }}</span>
    <div
      :style="{
        marginBottom: `${blankTitleBottom}px`,
        marginLeft: `${padding}px`,
        color: '#B5B6BF',
        fontSize: `${descriptionSize}px`,
      }"
      v-show="!hasPlaylist"
    >
      <!--eslint-disable-next-line-->
      <span>{{ $t('browsing.homepage.playlistInfoPre') }}<Icon :style="{ width: '15px', height: '14px' }" type="browsingOpen" />{{ $t('browsing.homepage.playlistInfoNext') }}</span>
    </div>
    <div class="playlist-content">
      <div
        :style="{
          position: 'relative',
          width: `${winWidth - (showSidebar ? 76 : 0) - padding * 2}px`,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '1321px',
          marginLeft: `${padding}px`,
          marginBottom: `${playlistBottom}px`,
        }"
      >
        <ul>
          <li
            :style="{
              height: winWidth - (showSidebar ? 0 : 76) > 888 ?
                `${thumbnailWidth * 133 / 236}px` : '${175 * 133 / 236}px',
              width: `${finalItemWidth}px`,
              marginBottom: `${deleteIconSize}px`,
              marginLeft: `${listRight}px`,
              background: hasPlaylist ? '' : `url(${item.blankPlaylist})`,
              backgroundSize: hasPlaylist ? '' : '100% 100%',
              backgroundRepeat: hasPlaylist ? '' : 'no-repeat',
            }"
            @mouseover="handleMouseover(index)"
            @mouseleave="handleMouseleave"
            v-for="(item, index) in playlist"
          >
            <div
              v-show="hasPlaylist"
              :style="{
                width: `${thumbnailWidth}px`,
                backgroundImage: `${item.backgroundUrl}`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                transition: 'box-shadow 100ms linear',
                cursor: 'pointer',
              }"
              @click="handleItemClick(item.id)"
              class="item-thumbnail"
            />
            <div
              v-show="hasPlaylist"
              :style="{
                width: `${thumbnailWidth}px`,
                fontSize: `${listItemFontSize}px`,
              }"
              class="item-info"
            >
              <div
                :style="{ lineHeight: `${infoLineHeight}px` }"
                class="title"
              >
                <!--eslint-disable-next-line-->
                <span :style="{ margin: `${progressPos}px 0 auto 7%` }"><b>{{ `${orderFormat(item.playedIndex + 1)} / ${orderFormat(item.playlistLength)}  ·  ` }}</b>{{ `${item.basename}` }}</span>
              </div>
              <div
                :style="{ margin: `auto auto ${progressPos}px 7%` }"
                class="progress"
              >
                <div class="progress-time">
                  <!--eslint-disable-line--><span>{{ `${timecodeFromSeconds(item.lastPlayedTime)} / ${timecodeFromSeconds(item.duration)}` }}</span>
                </div>
                <div
                  :style="{
                    width: `${progressBarWidth}px`,
                    height: `${progressHeight}px`
                  }"
                  class="progress-bar"
                >
                  <div
                    :style="{ width: `${item.lastPlayedTime / item.duration * 100}%` }"
                    class="slider"
                  />
                </div>
              </div>
              <transition name="fade-100">
                <div
                  v-show="index === hoveredIndex && hasPlaylist"
                  :style="{
                    width: `${deleteIconSize}px`,
                    height: `${deleteIconSize}px`,
                    right: `${listBottom}px`,
                    bottom: `${progressPos}px`,
                  }"
                  @click.stop="handleItemDelete(item.id)"
                  class="delete-icon"
                >
                  <Icon type="browsingDelete" />
                </div>
              </transition>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import { recentPlayService } from '@/services/media/RecentPlayService';
import { playInfoStorageService } from '@/services/storage/PlayInfoStorageService';
import blankPlaylist from '../../assets/blankPlaylist.png';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'BrowsingLocalPlaylist',
  components: {
    Icon,
  },
  props: {
    width: {
      type: Number,
      required: true,
    },
    padding: {
      type: Number,
      required: true,
    },
    playlistFontSize: {
      type: Number,
      required: true,
    },
    calcSizeByPhase: {
      type: Function,
      required: true,
    },
    listRight: {
      type: Number,
      required: true,
    },
    listItemFontSize: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      hoveredItem: false,
      playlist: [],
      currentListIndex: 0,
      translateX: 0,
      translateSpace: 0,
      hoveredIndex: -1,
      hasPlaylist: false,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'showSidebar']),
    thumbnailWidth() {
      const winWidth = this.winWidth > 1441 + (this.showSidebar ? 76 : 0)
        ? 1441 + (this.showSidebar ? 76 : 0) : this.winWidth;
      const thumbnailsTotalWidth = winWidth - (this.showSidebar ? 76 : 0) - this.padding * 2;
      const calcVideoNum = Math.floor((thumbnailsTotalWidth + this.listRight)
        / (175 + this.listRight));
      let updateVideoNum = 4;
      if (calcVideoNum < 4) {
        updateVideoNum = 4;
      } else if (calcVideoNum >= 4 && calcVideoNum <= 6) {
        updateVideoNum = calcVideoNum;
      } else if (calcVideoNum > 6) {
        updateVideoNum = 6;
      }
      return (thumbnailsTotalWidth - (updateVideoNum - 1) * this.listRight)
        / updateVideoNum;
    },
    calcTranslateX() {
      return this.translateX === 0 ? 0 : `calc(${this.translateX}% + ${this.translateSpace}px)`;
    },
    playlistBottom() {
      return this.calcSizeByPhase(20);
    },
    titleBottom() {
      return this.calcSizeByPhase(15);
    },
    descriptionSize() {
      return this.calcSizeByPhase(17);
    },
    listBottom() {
      return this.calcSizeByPhase(15);
    },
    progressHeight() {
      return this.calcSizeByPhase(4);
    },
    progressPos() {
      return this.calcSizeByPhase(7);
    },
    showListNum() {
      return this.winWidth >= 1326 - (this.showSidebar ? 0 : 76) ? 3 : 2;
    },
    itemWidth() {
      return (this.winWidth - this.padding * 2 - (this.showSidebar ? 76 : 0)
        - this.listRight * this.showListNum) / this.showListNum;
    },
    finalItemWidth() {
      switch (true) {
        case this.winWidth > 1441 + (this.showSidebar ? 76 : 0):
          return 424.3;
        case this.winWidth < 812 + (this.showSidebar ? 76 : 0):
          return 344.3;
        default:
          return this.itemWidth;
      }
    },
    progressBarWidth() {
      return this.calcSizeByPhase(110);
    },
    deleteIconSize() {
      return this.calcSizeByPhase(30);
    },
    blankTitleBottom() {
      return this.calcSizeByPhase(25);
    },
    blankTitleFontSize() {
      return this.calcSizeByPhase(19);
    },
    infoLineHeight() {
      return this.calcSizeByPhase(18);
    },
  },
  watch: {
    playlist(val: number[]) {
      if (!val.length) {
        this.hasPlaylist = false;
        for (let i = 0; i < this.showListNum; i += 1) {
          this.playlist.push({ blankPlaylist });
        }
      }
    },
    showListNum(val: number) {
      if (!this.hasPlaylist) {
        this.playlist = [];
        for (let i = 0; i < val; i += 1) {
          this.playlist.push({ blankPlaylist });
        }
      }
    },

    currentListIndex(val: number) {
      this.translateX = -val * 100;
      this.translateSpace = -val * this.listRight;
    },
    winWidth() {
      this.translateSpace = -this.currentListIndex * this.listRight;
    },
  },
  created() {
    // Get all data and show
    recentPlayService.getRecords().then((results) => {
      if (results.length) {
        this.hasPlaylist = true;
        this.playlist = results.filter((result) => {
          if (result.playlistLength) return result.playlistLength > 1;
          return false;
        });
      } else {
        this.hasPlaylist = false;
        for (let i = 0; i < this.showListNum; i += 1) {
          this.playlist.push({ blankPlaylist });
        }
      }
    });
  },
  methods: {
    orderFormat(val: number) {
      return val < 10 ? `0${val}` : val;
    },
    handleItemClick(id: number) {
      if (this.hasPlaylist && id) {
        this.openPlayList(id);
      }
    },
    handleMouseover(index: number) {
      this.hoveredIndex = index;
    },
    handleMouseleave() {
      this.hoveredIndex = -1;
    },
    handleItemDelete(id: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.playlist = this.playlist.filter((i: any) => i.id !== id);
      playInfoStorageService.deleteRecentPlayedBy(id);
    },
  },
};
</script>

<style scoped lang="scss">
.playlist-container {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  .playlist-content {
    height: auto;
    display: flex;
    position: relative;
  }
  ul {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-content: start;
    overflow: hidden;
    min-width: 710.6px;
    list-style: none;
    li {
      display: flex;
      min-width: 302.3px;
      min-height: 84px;
    }
  }
  .delete-icon {
    cursor: pointer;
    position: absolute;
    opacity: 0.6;
    border-radius: 100%;
    transition: background-color 100ms ease-in, opacity 100ms ease-in;
    &:hover {
      background-color: #F5F6F8;
      opacity: 1;
    }
  }
  .item-thumbnail {
    min-width: 169.4px;
    height: 100%;
    float: left;
    border-radius: 5px;
    &:hover {
      box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.3);
    }
  }
  .item-info {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    min-width: 169.4px;
    .title {
      width: 100%;
      height: 59%;
      display: flex;
      span {
        width: 84%;
        height: auto;
        white-space: pre-wrap;
        word-break: break-all;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        text-overflow: ellipsis;
        color: #3B3B41;
      }
    }
    .progress {
      width: auto;
      height: auto;
      display: flex;
      flex-direction: column;
      .progress-time {
        width: 100%;
        margin-bottom: 5%;
        color: #B5B6BF;
      }
      .progress-bar {
        max-height: 4px;
        background: #B5B6BF;
        border-radius: 3px;
        .slider {
          background: #3B3B41;
          height: 100%;
          border-radius: 3px;
        }
      }
    }
  }
}
.fade-100-enter-active {
  animation: show-icon 100ms;
}
.fade-100-enter, .fade-100-leave-to {
  opacity: 0;
}
.fade-100-leave-active {
  animation: hide-icon 100ms;
}
@keyframes show-icon {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 0.6;
  }
}
@keyframes hide-icon {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
  }
}
</style>
