<template>
<div class="recent-playlist-item no-drag" ref="recentPlaylistItem"
  :style="{
    transition: tranFlag ? 'transform 100ms ease-out' : '',
    marginRight: sizeAdaption(15),
    cursor: isPlaying && isInRange ? '' : 'pointer',
    minWidth: `${thumbnailWidth}px`,
    minHeight: `${thumbnailHeight}px`,
  }">
      <div class="child-item" style="will-change: transform;">
        <div class="img blur" ref="blur"
          v-if="imageLoaded"
          :style="{
            backgroundImage: !isPlaying ? `linear-gradient(-180deg, rgba(0,0,0,0) 26%, rgba(0,0,0,0.73) 98%), ${backgroundImage}` : 'linear-gradient(-180deg, rgba(0,0,0,0) 26%, rgba(0,0,0,0.73) 98%)',
          }"/>
        <div class="white-hover" ref="whiteHover"
          :style="{
            opacity: hovered ? '1' : '0',
            minWidth: `${thumbnailWidth}px`,
            minHeight: `${thumbnailHeight}px`,
          }"/>
        <div class="content" ref="content"
          @mouseenter="mouseoverVideo"
          @mouseleave="mouseoutVideo"
          @mousedown.left="mousedownVideo"
          @mouseup.left="mouseupVideo"
          :style="{
            height: '100%',
          }">
          <div class="info" ref="info"
            :style="{
                height: `${thumbnailHeight - bottom}px`,
                width: `${thumbnailWidth - 2 * side}px`,
                left: `${side}px`,
              }">
            <div class="overflow-container"
              :style="{
                height: sizeAdaption(22),
                bottom: sizeAdaption(14),
              }">
            <transition name="icon">
            <div class="icon-container"
              v-if="isPlaying">
              <Icon type="playlistplay" class="playlist-play"
                :style="{
                  width: sizeAdaption(10),
                  height: sizeAdaption(22),
                  marginRight: sizeAdaption(4),
                }"/>
              <div class="playing"
                :style="{
                  paddingTop: sizeAdaption(5),
                  fontSize: sizeAdaption(12),
                  lineHeight: sizeAdaption(12),
                }">{{ $t('recentPlaylist.playing') }}</div>
            </div>
            </transition>
            </div>
            <transition name="fade">
            <div class="progress" ref="progress"
              :style="{
                opacity: '0',
                height: sizeAdaption(2),
                bottom: sizeAdaption(14),
                marginBottom: sizeAdaption(7),
              }">
              <div class="slider"
              :style="{
                width: `${sliderPercentage}%`,
              }"></div>
            </div>
            </transition>
            <div class="title" ref="title"
              :style="{
                color: 'rgba(255,255,255,0.40)',
                fontSize: sizeAdaption(12),
                lineHeight: sizeAdaption(16),
              }">{{ baseName }}</div>
          </div>
          <div class="deleteUi" ref="deleteUi"
            :style="{
              height: `${thumbnailHeight}px`,
            }">
            <Icon type="delete"/>
          </div>
        </div>
        <div class="border" ref="border"
          :style="{
            borderColor: 'rgba(255,255,255,0.15)',
          }"/>
      </div>
</div>
</template>
<script>
import fs from 'fs';
import path from 'path';
import { mapGetters } from 'vuex';
import { filePathToUrl, parseNameFromPath } from '@/helpers/path';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    index: {
      type: Number,
    },
    maxIndex: {
      type: Number,
    },
    hovered: {
      type: Boolean,
    },
    itemMoving: {
      type: Boolean,
    },
    indexOfMovingItem: {
      type: Number,
    },
    movementX: {
      type: Number,
    },
    movementY: {
      type: Number,
    },
    indexOfMovingTo: {
      type: Number,
    },
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
    },
    winWidth: {
      type: Number,
    },
    // content related
    isPlaying: {
      type: Boolean,
      default: false,
    },
    path: {
      type: String,
    },
    eventTarget: {
      type: Object,
      required: true,
    },
    sizeAdaption: {
      type: Function,
    },
    pageSwitching: {
      type: Boolean,
    },
  },
  data() {
    return {
      showVideo: false,
      coverSrc: '',
      lastPlayedTime: 0,
      mediaInfo: { path: this.path },
      smallShortCut: '',
      imgPath: '',
      videoHeight: 0,
      videoWidth: 0,
      displayIndex: NaN,
      tranFlag: true,
      outOfWindow: false,
      deleteTimeId: NaN,
      selfMoving: false,
    };
  },
  methods: {
    mousedownVideo(e) {
      if (this.isPlaying) return;
      this.eventTarget.onItemMousedown(this.index, e.pageX, e.pageY, e);
      document.onmousemove = (e) => {
        this.selfMoving = true;
        this.tranFlag = false;
        this.$refs.recentPlaylistItem.style.zIndex = 200;
        this.$refs.content.style.zIndex = 200;
        this.outOfWindow = e.pageX > window.innerWidth || e.pageX < 0
          || e.pageY > window.innerHeight || e.pageY < 0;
        this.eventTarget.onItemMousemove(this.index, e.pageX, e.pageY, e);
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
        this.eventTarget.onItemMouseout();
        this.eventTarget.onItemMouseup(this.index);
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
      this.eventTarget.onItemMouseup(this.index);
    },
    updateAnimationIn() {
      if (!this.isPlaying && this.imageLoaded) {
        this.$refs.blur.classList.remove('blur');
      }
      if (!this.itemMoving) this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,-9px)');
      this.$refs.content.style.setProperty('height', `${this.thumbnailHeight + 10}px`);
      this.$refs.border.style.setProperty('border-color', 'rgba(255,255,255,0.6)');
      this.$refs.title.style.setProperty('color', 'rgba(255,255,255,0.8)');
      if (!this.isPlaying && this.sliderPercentage > 0) {
        this.$refs.progress.style.setProperty('opacity', '1');
      }
    },
    updateAnimationOut() {
      if (!this.isPlaying && this.imageLoaded) {
        this.$refs.blur.classList.add('blur');
      }
      if (!this.itemMoving) this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,0)');
      this.$refs.content.style.setProperty('height', '100%');
      this.$refs.border.style.setProperty('border-color', 'rgba(255,255,255,0.15)');
      this.$refs.title.style.setProperty('color', 'rgba(255,255,255,0.40)');
      this.$refs.progress.style.setProperty('opacity', '0');
    },
    mouseoverVideo() {
      if (!this.isPlaying && this.isInRange && !this.isShifting
        && this.canHoverItem && !this.itemMoving) {
        this.eventTarget.onItemMouseover(this.index, this.mediaInfo);
        requestAnimationFrame(this.updateAnimationIn);
      }
    },
    mouseoutVideo() {
      if (!this.itemMoving) {
        this.eventTarget.onItemMouseout();
        requestAnimationFrame(this.updateAnimationOut);
      }
    },
  },
  mounted() {
    this.displayIndex = this.index;
    this.$electron.ipcRenderer.send('mediaInfo', this.path);
    this.$electron.ipcRenderer.once(`mediaInfo-${this.path}-reply`, (event, info) => {
      const videoStream = JSON.parse(info).streams.find(stream => stream.codec_type === 'video');
      this.videoHeight = videoStream.height;
      this.videoWidth = videoStream.width;
      this.mediaInfo = Object.assign(this.mediaInfo, JSON.parse(info).format);
      this.mediaQuickHash(this.path).then((quickHash) => {
        this.$electron.ipcRenderer.send('snapShot', {
          videoPath: this.path,
          quickHash,
          duration: this.mediaInfo.duration,
          videoWidth: this.videoWidth,
          videoHeight: this.videoHeight,
        });
      });
    });
    this.$electron.ipcRenderer.once(`snapShot-${this.path}-reply`, (event, imgPath) => {
      this.coverSrc = filePathToUrl(`${imgPath}`);
      this.imgPath = imgPath;
      if (this.isPlaying || this.lastPlayedTime) {
        fs.readFile(`${imgPath}`, 'base64', (err, data) => {
          if (!err) {
            const cover = `data:image/png;base64, ${data}`;
            this.infoDB.get('recent-played', 'path', this.path).then((data) => {
              if (data) {
                const mergedData = Object.assign(data, { cover });
                this.infoDB.add('recent-played', mergedData);
              }
            });
          }
        });
      }
    });
    this.infoDB.get('recent-played', 'path', this.path).then((val) => {
      if (val && val.lastPlayedTime) {
        this.lastPlayedTime = val.lastPlayedTime;
        this.smallShortCut = val.smallShortCut;
      }
      this.mediaInfo = Object.assign(this.mediaInfo, val);
    });
    this.$bus.$on('database-saved', () => {
      this.infoDB.get('recent-played', 'path', this.path).then((val) => {
        if (val && val.lastPlayedTime) {
          this.lastPlayedTime = val.lastPlayedTime;
          this.smallShortCut = val.smallShortCut;
        }
        this.mediaInfo = Object.assign(this.mediaInfo, val);
      });
    });
  },
  watch: {
    aboutToDelete(val) {
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
    isPlaying(val) {
      if (val) {
        requestAnimationFrame(this.updateAnimationOut);
        fs.readFile(`${this.imgPath}`, 'base64', (err, data) => {
          if (!err) {
            const cover = `data:image/png;base64, ${data}`;
            this.infoDB.get('recent-played', 'path', this.path).then((data) => {
              if (data) {
                const mergedData = Object.assign(data, { cover });
                this.infoDB.add('recent-played', mergedData);
              }
            });
          }
        });
      }
    },
    displayIndex(val) {
      requestAnimationFrame(() => {
        const marginRight = this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
        const distance = marginRight + this.thumbnailWidth;
        if (val !== this.index) {
          this.$refs.recentPlaylistItem.style.setProperty('transform', `translate(${(val - this.index) * distance}px,0)`);
        } else {
          this.tranFlag = false;
          this.$refs.recentPlaylistItem.style.setProperty('transform', 'translate(0,0)');
          setTimeout(() => {
            this.tranFlag = true;
          }, 0);
        }
      });
    },
    itemMoving(val) {
      if (!val) {
        this.tranFlag = true;
        this.displayIndex = this.index;
      }
    },
    indexOfMovingTo(val) {
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
    pageSwitching(val, oldVal) {
      if (!val && oldVal && this.selfMoving) {
        requestAnimationFrame(() => {
          this.$refs.recentPlaylistItem.style.setProperty('transform', `translate(${this.movementX}px, ${this.movementY}px)`);
        });
      }
    },
    movementY(val) { // eslint-disable-line complexity
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
  computed: {
    ...mapGetters(['playingList']),
    aboutToDelete() {
      return this.selfMoving && (-(this.movementY) > this.thumbnailHeight * 1.5);
    },
    baseName() {
      const parsedName = parseNameFromPath(this.path);
      if (parsedName.episode && parsedName.season) {
        return `S${parsedName.season}E${parsedName.episode}`;
      } else if (parsedName.episode && !parsedName.season) {
        return `EP${parsedName.episode}`;
      }
      return path.basename(this.path, path.extname(this.path));
    },
    backgroundImage() {
      return `url(${this.imageSrc})`;
    },
    imageSrc() {
      if (this.lastPlayedTime) {
        if (this.mediaInfo.duration - this.lastPlayedTime < 10) {
          return this.coverSrc;
        }
        return this.smallShortCut;
      }
      return this.coverSrc;
    },
    imageLoaded() {
      return this.smallShortCut || this.coverSrc !== '';
    },
    sliderPercentage() {
      if (this.lastPlayedTime) {
        if (this.mediaInfo.duration &&
            this.lastPlayedTime / this.mediaInfo.duration <= 1) {
          return (this.lastPlayedTime / this.mediaInfo.duration) * 100;
        }
      }
      return 0;
    },
    side() {
      return this.winWidth > 1355 ? this.thumbnailWidth / (112 / 14) : 14;
    },
    bottom() {
      return this.winWidth > 1355 ? this.thumbnailWidth / (112 / 14) : 14;
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
      clip-path: inset(0 round $border-radius);
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
          opacity: 0.7;
          font-family: $font-semibold;
          color: #FFFFFF;
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
    transition: border-color 20ms ease-out;

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
