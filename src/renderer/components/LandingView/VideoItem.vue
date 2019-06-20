
<template>
  <div
    ref="item"
    :style="{
      bottom: chosen ? '9px' : '0',
      width: `${thumbnailWidth}px`,
      height: `${thumbnailHeight}px`,
    }"
    class="item"
  >
    <div
      :style="{
        width: `${thumbnailWidth}px`,
        height: chosen ? `${thumbnailHeight + 10}px` : `${thumbnailHeight}px`,
      }"
      @click.stop="onRecentItemClick(item)"
      @mouseout="onRecentItemMouseout"
      @mouseover="onRecentItemMouseover"
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
        }"
        class="border"
      >
        <div
          ref="deleteUi"
          class="deleteUi"
        >
          <Icon type="delete" />
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

export default {
  name: 'VideoItem',
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
      default: NaN,
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
      item: null,
      coverSrc: '',
      isDragging: false,
      aboutToDelete: false,
      showShadow: true,
      chosen: false,
      disX: NaN,
      disY: NaN,
    };
  },
  created() {
    let index = this.playlist.playedIndex;
    if (index !== 0) {
      index = 0;
      this.infoDB.update('recent-played', {
        ...this.playlist,
        playedIndex: index,
      }, this.playlist.id);
    }
    this.infoDB.get('media-item', this.playlist.items[this.playlist.playedIndex]).then((data) => {
      if (!data) return;
      this.item = data;
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
        baseName: path.basename(this.item.path, path.extname(this.item.path)),
        lastTime: this.item.lastPlayedTime,
        duration: this.item.duration,
        percentage: (this.item.lastPlayedTime / this.item.duration) * 100,
        path: this.item.path,
        cover: this.item.cover,
      };
    },
    onRecentItemMouseover() {
      if ((this.isInRange || this.isFullScreen) && !this.shifting) {
        this.chosen = true;
        this.$refs.border.style.setProperty('background-color', 'rgba(255,255,255,0.2)');
        if (this.item.shortCut !== '') {
          this.isChanging = true;
          this.$emit('showShortcutImage');
        } else {
          this.$emit('showLandingLogo');
        }
        this.displayInfo = {
          ...this.itemInfo(),
          backgroundUrl: this.itemShortcut(
            this.item.shortCut,
            this.item.lastPlayedTime,
            this.item.duration,
          ),
        };
        this.$emit('displayInfo', this.displayInfo);
      }
    },
    onRecentItemMouseout() {
      this.chosen = false;
      this.$refs.border.style.setProperty('background-color', '');
    },
    onRecentItemMousedown(e) {
      this.disX = e.pageX;
      this.disY = e.pageY;
      this.isDragging = false;

      if (this.isInRange) {
        document.addEventListener('mousemove', this.onRecentItemMousemove);
        document.addEventListener('mouseup', this.onRecentItemMouseup);
        this.showShadow = false;
        this.$refs.item.style.setProperty('z-index', '5');
      }
    },
    onRecentItemMousemove(e) {
      this.isDragging = true;
      const movementX = e.pageX - this.disX;
      const movementY = e.pageY - this.disY;
      this.$refs.item.style.setProperty('transform', `translate(${movementX}px, ${movementY}px)`);
      if (Math.abs(movementX) >= this.thumbnailWidth
        || Math.abs(movementY) >= this.thumbnailHeight) {
        this.$refs.border.style.setProperty('background-color', 'rgba(0,0,0,0.43)');
        this.$refs.deleteUi.style.setProperty('opacity', '1');
        this.aboutToDelete = true;
      } else {
        this.$refs.border.style.setProperty('background-color', 'rgba(255,255,255,0.2');
        this.$refs.deleteUi.style.setProperty('opacity', '0');
        this.aboutToDelete = false;
      }
    },
    onRecentItemMouseup() {
      document.removeEventListener('mousemove', this.onRecentItemMousemove);
      this.showShadow = true;
      this.$refs.item.style.setProperty('transform', 'translate(0,0)');
      this.$refs.item.style.setProperty('z-index', '');
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
.item {
  transition: bottom 100ms ease-in, transform 10ms ease-in;
  position: relative;
  border-radius: $border-radius;
  cursor: pointer;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-color: rgb(60, 60, 60);
}

.mask {
  background-color: rgba(0,0,0,0.43);
  opacity: 1;
  border-radius: $border-radius;
  width: 100%;
  height: calc(100% - 9px);
}
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
</style>
