<template>
  <div
    class="playlist-container"
  >
    <span
      :style="{
        fontSize: `${playlistFontSize[currentPhase]}px`,
        marginLeft: `${padding}px`,
        color: '#3B3B41',
        marginBottom: `${playlistBottom[currentPhase]}px`,
      }"
    >
      本地播放列表</span>
    <div
      :style="{
        marginBottom: `${blankTitleBottom[currentPhase]}px`,
        marginLeft: `${padding}px`,
        color: '#B5B6BF',
        fontSize: `${blankTitleFontSize[currentPhase]}px`,
      }"
      v-show="!hasPlaylist"
    >
      <!--eslint-disable-next-line-->
      <span>{{ '点击侧边栏底部“ ' }}<Icon :style="{ width: '15px', height: '14px' }" type="browsingOpen" />{{ ' ”按钮，选择多个文件播放，即可生成播放列表' }}</span>
    </div>
    <div
      @mouseover="handleMouseover"
      @mouseleave="handleMouseleave"
      class="playlist-content"
    >
      <div
        :style="{ width: `${padding}px` }"
        @click="handlePreItem"
        class="pre-item"
      >
        <Icon
          v-show="hoveredItem && hasPreItem"
          type="browsingPre"
        />
      </div>
      <div
        :style="{
          position: 'relative',
          width: `${winWidth - (showSidebar ? 76 : 0) - padding * 2}px`,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '1664px',
        }"
      >
        <ul
          :style="{
            borderBottom: hasPlaylist ? '1px solid #eeeeee' : '',
            paddingBottom: `${listBottom[currentPhase]}px`,
          }"
        >
          <li
            :style="{
              height: `${height}px`,
              width: winWidth > 1772 + (showSidebar ? 76 : 0) ? '544px' : `${itemWidth}px`,
              marginRight: `${listRight[currentPhase]}px`,
              transform: `translateX(${calcTranslateX})`,
              transition: 'transform 300ms linear',
              background: hasPlaylist ? '' : `url(${item.blankPlaylist})`,
              backgroundSize: hasPlaylist ? '' : '100% 100%',
              backgroundRepeat: hasPlaylist ? '' : 'no-repeat',
              cursor: hasPlaylist ? 'pointer' : 'default',
            }"
            @click="handleItemClick(item.id)"
            @mouseover="handleFirstMouseover(index)"
            @mouseleave="handleFirstMouseleave"
            v-for="(item, index) in firstLineList"
          >
            <div
              v-show="hasPlaylist"
              :style="{
                backgroundImage: `${item.backgroundUrl}`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              }"
              class="item-thumbnail"
            />
            <div
              v-show="hasPlaylist"
              :style="{
                fontSize: `${listItemFontSize[currentPhase]}px`,
              }"
              class="item-info"
            >
              <div class="title">
                <!--eslint-disable-next-line-->
                <span :style="{ margin: `${progressPos[currentPhase]}px auto auto auto` }"><b>{{ `0${playlist.findIndex(i => i === item) + 1} / 0${playlist.length} · ` }}</b>{{ `${item.basename}` }}</span>
              </div>
              <div
                :style="{ margin: `auto auto ${progressPos[currentPhase]}px 8%` }"
                class="progress"
              >
                <div class="progress-time">
                  <!--eslint-disable-line--><span>{{ `${timecodeFromSeconds(item.lastPlayedTime)} / ${timecodeFromSeconds(item.duration)}` }}</span>
                </div>
                <div
                  :style="{
                    width: `${progressBarWidth[currentPhase]}px`,
                    height: `${progressHeight[currentPhase]}px`
                  }"
                  class="progress-bar"
                >
                  <div
                    :style="{ width: `${item.lastPlayedTime / item.duration * 100}%` }"
                    class="slider"
                  />
                </div>
              </div>
            </div>
            <div
              v-show="index === firstHoveredIndex && hasPlaylist"
              :style="{
                width: `${deleteIconSize[currentPhase]}px`,
                height: `${deleteIconSize[currentPhase]}px`,
                right: `${playlistBottom[currentPhase]}px`,
                bottom: `${progressPos[currentPhase]}px`,
              }"
              @click.stop="handleItemDelete(item.id)"
              class="delete-icon"
            >
              <Icon type="browsingDelete" />
            </div>
          </li>
        </ul>
        <ul
          :style="{
            paddingTop: `${listBottom[currentPhase]}px`,
          }"
        >
          <li
            :style="{
              height: `${height}px`,
              width: winWidth > 1772 + (showSidebar ? 76 : 0) ? '544px' : `${itemWidth}px`,
              marginRight: `${listRight[currentPhase]}px`,
              transform: `translateX(${calcTranslateX})`,
              transition: 'transform 300ms linear',
              cursor: 'pointer',
            }"
            @click="handleItemClick(item.id)"
            @mouseover="handleSecondMouseover(index)"
            @mouseleave="handleSecondMouseleave"
            v-for="(item, index) in secondLineList"
          >
            <div
              :style="{
                background: `${item.backgroundUrl}`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              }"
              class="item-thumbnail"
            />
            <div
              :style="{
                fontSize: `${listItemFontSize[currentPhase]}px`,
              }"
              class="item-info"
            >
              <div class="title">
                <!--eslint-disable-next-line-->
                <span :style="{ margin: `${progressPos[currentPhase]}px auto auto auto` }"><b>{{ `0${playlist.findIndex(i => i === item) + 1} / 0${playlist.length} · ` }}</b>{{ `${item.basename}` }}</span>
              </div>
              <div
                :style="{ margin: `auto auto ${progressPos[currentPhase]}px 8%` }"
                class="progress"
              >
                <div class="progress-time">
                  <!--eslint-disable-line--><span>{{ `${timecodeFromSeconds(item.lastPlayedTime)} / ${timecodeFromSeconds(item.duration)}` }}</span>
                </div>
                <div
                  :style="{
                    width: `${progressBarWidth[currentPhase]}px`,
                    height: `${progressHeight[currentPhase]}px`
                  }"
                  class="progress-bar"
                >
                  <div
                    :style="{ width: `${item.lastPlayedTime / item.duration * 100}%` }"
                    class="slider"
                  />
                </div>
              </div>
            </div>
            <div
              v-show="index === secondHoveredIndex"
              :style="{
                width: `${deleteIconSize[currentPhase]}px`,
                height: `${deleteIconSize[currentPhase]}px`,
                right: `${playlistBottom[currentPhase]}px`,
                bottom: `${progressPos[currentPhase]}px`,
              }"
              @click.stop="handleItemDelete(item.id)"
              class="delete-icon"
            >
              <Icon type="browsingDelete" />
            </div>
          </li>
        </ul>
      </div>
      <div
        :style="{ width: `${padding}px` }"
        @click="handleNextItem"
        class="next-item"
      >
        <Icon
          v-show="hoveredItem && hasNextItem"
          type="browsingNext"
        />
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
    height: {
      type: Number,
      required: true,
    },
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
  },
  data() {
    return {
      hoveredItem: false,
      playlist: [],
      firstLineList: [],
      secondLineList: [],
      currentListIndex: 0,
      translateX: 0,
      translateSpace: 0,
      firstHoveredIndex: -1,
      secondHoveredIndex: -1,
      hasPlaylist: false,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'showSidebar']),
    calcTranslateX() {
      return this.translateX === 0 ? 0 : `calc(${this.translateX}% + ${this.translateSpace}px)`;
    },
    playlistBottom() {
      return [20 * 888 / 1176, 20 * this.winWidth / 1176, 20];
    },
    listBottom() {
      return [18, this.calcSize(18, 25), 25];
    },
    listRight() {
      return [11, this.calcSize(11, 16), 16];
    },
    listItemFontSize() {
      return [11, this.calcSize(11, 15), 15];
    },
    progressHeight() {
      return [4 * 888 / 1176, 4 * this.winWidth / 1176, 4];
    },
    progressPos() {
      return [7 * 888 / 1176, 7 * this.winWidth / 1176, 7];
    },
    showListNum() {
      return this.winWidth >= 1608 - (this.showSidebar ? 0 : 76) ? 3 : 2;
    },
    itemWidth() {
      return (this.winWidth - this.padding * 2 - (this.showSidebar ? 76 : 0)
        - this.listRight[this.currentPhase] * (this.showListNum - 1)) / this.showListNum;
    },
    hasNextItem() {
      return this.firstLineList.length - 1 >= this.currentListIndex + this.showListNum;
    },
    hasPreItem() {
      return this.currentListIndex > 0;
    },
    progressBarWidth() {
      return [110 * 888 / 1176, 110 * this.winWidth / 1176, 110];
    },
    deleteIconSize() {
      return [30 * 888 / 1176, 30 * this.winWidth / 1176, 30];
    },
    blankTitleBottom() {
      return [25 * 888 / 1176, 25 * this.winWidth / 1176, 25];
    },
    blankTitleFontSize() {
      return [19 * 888 / 1176, 19 * this.winWidth / 1176, 19];
    },
  },
  watch: {
    playlist: {
      handler(val: number[]) {
        this.firstLineList = [];
        this.secondLineList = [];
        if (val.length) {
          const tmp = val.slice(0, val.length);
          const times = Math.ceil(val.length / this.showListNum);
          let isFirst = true;
          for (let i = 0; i < times; i += 1) {
            if (isFirst) {
              this.firstLineList.push(...tmp.splice(0, this.showListNum));
              isFirst = false;
            } else {
              this.secondLineList.push(...tmp.splice(0, this.showListNum));
              isFirst = true;
            }
          }
        } else {
          this.hasPlaylist = false;
          for (let i = 0; i < this.showListNum; i += 1) {
            this.firstLineList.push({ blankPlaylist });
          }
        }
      },
      immediate: true,
    },
    showListNum: {
      handler(val: number) {
        this.firstLineList = [];
        this.secondLineList = [];
        if (this.hasPlaylist) {
          this.translateX = 0;
          this.translateSpace = 0;
          this.currentListIndex = 0;
          const tmp = this.playlist.slice(0, this.playlist.length);
          const times = Math.ceil(this.playlist.length / val);
          let isFirst = true;
          for (let i = 0; i < times; i += 1) {
            if (isFirst) {
              this.firstLineList.push(...tmp.splice(0, val));
              isFirst = false;
            } else {
              this.secondLineList.push(...tmp.splice(0, val));
              isFirst = true;
            }
          }
        } else {
          for (let i = 0; i < this.showListNum; i += 1) {
            this.firstLineList.push({ blankPlaylist });
          }
        }
      },
      immediate: true,
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
    handleItemClick(id: number) {
      if (this.hasPlaylist && id) {
        this.openPlayList(id);
      }
    },
    calcSize(min: number, max: number) {
      const a = (max - min) / (1176 - 888);
      const b = min - 888 * a;
      return a * this.winWidth + b;
    },
    handlePreItem() {
      if (this.hasPreItem) {
        this.currentListIndex -= this.showListNum;
        this.translateX += this.showListNum * 100;
        this.translateSpace += this.showListNum * this.listRight[this.currentPhase];
      }
    },
    handleNextItem() {
      if (this.hasNextItem) {
        this.translateX -= this.showListNum * 100;
        this.translateSpace -= this.showListNum * this.listRight[this.currentPhase];
        this.currentListIndex += this.showListNum;
      }
    },
    handleMouseover() {
      this.hoveredItem = true;
    },
    handleMouseleave() {
      this.hoveredItem = false;
    },
    handleFirstMouseover(index: number) {
      this.firstHoveredIndex = index;
    },
    handleFirstMouseleave() {
      this.firstHoveredIndex = -1;
    },
    handleSecondMouseover(index: number) {
      this.secondHoveredIndex = index;
    },
    handleSecondMouseleave() {
      this.secondHoveredIndex = -1;
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
  .pre-item, .next-item {
    height: auto;
    display: flex;
  }
  .next-item {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    top: 50%;
  }
  .playlist-content {
    height: auto;
    display: flex;
    position: relative;
  }
  ul {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    min-width: 732px;
    list-style: none;
    li {
      display: inline-block;
      min-width: 360px;
    }
  }
  .delete-icon {
    position: absolute;
    opacity: 0.6;
    &:hover {
      background: #F5F6F8;
      border-radius: 100%;
      opacity: 1;
    }
  }
  .item-thumbnail {
    width: 48%;
    height: 100%;
    float: left;
    border-radius: 5px;
  }
  .item-info {
    width: 52%;
    height: 100%;
    float: left;
    display: flex;
    flex-direction: column;
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
        -webkit-line-clamp: 4;
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
</style>
