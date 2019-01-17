<template>
  <div
    :data-component-name="$options.name"
    class="video">
    <transition name="fade" mode="out-in">
    <base-video-player
      ref="videoCanvas"
      :key="originSrc"
      :needtimeupdate=true
      :events="['loadedmetadata', 'audiotrack']"
      :styles="{objectFit: 'contain', width: '100%', height: '100%'}"
      @loadedmetadata="onMetaLoaded"
      @audiotrack="onAudioTrack"
      :src="convertedSrc"
      :playbackRate="rate"
      :volume="volume"
      :muted="muted"
      :paused="paused"
      :currentTime="seekTime"
      :currentAudioTrackId="currentAudioTrackId.toString()" />
    </transition>
    <div class="mask"
      :style="{
        backgroundColor: maskBackground
      }"/>
    <canvas class="canvas" ref="thumbnailCanvas"></canvas>
  </div>
</template>;

<script>
import asyncStorage from '@/helpers/asyncStorage';
import { mapGetters, mapActions } from 'vuex';
import { Video as videoActions } from '@/store/actionTypes';
import BaseVideoPlayer from './BaseVideoPlayer.vue';
import { videodata } from '../../store/video';

export default {
  name: 'video-canvas',
  components: {
    'base-video-player': BaseVideoPlayer,
  },
  data() {
    return {
      videoExisted: false,
      videoElement: null,
      coverFinded: false,
      seekTime: [0],
      lastPlayedTime: 0,
      lastCoverDetectingTime: 0,
      maskBackground: 'rgba(255, 255, 255, 0)', // drag and drop related var
      asyncTasksDone: false, // window should not be closed until asyncTasks Done (only use
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
    onMetaLoaded(event) {
      this.videoElement = event.target;
      this.videoConfigInitialize({
        volume: this.volume * 100,
        muted: this.muted,
        rate: 1,
        duration: event.target.duration,
        currentTime: 0,
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
          true,
          getWindowRect().slice(2, 4),
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
    },
    calculateWindowSize(minSize, maxSize, videoSize, videoExisted, screenSize) {
      let result = videoSize;
      const getRatio = size => size[0] / size[1];
      const setWidthByHeight = size => [size[1] * getRatio(videoSize), size[1]];
      const setHeightByWidth = size => [size[0], size[0] / getRatio(videoSize)];
      const biggerSize = (size, diffedSize) =>
        size.some((value, index) => value >= diffedSize[index]);
      const biggerWidth = (size, diffedSize) => size[0] >= diffedSize[0];
      const biggerRatio = (size1, size2) => getRatio(size1) > getRatio(size2);
      if (videoExisted && biggerWidth(result, maxSize)) {
        result = setHeightByWidth(maxSize);
      }
      const realMaxSize = videoExisted ? screenSize : maxSize;
      if (biggerSize(result, realMaxSize)) {
        result = biggerRatio(result, realMaxSize) ?
          setHeightByWidth(realMaxSize) : setWidthByHeight(realMaxSize);
      }
      if (biggerSize(minSize, result)) {
        result = biggerRatio(minSize, result) ?
          setHeightByWidth(minSize) : setWidthByHeight(minSize);
      }
      return result.map(Math.round);
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
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', rect.slice(2, 4));
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', rect.slice(0, 2));
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [rect.slice(2, 4)[0] / rect.slice(2, 4)[1]]);
    },
    async saveScreenshot(videoPath) {
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
      const imagePath = canvas.toDataURL('image/jpeg', 0.8);
      // 用于测试截图的代码，以后可能还会用到
      // const img = imagePath.replace(/^data:image\/\w+;base64,/, '');
      // fs.writeFileSync('/Users/jinnaide/Desktop/screenshot.png', img, 'base64');
      [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 122.6, 122.6];
      canvasCTX.drawImage(
        videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, (videoWidth / videoHeight) * 122.6, 122.6,
      );
      const smallImagePath = canvas.toDataURL('image/jpeg', 0.8);
      const data = {
        shortCut: imagePath,
        smallShortCut: smallImagePath,
        lastPlayedTime: videodata.time,
        duration: this.duration,
      };

      const val = await this.infoDB.get('recent-played', 'path', videoPath);
      if (val) {
        const mergedData = Object.assign(val, data);
        await this.infoDB.add('recent-played', mergedData);
        this.$bus.$emit('database-saved');
      }
    },
    saveSubtitleStyle() {
      return asyncStorage.set('subtitle-style', { chosenStyle: this.chosenStyle, chosenSize: this.chosenSize });
    },
    async getVideoCover(grabCoverTime) {
      if (!this.$refs.videoCanvas || !this.$refs.thumbnailCanvas) return;
      // Because we are execution in async, we do double check.
      if (this.coverFinded) {
        return;
      }

      // Assume to grab the cover can be the success and to keep
      // it doesn't execution multiple times. if grab failed,
      // we set it back to false.
      this.coverFinded = true;

      const videoElement = this.$refs.videoCanvas.videoElement();
      const canvas = this.$refs.thumbnailCanvas;
      const canvasCTX = canvas.getContext('2d');
      const { videoHeight, videoWidth } = videoElement;
      [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 122.6, 122.6];
      canvasCTX.drawImage(
        videoElement, 0, 0, videoWidth, videoHeight,
        0, 0, (videoWidth / videoHeight) * 122.6, 122.6,
      );

      let grabCoverDone = false;
      const { data } = canvasCTX.getImageData(0, 0, 100, 100);
      // check the cover is it right.
      for (let i = 0; i < data.length; i += 1) {
        if ((i + 1) % 4 !== 0 && data[i] > 20) {
          grabCoverDone = true;
          break;
        }
      }
      if (grabCoverDone) {
        const smallImagePath = canvas.toDataURL('image/png');
        [canvas.width, canvas.height] = [(videoWidth / videoHeight) * 1080, 1080];
        canvasCTX.drawImage(
          videoElement, 0, 0, videoWidth, videoHeight,
          0, 0, (videoWidth / videoHeight) * 1080, 1080,
        );
        const imagePath = canvas.toDataURL('image/png');
        const val = await this.infoDB.get('recent-played', 'path', this.originSrc);
        if (val) {
          const mergedData = Object.assign(val, { cover: imagePath, smallCover: smallImagePath });
          this.infoDB.add('recent-played', mergedData);
        } else {
          const data = {
            quickHash: await this.mediaQuickHash(this.originSrc),
            path: this.originSrc,
            cover: imagePath,
            smallCover: smallImagePath,
            duration: this.$store.getters.duration,
          };
          this.infoDB.add('recent-played', data);
        }
      }

      this.coverFinded = grabCoverDone;
      this.lastCoverDetectingTime = grabCoverTime;
    },
    checkPresentTime() {
      if (!this.coverFinded && videodata.time - this.lastCoverDetectingTime > 1) {
        this.getVideoCover(videodata.time);
      }
    },
  },
  computed: {
    ...mapGetters([
      'originSrc', 'convertedSrc', 'volume', 'muted', 'rate', 'paused', 'duration', 'ratio', 'currentAudioTrackId',
      'winSize', 'winPos', 'isFullScreen', 'winHeight', 'chosenStyle', 'chosenSize', 'nextVideo']),
    ...mapGetters({
      videoWidth: 'intrinsicWidth',
      videoHeight: 'intrinsicHeight',
      videoRatio: 'ratio',
    }),
  },
  watch: {
    originSrc(val, oldVal) {
      this.coverFinded = false;
      this.saveScreenshot(oldVal);
      this.$bus.$emit('showlabel');
      this.videoConfigInitialize({
        audioTrackList: [],
      });
      this.play();
    },
  },
  mounted() {
    this.videoElement = this.$refs.videoCanvas.videoElement();
    this.$bus.$on('toggle-fullscreen', () => {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [!this.isFullScreen]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [this.ratio]);
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
    this.$bus.$on('next-video', () => {
      if (this.nextVideo) {
        this.playFile(this.nextVideo);
      }
    });
    this.$bus.$on('seek', (e) => {
      this.seekTime = [e];
      // todo: use vuex get video element src
      const filePath = decodeURI(this.src);
      const indexOfLastDot = filePath.lastIndexOf('.');
      const ext = filePath.substring(indexOfLastDot + 1);
      if (ext === 'mkv') {
        this.$bus.$emit('seek-subtitle', e);
      }
    });
    this.$bus.$on('drag-over', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0.18)';
    });
    this.$bus.$on('drag-leave', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0)';
    });
    this.$bus.$on('drop', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0)';
    });
    window.onbeforeunload = (e) => {
      if (!this.asyncTasksDone) {
        this.saveScreenshot(this.originSrc).then(this.saveSubtitleStyle).then(() => {
          this.asyncTasksDone = true;
          window.close();
        }).catch(() => {
          this.asyncTasksDone = true;
          window.close();
        });
        e.returnValue = false;
      }
    };
  },
  beforeDestroy() {
    window.onbeforeunload = null;
  },
};
</script>
<style lang="scss" scoped>
.video {
  position: relative;
  height: 0;
  z-index: auto;
}
.mask {
  position: absolute;
  width: 100vw;
  height: 100vh;
  transition: background-color 120ms linear;
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
