<template>
<BaseInfoCard class="recent-playlist-item"
  :height="thumbnailHeight"
  :width="thumbnailWidth"
  :borderRadius="3"
  :borderColor="isChosen ? '255,255,255,0.6' : '255,255,255,0.2'"
  :class="{ chosen: isChosen }"
  :style="{
    marginRight: sizeAdaption(15),
    cursor: isPlaying && isInRange ? '' : 'pointer',
    minWidth: `${thumbnailWidth}px`,
    minHeight: `${thumbnailHeight}px`,
  }">
      <div class="child-item">
        <img :src="imageSrc"
          v-if="!isPlaying && imageLoaded"/>
        <div class="blur"
          v-show="!isChosen && !isPlaying"/>
        <div class="white-hover"
          v-show="isChosen && !isPlaying"/>
        <div class="black-gradient"/>  
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
      </div>
</BaseInfoCard>
</template>
<script>
import { mapGetters } from 'vuex';
import path from 'path';
import BaseInfoCard from '@/components/PlayingView/BaseInfoCard.vue';
import Icon from '@/components/BaseIconContainer.vue';
export default {
  components: {
    BaseInfoCard,
    Icon,
  },
  props: {
    index: {
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
    transferedTime: {
      type: Number,
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
      DBInfo: {},
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
      }
      this.$emit('mouseoverItem', {
        index: this.index,
        mediaInfo: this.mediaInfo,
      });
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
      this.mediaInfo = Object.assign(this.mediaInfo, val);
    });
  },
  watch: {
    originSrc(val, oldVal) {
      this.infoDB().get('recent-played', 'path', this.path).then((val) => {
        if (val && val.lastPlayedTime) {
          this.lastPlayedTime = val.lastPlayedTime;
        }
        if (oldVal === this.path) {
          val.lastPlayedTime = this.transferedTime;
        }
        this.mediaInfo = Object.assign(this.mediaInfo, val);
      });
    },
  },
  computed: {
    ...mapGetters(['originSrc']),
    imageSrc() {
      if (this.mediaInfo.smallShortCut) {
        return this.mediaInfo.smallShortCut;
      }
      return this.coverSrc;
    },
    imageLoaded() {
      return this.mediaInfo.smallShortCut || this.coverSrc !== '';
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
}
.chosen {
  transform: translateY(-9px);
}
.child-item {
  position: relative;
  border-radius: $border-radius;
  width: 100%;
  height: 100%;
  background-color: rgba(255,255,255,0.1);
  img {
    position: absolute;
    border-radius: $border-radius;
    width: 100%;
    height: 100%;
    transform: translate(0px, 0px);
  }
  .content {
    position: absolute;
    z-index: 100;
    width: 100%;
    height: 100%;

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
      z-index: 100;
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
    z-index: 100;
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

    z-index: 100;
    font-family: Avenir-Heavy, Arial, "Microsoft YaHei";
    letter-spacing: 0.58px;

    width: 100%;
    position: absolute;
    bottom: 0;
  }
}
.blur {
  position: absolute;
  left: 0.35px;
  top: 0.35px;
  width: calc(100% - 0.7px);
  height: calc(100% - 0.7px);
  backdrop-filter: blur(1px);
}
.white-hover {
  position: absolute;
  border-radius: $border-radius;
  width: 100%;
  height: 100%;
  background-color: rgba(255,255,255,0.2);
}
.black-gradient {
  position: absolute;
  width: 100%;
  height: 105%;
  border-radius: $border-radius;
  background-image: linear-gradient(-180deg, rgba(0,0,0,0) 26%, rgba(0,0,0,0.73) 98%);
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
.icon-enter-active, .icon-leave-active {
  transition: transform 80ms linear;
}
.icon-enter, .icon-leave-to {
  transform: translateY(12px);
}
</style>
