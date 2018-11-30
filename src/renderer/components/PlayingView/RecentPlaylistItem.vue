<template>
<div class="recent-playlist-item"
  :class="{ chosen: isChosen }"
  :style="{
    marginRight: sizeAdaption(15),
    cursor: isPlaying && isInRange ? '' : 'pointer',
    minWidth: `${thumbnailWidth}px`,
    minHeight: `${thumbnailHeight}px`,
  }">
      <div class="child-item">
        <div class="img"
          v-if="!isPlaying && imageLoaded"
          :style="{
            backgroundImage: backgroundImage,
          }"/>
        <div class="blur"
          v-show="!isChosen && !isPlaying"/>
        <transition name="fade2">
        <div class="white-hover"
          v-show="hoverIndex === index"/>
        </transition>
        <div class="black-gradient">
          <div class="content"
            @mouseover="mouseoverVideo"
            @mouseout="mouseoutVideo"
            @mouseup="mouseupVideo"
            :style="{
              height: isChosen ? `${thumbnailHeight + 9}px` : '100%',
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
                    }">正在播放</div>
                </div>
                </transition>
                </div>
                <transition name="fade">
                <div class="progress"
                  v-if="!isPlaying"
                  v-show="isChosen && sliderPercentage > 0"
                  :style="{
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
                <div class="title"
                  :style="{
                    color: isChosen ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.40)',
                    fontSize: sizeAdaption(14),
                    lineHeight: sizeAdaption(14),
                  }">{{ baseName }}</div>
              </div>
          </div>
          <div class="border"
            :style="{
              borderColor: isChosen ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
            }"/>
        </div>
      </div>
</div>
</template>
<script>
import { mapGetters } from 'vuex';
import path from 'path';
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
  },
  data() {
    return {
      isBlur: true,
      showVideo: false,
      isChosen: false,
      coverSrc: '',
      lastPlayedTime: 0,
      mediaInfo: {},
      smallShortCut: '',
    };
  },
  methods: {
    sizeAdaption(size) {
      return this.winWidth > 1355 ? `${(this.winWidth / 1355) * size}px` : `${size}px`;
    },
    mouseupVideo() {
      this.$emit('mouseupItem', this.index);
    },
    mouseoverVideo() {
      if (!this.isPlaying && this.isInRange && !this.isShifting && this.canHoverItem) {
        this.isBlur = false;
        this.isChosen = true;
        this.mouseoverRecently = true;
        this.$emit('mouseoverItem', {
          index: this.index,
          mediaInfo: this.mediaInfo,
        });
      }
    },
    mouseoutVideo() {
      this.isBlur = true;
      this.isChosen = false;
      this.$emit('mouseoutItem');
    },
  },
  mounted() {
    this.$electron.ipcRenderer.send('snapShot', this.path);
    this.$electron.ipcRenderer.once(`snapShot-${this.path}-reply`, (event, imgPath) => {
      this.coverSrc = `file://${imgPath}.png`;
    });
    this.$electron.ipcRenderer.send('mediaInfo', this.path);
    this.$electron.ipcRenderer.once(`mediaInfo-${this.path}-reply`, (event, info) => {
      this.mediaInfo = Object.assign(this.mediaInfo, JSON.parse(info).format);
    });
    this.infoDB().get('recent-played', 'path', this.path).then((val) => {
      if (val && val.lastPlayedTime) this.lastPlayedTime = val.lastPlayedTime;
      if (val && val.smallShortCut) this.smallShortCut = val.smallShortCut;
      this.mediaInfo = Object.assign(this.mediaInfo, val);
    });
    this.$bus.$on('database-saved', () => {
      this.infoDB().get('recent-played', 'path', this.path).then((val) => {
        if (val && val.lastPlayedTime) this.lastPlayedTime = val.lastPlayedTime;
        if (val && val.smallShortCut) this.smallShortCut = val.smallShortCut;
        this.mediaInfo = Object.assign(this.mediaInfo, val);
      });
    });
  },
  computed: {
    ...mapGetters(['originSrc']),
    backgroundImage() {
      return `url(${this.imageSrc})`;
    },
    imageSrc() {
      if (this.smallShortCut) {
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
.chosen {
  transform: translateY(-9px);
}
.recent-playlist-item {
  transition: transform 100ms ease-out;
  .child-item {
    border-radius: $border-radius;
    width: 100%;
    height: 100%;
    background-color: rgba(255,255,255,0.1);
    .blur {
      position: absolute;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(1px);
      border-radius: $border-radius;
      clip-path: inset(0 round $border-radius);
    }
    .white-hover {
      position: absolute;
      border-radius: $border-radius;
      width: 100%;
      height: 100%;
      background-color: rgba(255,255,255,0.2);
    }
    .black-gradient {
      border-radius: $border-radius;
      width: 100%;
      height: 100%;
      background-image: linear-gradient(-180deg, rgba(0,0,0,0) 26%, rgba(0,0,0,0.73) 98%);
    }
    .img {
      position: absolute;
      border-radius: $border-radius;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center center;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      transform: translate(0px, 0px);
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
          font-family: PingFangSC-Semibold;
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

      font-family: Avenir-Heavy, Arial, "Microsoft YaHei";
      letter-spacing: 0.58px;

      width: 100%;
      position: absolute;
      bottom: 0;
    }
  }
  .border {
    position: absolute;
    box-sizing: border-box;

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
