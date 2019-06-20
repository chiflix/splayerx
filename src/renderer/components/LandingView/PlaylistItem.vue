
<template>
  <div
    ref="playlistItem"
    class="playlist-item"
  >
    <div
      ref="layer1"
      :style="{
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
      }"
      class="layer1"
    />
    <div
      ref="layer2"
      :style="{
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
      }"
      class="layer2"
    />
    <div
      ref="item"
      :style="{
        bottom: chosen ? '10px' : '0',
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
      }"
      class="item"
    >
      <div
        :style="{
          width: `${thumbnailWidth}px`,
          height: chosen ? `${thumbnailHeight + 11}px` : `${thumbnailHeight}px`,
        }"
        @click.stop="onRecentItemClick"
        @mouseenter="onRecentItemMouseenter"
        @mouseleave="onRecentItemMouseleave"
        @mousedown.stop="onRecentItemMousedown"
        @mouseup="onRecentItemMouseup"
        class="content"
      >
        <div
          ref="border"
          :style="{
            left: `-${0.7 / 2}px`,
            top: `-${0.7 / 2}px`,
            width: `${thumbnailWidth - 0.7}px`,
            height: `${thumbnailHeight - 0.7}px`,
            border: chosen ? '0.7px solid rgba(255,255,255,0.6)'
              : '0.7px solid rgba(255,255,255,0.15)',
            backgroundColor: aboutToDelete ? 'rgba(0,0,0,0.43)'
              : chosen ? 'rgba(255,255,255,0.2)' : '',
          }"
          class="border"
        >
          <div
            :style="{
              opacity: aboutToDelete ? '1' : '0',
            }"
            class="deleteUi"
          >
            <Icon type="delete" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import path from 'path';
import { filePathToUrl } from '@/helpers/path';
import { generateCoverPathByMediaHash } from '@/helpers/cacheFileStorage';
import Icon from '../BaseIconContainer.vue';
import { info } from '@/libs/DataBase';

export default {
  name: 'PlaylistItem',
  components: { Icon },
  props: {
    firstIndex: {
      type: Number,
      default: 0,
    },
    lastIndex: {
      type: Number,
      default: 0,
    },
    shifting: {
      type: Boolean,
    },
    isInRange: {
      type: Boolean,
    },
    index: {
      type: Number,
      default: 0,
    },
    playlist: {
      type: Object,
      default: () => {},
    },
    thumbnailHeight: {
      type: Number,
      default: 63,
    },
    thumbnailWidth: {
      type: Number,
      default: 112,
    },
    lastPlayedFile: {
      type: Array,
      require: true,
      default: () => [],
    },
    isFullScreen: {
      type: Boolean,
    },
    filePathNeedToDelete: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      displayInfo: [],
      coverVideo: null,
      coverSrc: '',
      isDragging: false,
      moving: false,
      aboutToDelete: false,
      chosen: false,
      disX: NaN,
      disY: NaN,
    };
  },
  created() {
    let index = this.playlist.playedIndex;
    if (index > this.playlist.items.length - 1 || index < 0) {
      index = 0;
      info.update('recent-played', {
        ...this.playlist,
        playedIndex: index,
      }, this.playlist.id);
    }
    info.getValueByKey('media-item', this.playlist.items[index]).then((data) => {
      if (!data) return;
      this.coverVideo = data;
      generateCoverPathByMediaHash(data.quickHash).then((path) => {
        this.coverSrc = filePathToUrl(path);
        this.$refs.item.style.setProperty(
          'background-image',
          this.itemShortcut(data.smallShortCut, data.lastPlayedTime, data.duration),
        );
      });
    });
  },
  destroyed() {
    document.removeEventListener('mousemove', this.onRecentItemMousemove);
    document.removeEventListener('mouseup', this.onRecentItemMouseup);
  },
  methods: {
    itemShortcut(shortCut, lastPlayedTime, duration) {
      return duration - lastPlayedTime < 5 ? `url("${this.coverSrc}")` : `url("${shortCut}")`;
    },
    itemInfo() {
      return {
        baseName: path.basename(this.coverVideo.path, path.extname(this.coverVideo.path)),
        lastTime: this.coverVideo.lastPlayedTime,
        duration: this.coverVideo.duration,
        percentage: (this.coverVideo.lastPlayedTime / this.coverVideo.duration) * 100,
        path: this.coverVideo.path,
        cover: this.coverVideo.cover,
        index: this.playlist.playedIndex,
        playListLength: this.playlist.items.length,
      };
    },
    onRecentItemMouseenter() {
      if ((this.isInRange || this.isFullScreen) && !this.shifting) {
        this.chosen = true;
        this.$refs.layer2.style.setProperty('transform', 'translateY(-4px) scale(0.9, 0.9)');
        if (this.coverVideo.shortCut !== '') {
          this.isChanging = true;
          this.$emit('showShortcutImage');
        } else {
          this.$emit('showLandingLogo');
        }
        this.displayInfo = {
          ...this.itemInfo(),
          backgroundUrl: this.itemShortcut(
            this.coverVideo.shortCut,
            this.coverVideo.lastPlayedTime,
            this.coverVideo.duration,
          ),
        };
        this.$emit('displayInfo', this.displayInfo);
      }
    },
    onRecentItemMouseleave() {
      if (!this.moving) {
        this.chosen = false;
        this.$refs.layer2.style.setProperty('transform', 'scale(0.9, 0.9)');
      }
    },
    onRecentItemMousedown(e) {
      this.disX = e.pageX;
      this.disY = e.pageY;
      this.isDragging = false;

      if (this.isInRange) {
        document.addEventListener('mousemove', this.onRecentItemMousemove);
        document.addEventListener('mouseup', this.onRecentItemMouseup);
      }
    },
    onRecentItemMousemove(e) {
      this.isDragging = true;
      this.moving = true;
      const movementX = e.pageX - this.disX;
      const movementY = e.pageY - this.disY;

      this.$refs.playlistItem.style.setProperty('z-index', '10');
      this.$refs.playlistItem.style.setProperty('transform', `translate(${movementX}px, ${movementY}px)`);
      if (Math.abs(movementX) >= this.thumbnailWidth - 5
        || Math.abs(movementY) >= this.thumbnailHeight - 10) {
        requestAnimationFrame(() => {
          this.$refs.layer1.style.setProperty('transform', 'translateY(-8px) scale(0.8, 0.8)');
          this.$refs.layer2.style.setProperty('transform', 'translateY(-10px) scale(0.9, 0.9)');
          this.aboutToDelete = true;
        });
      } else if (Math.abs(movementX) >= this.thumbnailWidth - 30
        || Math.abs(movementY) >= this.thumbnailHeight - 30) {
        const percentageX = (Math.abs(movementX) - (this.thumbnailWidth - 30)) / 25;
        const percentageY = (Math.abs(movementY) - (this.thumbnailHeight - 30)) / 24;
        const percentage = percentageX > percentageY ? percentageX : percentageY;
        requestAnimationFrame(() => {
          this.$refs.layer1.style.setProperty('transform', `translateY(-${8 * percentage}px) scale(0.8, 0.8)`);
          this.$refs.layer2.style.setProperty('transform', `translateY(-${4 + (6 * percentage)}px) scale(0.9, 0.9)`);
          this.aboutToDelete = false;
        });
      } else {
        requestAnimationFrame(() => {
          this.$refs.layer1.style.setProperty('transform', 'scale(0.8, 0.8)');
          this.$refs.layer2.style.setProperty('transform', 'translateY(-4px) scale(0.9, 0.9)');
          this.aboutToDelete = false;
        });
      }
    },
    onRecentItemMouseup() {
      document.removeEventListener('mousemove', this.onRecentItemMousemove);
      this.moving = false;
      this.$refs.layer1.style.setProperty('transform', 'scale(0.8, 0.8)');
      this.$refs.layer2.style.setProperty('transform', 'translateY(-4px) scale(0.9, 0.9)');
      this.$refs.playlistItem.style.setProperty('transform', 'translate(0,0)');
      this.$refs.playlistItem.style.setProperty('z-index', '');
      if (this.aboutToDelete) {
        this.$emit('showLandingLogo');
        this.$emit('delete-item', this.playlist);
        this.aboutToDelete = false;
      }
      if (this.firstIndex !== 0) {
        this.$emit('next-page');
      }
    },
    onRecentItemClick() {
      if (!this.isDragging && !this.shifting) {
        if (this.index === this.lastIndex && !this.isFullScreen) {
          this.$emit('next-page');
        } else if (this.index + 1 < this.firstIndex && !this.isFullScreen) {
          this.$emit('previous-page');
        } else if (!this.filePathNeedToDelete) {
          this.openPlayList(this.playlist.id);
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$border-radius: 3px;
.layer1 {
  position: absolute;
  bottom: 1px;
  transform-origin: bottom center;
  transform: scale(0.8, 0.8);
  transition: transform 80ms ease-in;

  background-color: rgba(74,74,74,0.60);
  border: 0.7px solid rgba(255,255,255,0.1);
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.30);
  border-radius: $border-radius;
}
.layer2 {
  position: absolute;
  bottom: 1px;
  transform-origin: bottom center;
  transform: scale(0.9, 0.9);
  transition: transform 80ms ease-in;

  background-color: rgba(60,60,60,0.80);
  border: 0.7px solid rgba(255,255,255,0.25);
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.40);
  border-radius: $border-radius;
}
.item {
  transition: bottom 100ms ease-in;
  position: relative;
  cursor: pointer;
  border-radius: $border-radius;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-color: rgb(60, 60, 60);

  .shadow {
    position: absolute;
    z-index: -1;
    top: 50%;
    left: 10px;
    right: 10px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    border-radius: 50px;
  }
  .content {
    position: absolute;
    top: 0;
    border-radius: $border-radius;
  }
  .border {
    position: absolute;
    box-sizing: content-box;
    border-radius: $border-radius;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: border 100ms ease-out, background-color 100ms ease-out;
    .deleteUi {
      opacity: 0;
      transition: opacity 100ms ease-out;
    }
  }
}
</style>
