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
      @mouseup.stop="handleCloseMouseup">
      <Icon type="close"/>
    </div>
  </div>
  <div class="thumbnail-shadow"></div>
  <div class="thumbnail"
    @mousedown.stop="handleMouseDown"
    @mouseover="mouseoverVideo"
    @mouseout="mouseoutVideo">
    <video ref="videoThumbnail"
      :src="convertedSrcOfNextVideo"
      :class="{ blur: isBlur }"
      @loadedmetadata="onMetaLoaded"
      @seeked="onSeeked"
      @timeupdate="onTimeupdate"></video>
    <Icon class="notificationPlay" :type="notificationPlayIcon"/>
  </div>
</div>
</template>
<script>
import path from 'path';
import Icon from '../BaseIconContainer';
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
      notificationPlayIcon: 'notificationPlay',
      isBlur: true,
    };
  },
  methods: {
    handleCloseMouseup() {
      this.$emit('manualclose-next-video');
    },
    onTimeupdate() {
      const currentTime = this.$store.state.PlaybackState.CurrentTime;
      if (currentTime < this.finalPartStartTime) {
        this.$emit('close-next-video');
      } else if (currentTime >= this.finalPartEndTime) {
        this.$emit('close-next-video');
        this.openFile(this.nextVideo);
      } else {
        const fractionProgress = (currentTime - this.finalPartStartTime)
          / (this.finalPartEndTime - this.finalPartStartTime);
        this.progress = fractionProgress * 100;
      }
      requestAnimationFrame(this.onTimeupdate);
    },
    handleMouseDown() {
      if (this.nextVideo) {
        this.$emit('close-next-video');
        this.openFile(this.nextVideo);
      }
    },
    mouseoverVideo() {
      this.$refs.videoThumbnail.play();
      this.notificationPlayIcon = 'notificationPlayHover';
      this.isBlur = false;
    },
    mouseoutVideo() {
      this.$refs.videoThumbnail.pause();
      this.notificationPlayIcon = 'notificationPlay';
      this.isBlur = true;
    },
    onMetaLoaded() {
      this.$refs.videoThumbnail.muted = true;
      this.$refs.videoThumbnail.currentTime = 100;
      this.duration = this.timecodeFromSeconds(this.$refs.videoThumbnail.duration);
    },
    onSeeked() {
      this.$emit('ready-to-show');
      console.log('readytoshow');
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
      if (this.nextVideo) {
        const originPath = this.nextVideo;
        const convertedPath = encodeURIComponent(originPath).replace(/%3A/g, ':').replace(/(%5C)|(%2F)/g, '/');

        return process.platform === 'win32' ? convertedPath : `file://${convertedPath}`;
      }
      return '';
    },
    finalPartStartTime() {
      return this.$store.getters.finalPartStartTime;
    },
    finalPartEndTime() {
      return this.$store.state.PlaybackState.Duration;
    },
  },
  mounted() {
    requestAnimationFrame(this.onTimeupdate);
  },
};
</script>
<style lang="scss" scoped>
.notification-enter-active {
 transition: opacity 100ms;
}
.notification-leave-active {
 transition: opacity 200ms;
}
.notification-enter-to, .notification-leave {
 opacity: 1;
}
.notification-enter, .notification-leave-to {
 opacity: 0;
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
      width: 116px;
      left: 7px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 84px;
      width: 140px;
      left: 8.5px;
    }
    @media screen and (min-width: 1921px) {
      height: 118px;
      width: 195px;
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
    .blur {
      filter: blur(2px);
    }
    .notificationPlay {
      position: absolute;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        top: 19px;
        left: 45px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        top: 23px;
        left: 54px;
      }
      @media screen and (min-width: 1921px) {
        top: 33px;
        left: 76px;
      }
    }
  }
  .plane-background {
    position: absolute;
    
    background-color: rgba(0,0,0,0.20);
    backdrop-filter: blur(9.6px);
    clip-path: inset(0px round 10px);

    border-radius: 11px;
    @media screen and (min-width: 513px) and (max-width: 854px) {
      height: 70px;
      width: 340px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 84px;
      width: 408px;
    }
    @media screen and (min-width: 1921px) {
      height: 118px;
      width: 571px;
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
      height: 70px;
      width: 340px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 84px;
      width: 408px;
    }
    @media screen and (min-width: 1921px) {
      height: 118px;
      width: 571px;
    }
    .progress{
      position: absolute;
      border-radius: 11px;
      height: 100%;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        left: 123px;
        width: 217px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        left: 148px;
        width: 260px;
      }
      @media screen and (min-width: 1921px) {
        left: 207px;
        width: 364px;
      }
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
            width: 34px;
          }
          @media screen and (min-width: 855px) and (max-width: 1920px) {
            width: 42px;
          }
          @media screen and (min-width: 1921px) {
            width: 57.5px;
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
      display: flex;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        padding-left: 136px;
        padding-top: 13px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        padding-left: 164px;
        padding-top: 15px;
      }
      @media screen and (min-width: 1921px) {
        padding-left: 230px;
        padding-top: 23px;
      }
      .info {
        display: flex;
        flex-direction: column;
        width: 100%;
        .top {
          display: flex;
          .duration {
            opacity: 0.7;
            font-family: Avenir-Light;
            color: #FFFFFF;
            @media screen and (min-width: 513px) and (max-width: 854px) {
              font-size: 8px;
              letter-spacing: 0.48px;
              line-height: 10px;
            }
            @media screen and (min-width: 855px) and (max-width: 1920px) {
              font-size: 10px;
              letter-spacing: 0.6px;
              line-height: 12px;
            }
            @media screen and (min-width: 1921px) {
              font-size: 14px;
              letter-spacing: 0.8px;
              line-height: 14px;
            }
          }
          .title {
            opacity: 0.7;
            font-family: PingFangSC-Light;
            color: #FFFFFF;
            @media screen and (min-width: 513px) and (max-width: 854px) {  
              font-size: 8px;
              letter-spacing: 0.42px;
              line-height: 10px;
            }
            @media screen and (min-width: 855px) and (max-width: 1920px) {
              font-size: 10px;
              letter-spacing: 0.52px;
              line-height: 12px;
            }
            @media screen and (min-width: 1921px) {
              font-size: 14px;
              letter-spacing: 0.73px;
              line-height: 14px;
            }
          }
        }
        .vid-name {
          font-family: PingFangSC-Semibold;
          color: #FFFFFF;

          opacity: 0.9;
          font-weight: 700;

          word-break: break-all;
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          text-overflow: ellipsis;
          @media screen and (min-width: 513px) and (max-width: 854px) {
            padding-top: 4px;
            width: 150px;
            font-size: 10px;
            letter-spacing: 0.3px;
            line-height: 16px;
          }
          @media screen and (min-width: 855px) and (max-width: 1920px) {
            padding-top: 5px;
            width: 178px;
            font-size: 12px;
            letter-spacing: 0.36px;
            line-height: 19.2px;
          }
          @media screen and (min-width: 1921px) {
            padding-top: 8px;
            width: 249px;
            font-size: 17px;
            letter-spacing: 0.5px;
            line-height: 28px;
          }
        }
      }
    }
    .close {
      position: absolute;
      @media screen and (min-width: 513px) and (max-width: 854px) {
        top: 24px;
        right: 16px;
      }
      @media screen and (min-width: 855px) and (max-width: 1920px) {
        top: 29px;
        right: 20px;
      }
      @media screen and (min-width: 1921px) {
        top: 41px;
        right: 28px;
      }    
    }
  }
}
</style>