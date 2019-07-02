<template>
  <div
    ref="recentPlaylistItem"
    :style="{
      transition: tranFlag ? 'transform 100ms ease-out' : '',
      marginRight: sizeAdaption(15),
      cursor: isInRange ? 'pointer' : '',
      minWidth: `${thumbnailWidth}px`,
      minHeight: `${thumbnailHeight}px`,
    }"
    class="recent-playlist-item no-drag"
  >
    <div
      class="child-item"
      style="will-change: transform;"
    >
      <div
        :style="{
          backgroundImage: !isPlaying ?
            `linear-gradient(-180deg, rgba(0,0,0,0) 26%, rgba(0,0,0,0.73) 98%), ${backgroundImage}`
            : 'linear-gradient(-180deg, rgba(0,0,0,0) 26%, rgba(0,0,0,0.73) 98%)',
        }"
        :class="['img', { blur: !isPlaying }]"
      />
      <div
        ref="whiteHover"
        :style="{
          opacity: hovered ? '1' : '0',
          minWidth: `${thumbnailWidth}px`,
          minHeight: `${thumbnailHeight}px`,
        }"
        class="white-hover"
      />
      <div
        ref="content"
        :style="{
          height: '100%',
        }"
        @mouseenter="mouseoverVideo"
        @mouseleave="mouseoutVideo"
        @mousedown.left="mousedownVideo"
        @mouseup.left="mouseupVideo"
        class="content"
      >
        <div
          ref="info"
          :style="{
            height: `${thumbnailHeight - bottom}px`,
            width: `${thumbnailWidth - 2 * side}px`,
            left: `${side}px`,
          }"
          class="info"
        >
          <div
            :style="{
              height: sizeAdaption(22),
              bottom: sizeAdaption(14),
            }"
            class="overflow-container"
          >
            <transition name="icon">
              <div
                v-if="isPlaying"
                class="icon-container"
              >
                <transition
                  name="fade"
                  mode="out-in"
                >
                  <Icon
                    :key="paused"
                    :style="{
                      width: sizeAdaption(10),
                      height: sizeAdaption(22),
                      marginRight: sizeAdaption(4),
                    }"
                    :type="paused ? 'playlistpause' : 'playlistplay'"
                  />
                </transition>
                <transition
                  name="fade"
                  mode="out-in"
                >
                  <div
                    :key="paused"
                    :style="{
                      paddingTop: sizeAdaption(5),
                      fontSize: sizeAdaption(12),
                      lineHeight: sizeAdaption(12),
                    }"
                    class="playing"
                  >
                    {{ paused ? $t('recentPlaylist.paused') : $t('recentPlaylist.playing') }}
                  </div>
                </transition>
              </div>
            </transition>
          </div>
          <transition name="fade">
            <div
              ref="progress"
              :style="{
                opacity: '0',
                height: sizeAdaption(2),
                bottom: sizeAdaption(14),
                marginBottom: sizeAdaption(7),
              }"
              class="progress"
            >
              <div
                :style="{
                  width: `${sliderPercentage}%`,
                }"
                class="slider"
              />
            </div>
          </transition>
          <div
            ref="title"
            :style="{
              color: 'rgba(255,255,255,0.40)',
              fontSize: sizeAdaption(12),
              lineHeight: sizeAdaption(16),
            }"
            class="title"
          >
            {{ baseName }}
          </div>
        </div>
        <div
          ref="deleteUi"
          :style="{
            height: `${thumbnailHeight}px`,
          }"
          class="deleteUi"
        >
          <Icon type="delete" />
        </div>
      </div>
      <div
        ref="border"
        :style="{
          borderColor: 'rgba(255,255,255,0.15)',
        }"
        class="border"
      />
    </div>
  </div>
</template>
<script lang="ts">
import path from 'path';
import { mapGetters } from 'vuex';
import { parseNameFromPath } from '@/libs/utils';
// @ts-ignore
import Icon from '@/components/BaseIconContainer.vue';
import RecentPlayService from '@/services/media/PlaylistService';
import { mediaStorageService } from '@/services/storage/MediaStorageService';

export default {
  components: {
    Icon,
  },
  props: {
    // index of current item
    index: {
      type: Number,
      default: NaN,
    },
    hovered: {
      type: Boolean,
    },
    // for moving
    itemMoving: {
      type: Boolean,
    },
    // for moving
    indexOfMovingItem: {
      type: Number,
      default: NaN,
    },
    // for moving
    movementX: {
      type: Number,
      default: 0,
    },
    // for moving
    movementY: {
      type: Number,
      default: 0,
    },
    // for moving
    indexOfMovingTo: {
      type: Number,
      default: NaN,
    },
    // for moving
    isLastPage: {
      type: Boolean,
    },
    isInRange: {
      type: Boolean,
    },
    isShifting: {
      type: Boolean,
    },
    canHoverItem: {
      type: Boolean,
    },
    // sizing related
    thumbnailWidth: {
      type: Number,
      default: 112,
    },
    thumbnailHeight: {
      type: Number,
      default: 63,
    },
    winWidth: {
      type: Number,
      default: 720,
    },
    // content related
    isPlaying: {
      type: Boolean,
      default: false,
    },
    paused: {
      type: Boolean,
      default: true,
    },
    // for base name
    path: {
      type: String,
      default: '',
    },
    onItemMousemove: {
      type: Function,
      required: true,
    },
    onItemMousedown: {
      type: Function,
      required: true,
    },
    onItemMouseup: {
      type: Function,
      required: true,
    },
    onItemMouseout: {
      type: Function,
      required: true,
    },
    onItemMouseover: {
      type: Function,
      required: true,
    },
    sizeAdaption: {
      type: Function,
      default: (val: number) => val,
    },
    pageSwitching: {
      type: Boolean,
    },
  },
  data() {
    return {
      recentPlayService: null,
      mouseover: false,
      imageSrc: '',
      sliderPercentage: 0,
      displayIndex: NaN,
      tranFlag: true,
      outOfWindow: false,
      deleteTimeId: NaN,
      selfMoving: false,
    };
  },
  computed: {
    ...mapGetters(['playingList', 'items']),
    aboutToDelete() {
      return this.selfMoving && (-(this.movementY) > this.thumbnailHeight * 1.5);
    },
    baseName() {
      const parsedName = parseNameFromPath(this.path);
      if (parsedName.episode && parsedName.season) {
        return `S${parsedName.season}E${parsedName.episode}`;
      }
      if (parsedName.episode && !parsedName.season) {
        return `EP${parsedName.episode}`;
      }
      if (parsedName.season && !parsedName.episode) {
        return `SE${parsedName.season}`;
      }
      return path.basename(this.path, path.extname(this.path));
    },
    backgroundImage() {
      const { imageSrc } = this;
      return imageSrc ? `url(${imageSrc})` : '';
    },
    // ui related
    side() {
      return this.winWidth > 1355 ? this.thumbnailWidth / (112 / 14) : 14;
    },
    bottom() {
      return this.winWidth > 1355 ? this.thumbnailWidth / (112 / 14) : 14;
    },
  },
  watch: {
    aboutToDelete(val: boolean) {
      if (val) {
        this.deleteTimeId = setTimeout(() => {
          this.$refs.whiteHover.style.backgroundColor = 'rgba(0,0,0,0.6)';
          this.$refs.info.style.opacity = '0';
          this.$refs.deleteUi.style.opacity = '1';
          this.$emit('can-remove');
        }, 250);
      } else {
        clearTimeout(this.deleteTimeId);
        requestAnimationFrame(() => {
          this.$refs.whiteHover.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          this.$refs.info.style.opacity = '1';
          this.$refs.deleteUi.style.opacity = '0';
        });
      }
    },
    canHoverItem(val: boolean, oldVal: boolean) {
      if (!oldVal && val && this.mouseover) {
        this.mouseoverVideo();
      }
    },
    items() {
      this.updateUI();
    },
    isPlaying(val: boolean) {
      if (val) {
        requestAnimationFrame(this.updateAnimationOut);
      }
    },
    displayIndex(val: number) {
      requestAnimationFrame(() => {
        const marginRight = this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
        const distance = marginRight + this.thumbnailWidth;
        if (val !== this.index) {
          this.$refs.recentPlaylistItem.style.setProperty('transform', `translate(${(val - this.index) * distance}px,0)`);
        } else {
          this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,0)');
        }
      });
    },
    itemMoving(val: boolean) {
      if (!val) {
        this.tranFlag = true;
        this.displayIndex = this.index;
      }
    },
    indexOfMovingTo(val: number) {
      if (this.itemMoving && Math.abs(this.movementY) < this.thumbnailHeight && !this.selfMoving) {
        // item moving to right
        if (this.index > this.indexOfMovingItem && this.index <= val) {
          this.displayIndex = this.index - 1;
        // item moving to left
        } else if (this.index >= val && this.index < this.indexOfMovingItem) {
          this.displayIndex = this.index + 1;
        } else {
          this.displayIndex = this.index;
        }
      }
    },
    pageSwitching(val: boolean, oldVal: boolean) {
      if (!val && oldVal && this.selfMoving) {
        requestAnimationFrame(() => {
          this.$refs.recentPlaylistItem.style.setProperty('transform', `translate(${this.movementX}px, ${this.movementY}px)`);
        });
      }
    },
    movementY(val: number) { // eslint-disable-line complexity
      if (Math.abs(val) > this.thumbnailHeight) {
        // avoid the wrong layout after moving to left and lift up
        if (this.index < this.indexOfMovingItem) {
          this.displayIndex = this.isLastPage ? this.index + 1 : this.index;
        } else if (this.index > this.indexOfMovingItem) {
          this.displayIndex = this.isLastPage ? this.index : this.index - 1;
        }
      } else if (Math.abs(val) <= this.thumbnailHeight) {
        // item moving to right
        if (this.index > this.indexOfMovingItem && this.index <= this.indexOfMovingTo) {
          this.displayIndex = this.index - 1;
        // item moving to left
        } else if (this.index >= this.indexOfMovingTo && this.index < this.indexOfMovingItem) {
          this.displayIndex = this.index + 1;
        } else {
          this.displayIndex = this.index;
        }
      }
    },
    playingList() {
      this.tranFlag = false;
      this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,0)');
      setTimeout(() => {
        this.tranFlag = true;
      }, 0);
    },
  },
  created() {
    this.displayIndex = this.index;
    this.recentPlayService = new RecentPlayService(
      mediaStorageService,
      this.path,
      this.items[this.index],
    );
    this.recentPlayService.on('image-loaded', () => {
      this.updateUI();
    });
    this.updateUI();
    this.$bus.$on('database-saved', this.updateUI);
  },
  methods: {
    async updateUI() {
      await this.recentPlayService.getRecord(this.items[this.index]);
      this.imageSrc = this.recentPlayService.imageSrc;
      this.sliderPercentage = this.recentPlayService.percentage;
    },
    mousedownVideo(e: MouseEvent) {
      this.onItemMousedown(this.index, e.pageX, e.pageY, e);
      if (this.isPlaying) return;
      document.onmousemove = (e) => {
        this.selfMoving = true;
        this.tranFlag = false;
        this.$refs.recentPlaylistItem.style.zIndex = 200;
        this.$refs.content.style.zIndex = 200;
        this.outOfWindow = e.pageX > window.innerWidth || e.pageX < 0
          || e.pageY > window.innerHeight || e.pageY < 0;
        this.onItemMousemove(this.index, e.pageX, e.pageY, e);
        requestAnimationFrame(() => {
          this.$refs.recentPlaylistItem.style.setProperty('transform', `translate(${this.movementX}px, ${this.movementY}px)`);
        });
      };
      document.onmouseup = () => {
        document.onmousemove = null;
        this.selfMoving = false;
        this.tranFlag = true;
        requestAnimationFrame(() => {
          this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,0)');
          this.$refs.progress.style.setProperty('opacity', '0');
          this.$refs.recentPlaylistItem.style.zIndex = 0;
          this.$refs.content.style.zIndex = 10;
          this.updateAnimationOut();
        });
        this.onItemMouseout();
        this.onItemMouseup(this.index);
      };
    },
    mouseupVideo() {
      document.onmousemove = null;
      this.selfMoving = false;
      this.tranFlag = true;
      requestAnimationFrame(() => {
        this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,0)');
        this.$refs.progress.style.setProperty('opacity', '0');
        this.$refs.recentPlaylistItem.style.zIndex = 0;
        this.$refs.content.style.zIndex = 10;
      });
      this.onItemMouseup(this.index);
    },
    updateAnimationIn() {
      this.$refs.border.style.setProperty('border-color', 'rgba(255,255,255,0.6)');
      if (this.isPlaying) {
        return;
      }
      if (!this.itemMoving) this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,-9px)');
      this.$refs.content.style.setProperty('height', `${this.thumbnailHeight + 10}px`);
      this.$refs.title.style.setProperty('color', 'rgba(255,255,255,0.8)');
      if (!this.isPlaying && this.sliderPercentage > 0) {
        this.$refs.progress.style.setProperty('opacity', '1');
      }
    },
    updateAnimationOut() {
      if (!this.itemMoving) this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,0)');
      this.$refs.content.style.setProperty('height', '100%');
      this.$refs.border.style.setProperty('border-color', 'rgba(255,255,255,0.15)');
      this.$refs.title.style.setProperty('color', 'rgba(255,255,255,0.40)');
      this.$refs.progress.style.setProperty('opacity', '0');
    },
    mouseoverVideo() {
      this.mouseover = true;
      if (this.isInRange && !this.isShifting
        && this.canHoverItem && !this.itemMoving) {
        this.onItemMouseover(
          this.index,
          this.recentPlayService,
        );
        requestAnimationFrame(this.updateAnimationIn);
      }
    },
    mouseoutVideo() {
      this.mouseover = false;
      if (!this.itemMoving) {
        this.onItemMouseout();
        requestAnimationFrame(this.updateAnimationOut);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
$border-radius: 3px;
.recent-playlist-item {
  .child-item {
    border-radius: $border-radius;
    width: 100%;
    height: 100%;
    background-color: rgba(111,111,111,0.30);
    .blur {
      filter: blur(1.5px);
    }
    .img {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: $border-radius;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center center;
    }
    .white-hover {
      pointer-events:none;
      position: absolute;
      border-radius: $border-radius;
      background-color: rgba(255, 255, 255, 0.2);
      transition: opacity 100ms ease-in, background-color 100ms ease-in;
    }
    .content {
      position: absolute;
      z-index: 10;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;

      .deleteUi {
        transition: opacity 100ms ease-in;
        opacity: 0;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .info {
        position: absolute;
        transition: opacity 100ms ease-in;
        opacity: 1;
        top: 0;
      }
      .overflow-container {
        position: absolute;
        width: 100%;
        height: 22px;
        overflow: hidden;
      }
      .icon-container {
        position: absolute;
        display: flex;
        flex-direction: row;
        height: fit-content;

        .playing {
          font-family: $font-semibold;
          color: rgba(255,255,255,0.7);
          letter-spacing: 0.5px;
        }
      }
    }
    .progress {
      position: absolute;
      width: 65%;
      border-radius: 2px;
      background-color: rgba(216,216,216,0.40);
      .slider {
        height: 100%;
        border-radius: 2px;
        background-color: #D8D8D8;
      }
    }
    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 80ms 80ms ease-out;

      font-family: $font-heavy;
      letter-spacing: 0.58px;

      width: 100%;
      position: absolute;
      bottom: 0;
    }
  }
  .border {
    position: absolute;
    box-sizing: border-box;
    transition: border-color 150ms ease-out;

    width: 100%;
    height: 100%;
    border-width: 1px;
    border-style: solid;
    border-radius: 3px;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 100ms ease-out;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.icon-enter-active, .icon-leave-active {
  transition: transform 80ms linear;
}
.icon-enter, .icon-leave-to {
  transform: translateY(12px);
}
</style>
