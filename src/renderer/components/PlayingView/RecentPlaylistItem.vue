<template>
<BaseInfoCard class="recent-playlist-item"
  :height="thumbnailHeight"
  :width="thumbnailWidth"
  :borderRadius="3"
  :borderColor="isChosen ? '255,255,255,0.7' : '255,255,255,0.2'"
  :style="{
    cursor: isChosen && !isPlaying ? 'pointer' : '',
    bottom: isChosen ? '9px' : '0px',
    minWidth: `${thumbnailWidth}px`,
    minHeight: `${thumbnailHeight}px`,
  }">
      <div class="item">
      <img :src="imageSrc"
        v-if="!isPlaying"/>
        <div class="blur"
          v-show="!isChosen && !isPlaying"></div>
        <div class="content"
          @mouseover="mouseoverVideo"
          @mouseout="mouseoutVideo"
          @mouseup="mouseupVideo">
            <div class="info"
              :style="{
                  height: `${thumbnailHeight - bottom}px`,
                  width: `${thumbnailWidth - 2 * side}px`,
                  left: `${side}px`,
                  bottom: `${bottom}px`,
                }">
              <div class="icon-container"
                v-if="isPlaying"
                :style="{
                  bottom: winWidth > 1355 ? '1.03vw' : '14px',
                }">
                <Icon type="playlistplay" class="playlist-play"
                :style="{
                  width: winWidth > 1355 ? '0.73vw' : '10px',
                  width: winWidth > 1355 ? '0.73vw' : '10px',
                }"/>
                <div class="playing"
                :style="{
                  fontSize: winWidth > 1355 ? '0.88vw' : '12px',
                  lineHeight: winWidth > 1355 ? '0.88vw' : '12px', 
                }">正在播放</div>
              </div>
              <transition name="fade">
              <div class="progress"
                v-if="!isPlaying"
                v-show="isChosen && sliderPercentage > 0"
                :style="{
                  bottom: winWidth > 1355 ? '1.03vw' : '14px',
                }">
                <div class="slider"
                :style="{
                  width: `${sliderPercentage}%`,
                }"></div>
              </div>
              </transition>
              <div class="title"
                :style="{
                  fontSize: winWidth > 1355 ? '1.03vw' : '14px',
                  lineHeight: winWidth > 1355 ? '1.03vw' : '14px',
                }">{{ baseName }}</div>
            </div>
        </div>
      </div>
</BaseInfoCard>
</template>
<script>
import fs from 'fs';
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
    // showVideo: {
    //   type: Boolean,
    //   default: false,
    // },
    DBInfo: {
      type: Object,
    },
    DBloaded: {
      type: Boolean,
      default: false,
    },
    snapShoted: {
      type: Boolean,
    },
  },
  data() {
    return {
      isBlur: true,
      showVideo: false,
      isChosen: false,
      duration: NaN,
      imageSrc: '',
    };
  },
  methods: {
    mouseupVideo() {
      this.$emit('mouseupItem', this.index);
    },
    mouseoverVideo() {
      if (!this.isPlaying && this.isInRange && !this.isShifting) {
        this.isBlur = false;
        this.isChosen = true;
        this.mouseoverRecently = true;
      }
      this.$emit('mouseoverItem', {
        index: this.index,
        filename: this.baseName,
      });
    },
    mouseoutVideo() {
      this.isBlur = true;
      this.isChosen = false;
    },
  },
  mounted() {
  },
  watch: {
    snapShoted(val) {
      if (val) {
        fs.readFile(`${this.path}.png`, 'base64', (err, data) => {
          if (!err && this.imageSrc === '') {
            this.imageSrc = `data:image/png;base64, ${data}`;
          }
        });
      }
    },
    DBloaded(val) {
      if (val) {
        if (this.DBInfo) {
          if (this.DBInfo.smallShortCut) {
            this.imageSrc = this.DBInfo.smallShortCut;
          }
        }
      }
    },
  },
  computed: {
    thumbnailHeight() {
      return this.thumbnailWidth / (112 / 63);
    },
    lastPlayedTime() {
      if (this.DBInfo) {
        if (this.DBInfo.lastPlayedTime && this.DBInfo.duration) {
          return this.DBInfo.lastPlayedTime / this.DBInfo.duration;
        }
      }
      return 0;
    },
    sliderPercentage() {
      if (this.DBInfo) {
        if (this.DBInfo.duration && this.DBInfo.lastPlayedTime) {
          return (this.DBInfo.lastPlayedTime / this.DBInfo.duration) * 100;
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
    srcOfVideo() {
      const originPath = this.path;
      const convertedPath = encodeURIComponent(originPath).replace(/%3A/g, ':').replace(/(%5C)|(%2F)/g, '/');

      return process.platform === 'win32' ? convertedPath : `file://${convertedPath}`;
    },
    baseName() {
      return path.basename(this.path, path.extname(this.path));
    },
  },
};
</script>
<style lang="scss" scoped>
.recent-playlist-item {
  margin-right: 15px;
  transition: bottom 100ms ease-out;
}
.item {
  position: relative;
  border-radius: 3px;
  width: 100%;
  height: 100%;
  background-color: rgba(255,255,255,0.2);
  video {
    position: absolute;
    border-radius: 3px;
  }
  img {
    position: absolute;
    border-radius: 3px;
    width: 100%;
    height: 100%;
    transform: translate(-0.2px, 0px);
  }
  .content {
    position: absolute;
    z-index: 100;
    width: 100%;
    height: 100%;

    .info {
      position: absolute;
    }
    .icon-container {
      position: absolute;
      display: flex;
      flex-direction: row;
      z-index: 100;

      .playlist-play {
        height: 22px;
        margin-right: 2px;
      }
      .playing {
        padding-top: 5px;
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
    height: 2px;
    margin-bottom: 7px;
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
    font-family: Avenir-Heavy;
    color: rgba(255,255,255,0.40);
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
  clip-path: inset(0px round 2px);
  backdrop-filter: blur(1px);
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
</style>
