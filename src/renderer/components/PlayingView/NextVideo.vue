<template>
<div
  :data-component-name="$options.name"
  class="next-video">
  <div class="preview"
    @mousedown.stop="handleMouseDown">
    <video ref="videoThumbnail"
      :src="convertedSrcOfNextVideo"
      @mouseover="mouseoverVideo"
      @mouseout="mouseoutVideo"
      @loadedmetadata="onMetaLoaded"></video>
  </div>
  <div class="plane">
    <div class="content">
      <div class="info">
        <div class="top">
          <div class="duration">{{ duration }}</div>
          <div class="title">&nbsp· Next in Playing List</div>
        </div>
        <div class="vid-name">{{ videoName }}</div>
      </div>
    </div>
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
    };
  },
  methods: {
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
.next-video {
  .preview {
    position: absolute;
    border: 0 solid rgba(0,0,0,0.12);
    border-radius: 3.3px;
    border-width: 0.77px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.1) inset;

    img {
      height: 100%;
    }
    video {
      height: 100%;
    }
    @media screen and (min-width: 513px) and (max-width: 854px) {
      width: 124px;
      height: 75px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 112px;
      width: 185px;
    }
    @media screen and (min-width: 1921px) {
      height: 167px;
      width: 279px;
    }
  }
  .preview:before {
      position: absolute;
      z-index: -1;
      left: 8.46px;
      right: 315.47px;
      width: 186px;
      height: 112px;
      opacity: 0.4;
      filter: blur(10px);
      border-radius: 18px;
  }
  .preview:after {
      right: 10px;
      left: auto;
      transform: skew(8deg) rotate(3deg);
  }
  .plane {
    box-sizing: border-box;
    border-style: solid;
    border-width: 0.5px;
    border-color: rgba(255,255,255,0.1);
    background-color: rgba(0,0,0,0.20);
    box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);

    @media screen and (min-width: 513px) and (max-width: 854px) {
      width: 335px;
      height: 75px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      border-radius: 15px;
      height: 112px;
      width: 500px;
    }
    @media screen and (min-width: 1921px) {
      height: 167px;
      width: 753px;
    }
    .content {
      position: absolute;
      left: 201px;
      height: 100%;
      padding-top: 21px;
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
          padding-top: 10.5px;
          font-size: 16px;
        }
      }
    }
  }
}
</style>