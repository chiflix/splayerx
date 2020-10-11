<template>
  <div
    class="video"
  >
    <transition
      name="fade"
      mode="out-in"
    >
      <base-video-player
        ref="videoCanvas"
        :key="videoId"
        :needtimeupdate="true"
        :last-audio-track-id="lastAudioTrackId"
        :events="['loadedmetadata', 'audiotrack', 'playing']"
        :styles="{objectFit: 'contain', width: 'calc(100% - 0.1px)', height: '100%'}"
        :loop="loop"
        :crossOrigin="'anonymous'"
        :src="convertedSrc"
        :playback-rate="rate"
        :volume="volume"
        :muted="muted"
        :hwhevc="hwhevc"
        :paused="paused"
        :current-time="seekTime"
        :current-audio-track-id="currentAudioTrackId.toString()"
        :autoplay="false"
        @loadedmetadata="onMetaLoaded"
        @playing="switchingLock = false"
        @audiotrack="onAudioTrack"
      />
      <!-- calc(100% - 0.1px) fix for mac book pro 15 full screen after
      video controller fade-out video will shake -->
    </transition>
    <div
      :style="{
        backgroundColor: maskBackground
      }"
      class="mask"
    />
    <canvas
      ref="thumbnailCanvas"
      class="canvas"
    />
  </div>
</template>;
<script lang="ts">
import { mapGetters, mapActions, mapMutations } from 'vuex';
import path from 'path';
import { debounce } from 'lodash';
import { windowRectService } from '@/services/window/WindowRectService';
import { playInfoStorageService } from '@/services/storage/PlayInfoStorageService';
import { settingStorageService } from '@/services/storage/SettingStorageService';
import { generateShortCutImageBy, ShortCut } from '@/libs/utils';
import { Video as videoMutations } from '@/store/mutationTypes';
import { Video as videoActions, AudioTranslate as atActions } from '@/store/actionTypes';
import { videodata } from '@/store/video';
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer.vue';
import { MediaItem } from '../interfaces/IDB';
import { AudioTranslateBubbleOrigin } from '../store/modules/AudioTranslate';

export default {
  name: 'VideoCanvas',
  components: {
    'base-video-player': BaseVideoPlayer,
  },
  data() {
    return {
      videoExisted: false,
      videoElement: null,
      seekTime: [0],
      lastAudioTrackId: 0,
      lastCoverDetectingTime: 0,
      maskBackground: 'rgba(255, 255, 255, 0)', // drag and drop related var
      asyncTasksDone: false, // window should not be closed until asyncTasks Done (only use
      nowRate: 1,
      quit: false,
      needToRestore: false,
      winAngleBeforeFullScreen: 0, // winAngel before full screen
      winSizeBeforeFullScreen: [], // winSize before full screen
      switchingLock: false,
      audioCtx: null,
      gainNode: null,
      enableVideoInfoStore: false, // tag can save video data when quit
    };
  },
  computed: {
    ...mapGetters([
      'videoId', 'nextVideoId', 'originSrc', 'convertedSrc', 'volume', 'muted', 'rate', 'paused', 'duration', 'ratio', 'currentAudioTrackId', 'enabledSecondarySub', 'subToTop',
      'winSize', 'winPos', 'winAngle', 'isFullScreen', 'winWidth', 'winHeight', 'chosenStyle', 'chosenSize', 'nextVideo', 'loop', 'playinglistRate', 'isFolderList', 'playingList', 'playingIndex', 'playListId', 'items',
      'previousVideo', 'previousVideoId', 'incognitoMode', 'isTranslating', 'nsfwProcessDone', 'hwhevc',
    ]),
    ...mapGetters({
      videoWidth: 'intrinsicWidth',
      videoHeight: 'intrinsicHeight',
      videoRatio: 'ratio',
    }),
  },
  watch: {
    winAngle(val: number) {
      this.changeWindowRotate(val);
    },
    async playListId(val: number, oldVal: number) {
      if (this.incognitoMode && oldVal) {
        const playlistItem = await playInfoStorageService.getPlaylistRecord(oldVal);
        const mediaItem = await playInfoStorageService
          .getMediaItem(playlistItem.items[playlistItem.playedIndex]);

        if (mediaItem.lastPlayedTime) return;

        await playInfoStorageService.deleteRecentPlayedBy(oldVal);
        return;
      }
      if (oldVal && !this.isFolderList) {
        await this.updatePlaylist(oldVal);
      }
    },
    async videoId(val: number, oldVal: number) {
      if (this.incognitoMode || !oldVal) return;
      const screenshot: ShortCut = await this.generateScreenshot();
      await this.saveScreenshot(oldVal, screenshot);
    },
    originSrc(val: string, oldVal: string) {
      this.enableVideoInfoStore = false;
      if (process.mas && oldVal) {
        this.$bus.$emit(`stop-accessing-${oldVal}`, oldVal);
      }
      // this.$bus.$emit('show-speedlabel');
      this.videoConfigInitialize({
        audioTrackList: [],
      });
      this.play();
      this.updatePlayinglistRate({
        oldDir: path.dirname(oldVal), newDir: path.dirname(val), playingList: this.playingList,
      });
      this.playinglistRate.forEach((item: {
        dirPath: string,
        rate: number,
        playingList: string[],
      }) => {
        if (item.dirPath === path.dirname(val)) {
          this.$store.dispatch(videoActions.CHANGE_RATE, item.rate);
          this.nowRate = item.rate;
        }
      });
    },
    volume(val: number) {
      if (val > 1) this.amplifyAudio(val);
      else this.amplifyAudio(1);
    },
  },
  created() {
    this.updatePlayinglistRate({ oldDir: '', newDir: path.dirname(this.originSrc), playingList: this.playingList });
  },
  mounted() {
    this.audioCtx = new AudioContext();
    this.$bus.$on('back-to-landingview', () => {
      if (this.isTranslating) {
        this.showTranslateBubble(AudioTranslateBubbleOrigin.WindowClose);
        this.addTranslateBubbleCallBack(() => {
          this.backToLandingView();
        });
        return false;
      }
      // 如果有back翻译任务，直接丢弃掉
      this.discardTranslate();
      this.backToLandingView();
      return false;
    });
    this.$electron.ipcRenderer.on('quit', (e: Event, needToRestore: boolean) => {
      if (needToRestore) this.needToRestore = needToRestore;
      this.quit = true;
    });
    this.videoElement = this.$refs.videoCanvas.videoElement();
    this.$bus.$on('toggle-fullscreen', () => {
      if (!this.isFullScreen) {
        this.toFullScreen();
      } else {
        this.offFullScreen();
      }
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [!this.isFullScreen]);
      this.$ga.event('app', 'toggle-fullscreen');
    });
    this.$bus.$on('to-fullscreen', () => {
      this.toFullScreen();
    });
    this.$bus.$on('off-fullscreen', () => {
      this.offFullScreen();
    });
    this.$bus.$on('toggle-muted', () => {
      this.toggleMute();
    });
    this.$bus.$on('toggle-playback', debounce(() => {
      this[this.paused ? 'play' : 'pause']();
      // this.$ga.event('app', 'toggle-playback');
    }, 50, { leading: true }));
    this.$bus.$on('next-video', () => {
      if (this.switchingLock) return;
      if (this.nextVideo === undefined && this.duration > 60) { // 非列表循环或单曲循环时，当前播放列表已经播完
        this.$router.push({ name: 'landing-view' });
        return;
      }
      if (this.duration <= 60 && this.isFolderList) {
        this.$store.dispatch('singleCycle');
        return;
      }
      this.switchingLock = true;
      videodata.paused = false;
      if (this.nextVideo !== '') {
        if (this.isFolderList) this.openVideoFile(this.nextVideo);
        else this.playFile(this.nextVideo, this.nextVideoId);
      } else if (this.nextVideo === '') { // 单曲循环时，nextVideo返回空字符串
        this.$store.commit('LOOP_UPDATE', true);
        this.$bus.$emit('seek', Math.ceil(this.duration));
      }
    });
    this.$bus.$on('previous-video', () => {
      if (this.switchingLock) return;
      if (this.previousVideo === undefined) { // 同上，当前为播放列表第一个视频
        this.$bus.$emit('seek', 0);
        return;
      }
      this.switchingLock = true;
      videodata.paused = false;
      if (this.previousVideo !== '') {
        if (this.isFolderList) this.openVideoFile(this.previousVideo);
        else this.playFile(this.previousVideo, this.previousVideoId);
      } else if (this.previousVideo === '') {
        this.$store.commit('LOOP_UPDATE', true);
        this.$bus.$emit('seek', 0);
      }
    });
    this.$bus.$on('seek', (e: number) => {
      // update vuex currentTime to use some where
      this.seekTime = [e];
      this.updateVideoCurrentTime(e);
    });
    this.$bus.$on('seek-forward', (delta: number) => this.$bus.$emit('seek', videodata.time + Math.abs(delta)));
    this.$bus.$on('seek-backward', (delta: number) => {
      const finalSeekTime = videodata.time - Math.abs(delta);
      // find a way to stop wheel event until next begin
      // if (finalSeekTime <= 0)
      this.$bus.$emit('seek', finalSeekTime);
    });
    this.$bus.$on('drag-over', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0.18)';
    });
    this.$bus.$on('drag-leave', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0)';
    });
    this.$bus.$on('drop', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0)';
      this.$ga.event('app', 'drop');
    });
    this.$bus.$on('mask-highlight', (on: boolean) => { this.maskBackground = `rgba(255, 255, 255, ${on ? 0.18 : 0})`; });
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  },
  beforeDestroy() {
    this.audioCtx.close();
    if (process.mas) this.$bus.$emit(`stop-accessing-${this.originSrc}`, this.originSrc);
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  },
  methods: {
    ...mapMutations({
      updateVideoCurrentTime: videoMutations.CURRENT_TIME_UPDATE,
    }),
    ...mapActions({
      videoConfigInitialize: videoActions.INITIALIZE,
      play: videoActions.PLAY_VIDEO,
      pause: videoActions.PAUSE_VIDEO,
      updateMetaInfo: videoActions.META_INFO,
      toggleMute: videoActions.TOGGLE_MUTED,
      addAudioTrack: videoActions.ADD_AUDIO_TRACK,
      switchAudioTrack: videoActions.SWITCH_AUDIO_TRACK,
      removeAllAudioTrack: videoActions.REMOVE_ALL_AUDIO_TRACK,
      updatePlayinglistRate: videoActions.UPDATE_PLAYINGLIST_RATE,
      showTranslateBubble: atActions.AUDIO_TRANSLATE_SHOW_BUBBLE,
      addTranslateBubbleCallBack: atActions.AUDIO_TRANSLATE_BUBBLE_CALLBACK,
      discardTranslate: atActions.AUDIO_TRANSLATE_DISCARD,
    }),
    async onMetaLoaded(event: Event) { // eslint-disable-line complexity
      const target = event.target as HTMLVideoElement;
      this.videoElement = target;

      const mediaInfo = this.videoId
        ? await playInfoStorageService.getMediaItem(this.videoId)
        : null;
      let currentTime = 0;
      if (mediaInfo && mediaInfo.lastPlayedTime
        && target.duration - mediaInfo.lastPlayedTime > 10) {
        currentTime = mediaInfo.lastPlayedTime;
      }
      this.videoElement.currentTime = currentTime;
      this.$bus.$emit('seek', currentTime);

      this.videoConfigInitialize({
        paused: false,
        volume: this.volume * 100,
        muted: this.muted,
        rate: this.nowRate,
        duration: target.duration,
        currentTime,
      });

      if (target.duration && Number.isFinite(target.duration)) {
        this.$bus.$emit('generate-thumbnails');
      }

      this.updateMetaInfo({
        intrinsicWidth: target.videoWidth,
        intrinsicHeight: target.videoHeight,
        ratio: target.videoWidth / target.videoHeight,
      });
      this.changeWindowRotate(this.winAngle);
      this.windowRectControl();

      if (this.duration <= 60 && this.isFolderList) this.$store.dispatch('singleCycle');

      if (mediaInfo && mediaInfo.audioTrackId) this.lastAudioTrackId = mediaInfo.audioTrackId;
      this.gainNode = this.audioCtx.createGain();
      this.audioCtx.createMediaElementSource(target).connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      if (this.volume > 1) this.amplifyAudio(this.volume);

      this.videoElement.play();
      setTimeout(() => {
        this.enableVideoInfoStore = true;
      }, 20);
    },
    amplifyAudio(gain: number) {
      if (this.gainNode && this.gainNode.gain) this.gainNode.gain.value = gain;
    },
    onAudioTrack(event: TrackEvent) {
      const { type, track } = event;
      this[`${type}AudioTrack`](track);
    },
    windowRectControl() {
      let videoSize;
      const [winWidth, winHeight] = this.winSize;
      const oldRatio = winWidth / winHeight;
      const isLandscape = (ratio: number) => ratio > 1;
      if (
        this.videoExisted
        && (isLandscape(this.ratio) === isLandscape(oldRatio)) // 同为landscpae或portrait
      ) {
        if (this.ratio > 1) {
          videoSize = [winHeight * this.ratio, winHeight];
        } else {
          videoSize = [winWidth, winWidth / this.ratio];
        }
      } else {
        videoSize = [this.videoWidth, this.videoHeight];
        const availWidth = window.screen.availWidth;
        const availHeight = window.screen.availHeight;
        if (this.ratio > 1 && videoSize[0] > availWidth * 0.7) {
          videoSize[0] = availWidth * 0.7;
          videoSize[1] = videoSize[0] / this.ratio;
        } else if (this.ratio <= 1 && videoSize[1] > availHeight * 0.7) {
          videoSize[1] = availHeight * 0.7;
          videoSize[0] = videoSize[1] * this.ratio;
        }
        this.videoExisted = true;
      }
      if (this.winAngle !== 0 && this.winAngle !== 180) videoSize.reverse();
      const oldRect = this.winPos.concat(this.winSize);
      windowRectService.calculateWindowRect(videoSize, true, oldRect);
    },
    changeWindowRotate(val: number) {
      requestAnimationFrame(() => {
        if (!this.$refs.videoCanvas) return;
        const scale = windowRectService.calculateWindowScaleBy(this.isFullScreen, val, this.ratio);
        this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${val}deg) scale(${scale}, ${scale})`);
      });
    },
    toFullScreen() {
      this.winSizeBeforeFullScreen = this.winSize;
      this.winAngleBeforeFullScreen = this.winAngle;
      requestAnimationFrame(() => {
        if (!this.$refs.videoCanvas) return;
        const scale = windowRectService.calculateWindowScaleBy(true, this.winAngle, this.ratio);
        this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg) scale(${scale}, ${scale})`);
      });
      windowRectService.uploadWindowBy(true);
    },
    offFullScreen() {
      requestAnimationFrame(() => {
        if (!this.$refs.videoCanvas) return;
        const scale = windowRectService.calculateWindowScaleBy(false, this.winAngle, this.ratio);
        this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg) scale(${scale}, ${scale})`);
      });
      windowRectService.uploadWindowBy(false, 'playing-view', this.winAngle, this.winAngleBeforeFullScreen, this.winSizeBeforeFullScreen, this.winPos);
    },
    async updatePlaylist(playlistId: number) {
      if (!Number.isNaN(playlistId) && !this.isFolderList) {
        const playlistRecord = await playInfoStorageService.getPlaylistRecord(playlistId);
        playlistRecord.playedIndex = this.playingIndex;

        await playInfoStorageService
          .updateRecentPlayedBy(playlistId, playlistRecord);
      }
    },
    async generateScreenshot(): Promise<ShortCut> {
      const { videoElement } = this;
      const canvas = this.$refs.thumbnailCanvas;
      // todo: use metaloaded to get videoHeight and videoWidth
      const { videoHeight, videoWidth } = this;
      const shortCut = generateShortCutImageBy(videoElement, canvas, videoWidth, videoHeight);
      return shortCut;
    },
    async saveScreenshot(videoId: number, screenshot: ShortCut) {
      const data = {
        shortCut: screenshot.shortCut,
        smallShortCut: screenshot.smallShortCut,
        lastPlayedTime: videodata.time,
        duration: this.duration,
        audioTrackId: this.currentAudioTrackId,
      };

      const result = await playInfoStorageService.updateMediaItemBy(videoId, data as MediaItem);
      // @ts-ignore
      if (result) this.$bus.$emit('database-saved', result);
    },
    saveSubtitleStyle() {
      return settingStorageService.updateSubtitleStyle({
        chosenStyle: this.chosenStyle,
        chosenSize: this.chosenSize,
        enabledSecondarySub: this.enabledSecondarySub,
      });
    },
    savePlaybackStates() {
      return settingStorageService.updatePlaybackStates({ volume: this.volume, muted: this.muted });
    },
    async handleLeaveVideo(videoId: number) {
      const playListId = this.playListId;
      // incognito mode
      if (this.incognitoMode) {
        const playlistItem = await playInfoStorageService.getPlaylistRecord(playListId);
        const mediaItem = await playInfoStorageService
          .getMediaItem(playlistItem.items[playlistItem.playedIndex]);

        if (mediaItem.lastPlayedTime) return;

        await playInfoStorageService.deleteRecentPlayedBy(playListId);
        return;
      }
      let savePromise = new Promise((resolve) => {
        resolve();
      });
      if (this.enableVideoInfoStore) {
        const screenshot: ShortCut = await this.generateScreenshot();
        savePromise = this.saveScreenshot(videoId, screenshot)
          .then(() => this.updatePlaylist(playListId));
      }
      if (process.mas && this.$store.getters.source === 'drop') {
        savePromise = savePromise.then(async () => {
          await playInfoStorageService.deleteRecentPlayedBy(playListId);
        });
      }
      await (savePromise
        .then(this.saveSubtitleStyle)
        .then(this.savePlaybackStates));
    },
    beforeUnloadHandler(e: BeforeUnloadEvent) {
      // 如果当前有翻译任务进行，而不是再后台进行
      if (this.isTranslating) {
        this.showTranslateBubble(AudioTranslateBubbleOrigin.WindowClose);
        this.addTranslateBubbleCallBack(() => {
          window.close();
        });
        e.returnValue = true;
        return;
      }
      // 如果有back翻译任务，直接丢弃掉
      this.discardTranslate();
      if (!this.asyncTasksDone && !this.needToRestore) {
        e.returnValue = false;
        if (typeof this.$electron.remote.app.hide === 'function') { // macOS only
          this.$electron.remote.app.hide();
        } else {
          this.$electron.remote.getCurrentWindow().hide();
        }
        this.$electron.remote.getCurrentWebContents().audioMuted = true;
        this.handleLeaveVideo(this.videoId)
          .finally(() => {
            this.removeAllAudioTrack();
            this.$store.dispatch('SRC_SET', { src: '', mediaHash: '', id: NaN });
            this.asyncTasksDone = true;
            window.close();
          });
      } else if (this.quit) {
        this.$electron.remote.app.quit();
      }
    },
    backToLandingView() {
      this.handleLeaveVideo(this.videoId)
        .finally(() => {
          this.removeAllAudioTrack();
          this.$bus.$emit('videocanvas-saved');
        });
    },
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
