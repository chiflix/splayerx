<template>
<div class="recent-playlist-item" ref="recentPlaylistItem"
  :style="{
    marginRight: sizeAdaption(15),
    cursor: isPlaying && isInRange ? '' : 'pointer',
    minWidth: `${thumbnailWidth}px`,
    minHeight: `${thumbnailHeight}px`,
  }">
      <div class="child-item" style="will-change: transform;">
        <div class="img blur" ref="blur"
          v-if="!isPlaying && imageLoaded"
          :style="{
            backgroundImage: backgroundImage,
          }"/>
        <transition name="fade2">
        <div class="white-hover"
          ref="whiteHover"
          :style="{
            opacity: hoverIndex === index ? '1' : '0',
            minWidth: `${thumbnailWidth}px`,
            minHeight: `${thumbnailHeight}px`,
          }"/>
        </transition>
        <div class="black-gradient"
          @mouseenter="mouseoverVideo"
          @mouseleave="mouseoutVideo"
          @mouseup="mouseupVideo">
          <div class="content" ref="content"
            :style="{
              height: '100%',
            }">
              <div class="info"
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
                    fontSize: sizeAdaption(14),
                    lineHeight: sizeAdaption(14),
                  }">{{ baseName }}</div>
              </div>
          </div>
          <div class="border" ref="border"
            :style="{
              borderColor: 'rgba(255,255,255,0.15)',
            }"/>
        </div>
      </div>
</div>
</template>
<script>
import fs from 'fs';
import path from 'path';
import { filePathToUrl } from '@/helpers/path';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    index: {
      type: Number,
    },
    hoverIndex: {
      type: Number,
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
  },
  data() {
    return {
      showVideo: false,
      coverSrc: '',
      lastPlayedTime: 0,
      mediaInfo: { path: this.path },
      smallShortCut: '',
      imgPath: '',
    };
  },
  methods: {
    sizeAdaption(size) {
      return this.winWidth > 1355 ? `${(this.winWidth / 1355) * size}px` : `${size}px`;
    },
    mouseupVideo() {
      this.eventTarget.onItemMouseup(this.index);
      this.$refs.progress.style.setProperty('opacity', '0');
    },
    updateAnimationIn() {
      if (!this.isPlaying) {
        this.$refs.blur.classList.remove('blur');
      }
      this.$refs.recentPlaylistItem.style.setProperty('transform', 'translateY(-9px)');
      this.$refs.content.style.setProperty('height', `${this.thumbnailHeight + 10}px`);
      this.$refs.border.style.setProperty('border-color', 'rgba(255,255,255,0.6)');
      this.$refs.title.style.setProperty('color', 'rgba(255,255,255,0.8)');
      if (!this.isPlaying && this.sliderPercentage > 0) {
        this.$refs.progress.style.setProperty('opacity', '1');
      }
    },
    updateAnimationOut() {
      if (!this.isPlaying) {
        this.$refs.blur.classList.add('blur');
      }
      this.$refs.recentPlaylistItem.style.setProperty('transform', 'translateY(0)');
      this.$refs.content.style.setProperty('height', '100%');
      this.$refs.border.style.setProperty('border-color', 'rgba(255,255,255,0.15)');
      this.$refs.title.style.setProperty('color', 'rgba(255,255,255,0.40)');
      this.$refs.progress.style.setProperty('opacity', '0');
    },
    mouseoverVideo() {
      if (!this.isPlaying && this.isInRange && !this.isShifting && this.canHoverItem) {
        this.eventTarget.onItemMouseover(this.index, this.mediaInfo);
        requestAnimationFrame(this.updateAnimationIn);
      }
    },
    mouseoutVideo() {
      this.eventTarget.onItemMouseout();
      requestAnimationFrame(this.updateAnimationOut);
    },
  },
  mounted() {
    this.mediaQuickHash(this.path).then((quickHash) => {
      this.$electron.ipcRenderer.send('snapShot', this.path, quickHash);
      this.$electron.ipcRenderer.once(`snapShot-${this.path}-reply`, (event, imgPath) => {
        this.coverSrc = filePathToUrl(`${imgPath}.png`);
        this.imgPath = imgPath;
        if (this.isPlaying || this.lastPlayedTime) {
          fs.readFile(`${imgPath}.png`, 'base64', (err, data) => {
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
    });
    this.$electron.ipcRenderer.send('mediaInfo', this.path);
    this.$electron.ipcRenderer.once(`mediaInfo-${this.path}-reply`, (event, info) => {
      this.mediaInfo = Object.assign(this.mediaInfo, JSON.parse(info).format);
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
    isPlaying(val) {
      if (val) {
        fs.readFile(`${this.imgPath}.png`, 'base64', (err, data) => {
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
  },
  computed: {
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
    thumbnailHeight() {
      return this.thumbnailWidth / (112 / 63);
    },
    sliderPercentage() {
      if (this.lastPlayedTime) {
        if (this.mediaInfo.duration) {
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
    baseName() {
      return path.basename(this.path, path.extname(this.path));
    },
  },
};
</script>
<style lang="scss" scoped>
$border-radius: 3px;
.recent-playlist-item {
  transition: transform 100ms ease-out;
  .child-item {
    border-radius: $border-radius;
    width: 100%;
    height: 100%;
    background-color: rgba(255,255,255,0.1);
    .black-gradient {
      position: absolute;
      border-radius: $border-radius;
      width: 100%;
      height: calc(100% + 0.08vw);
      background-image: linear-gradient(-180deg, rgba(0,0,0,0) 26%, rgba(0,0,0,0.73) 98%);
    }
    .white-hover {
      pointer-events:none;
      position: absolute;
      border-radius: $border-radius;
      background-color: rgba(255, 255, 255, 0.2);
      transition: opacity 80ms 80ms ease-out;
    }
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
    .content {
      position: absolute;
      z-index: 100;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;

      .info {
        position: absolute;
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

        .playlist-play {
        }
        .playing {
          opacity: 0.7;
          font-family: splayer-semibold;
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

      font-family: splayer-heavy;
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
.middleChosen {
  background-color: rgba(255, 255, 255, 0.7);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 100ms ease-out;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.fade2-enter-active, .fade2-leave-active {
  transition: opacity 300ms ease-out;
}
.fade2-enter, .fade2-leave-to {
  opacity: 0;
}
.icon-enter-active, .icon-leave-active {
  transition: transform 80ms linear;
}
.icon-enter, .icon-leave-to {
  transform: translateY(12px);
}
</style>
