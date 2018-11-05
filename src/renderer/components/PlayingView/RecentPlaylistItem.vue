<template>
<BaseInfoCard class="recent-playlist-item"
  :height="thumbnailHeight"
  :width="thumbnailWidth"
  :borderRadius="3"
  :borderColor="isChosen ? '255,255,255,0.7' : '255,255,255,0.2'"
  :class="{ chosen: isChosen }"
  :style="{
    minWidth: `${thumbnailWidth}px`,
    minHeight: `${thumbnailHeight}px`,
  }">
      <div class="item">
        <video ref="playlistVideo"
          :width="thumbnailWidth"
          :height="thumbnailHeight"
          :src="srcOfVideo"
          v-if="showVideo && !isPlaying" 
          @loadedmetadata="onMetaLoaded"/>
        <div class="blur"
          v-show="!isChosen"></div>
        <div class="content"
          @mouseover="mouseoverVideo"
          @mouseout="mouseoutVideo"
          @mousedown="mousedownVideo">
          <transition name="fade">
          <div class="icon-container"
            v-if="isPlaying">
            <Icon type="play" class="icon"/>
            正在播放
          </div>
          <div class="progress"
            v-if="!isPlaying"
            v-show="isChosen"
            :style="{
              left: side,
              bottom: bottom,
            }">
            <div class="slider"></div>
          </div>
          </transition>
          <div class="title"
            :style="{
              left: side,
              bottom: bottom,
            }">{{ baseName }}</div>
        </div>
      </div>
</BaseInfoCard>
</template>
<script>
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
  },
  data() {
    return {
      isBlur: true,
      duration: 0,
      srcOfCover: '',
      showVideo: true,
      isChosen: false,
    };
  },
  methods: {
    mousedownVideo() {
      this.$emit('mousedownItem', this.index);
    },
    mouseoverVideo() {
      // this.$refs.playlistVideo.play();
      if (!this.isPlaying) {
        this.isBlur = false;
        this.isChosen = true;
      }
      this.$emit('mouseoverItem', this.index);
    },
    mouseoutVideo() {
      // this.$refs.playlistVideo.pause();
      // if (this.DBInfo !== undefined && this.DBInfo.lastPlayedTime > 0) {
      //   this.$refs.playlistVideo.currentTime = this.DBInfo.lastPlayedTime;
      // } else {
      //   this.$refs.playlistVideo.currentTime = 5;
      // }
      this.isBlur = true;
      this.isChosen = false;
    },
    onMetaLoaded(event) {
      if (this.DBInfo !== undefined && this.DBInfo.lastPlayedTime > 0) {
        event.target.currentTime = this.DBInfo.lastPlayedTime;
      } else {
        event.target.currentTime = 5;
      }
    },
  },
  mounted() {
  },
  watch: {
    DBloaded(loaded) {
      if (loaded) {
        this.showVideo = true;
      }
    },
  },
  computed: {
    thumbnailHeight() {
      return this.thumbnailWidth / (112 / 63);
    },
    side() {
      return this.winWidth > 1355 ? `${this.thumbnailWidth / (112 / 14)}px` : '14px';
    },
    bottom() {
      return this.winWidth > 1355 ? `${this.thumbnailWidth / (112 / 14)}px` : '14px';
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
  transition: transform 100ms ease-in;
}
.chosen {
  transform: translateY(-9px);
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

    .icon-container {
      width: 49.6px;
      .icon {
        width: 10px;
        height: 10px;
      }
    }
  }
  .progress {
    z-index: 100;
    position: absolute;
    width: 61px;
    height: 2px;
    border-radius: 2px;
    background-color: rgba(216,216,216,0.40);
    .slider {
      height: 100%;
      width: 50%;
      border-radius: 2px;
      background-color: #D8D8D8;
    }
  }
  .title {
    z-index: 100;
    font-family: Avenir-Heavy;
    font-size: 14px;
    color: rgba(255,255,255,0.40);
    letter-spacing: 0.58px;
    line-height: 14px;

    position: absolute;
    width: calc(100% - 28px);
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
  transition: opacity 300ms ease-in;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
