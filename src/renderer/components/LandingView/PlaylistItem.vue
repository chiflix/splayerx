
<template>
<div ref="playlistItem" class="playlist-item">
  <div class="layer1" ref="layer1"
    :style="{
      width: `${thumbnailWidth}px`,
      height: `${thumbnailHeight}px`,
    }"/>
  <div class="layer2" ref="layer2"
    :style="{
      width: `${thumbnailWidth}px`,
      height: `${thumbnailHeight}px`,
    }"/>
  <div class="item" ref="item"
    :style="{
      bottom: chosen ? '10px' : '0',
      width: `${thumbnailWidth}px`,
      height: `${thumbnailHeight}px`,
      backgroundImage: itemShortcut(coverVideo.smallShortCut, coverVideo.cover, coverVideo.lastPlayedTime, coverVideo.duration),
    }">
    <div class="content"
      @click.stop="onRecentItemClick(item)"
      @mouseout="onRecentItemMouseout"
      @mouseover="onRecentItemMouseover"
      @mousedown.stop="onRecentItemMousedown"
      @mouseup="onRecentItemMouseup"
      :style="{
        width: `${thumbnailWidth}px`,
        height: chosen ? `${thumbnailHeight + 11}px` : `${thumbnailHeight}px`,
      }">
      <div class="border" ref="border"
        :style="{
          left: `-${0.7 / 2}px`,
          top: `-${0.7 / 2}px`,
          width: `${thumbnailWidth - 0.7}px`,
          height: `${thumbnailHeight - 0.7}px`,
          border: chosen ? '0.7px solid rgba(255,255,255,0.6)' : '0.7px solid rgba(255,255,255,0.15)',
        }">
        <div class="deleteUi" ref="deleteUi"><Icon type="delete"/></div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import path from 'path';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'playlist-item',
  components: { Icon },
  data() {
    return {
      displayInfo: [],
      isDragging: false,
      aboutToDelete: false,
      showShadow: true,
      chosen: false,
    };
  },
  props: {
    firstIndex: {
      type: Number,
    },
    lastIndex: {
      type: Number,
    },
    shifting: {
      type: Boolean,
    },
    isInRange: {
      type: Boolean,
    },
    index: {
      type: Number,
    },
    item: {
      type: Object,
    },
    thumbnailHeight: {
      type: Number,
    },
    thumbnailWidth: {
      type: Number,
    },
    lastPlayedFile: {
      type: Object.Array,
      require: true,
      default: () => [],
    },
    isFullScreen: {
      type: Boolean,
    },
    filePathNeedToDelete: {
      type: String,
    },
  },
  destroyed() {
    document.onmousemove = null;
    document.onmouseup = null;
  },
  computed: {
    coverVideo() {
      return this.item.infos.find(video => video.path === this.item.currentVideo);
    },
  },
  methods: {
    itemShortcut(shortCut, cover, lastPlayedTime, duration) {
      return duration - lastPlayedTime < 5 ? `url("${cover}")` : `url("${shortCut}")`;
    },
    itemInfo() {
      return {
        baseName: path.basename(this.coverVideo.path, path.extname(this.coverVideo.path)),
        lastTime: this.coverVideo.lastPlayedTime,
        duration: this.coverVideo.duration,
        percentage: (this.coverVideo.lastPlayedTime / this.coverVideo.duration) * 100,
        path: this.coverVideo.path,
        cover: this.coverVideo.cover,
      };
    },
    onRecentItemMouseover() {
      if ((this.isInRange || this.isFullScreen) && !this.shifting) {
        this.chosen = true;
        this.$refs.border.style.setProperty('background-color', 'rgba(255,255,255,0.2)');
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
            this.coverVideo.cover,
            this.coverVideo.lastPlayedTime,
            this.coverVideo.duration,
          ),
        };
        this.$emit('displayInfo', this.displayInfo);
      }
    },
    onRecentItemMouseout() {
      this.chosen = false;
      this.$refs.border.style.setProperty('background-color', '');
      this.$refs.layer2.style.setProperty('transform', 'scale(0.9, 0.9)');
    },
    onRecentItemMousedown(e) {
      const disX = e.pageX;
      const disY = e.pageY;
      this.isDragging = false;

      if (this.isInRange) {
        document.onmousemove = (e) => {
          this.isDragging = true;
          const movementX = e.pageX - disX;
          const movementY = e.pageY - disY;

          this.$refs.playlistItem.style.setProperty('z-index', '5');
          this.$refs.playlistItem.style.setProperty('transform', `translate(${movementX}px, ${movementY}px)`);
          if (Math.abs(movementX) >= this.thumbnailWidth
            || Math.abs(movementY) >= this.thumbnailHeight) {
            this.$refs.layer1.style.setProperty('transform', 'translateY(-8px) scale(0.8, 0.8)');
            this.$refs.layer2.style.setProperty('transform', 'translateY(-10px) scale(0.9, 0.9)');
            this.$refs.border.style.setProperty('background-color', 'rgba(0,0,0,0.43)');
            this.$refs.deleteUi.style.setProperty('opacity', '1');
            this.aboutToDelete = true;
          } else {
            this.$refs.layer1.style.setProperty('transform', 'scale(0.8, 0.8)');
            this.$refs.layer2.style.setProperty('transform', 'translateY(-4px) scale(0.9, 0.9)');
            this.$refs.border.style.setProperty('background-color', 'rgba(255,255,255,0.2');
            this.$refs.deleteUi.style.setProperty('opacity', '0');
            this.aboutToDelete = false;
          }
        };
        document.onmouseup = this.onRecentItemMouseup;
        this.showShadow = false;
      }
    },
    onRecentItemMouseup() {
      document.onmousemove = null;
      this.showShadow = true;
      this.$refs.layer1.style.setProperty('transform', 'scale(0.8, 0.8)');
      this.$refs.layer2.style.setProperty('transform', 'translateY(-4px) scale(0.9, 0.9)');
      this.$refs.playlistItem.style.setProperty('transform', 'translate(0,0)');
      this.$refs.playlistItem.style.setProperty('z-index', '');
      if (this.aboutToDelete) {
        this.$emit('showLandingLogo');
        this.$emit('delete-item', this.item);
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
          this.openPlaylist(this.item.quickHash);
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
  border-radius: 1px;
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
  border-radius: 1px;
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
