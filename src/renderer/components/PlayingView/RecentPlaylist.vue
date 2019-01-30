<template>
<div class="recent-playlist"
  v-show="backgroundDisplayState"
  @mouseup="handleMouseup">
  <transition name="background-fade">
  <div class="background-gradient"
    v-show="displayState"
    :style="{
      height: sizeAdaption(282),
    }"/>
  </transition>
  <transition name="translate"
    @after-leave="afterLeave">
  <div class="content"
    v-show="displayState">
    <transition name="fade" mode="out-in">
    <div class="info"
      :key="hoverIndex"
      :style="{
        marginTop: sizeAdaption(53),
        paddingLeft: sizeAdaption(40),
      }">
      <div class="top"
      :style="{
        fontSize: sizeAdaption(14),
        lineHeight: sizeAdaption(13),
      }"><span ref="lastPlayedTime"></span> {{timecodeFromSeconds(videoDuration)}}&nbsp&nbsp·&nbsp&nbsp{{inWhichSource}}&nbsp&nbsp{{indexInPlaylist}} / {{numberOfPlaylistItem}}</div>
      <div class="file-name"
        :style="{
          marginTop: sizeAdaption(9),
          fontSize: sizeAdaption(18),
          lineHeight: sizeAdaption(20),
          fontWeight: 500,
        }">{{filename}}</div>
    </div>
    </transition>
    <div class="playlist-items"
      @mouseup.stop=""
      :style="{
        transition: tranFlag ? 'transform 400ms ease-in' : '',
        transform: `translateX(-${distance}px)`,
        marginTop: sizeAdaption(20),
        marginBottom: sizeAdaption(40),
        marginLeft: sizeAdaption(40),
      }">
      <RecentPlaylistItem v-for="(item, index) in playingList" class="item"
        :key="item"
        :index="index"
        :path="item"
        :canHoverItem="canHoverItem"
        :isInRange="index >= firstIndex && index <= lastIndex"
        :isPlaying="index === playingIndex"
        :winWidth="winWidth"
        :isShifting="shifting"
        :hoverIndex="hoverIndex"
        :thumbnailWidth="thumbnailWidth"
        :eventTarget="eventTarget" />
      <div class="next-page"
        v-if="thumbnailNumber < numberOfPlaylistItem"
        @mouseup.stop=""
        :style="{
          marginRight: sizeAdaption(15),
          width: `${thumbnailWidth}px`,
          height: `${thumbnailWidth / (112 / 63)}px`,
        }"/>
    </div>
  </div>
  </transition>
</div>
</template>
<script>
import path from 'path';
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
import { Input as inputMutations } from '@/store/mutationTypes';
import { Input as InputActions } from '@/store/actionTypes';
import RecentPlaylistItem from '@/components/PlayingView/RecentPlaylistItem.vue';

export default {
  name: 'recent-playlist',
  components: {
    RecentPlaylistItem,
  },
  props: {
    mousemovePosition: {},
    displayState: Boolean,
    mousedownOnOther: Boolean,
    mouseupOnOther: Boolean,
    isDragging: Boolean,
    lastDragging: Boolean,
  },
  data() {
    return {
      filename: '',
      firstIndex: 0, // first index of current page
      hoverIndex: 0, // only for display
      shifting: false,
      snapShoted: false,
      hoveredMediaInfo: {}, // the hovered video's media info
      mousePosition: [],
      backgroundDisplayState: this.displayState, // it's weird but DON'T DELETE IT!!
      canHoverItem: false,
      tranFlag: false,
      filePathNeedToDelete: '',
      eventTarget: {},
      changeByRecent: false,
    };
  },
  created() {
    this.$bus.$on('file-not-existed', (path) => {
      this.filePathNeedToDelete = path;
    });
    this.$bus.$on('delete-file', () => {
      this.$store.dispatch('RemovePlayingList', this.filePathNeedToDelete);
      this.filePathNeedToDelete = '';
    });
    this.hoverIndex = this.playingIndex;
    this.eventTarget.onItemMouseover = this.onItemMouseover;
    this.eventTarget.onItemMouseout = this.onItemMouseout;
    this.eventTarget.onItemMouseup = this.onItemMouseup;

    this.filename = path.basename(this.originSrc, path.extname(this.originSrc));
  },
  methods: {
    ...mapMutations({
      updateMousemoveTarget: inputMutations.MOUSEMOVE_TARGET_UPDATE,
    }),
    ...mapActions({
      clearMousedown: InputActions.MOUSEDOWN_UPDATE,
      clearMouseup: InputActions.MOUSEUP_UPDATE,
    }),
    afterLeave() {
      this.backgroundDisplayState = false;
    },
    sizeAdaption(size) {
      return this.winWidth > 1355 ? `${(this.winWidth / 1355) * size}px` : `${size}px`;
    },
    handleMouseup() {
      if (this.isDragging) {
        this.clearMousedown({ target: '' });
      } else if (this.backgroundDisplayState) {
        this.$emit('update:playlistcontrol-showattached', false);
        this.updateMousemoveTarget('the-video-controller');
      }
    },
    onItemMouseover(index, media) {
      this.hoverIndex = index;
      this.hoveredMediaInfo = media;
      this.filename = path.basename(
        media.path,
        path.extname(media.path),
      );
    },
    onItemMouseout() {
      this.hoverIndex = this.playingIndex;
      this.filename = path.basename(this.originSrc, path.extname(this.originSrc));
    },
    updatelastPlayedTime(time) {
      if (this.$refs.lastPlayedTime) {
        if (this.hoverIndex === this.playingIndex) {
          this.$refs.lastPlayedTime.textContent = `${this.timecodeFromSeconds(time)} /`;
        } else if (this.hoveredMediaInfo.lastPlayedTime) {
          this.$refs.lastPlayedTime.textContent = `${this.timecodeFromSeconds(this.hoveredMediaInfo.lastPlayedTime)} /`;
        }
      }
    },
    onItemMouseup(index) {
      // last page
      if (index === this.firstIndex - 1) {
        this.lastIndex = index;
        this.shifting = true;
        this.tranFlag = true;
        setTimeout(() => {
          this.shifting = false;
          this.tranFlag = false;
        }, 400);
      } else if (index === this.lastIndex + 1) { // next page
        this.firstIndex = index;
        this.shifting = true;
        this.tranFlag = true;
        setTimeout(() => {
          this.shifting = false;
          this.tranFlag = false;
        }, 400);
      } else if (index !== this.playingIndex && !this.shifting
        && this.filePathNeedToDelete !== this.playingList[index]) {
        this.changeByRecent = true;
        this.playFile(this.playingList[index]);
      }
    },
  },
  watch: {
    originSrc() {
      if (!this.changeByRecent) {
        this.displayState = false;
        this.$emit('update:playlistcontrol-showattached', false);
      }
      this.changeByRecent = false;
      this.hoverIndex = this.playingIndex;
      this.filename = path.basename(this.originSrc, path.extname(this.originSrc));
    },
    firstIndex() {
      if (this.lastIndex > this.maxIndex) {
        this.lastIndex = this.maxIndex;
      }
    },
    lastIndex(val) {
      if (this.firstIndex > 0 && this.maxIndex > this.firstIndex && this.maxIndex <= val) {
        this.firstIndex = (this.maxIndex - this.thumbnailNumber) + 1;
      }
    },
    currentMousedownComponent(val) {
      if (val !== 'notification-bubble' && val !== 'titlebar' && val !== '') {
        if (val !== this.$options.name && this.backgroundDisplayState) {
          this.clearMouseup({ target: '' });
        }
      }
    },
    currentMouseupComponent(val) {
      if (this.currentMousedownComponent !== 'notification-bubble' && this.currentMousedownComponent !== 'titlebar' && val !== '') {
        if (this.lastDragging) {
          this.clearMousedown({ target: '' });
          if (this.displayState) {
            this.$emit('update:lastDragging', false);
          }
        } else if (val !== this.$options.name && this.backgroundDisplayState) {
          this.$emit('update:playlistcontrol-showattached', false);
        }
      }
    },
    playingIndex(val) {
      if (val > this.lastIndex) {
        this.firstIndex = val;
      } else if (val < this.firstIndex) {
        this.lastIndex = val;
      }
    },
    displayState(val, oldval) {
      if (oldval !== undefined) {
        this.$bus.$emit('subtitle-to-top', val);
      }
      this.canHoverItem = false;
      this.mousePosition = this.mousemovePosition;
      if (val) {
        this.$store.dispatch('UpdatePlayingList');
        this.backgroundDisplayState = val;
        this.firstIndex = Math.floor(this.playingIndex / this.thumbnailNumber)
          * this.thumbnailNumber;
      }
    },
    mousemovePosition(val) {
      const distance = this.winWidth > 1355 ? 20 : 10;
      if (!this.canHoverItem && this.displayState) {
        if (Math.abs(this.mousePosition.x - val.x) > distance ||
        Math.abs(this.mousePosition.y - val.y) > distance) {
          this.canHoverItem = true;
        }
      }
    },
  },
  computed: {
    ...mapGetters(['playingList', 'isFolderList', 'winWidth', 'playingIndex', 'duration', 'originSrc']),
    ...mapState({
      currentMousedownComponent: ({ Input }) => Input.mousedownComponentName,
      currentMouseupComponent: ({ Input }) => Input.mouseupComponentName,
    }),
    inWhichSource() {
      if (this.isFolderList) {
        return this.$t('recentPlaylist.folderSource');
      }
      return this.$t('recentPlaylist.playlistSource');
    },
    videoDuration() {
      if (this.hoverIndex !== this.playingIndex) {
        return this.hoveredMediaInfo.duration;
      }
      return this.duration;
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
      set(val) {
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
      return this.playingList.length - 1;
    },
    maxDistance() {
      return (this.maxIndex - (this.thumbnailNumber - 1)) * this.thumbnailWidth;
    },
    // if you wanna know the meanings of wABC, please look up the product doc:
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
  },
};
</script>
<style lang="scss" scoped>
.recent-playlist {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  @media screen and (max-width: 1355px) {
    height: 282px;
  }
  @media screen and (min-width: 1356px) {
    height: 20.81vw;
  }
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
      -webkit-app-region: no-drag;
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
