<template>
  <div
    v-show="backgroundDisplayState"
    @mouseup="handleMouseup"
    class="recent-playlist"
  >
    <transition name="background-fade">
      <div
        v-show="displayState"
        :style="{
          height: sizeAdaption(282),
        }"
        class="background-gradient"
      />
    </transition>
    <transition
      @after-leave="afterLeave"
      name="translate"
    >
      <div
        v-show="displayState"
        class="content"
      >
        <transition
          name="fade"
          mode="out-in"
        >
          <div
            :key="filename"
            :style="{
              marginTop: sizeAdaption(53),
              paddingLeft: sizeAdaption(40),
            }"
            class="info"
          >
            <div
              v-show="showTopContent"
              :style="{
                fontSize: sizeAdaption(14),
                lineHeight: sizeAdaption(14),
              }"
              class="top"
            >
              <span v-show="lastPlayedTimeDisplay > 0">
                {{
                  timecodeFromSeconds(lastPlayedTimeDisplay)
                }} /
              </span>
              {{
                timecodeFromSeconds(hoveredDuration)
              }}&nbsp;&nbsp;·&nbsp;&nbsp;{{
                inWhichSource
              }}&nbsp;&nbsp;{{ indexInPlaylist }} / {{ numberOfPlaylistItem }}
            </div>
            <div
              :style="{
                marginTop: sizeAdaption(9),
                fontSize: sizeAdaption(18),
                lineHeight: sizeAdaption(20),
                fontWeight: 500,
              }"
              class="file-name"
            >
              {{ filename }}
            </div>
          </div>
        </transition>
        <div
          :style="{
            transition: tranFlag ? 'transform 400ms ease-in' : '',
            transform: `translateX(-${distance}px)`,
            marginTop: sizeAdaption(20),
            marginBottom: sizeAdaption(40),
            marginLeft: sizeAdaption(40),
          }"
          @mouseup.stop=""
          class="playlist-items no-drag"
        >
          <RecentPlaylistItem
            v-for="(item, index) in playingList"
            :key="item"
            :index="index"
            :cursor-url="index === (lastIndex + 1)
              ? cursorRight
              : (firstIndex !== 0 && index === firstIndex - 1) ? cursorLeft : ''"
            :path="item"
            :paused="paused"
            :is-last-page="lastIndex === maxIndex && firstIndex > 0"
            :page-switching="pageSwitching"
            :item-moving="itemMoving"
            :index-of-moving-to="indexOfMovingTo"
            :index-of-moving-item="indexOfMovingItem"
            :movement-x="movementX"
            :movement-y="movementY"
            :can-hover-item="canHoverItem"
            :is-in-range="index >= firstIndex && index <= lastIndex"
            :is-playing="index === playingIndex"
            :is-shifting="shifting"
            :hovered="hoverIndex === index"
            :win-width="winWidth"
            :thumbnail-width="thumbnailWidth"
            :thumbnail-height="thumbnailHeight"
            :size-adaption="sizeAdaption"
            :on-item-mousedown="onItemMousedown"
            :on-item-mouseup="onItemMouseup"
            :on-item-mouseout="onItemMouseout"
            :on-item-mouseover="onItemMouseover"
            :on-item-mousemove="onItemMousemove"
            @can-remove="canRemove = true"
            class="item"
          />
          <Add
            :style="{
              marginRight: sizeAdaption(15),
              minWidth: `${thumbnailWidth}px`,
              minHeight: `${thumbnailHeight}px`,
            }"
            :is-in-range="playingList.length <= lastIndex"
            :cursor-url="cursorRight"
            :item-moving="itemMoving"
            :index="addIndex"
            :add-mouseup="addMouseup"
            :on-item-mouseout="onItemMouseout"
            :on-item-mouseover="onItemMouseover"
          />
          <div
            v-if="thumbnailNumber < numberOfPlaylistItem"
            :style="{
              marginRight: sizeAdaption(15),
              width: `${thumbnailWidth}px`,
              height: `${thumbnailWidth / (112 / 63)}px`,
            }"
            @mouseup.stop=""
            class="next-page"
          />
        </div>
      </div>
    </transition>
  </div>
</template>
<script lang="ts">
import path from 'path';
import {
  mapState, mapGetters, mapActions, mapMutations,
} from 'vuex';
import { filePathToUrl } from '@/helpers/path';
import { mediaQuickHash } from '@/libs/utils';
import { Input as inputMutations } from '@/store/mutationTypes';
import { Input as InputActions, Subtitle as subtitleActions } from '@/store/actionTypes';
import RecentPlaylistItem from '@/containers/RecentPlaylistItem.vue';
import Add from '@/components/PlayingView/Add.vue';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import RecentPlayService from '@/services/media/PlaylistService';
import { playInfoStorageService } from '@/services/storage/PlayInfoStorageService';
import { PlaylistItem } from '@/interfaces/IDB';

export default {
  name: 'RecentPlaylist',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    RecentPlaylistItem,
    Add,
  },
  props: {
    mousemoveClientPosition: {
      type: Object,
      default: () => {},
    },
    paused: Boolean,
    displayState: Boolean,
    isDragging: Boolean,
    lastDragging: Boolean,
  },
  data() {
    return {
      playlist: [],
      mediaInfos: [],
      filename: '',
      firstIndex: 0, // first index of current page
      hoverIndex: 0, // only for display
      indexOfMovingItem: NaN, // index of move item
      movementX: 0, // movementX of move item
      movementY: 0, // movementY of move item
      shifting: false,
      hoveredDuration: NaN,
      hoveredLastPlayedTime: NaN,
      mousePosition: {},
      backgroundDisplayState: this.displayState, // it's weird but DON'T DELETE IT!!
      canHoverItem: false,
      tranFlag: false,
      filePathNeedToDelete: '',
      pageSwitching: false,
      pageSwitchingTimeId: NaN,
      removeTimeId: NaN,
      canRemove: false,
      mousedownIndex: NaN,
      mousedownPosition: [],
      mousemovePosition: [],
      firstIndexOnMousedown: 0,
      lastIndexOnMousedown: 0,
      currentTime: NaN,
      shiftingTimeout: NaN,
      showTopContent: true,
      cursorLeft: `url("${filePathToUrl(path.join(__static, 'cursor/cursorLeft.svg') as string)}")`,
      cursorRight: `url("${filePathToUrl(path.join(__static, 'cursor/cursorRight.svg') as string)}")`,
    };
  },
  created() {
    window.addEventListener('keyup', this.keyboardHandler);
    this.$bus.$on('delete-file', async (path: string, id: number) => {
      this.$store.dispatch('RemoveItemFromPlayingList', path);
      this.infoDB.delete('media-item', id);
      const playlist = await this.infoDB.get('recent-played', this.playListId);
      if (!playlist) return;
      await this.infoDB.update('recent-played', {
        ...playlist,
        items: this.items,
        playedIndex: this.playingIndex,
      }, playlist.id);
    });

    this.indexOfMovingItem = this.playingList.length;
    this.hoverIndex = this.playingIndex;
    if (this.duration) this.hoveredDuration = this.duration;
    this.filename = this.pathBaseName(this.originSrc);
  },
  destroyed() {
    window.removeEventListener('keyup', this.keyboardHandler);
  },
  methods: {
    ...mapMutations({
      updateMousemoveTarget: inputMutations.MOUSEMOVE_COMPONENT_NAME_UPDATE,
    }),
    ...mapActions({
      clearMousedown: InputActions.MOUSEDOWN_UPDATE,
      clearMouseup: InputActions.MOUSEUP_UPDATE,
      updateSubToTop: subtitleActions.UPDATE_SUBTITLE_TOP,
    }),
    keyboardHandler(e: KeyboardEvent) {
      if (this.displayState && !e.metaKey && !e.ctrlKey) {
        if (e.key === 'ArrowRight') {
          this.shifting = true;
          this.tranFlag = true;
          this.firstIndex += this.thumbnailNumber;
          if (this.shiftingTimeout) clearTimeout(this.shiftingTimeout);
          this.shiftingTimeout = setTimeout(() => {
            this.shifting = false;
            this.tranFlag = false;
          }, 400);
        } else if (e.key === 'ArrowLeft') {
          this.shifting = true;
          this.tranFlag = true;
          this.lastIndex -= this.thumbnailNumber;
          if (this.shiftingTimeout) clearTimeout(this.shiftingTimeout);
          this.shiftingTimeout = setTimeout(() => {
            this.shifting = false;
            this.tranFlag = false;
          }, 400);
        } else if (e.key === 'Escape') {
          this.$emit('update:playlistcontrol-showattached', false);
        }
      }
    },
    afterLeave() {
      this.backgroundDisplayState = false;
    },
    sizeAdaption(size: number) {
      return this.winWidth > 1355 ? `${(this.winWidth / 1355) * size}px` : `${size}px`;
    },
    pathBaseName(src: string) {
      return path.basename(src, path.extname(src));
    },
    handleMouseup() {
      if (this.isDragging) {
        this.clearMousedown({ componentName: '' });
      } else if (this.backgroundDisplayState) {
        this.$emit('update:playlistcontrol-showattached', false);
        this.updateMousemoveTarget('the-video-controller');
      }
    },
    updatelastPlayedTime(time: number) {
      this.currentTime = time;
    },
    addMouseup() {
      if (this.addIndex !== this.lastIndex + 1) {
        this.addFilesByDialog({
          defaultPath: path.dirname(this.originSrc),
        });
      }
      this.onItemMouseup(this.addIndex);
    },
    onItemMousedown(index: number, pageX: number, pageY: number) {
      this.mousedownIndex = index;
      this.mousedownPosition = [pageX, pageY];
      this.firstIndexOnMousedown = this.firstIndex;
      this.lastIndexOnMousedown = this.lastIndex;
    },
    onItemMousemove(index: number, pageX: number, pageY: number) { // eslint-disable-line complexity
      this.mousemovePosition = [pageX, pageY];
      const offsetX = pageX - this.mousedownPosition[0];
      const offsetY = pageY - this.mousedownPosition[1];
      const marginRight = this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
      const distance = marginRight + this.thumbnailWidth;
      const outOfWindow = pageX > window.innerWidth || pageX < 0
        || pageY > window.innerHeight || pageY < 0;

      if (Math.abs(offsetY) > 0 || Math.abs(offsetX) > 0) {
        this.indexOfMovingItem = index;
        this.movementY = offsetY;
        if (Math.abs(this.movementY) < this.thumbnailHeight) this.canRemove = false;

        if (outOfWindow) {
          clearTimeout(this.pageSwitchingTimeId);
          this.pageSwitching = false;
        }
        // if the item is moved to the edge of the window and stay for 1s
        // then switch the page
        if (this.indexOfMovingTo === this.lastIndex + 1) {
          if (!this.pageSwitching && !outOfWindow) {
            this.pageSwitching = true;
            this.pageSwitchingTimeId = setTimeout(() => {
              this.pageSwitching = false;
              this.firstIndex += this.thumbnailNumber;
              this.shifting = true;
              this.tranFlag = true;

              setTimeout(() => {
                this.shifting = false;
                this.tranFlag = false;
              }, 400);
            }, 1000);
          }
        } else if (this.indexOfMovingTo === this.firstIndex - 1) {
          if (!this.pageSwitching && !outOfWindow) {
            this.pageSwitching = true;
            this.pageSwitchingTimeId = setTimeout(() => {
              this.pageSwitching = false;
              this.lastIndex -= this.thumbnailNumber;
              this.shifting = true;
              this.tranFlag = true;

              setTimeout(() => {
                this.shifting = false;
                this.tranFlag = false;
              }, 400);
            }, 1000);
          }
        } else {
          clearTimeout(this.pageSwitchingTimeId);
          this.pageSwitching = false;
        }
        // calculate the movement of the item if page had been switch
        if (this.lastIndex > this.lastIndexOnMousedown) {
          this.movementX = offsetX + ((this.lastIndex - this.lastIndexOnMousedown) * distance);
        } else if (this.firstIndex < this.firstIndexOnMousedown) {
          this.movementX = offsetX + ((this.firstIndex - this.firstIndexOnMousedown) * distance);
        } else {
          this.movementX = offsetX;
        }
      } else {
        this.indexOfMovingItem = this.playingList.length;
      }
    },
    async setPlayList() {
      const playlist = await this.infoDB.get('recent-played', this.playListId);
      const currentVideoId = playlist.items[0];
      const currentVideoHp = playlist.hpaths[0];
      const items = [];
      const hpaths = [];
      /* eslint-disable */
      for (const videoPath of this.playingList) {
        if (videoPath !== this.originSrc) {
          const quickHash = await mediaQuickHash.try(videoPath);
          if (quickHash) {
            const data = {
              quickHash,
              type: 'video',
              path: videoPath,
              source: 'playlist',
            };
            const videoId = await this.infoDB.add('media-item', data);
            items.push(videoId);
            hpaths.push(`${quickHash}-${videoPath}`);
          }
        } else {
          items.push(currentVideoId);
          hpaths.push(currentVideoHp);
        }
      }
      playlist.items = items;
      playlist.hpaths = hpaths;
      this.infoDB.update('recent-played', playlist, playlist.id);
      this.$store.dispatch('PlayingList', { id: playlist.id, paths: this.playingList, items: playlist.items });
    },
    async updatePlaylist(playlistId: number) {
      if (!Number.isNaN(playlistId)) {
        const playlistRecord = await playInfoStorageService.getPlaylistRecord(playlistId);
        const recentPlayedData = {
          ...playlistRecord,
          items: this.items,
        };
        await playInfoStorageService
          .updateRecentPlayedBy(playlistId, recentPlayedData as PlaylistItem);
      }
    },
    onItemMouseup(index: number) { // eslint-disable-line complexity
      if (this.pageSwitching) clearTimeout(this.pageSwitchingTimeId);
      document.onmouseup = null;
      if (-(this.movementY) > this.thumbnailHeight * 1.5
       && this.itemMoving && this.canRemove) {
        this.$store.dispatch('RemoveItemFromPlayingList', this.playingList[index]);
        if (this.isFolderList) this.setPlayList();
        else this.updatePlaylist(this.playListId);
        this.hoverIndex = this.playingIndex;
        this.filename = this.pathBaseName(this.originSrc);
        this.canRemove = false;
      } else if (this.movingOffset !== 0
        && Math.abs(this.movementY) < this.thumbnailHeight) {
        this.$store.dispatch('RepositionItemFromPlayingList', {
          id: this.items[index],
          src: this.playingList[index],
          newPosition: this.indexOfMovingTo,
        });
        if (this.isFolderList) this.setPlayList();
        else this.updatePlaylist(this.playListId);
        if (this.indexOfMovingTo > this.lastIndex
          && this.lastIndex + 1 !== this.playingList.length) {
          this.lastIndex += 1;
          this.shifting = true;
          this.tranFlag = true;
          setTimeout(() => {
            this.shifting = false;
            this.tranFlag = false;
          }, 400);
        } else if (this.indexOfMovingTo < this.firstIndex
          && this.firstIndex !== 0) {
          this.firstIndex -= 1;
          this.shifting = true;
          this.tranFlag = true;
          setTimeout(() => {
            this.shifting = false;
            this.tranFlag = false;
          }, 400);
        }
        this.hoverIndex = this.indexOfMovingTo;
        // last page
      } else if (index === this.firstIndex - 1) {
        this.lastIndex -= this.thumbnailNumber;
        this.shifting = true;
        this.tranFlag = true;
        setTimeout(() => {
          this.shifting = false;
          this.tranFlag = false;
        }, 400);
      } else if (index === this.lastIndex + 1) { // next page
        this.firstIndex += this.thumbnailNumber;
        this.shifting = true;
        this.tranFlag = true;
        setTimeout(() => {
          this.shifting = false;
          this.tranFlag = false;
        }, 400);
      } else if (index !== this.playingIndex && !this.shifting
        && this.mousedownIndex !== this.playingIndex
        && this.indexOfMovingItem === this.playingList.length
        && this.filePathNeedToDelete !== this.playingList[index]) {
        this.mousedownIndex = NaN;
        if (this.isFolderList) this.openVideoFile(this.playingList[index]);
        else this.playFile(this.playingList[index], this.items[index]);
      } else if (index === this.playingIndex
        && this.indexOfMovingItem === this.playingList.length) {
        this.$bus.$emit('toggle-playback');
      }
      this.indexOfMovingItem = this.playingList.length;
      this.movementX = this.movementY = 0;
    },
    onItemMouseover(index?: number, recentPlayService?: RecentPlayService, isAdd?: boolean) {
      this.$emit('can-hover-item');
      if (isAdd) {
        this.filename = this.$t('recentPlaylist.add');
        this.showTopContent = false;
        return;
      }
      if (recentPlayService) {
        this.hoverIndex = index;
        this.hoveredDuration = recentPlayService.duration;
        this.filename = this.pathBaseName(recentPlayService.path);
        if (recentPlayService.lastPlayedTime) {
          this.hoveredLastPlayedTime = recentPlayService.lastPlayedTime;
        } else {
          this.hoveredLastPlayedTime = 0;
        }
      }
    },
    onItemMouseout() {
      this.showTopContent = true;
      this.hoverIndex = this.playingIndex;
      this.hoveredDuration = this.duration;
      this.filename = this.pathBaseName(this.originSrc);
    },
  },
  watch: {
    originSrc() {
      this.updateSubToTop(this.displayState);
      if (
        this.playingIndex > this.lastIndex
        || this.playingIndex < this.firstIndex
      ) {
        this.firstIndex = this.playingIndex;
        this.shifting = true;
        this.tranFlag = true;
        setTimeout(() => {
          this.shifting = false;
          this.tranFlag = false;
        }, 400);
      }
      this.filename = this.pathBaseName(this.originSrc);
    },
    duration(val: number) {
      this.hoveredDuration = val;
    },
    playingList(val: string[]) {
      this.indexOfMovingItem = val.length;
    },
    playingIndex(val: number) {
      this.hoverIndex = val;
    },
    firstIndex() {
      const marginRight = this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
      const distance = marginRight + this.thumbnailWidth;
      if (this.itemMoving && this.lastIndex > this.lastIndexOnMousedown) {
        this.movementX = (this.mousemovePosition[0] - this.mousedownPosition[0])
         + ((this.lastIndex - this.lastIndexOnMousedown) * distance);
      }
      if (this.lastIndex > this.maxIndex) {
        this.lastIndex = this.maxIndex;
      }
    },
    lastIndex(val: number) {
      const marginRight = this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
      const distance = marginRight + this.thumbnailWidth;
      if (this.itemMoving && this.firstIndex < this.firstIndexOnMousedown) {
        this.movementX = (this.mousemovePosition[0] - this.mousedownPosition[0])
         + ((this.firstIndex - this.firstIndexOnMousedown) * distance);
      }
      if (this.firstIndex > 0 && this.maxIndex > this.firstIndex
       && this.maxIndex <= val && !this.itemMoving) {
        this.firstIndex = (this.maxIndex - this.thumbnailNumber) + 1;
      }
    },
    thumbnailNumber(val: number) {
      if (this.playingIndex > this.lastIndex) {
        this.lastIndex = this.playingIndex;
        this.shifting = true;
        this.tranFlag = true;
        setTimeout(() => {
          this.shifting = false;
          this.tranFlag = false;
        }, 400);
      } else if (this.playingIndex < this.firstIndex) {
        this.firstIndex = this.playingIndex;
        this.shifting = true;
        this.tranFlag = true;
        setTimeout(() => {
          this.shifting = false;
          this.tranFlag = false;
        }, 400);
      } else {
        this.firstIndex = Math.floor(this.playingIndex / val) * val;
      }
    },
    maxIndex(val: number, oldVal: number) {
      if (this.lastIndex === oldVal) {
        this.lastIndex = val;
      }
    },
    currentMousedownComponent(val: string) {
      if (val !== 'notification-bubble' && val !== 'titlebar' && val !== '') {
        if (val !== this.$options.name && this.backgroundDisplayState) {
          this.clearMouseup({ componentName: '' });
        }
      }
    },
    currentMouseupComponent(val: string) {
      setTimeout(() => {
        if (this.currentMousedownComponent !== 'notification-bubble' && this.currentMousedownComponent !== 'titlebar' && val !== '') {
          if (this.lastDragging) {
            this.clearMousedown({ componentName: '' });
            if (this.displayState) {
              this.$emit('update:lastDragging', false);
            }
          } else if (val !== this.$options.name && this.backgroundDisplayState) {
            this.$emit('update:playlistcontrol-showattached', false);
          }
        }
      }, 0);
    },
    displayState(val: boolean, oldval: boolean) {
      if (oldval !== undefined) {
        this.updateSubToTop(val);
      }
      this.canHoverItem = false;
      this.mousePosition = this.mousemoveClientPosition;
      if (val) {
        this.backgroundDisplayState = val;
        this.firstIndex = Math.floor(this.playingIndex / this.thumbnailNumber)
          * this.thumbnailNumber;
      } else {
        document.onmouseup = null;
      }
    },
    mousemoveClientPosition(val: { x: number, y: number }) {
      const distance = 10;
      if (!this.canHoverItem && this.displayState) {
        if (Math.abs(this.mousePosition.x - val.x) > distance ||
        Math.abs(this.mousePosition.y - val.y) > distance) {
          this.canHoverItem = true;
        }
      }
    },
  },
  computed: {
    ...mapGetters(['playingList', 'playListId', 'items', 'playListId', 'isFolderList', 'winWidth', 'playingIndex', 'duration', 'originSrc']),
    ...mapState({
      currentMousedownComponent: ({ Input }) => Input.mousedownComponentName,
      currentMouseupComponent: ({ Input }) => Input.mouseupComponentName,
    }),
    movingOffset() {
      const marginRight = this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
      const distance = marginRight + this.thumbnailWidth;
      const movingOffset = this.movementX > 0 ? // the position where item moving to
        Math.floor((this.movementX + (this.thumbnailWidth * 0.8)) / distance) :
        Math.ceil((this.movementX - (this.thumbnailWidth * 0.8)) / distance);
      return movingOffset;
    },
    indexOfMovingTo() { // the place where the moving item is going to be set
      if (!this.itemMoving) return this.indexOfMovingItem;
      let indexOfMovingTo = this.indexOfMovingItem + this.movingOffset;
      if (indexOfMovingTo > this.lastIndex + 1) indexOfMovingTo = this.lastIndex + 1;
      else if (indexOfMovingTo < this.firstIndex - 1) indexOfMovingTo = this.firstIndex - 1;
      return indexOfMovingTo;
    },
    itemMoving() {
      return this.indexOfMovingItem !== this.playingList.length;
    },
    addIndex() {
      return this.playingList.length;
    },
    onlyOneVideo() {
      return this.playingList.length === 1;
    },
    inWhichSource() {
      if (this.isFolderList) {
        return this.$t('recentPlaylist.folderSource');
      }
      return this.$t('recentPlaylist.playlistSource');
    },
    lastPlayedTimeDisplay() {
      if (this.hoverIndex !== this.playingIndex) {
        return this.hoveredLastPlayedTime;
      }
      return this.currentTime;
    },
    indexInPlaylist() {
      return this.hoverIndex + 1;
    },
    numberOfPlaylistItem() {
      return this.playingList.length;
    },
    // last index of current page
    lastIndex: {
      get() {
        return (this.firstIndex + this.thumbnailNumber) - 1;
      },
      set(val: number) {
        if ((val - this.thumbnailNumber) + 1 < 0) {
          this.firstIndex = 0;
        } else {
          this.firstIndex = (val - this.thumbnailNumber) + 1;
        }
      },
    },
    distance() {
      if (this.winWidth > 1355) {
        return this.firstIndex * (this.thumbnailWidth + ((this.winWidth / 1355) * 15));
      }
      return this.firstIndex * (this.thumbnailWidth + 15);
    },
    maxIndex() {
      return this.playingList.length;
    },
    maxDistance() {
      return (this.maxIndex - (this.thumbnailNumber - 1)) * this.thumbnailWidth;
    },
    // please look up the product doc:
    // https://www.notion.so/splayer/Playlist-685b398ac7ce45508a4283af00f76534
    thumbnailNumber() {
      let number = 3;
      const w = 112; // default width of playlist item
      const B = 15; // space between each playlist item
      if (this.winWidth >= 512 && this.winWidth < 720) {
        number = Math.floor(3 + ((this.winWidth - 512) / (w + B)));
      } else if (this.winWidth >= 720 && this.winWidth <= 1355) {
        number = Math.floor(((this.winWidth - 720) / (w + B)) + 5);
      } else if (this.winWidth > 1355) {
        number = 10;
      }
      return number;
    },
    thumbnailWidth() {
      let width = 0;
      const A = 40; // playlist left margin
      const B = 15; // space between each playlist item
      const C = 60; // the space between last playlist item and right edge of the screen
      if (this.winWidth <= 1355) {
        width = ((((this.winWidth - A) - C) + B) / this.thumbnailNumber) - B;
      } else if (this.winWidth > 1355) {
        width = this.winWidth * (112 / 1355);
      }
      return Math.floor(width);
    },
    thumbnailHeight() {
      return this.thumbnailWidth / (112 / 63);
    },
  },
};
</script>
<style lang="scss" scoped>
.recent-playlist {
  width: 100%;
  height: calc(100% - 36px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  .background-gradient {
    position: absolute;
    z-index: -1;
    background-image: linear-gradient(-180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.00) 2%, rgba(0,0,0,0.01) 5%, rgba(0,0,0,0.02) 8%, rgba(0,0,0,0.05) 13%, rgba(0,0,0,0.11) 21%, rgba(0,0,0,0.15) 26%, rgba(0,0,0,0.22) 33%, rgba(0,0,0,0.34) 42%, #000000 86%);
    width: 100%;
    bottom: 0;
  }
  .content {
    .info {
      width: 90%;
      .top {
        font-family: $font-heavy;
        white-space:nowrap;
        color: rgba(235,235,235,0.6);
        letter-spacing: 0.64px;
        width: fit-content;
      }
      .file-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        font-family: $font-normal;
        color: rgba(255,255,255,0.70);
        letter-spacing: 1px;
        width: 100%;
      }
    }
    .playlist-items {
      display: flex;
      width: fit-content;
      .item {
        position: relative;
        background-color: rgba(255,255,255,0.1);
      }
    }
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 150ms ease-in;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.translate-enter-active, .translate-leave-active {
  transition: transform 350ms cubic-bezier(0.2, 0.3, 0.01, 1), opacity 350ms cubic-bezier(0.2, 0.3, 0.01, 1);
}
.translate-enter, .translate-leave-to {
  transform: translateY(100px);
  opacity: 0;
}
.background-fade-enter-active, .background-fade-leave-active {
  transition: opacity 350ms cubic-bezier(0.2, 0.3, 0.01, 1);
}
.background-fade-enter, .background-fade-leave-to {
  opacity: 0;
}
</style>
