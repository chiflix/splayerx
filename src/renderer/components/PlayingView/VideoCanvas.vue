<template>
  <div
    :data-component-name="$options.name"
    class="video">
    <transition name="fade" mode="out-in">
    <base-video-player
      ref="videoCanvas"
      :key="originSrc"
      :events="['loadedmetadata', 'audiotrack']"
      :styles="{objectFit: 'contain', width: '100%', height: '100%'}"
      @loadedmetadata="onMetaLoaded"
      @audiotrack="onAudioTrack"
      :src="convertedSrc"
      :playbackRate="rate"
      :volume="volume"
      :muted="muted"
      :paused="paused"
      :updateCurrentTime="true"
      :currentTime="seekTime"
      :currentAudioTrackId="currentAudioTrackId.toString()"
      @update:currentTime="updateCurrentTime" />
    </transition>
    <BaseSubtitle :style="{ bottom: `${-winHeight + 20}px` }"/>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
  </div>
</template>;

<script>
import asyncStorage from '@/helpers/asyncStorage';
import syncStorage from '@/helpers/syncStorage';
import WindowSizeHelper from '@/helpers/WindowSizeHelper.js';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import { Video as videoMutations } from '@/store/mutationTypes';
import { Video as videoActions } from '@/store/actionTypes';
import BaseSubtitle from './BaseSubtitle.vue';
import BaseVideoPlayer from './BaseVideoPlayer';

export default {
  name: 'video-canvas',
  components: {
    BaseSubtitle,
    'base-video-player': BaseVideoPlayer,
  },
  data() {
    return {
      videoExisted: false,
      windowSizeHelper: null,
      videoElement: null,
      coverFinded: false,
      seekTime: [0],
      lastPlayedTime: 0,
      lastCoverDetectingTime: 0,
    };
  },
  methods: {
    ...mapActions({
      videoConfigInitialize: videoActions.INITIALIZE,
      play: videoActions.PLAY_VIDEO,
      pause: videoActions.PAUSE_VIDEO,
      updateMetaInfo: videoActions.META_INFO,
      toggleMute: videoActions.TOGGLE_MUTED,
      addAudioTrack: videoActions.ADD_AUDIO_TRACK,
      removeAudioTrack: videoActions.REMOVE_AUDIO_TRACK,
      switchAudioTrack: videoActions.SWITCH_AUDIO_TRACK,
      removeAllAudioTrack: videoActions.REMOVE_ALL_AUDIO_TRACK,
    }),
    ...mapMutations({
      updateCurrentTime: videoMutations.CURRENT_TIME_UPDATE,
    }),
    onMetaLoaded(event) {
      this.videoElement = event.target;
      this.videoConfigInitialize({
        volume: 100,
        muted: false,
        rate: 1,
        duration: event.target.duration,
        currentTime: this.lastPlayedTime || 0,
      });
      this.updateMetaInfo({
        intrinsicWidth: event.target.videoWidth,
        intrinsicHeight: event.target.videoHeight,
        ratio: event.target.videoWidth / event.target.videoHeight,
      });
      if (event.target.duration - this.lastPlayedTime > 10) {
        this.$bus.$emit('seek', this.lastPlayedTime);
      } else {
        this.$bus.$emit('seek', 0);
      }
      this.lastPlayedTime = 0;
      this.$bus.$emit('video-loaded');
      this.getVideoCover();
      this.changeWindowSize();
    },
    onAudioTrack(event) {
      const { type, track } = event;
      this[`${type}AudioTrack`](track);
    },
    changeWindowSize() {
      let newSize = [];
      const getWindowRect = () => [
        window.screen.availLeft, window.screen.availTop,
        window.screen.availWidth, window.screen.availHeight,
      ];
      if (this.videoExisted) {
        newSize = this.calculateWindowSize(
          [320, 180],
          this.winSize,
          [this.videoWidth, this.videoHeight],
        );
      } else {
        newSize = this.calculateWindowSize(
          [320, 180],
          getWindowRect().slice(2, 4),
          [this.videoWidth, this.videoHeight],
        );
        this.videoExisted = true;
      }
      const newPosition = this.calculateWindowPosition(
        this.winPos.concat(this.winSize),
        getWindowRect(),
        newSize,
      );
      this.controlWindowRect(newPosition.concat(newSize));
      this.windowSizeHelper.setNewWindowSize();
    },
    calculateWindowSize(minSize, maxSize, videoSize) {
      let result = videoSize;
      const getRatio = size => size[0] / size[1];
      const setWidthByHeight = size => [size[1] * getRatio(videoSize), size[1]];
      const setHeightByWidth = size => [size[0], size[0] / getRatio(videoSize)];
      const diffSize = (overOrNot, size, diffedSize) => size.some((value, index) => // eslint-disable-line
        overOrNot ? value >= diffedSize[index] : value < diffedSize[index]);
      const biggerRatio = (size1, size2) => getRatio(size1) > getRatio(size2);
      if (diffSize(true, videoSize, maxSize)) {
        result = biggerRatio(videoSize, maxSize) ?
          setHeightByWidth(maxSize) : setWidthByHeight(maxSize);
      } else if (diffSize(false, videoSize, minSize)) {
        result = biggerRatio(minSize, videoSize) ?
          setHeightByWidth(minSize) : setWidthByHeight(minSize);
      }
      return result.map(value => Math.round(value));
    },
    calculateWindowPosition(currentRect, windowRect, newSize) {
      const tempRect = currentRect.slice(0, 2)
        .map((value, index) => Math.floor(value + (currentRect.slice(2, 4)[index] / 2)))
        .map((value, index) => Math.floor(value - (newSize[index] / 2))).concat(newSize);
      return ((windowRect, tempRect) => {
        const alterPos = (boundX, boundLength, videoX, videoLength) => {
          if (videoX < boundX) return boundX;
          if (videoX + videoLength > boundX + boundLength) {
            return (boundX + boundLength) - videoLength;
          }
          return videoX;
        };
        return [
          alterPos(windowRect[0], windowRect[2], tempRect[0], tempRect[2]),
          alterPos(windowRect[1], windowRect[3], tempRect[1], tempRect[3]),
        ];
      })(windowRect, tempRect);
    },
    controlWindowRect(rect) {
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setSize', rect.slice(2, 4));
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setPosition', rect.slice(0, 2));
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [rect.slice(2, 4)[0] / rect.slice(2, 4)[1]]);
    },
    $_saveScreenshot() {
      const { videoElement } = this;
      const canvas = this.$refs.thumbnailCanvas;
      const canvasCTX = canvas.getContext('2d');
      // todo: use metaloaded to get videoHeight and videoWidth
      const { videoHeight, videoWidth } = this;
      // cannot delete
      [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 1080, 1080];
      canvasCTX.drawImage(
        videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, (videoWidth / videoHeight) * 1080, 1080,
      );
      const imagePath = canvas.toDataURL('image/png');
      // 用于测试截图的代码，以后可能还会用到
      // const img = imagePath.replace(/^data:image\/\w+;base64,/, '');
      // fs.writeFileSync('/Users/jinnaide/Desktop/screenshot.png', img, 'base64');
      [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 122.6, 122.6];
      canvasCTX.drawImage(
        videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, (videoWidth / videoHeight) * 122.6, 122.6,
      );
      const smallImagePath = canvas.toDataURL('image/png');
      const data = {
        shortCut: imagePath,
        smallShortCut: smallImagePath,
        lastPlayedTime: this.currentTime,
        duration: this.$store.state.Video.duration,
      };
      syncStorage.setSync('recent-played', data);
    },
    saveSubtitleStyle() {
      syncStorage.setSync('subtitle-style', { curStyle: this.curStyle, curBorderStyle: this.curBorderStyle, chosenStyle: this.chosenStyle });
    },
    async getVideoCover() {
      const videoElement = this.$refs.videoCanvas.videoElement();
      const canvas = this.$refs.thumbnailCanvas;
      const canvasCTX = canvas.getContext('2d');
      const { videoHeight, videoWidth } = videoElement;
      [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 122.6, 122.6];
      canvasCTX.drawImage(
        videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, (videoWidth / videoHeight) * 122.6, 122.6,
      );
      const { data } = canvasCTX.getImageData(0, 0, 100, 100);
      for (let i = 0; i < data.length; i += 1) {
        if ((i + 1) % 4 !== 0 && data[i] > 20) {
          this.coverFinded = true;
          break;
        }
      }
      if (this.coverFinded) {
        const smallImagePath = canvas.toDataURL('image/png');
        [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 1080, 1080];
        canvasCTX.drawImage(
          videoElement, 0, 0, videoWidth, videoHeight,
          0, 0, (videoWidth / videoHeight) * 1080, 1080,
        );
        const imagePath = canvas.toDataURL('image/png');
        const val = await this.infoDB().get('recent-played', 'path', this.originSrc);
        if (val) {
          const mergedData = Object.assign(val, { cover: imagePath, smallCover: smallImagePath });
          this.infoDB().add('recent-played', mergedData);
        } else {
          const data = {
            quickHash: this.mediaQuickHash(this.originSrc),
            path: this.originSrc,
            cover: imagePath,
            smallCover: smallImagePath,
            duration: this.$store.getters.duration,
          };
          this.infoDB().add('recent-played', data);
        }
      }
      this.lastCoverDetectingTime = this.currentTime;
    },
  },
  computed: {
    ...mapGetters([
      'originSrc', 'convertedSrc', 'volume', 'muted', 'rate', 'paused', 'currentTime', 'duration', 'ratio', 'currentAudioTrackId',
      'winSize', 'winPos', 'isFullScreen',
      'winSize', 'winPos', 'isFullScreen', 'curStyle', 'curBorderStyle', 'winHeight', 'chosenStyle',
      'nextVideo']),
    ...mapGetters({
      videoWidth: 'intrinsicWidth',
      videoHeight: 'intrinsicHeight',
      videoRatio: 'ratio',
    }),
  },
  watch: {
    originSrc(val, oldVal) {
      this.coverFinded = false;
      this.$_saveScreenshot();
      asyncStorage.get('recent-played')
        .then(async (data) => {
          const val = await this.infoDB().get('recent-played', 'path', oldVal);
          if (val && data) {
            const mergedData = Object.assign(val, data);
            this.infoDB().add('recent-played', mergedData);
          }
        });
      this.$bus.$emit('showlabel');
      this.videoConfigInitialize({
        audioTrackList: [],
      });
    },
    currentTime(val) {
      if (!this.coverFinded && val - this.lastCoverDetectingTime > 1) {
        this.getVideoCover();
      }
    },
  },
  mounted() {
    this.videoElement = this.$refs.videoCanvas.videoElement();
    this.$bus.$on('toggle-fullscreen', () => {
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setFullScreen', [!this.isFullScreen]);
      this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [this.ratio]);
    });
    this.$bus.$on('toggle-muted', () => {
      this.toggleMute();
    });
    this.$bus.$on('send-lastplayedtime', (e) => {
      this.lastPlayedTime = e;
    });
    this.$bus.$on('toggle-playback', () => {
      this[this.paused ? 'play' : 'pause']();
    });
    this.$bus.$on('toggle-mute', this.toggleMute);
    this.$bus.$on('seek', (e) => {
      if (e === this.duration && this.nextVideo) {
        this.openFile(this.nextVideo);
      } else {
        this.seekTime = [e];
        // todo: use vuex get video element src
        const filePath = decodeURI(this.src);
        const indexOfLastDot = filePath.lastIndexOf('.');
        const ext = filePath.substring(indexOfLastDot + 1);
        if (ext === 'mkv') {
          this.$bus.$emit('seek-subtitle', e);
        }
      }
    });
    this.windowSizeHelper = new WindowSizeHelper(this);
    window.onbeforeunload = () => {
      this.$_saveScreenshot();
      this.saveSubtitleStyle();
    };
  },
};
</script>
<style lang="scss" scoped>
.video {
  position: relative;
  height: 0;
  z-index: auto;
}
.base-video-player {
  width: 100%;
  height: 100%;
  position: fixed;
}
.canvas {
  visibility: hidden;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 200ms ease-in;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
