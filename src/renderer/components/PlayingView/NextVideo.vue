<template>
  <div class="nextVideo">
    <div
      :class="{ 'backdrop': useBlur }"
      class="nextVideo__plane"
    >
      <div
        :style="{ width: `${(progress/100)*217}px` }"
        class="nextVideo__progress"
      >
        <div class="progressGradient" />
        <div class="progressBorderLight" />
      </div>
      <div class="nextVideo__infoWrap">
        <div class="nextVideo__info--upper">
          <span>{{ timecode }}&nbsp;· </span>
          <span>{{ title }}</span>
        </div>
        <div class="nextVideo__info--mainly">
          {{ videoName }}
        </div>
      </div>
      <div
        @mouseup.stop="handleCloseMouseup"
        class="nextVideo__closeButton"
      >
        <Icon type="close" />
      </div>
    </div>
    <div
      @mouseup="handleMouseup"
      @mouseover="mouseoverVideo"
      @mouseout="mouseoutVideo"
      class="nextVideo__thumbnail"
    >
      <video
        ref="videoThumbnail"
        :src="convertedSrcOfNextVideo"
        :class="{ blur: isBlur }"
        @loadedmetadata="onMetaLoaded"
        @seeked="onSeeked"
      />
      <div class="nextVideo__playButton">
        <Icon :type="notificationPlayIcon" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters } from 'vuex';
import path from 'path';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'NextVideo',
  components: {
    Icon,
  },
  props: {
    useBlur: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      progress: 0,
      animation: '',
      notificationPlayIcon: 'notificationPlay',
      isBlur: true,
    };
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
      if (!this.$refs.videoThumbnail) return;
      this.$refs.videoThumbnail.play();
      this.notificationPlayIcon = 'notificationPlayHover';
      this.isBlur = false;
    },
    mouseoutVideo() {
      if (!this.$refs.videoThumbnail) return;
      this.$refs.videoThumbnail.pause();
      this.notificationPlayIcon = 'notificationPlay';
      this.isBlur = true;
    },
    onMetaLoaded(event: Event) {
      (event.target as HTMLVideoElement).muted = true;
      (event.target as HTMLVideoElement).currentTime = 100;
    },
    onSeeked() {
      this.$emit('ready-to-show');
    },
    updatePlayingTime(time: number) {
      const fractionProgress = (time - this.nextVideoPreviewTime)
        / (this.duration - this.nextVideoPreviewTime);
      this.progress = fractionProgress * 100;
    },
  },
};
</script>
<style scoped lang="scss">
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
.nextVideo {
  zoom: 1;

  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    & {
      display: none;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    zoom: 1;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    zoom: 1.2;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    zoom: 1.68;
  }

  &__plane {
    width: 340px;
    height: 70px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;

    background-image: radial-gradient(
      80% 130%,
      rgba(85,85,85,0.88) 20%,
      rgba(85,85,85,0.78) 50%,
      rgba(85,85,85,0.72) 60%,
      rgba(85,85,85,0.46) 80%,
      rgba(85,85,85,0.00) 100%
    );
    box-shadow: 0 0 1px rgba(0,0,0,0.1);
  }
  .backdrop {
    background-image: none;
    border-width: 0px;
    background-color: rgba(0,0,0,0.2);
    backdrop-filter: blur(10px);
  }

  &__progress {
    position: absolute;
    left: 123px;
    width: 217px;
    height: 70px;
    opacity: 0.5;
    background-color: rgba(255,255,255,0.25);
    overflow: hidden;

    .progressGradient {
      position: absolute;
      right: 0;
      width: 50px;
      height: 100%;
      background-image: linear-gradient(
        -90deg,
        rgba(238,238,238,0.29) 0%,
        rgba(255,255,255,0.00) 100%
      );
    }
    .progressBorderLight {
      position: absolute;
      right: 0;
      width: 1px;
      height: 100%;
      opacity: 0.7;
      background-image: linear-gradient(
        -180deg,
        rgba(255,255,255,0.00) 0%,
        rgba(255,255,255,0.59) 32%,
        rgba(255,255,255,0.17) 71%,
        rgba(255,255,255,0.00) 100%
      );
    }
  }
  &__infoWrap {
    position: absolute;
    right: 0;
    box-sizing: border-box;
    width: 217px;
    height: 70px;
    border-radius: 7px;
    padding: 14px 55px 13px 14px;
  }
  &__info {
    color: #FFFFFF;
    &--upper {
      @extend .nextVideo__info;
      padding-left: 1px;
      opacity: 0.7;
      font-family: $font-light;
      font-size: 8px;
      letter-spacing: 0.5px;
      height: 10px;
      span {
        line-height: 10px;
      }
    }
    &--mainly {
      @extend .nextVideo__info;
      margin-top: 3px;
      font-family: $font-semibold;
      opacity: 0.9;
      font-weight: 700;
      word-break: break-all;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 148px;
      height: 30px;
      line-height: 15px;
      font-size: 10px;
      letter-spacing: 0.3px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }
  &__thumbnail {
    cursor: pointer;
    position: absolute;
    top: 0;
    left: 0px;
    height: 72px;
    width: 123px;
    transform: translate(0px, 0px);
    border-radius: 3px;
    overflow: hidden;
    box-shadow: 0 0 15px rgba(0,0,0,0.3), -1px 0 0px rgba(255,255,255,0.1);

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: black;
    }
    .blur {
      filter: blur(1px);
    }
  }
  &__playButton {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__closeButton {
    width: 22px;
    height: 22px;
    position: absolute;
    top: 25px;
    right: 17px;
  }
}
</style>
