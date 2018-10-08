<template>
<div
  :data-component-name="$options.name"
  class="next-video"
  @animationed.native="animationEnd">
  <div class="plane-background"></div>
  <div class="plane">
    <div class="progress">
      <div
        class="progress-slider"
        style="{ width: progress + '%' }">
      </div>
    </div>
    <div class="content">
      <div class="info">
        <div class="top">
          <div class="duration">{{ duration }}</div>
          <div class="title">&nbsp· Next in Playing List</div>
        </div>
        <div class="vid-name">{{ videoName }}</div>
      </div>
    </div>
    <div class="close"
      @mousedown="handleCloseMousedown">
      <Icon type="close"/>
    </div>
  </div>
  <div class="thumbnail-shadow"></div>
  <div class="thumbnail"
    @mousedown.stop="handleMouseDown">
    <video ref="videoThumbnail"
      :src="convertedSrcOfNextVideo"
      @mouseover="mouseoverVideo"
      @mouseout="mouseoutVideo"
      @loadedmetadata="onMetaLoaded"></video>
  </div>
</div>
</template>
<script>
import path from 'path';
import Icon from '../IconContainer';
export default {
  name: 'next-video',
  components: {
    Icon,
  },
  data() {
    return {
      duration: '',
      progress: 50,
      animation: '',
    };
  },
  methods: {
    animationEnd() {
    },
    handleCloseMousedown() {
    },
    handleMouseDown() {
      if (this.nextVideo) {
        this.openFile(this.nextVideo);
      }
    },
    mouseoverVideo() {
      this.$refs.videoThumbnail.play();
    },
    mouseoutVideo() {
      this.$refs.videoThumbnail.pause();
    },
    onMetaLoaded() {
      this.$refs.videoThumbnail.volume = 0;
      this.$refs.videoThumbnail.currentTime = 100;
      this.duration = this.timecodeFromSeconds(this.$refs.videoThumbnail.duration);
    },
  },
  computed: {
    videoName() {
      return path.basename(this.nextVideo, path.extname(this.nextVideo));
    },
    nextVideo() {
      return this.$store.getters.nextVideo;
    },
    convertedSrcOfNextVideo() {
      const originPath = this.nextVideo;
      const convertedPath = encodeURIComponent(originPath).replace(/%3A/g, ':').replace(/(%5C)|(%2F)/g, '/');

      return process.platform === 'win32' ? convertedPath : `file://${convertedPath}`;
    },
  },
  mounted() {
  },
};
</script>
<style lang="scss" scoped>
.icon-appear {
  animation: fade-in 500ms linear 1 normal;
}
.icon-disappear {
  animation: fade-out 500ms linear 1 normal;
  left: 14px;
}
@keyframes fade-in {
  0% {opacity: 0; transform: translateX(0.25)};
  50% {opacity: 0.5; transform: translateX(0.5)}
  100% {opacity: 1; transform: translateX(1)};
}
@keyframes fade-out {
  0% {opacity: 1; transform: translateX(0.25)};
  50% {opacity: 0.5; transform: translateX(0.5)}
  100% {opacity: 0; transform: translateX(1)};
}
.next-video {
  .thumbnail-shadow {
    position: absolute;
    top: 0px;
    filter: blur(11.55px);
    background-color: rgba(0,0,0,0.20);
    border-radius: 21.6px;
    @media screen and (min-width: 513px) and (max-width: 854px) {
      height: 70px;
      width: 123px;
      left: 7px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 84px;
      width: 140px;
      left: 8.5px;
    }
    @media screen and (min-width: 1921px) {
      height: 118px;
      width: 207px;
      left: 12px;
    }
  }
  .thumbnail {
    position: absolute;
    top: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-item: center;

    border: 1px solid rgba(0,0,0,0.10);

    @media screen and (min-width: 513px) and (max-width: 854px) {
      border-radius: 2px;
      height: 70px;
      width: 123px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      border-radius: 2.4px;
      height: 84px;
      width: 148px;
    }
    @media screen and (min-width: 1921px) {
      border-radius: 3.36px;
      height: 118px;
      width: 207px;
    }
    video {
      height: 100%;
    }
  }
  .plane-background {
    position: absolute;
    border-radius: 11px;

    background-color: rgba(255,255,255,0.20);
    @media screen and (min-width: 513px) and (max-width: 854px) {
      width: 335px;
      height: 75px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 84px;
      width: 408px;
    }
    @media screen and (min-width: 1921px) {
      height: 167px;
      width: 753px;
    }
  }
  .plane {
    border-style: solid;
    border-width: 1px;
    border-color: rgba(255,255,255,0.1);

    background-color: rgba(0,0,0,0.20);
    border-radius: 11px;

    @media screen and (min-width: 513px) and (max-width: 854px) {
      width: 335px;
      height: 75px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 84px;
      width: 408px;
    }
    @media screen and (min-width: 1921px) {
      height: 167px;
      width: 753px;
    }
    .progress{
      position: absolute;
      border-radius: 11px;
      left: 148px;
      height: 100%;
      width: 260px;
      .progress-slider {
        height: 100%;
      }
    }
    .content {
      padding-left: 164px;
      padding-top: 15px;
      display: flex;
      .info {
        display: flex;
        flex-direction: column;
        .top {
          display: flex;
          color: white;
          font-size: 14px;
        }
        .vid-name {
          color: white;
          padding-top: 5px;
          font-size: 16px;
        }
      }
    }
    .close {
      position: absolute;
      top: 29px;
      right: 20px;
    }
  }
}
</style>