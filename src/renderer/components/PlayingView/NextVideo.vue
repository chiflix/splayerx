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
          <div class="duration">{{ timecode }}</div>
          <div class="title">&nbsp;· {{ title }}</div>
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
    @mouseup="handleMouseup"
    @mouseover="mouseoverVideo"
    @mouseout="mouseoutVideo">
    <video ref="videoThumbnail"
      :src="convertedSrcOfNextVideo"
      :class="{ blur: isBlur }"
      @loadedmetadata="onMetaLoaded"
      @seeked="onSeeked"></video>
    <Icon class="notificationPlay" :type="notificationPlayIcon"/>
  </div>
</div>
</template>
<script>
import { mapGetters } from 'vuex';
import path from 'path';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'next-video',
  components: {
    Icon,
  },
  data() {
    return {
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
    handleMouseup() {
      if (this.nextVideo) {
        this.$bus.$emit('seek', this.duration);
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
    onMetaLoaded(event) {
      event.target.muted = true;
      event.target.currentTime = 100;
    },
    onSeeked() {
      this.$emit('ready-to-show');
    },
    updatePlayingTime(time) {
      const fractionProgress = (time - this.nextVideoPreviewTime) /
        (this.duration - this.nextVideoPreviewTime);
      this.progress = fractionProgress * 100;
    },
  },
  computed: {
    ...mapGetters(['nextVideo', 'isFolderList', 'nextVideoPreviewTime', 'duration']),
    videoName() {
      return path.basename(this.nextVideo, path.extname(this.nextVideo));
    },
    title() {
      return this.isFolderList ? this.$t('nextVideo.nextInFolder') : this.$t('nextVideo.nextInPlaylist');
    },
    convertedSrcOfNextVideo() {
      if (this.nextVideo) {
        const originPath = this.nextVideo;
        const convertedPath = encodeURIComponent(originPath).replace(/%3A/g, ':').replace(/(%5C)|(%2F)/g, '/');

        return process.platform === 'win32' ? convertedPath : `file://${convertedPath}`;
      }
      return '';
    },
    timecode() {
      return this.timecodeFromSeconds(this.duration);
    },
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
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    & {
      display: none;
    }
  }
  .thumbnail-shadow {
    position: absolute;
    top: 0px;
    filter: blur(11.55px);
    background-color: rgba(0,0,0,0.20);
    border-radius: 21.6px;
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      height: 70px;
      width: 116px;
      left: 7px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      height: 84px;
      width: 140px;
      left: 8.5px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      height: 118px;
      width: 195px;
      left: 12px;
    }
  }
  .thumbnail {
    cursor: pointer;
    position: absolute;
    box-sizing: border-box;
    top: 0;
    transform: translate(0px, 0px);
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    border: 1px solid rgba(0,0,0,0.2);

    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      border-radius: 2px;
      height: 70px;
      width: 123px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      border-radius:4px;
      height: 84px;
      width: 148px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      border-radius: 3.36px;
      height: 118px;
      width: 207px;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: black;
    }
    .blur {
      filter: blur(1px);
    }
    .notificationPlay {
      position: absolute;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        top: 20.1875px;
        left: 47.8125px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        top: 24.4375px;
        left: 57.375px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        top: 35.0625px;
        left: 80.75px;
      }
    }
  }
  .plane-background {
    position: absolute;

    background-color: rgba(0,0,0,0.20);
    backdrop-filter: blur(9.6px);

    border-radius: 3.36px 7px 7px 3.36px;
    clip-path: inset(0px round 7px);
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      height: 70px;
      width: 340px;
      border-radius: 3.36px 7px 7px 3.36px;
      clip-path: inset(0px round 7px);
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      height: 84px;
      width: 408px;
      border-radius: 3.36px 9px 9px 3.36px;
      clip-path: inset(0px round 9px);
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      height: 118px;
      width: 571px;
      border-radius: 3.36px 11px 11px 3.36px;
      clip-path: inset(0px round 11px);
    }
  }
  .plane {
    border-style: solid;
    border-width: 1px;
    border-color: rgba(255,255,255,0.1);

    clip-path: inset(0px round 3.36px);
    overflow: hidden;

    border-radius: 3.36px 7px 7px 3.36px;

    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      height: 70px;
      width: 340px;
      border-radius: 3.36px 7px 7px 3.36px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      height: 84px;
      width: 408px;
      border-radius: 3.36px 9px 9px 3.36px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      height: 118px;
      width: 571px;
      border-radius: 3.36px 11px 11px 3.36px;
    }
    .progress{
      position: absolute;
      border-radius: 11px;
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        top: 1.5px;
        height: 68px;
        left: 122px;
        width: 217px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        top: 1.5px;
        height: 82px;
        left: 147px;
        width: 260px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        top: 1.5px;
        height: 116px;
        left: 206px;
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
          @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
            width: 34px;
          }
          @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
            width: 42px;
          }
          @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
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
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        padding-left: 136px;
        padding-top: 13px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        padding-left: 164px;
        padding-top: 15px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
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
            font-family: $font-light;
            color: #FFFFFF;
            @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
              font-size: 8px;
              letter-spacing: 0.48px;
              line-height: 10px;
            }
            @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
              font-size: 10px;
              letter-spacing: 0.6px;
              line-height: 12px;
            }
            @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
              font-size: 14px;
              letter-spacing: 0.8px;
              line-height: 14px;
            }
          }
          .title {
            opacity: 0.7;
            font-family: $font-light;
            color: #FFFFFF;
            @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
              font-size: 8px;
              letter-spacing: 0.42px;
              line-height: 10px;
              transform: translateY(-0.5px);
            }
            @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
              font-size: 10px;
              letter-spacing: 0.52px;
              line-height: 12px;
              transform: translateY(-1px);
            }
            @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
              font-size: 14px;
              letter-spacing: 0.73px;
              line-height: 14px;
            }
          }
        }
        .vid-name {
          font-family: $font-semibold;
          color: #FFFFFF;

          opacity: 0.9;
          font-weight: 700;

          word-break: break-all;
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          text-overflow: ellipsis;
          @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
            padding-top: 4px;
            width: 150px;
            font-size: 10px;
            letter-spacing: 0.3px;
            line-height: 16px;
          }
          @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
            padding-top: 5px;
            width: 178px;
            font-size: 12px;
            letter-spacing: 0.36px;
            line-height: 19.2px;
          }
          @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
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
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
        top: 24px;
        right: 16px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
        top: 29px;
        right: 20px;
      }
      @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
        top: 41px;
        right: 28px;
      }
    }
  }
}
</style>
