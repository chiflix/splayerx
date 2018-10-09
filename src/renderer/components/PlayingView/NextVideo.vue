<template>
<div
  :data-component-name="$options.name"
  class="next-video">
  <div class="plane-background"></div>
  <div class="plane">
    <div class="progress">
      <div class="progress-color"
        :style="{ width: progress + '%' }">
        <div class="progress-gradient"></div>
        <div class="progress-border-light"></div>
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
      @loadedmetadata="onMetaLoaded"
      @timeupdate="onTimeupdate"></video>
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
      progress: 0,
      animation: '',
    };
  },
  methods: {
    handleCloseMousedown() {
    },
    onTimeupdate() {
      const fractionProgress = this.$store.state.PlaybackState.CurrentTime / this.finalPartTime;
      this.progress = fractionProgress * 100;
      requestAnimationFrame(this.onTimeupdate);
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
    finalPartTime() {
      return this.$store.state.PlaybackState.Duration * 0.01;
    },
  },
  mounted() {
    requestAnimationFrame(this.onTimeupdate);
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
    box-sizing: content-box;
    top: 0;
    transform: translate(-1px, -1px);
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
      border-radius:4px;
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
    
    background-color: rgba(0,0,0,0.20);
    backdrop-filter: blur(9.6px);
    clip-path: inset(0px round 10px);

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
  }
  .plane {
    border-style: solid;
    border-width: 1px;
    border-color: rgba(255,255,255,0.1);

    clip-path: inset(0px round 10px);

    background-color: rgba(255,255,255,0.20);
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
      .progress-color {
        position: absolute;
        transform: translateY(-1px);
        opacity: 0.5;
        background-image: linear-gradient(-90deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.27) 100%);
        height: 100%;
        .progress-gradient {
          position: absolute;
          right: 0;
          height: 100%;
          background-image: linear-gradient(-90deg, rgba(238,238,238,0.29) 0%, rgba(255,255,255,0.00) 100%);
          @media screen and (min-width: 513px) and (max-width: 854px) {
          }
          @media screen and (min-width: 855px) and (max-width: 1920px) {
            width: 42px;
          }
          @media screen and (min-width: 1921px) {
          }
        }
        .progress-border-light {
          position: absolute;
          right: 0;
          opacity: 0.69;
          background-image: linear-gradient(-180deg, rgba(255,255,255,0.00) 13%, rgba(255,255,255,0.84) 26%, rgba(255,255,255,0.17) 56%, rgba(255,255,255,0.00) 100%);
          height: 100%;
          width: 1px;
        }
      }
    }
    .content {
      padding-left: 164px;
      padding-top: 15px;
      display: flex;
      .info {
        display: flex;
        flex-direction: column;
        width: 100%;
        .top {
          display: flex;
          opacity: 0.7;
          font-family: PingFangSC-Light;
          font-size: 10px;
          color: #FFFFFF;
          letter-spacing: 0.52px;
          line-height: 12px;
        }
        .vid-name {
          color: white;
          padding-top: 5px;

          font-family: PingFangSC-Semibold;
          font-size: 12px;
          color: #FFFFFF;
          letter-spacing: 0.36px;
          line-height: 19.2px;

          word-break: break-all;
          font-weight: bold;
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          text-overflow: ellipsis;
          font-weight: 700;
          @media screen and (min-width: 513px) and (max-width: 854px) {
          }
          @media screen and (min-width: 855px) and (max-width: 1920px) {
            width: 178px;
          }
          @media screen and (min-width: 1921px) {
          }
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