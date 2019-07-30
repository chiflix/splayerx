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
        :events="['loadedmetadata', 'audiotrack']"
        :styles="{objectFit: 'contain', width: 'calc(100% - 0.1px)', height: '100%'}"
        :loop="loop"
        :src="convertedSrc"
        :playback-rate="rate"
        :volume="volume"
        :muted="muted"
        :paused="paused"
        :current-time="seekTime"
        :current-audio-track-id="currentAudioTrackId.toString()"
        @loadedmetadata="onMetaLoaded"
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
import { mapGetters, mapActions } from 'vuex';
import path from 'path';
import { debounce } from 'lodash';
import { windowRectService } from '@/services/window/WindowRectService';
import { playInfoStorageService } from '@/services/storage/PlayInfoStorageService';
import { settingStorageService } from '@/services/storage/SettingStorageService';
import { nsfwThumbnailFilterService } from '@/services/filter/NSFWThumbnailFilterService';
import { generateShortCutImageBy, ShortCut } from '@/libs/utils';
import { Video as videoActions, AudioTranslate as atActions } from '@/store/actionTypes';
import { videodata } from '@/store/video';
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer.vue';
import { MediaItem, PlaylistItem } from '../interfaces/IDB';
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
    };
  },
  computed: {
    ...mapGetters([
      'videoId', 'nextVideoId', 'originSrc', 'convertedSrc', 'volume', 'muted', 'rate', 'paused', 'duration', 'ratio', 'currentAudioTrackId', 'enabledSecondarySub', 'lastChosenSize', 'subToTop',
      'winSize', 'winPos', 'winAngle', 'isFullScreen', 'winWidth', 'winHeight', 'chosenStyle', 'chosenSize', 'nextVideo', 'loop', 'playinglistRate', 'isFolderList', 'playingList', 'playingIndex', 'playListId', 'items',
      'previousVideo', 'previousVideoId', 'hideNSFW', 'isTranslating',
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
    playListId(val: number, oldVal: number) {
      if (oldVal) this.updatePlaylist(oldVal);
    },
    videoId(val: number, oldVal: number) {
      this.handleLeaveVideo(oldVal);
    },
    originSrc(val: string, oldVal: string) {
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
  },
  created() {
    this.updatePlayinglistRate({ oldDir: '', newDir: path.dirname(this.originSrc), playingList: this.playingList });
  },
  mounted() {
    this.$bus.$on('back-to-landingview', () => {
      if (this.isTranslating) {
        this.showTranslateBubble(AudioTranslateBubbleOrigin.WindowClose);
        this.addTranslateBubbleCallBack(() => {
          this.handleLeaveVideo(this.videoId)
            .finally(() => {
              this.$store.dispatch('Init');
              this.$bus.$off();
              this.$router.push({
                name: 'landing-view',
              });
              windowRectService.uploadWindowBy(false, 'landing-view');
            });
        });
        return false;
      }
      // 如果有back翻译任务，直接丢弃掉
      this.discardTranslate();
      this.handleLeaveVideo(this.videoId)
        .finally(() => {
          this.$store.dispatch('Init');
          this.$bus.$off();
          this.$router.push({
            name: 'landing-view',
          });
          windowRectService.uploadWindowBy(false, 'landing-view');
        });
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
      this.$ga.event('app', 'toggle-playback');
    }, 50, { leading: true }));
    this.$bus.$on('next-video', () => {
      videodata.paused = false;
      if (this.nextVideo) {
        this.$store.commit('LOOP_UPDATE', false);
        if (this.isFolderList) this.openVideoFile(this.nextVideo);
        else this.playFile(this.nextVideo, this.nextVideoId);
      } else {
        this.$store.commit('LOOP_UPDATE', true);
      }
    });
    this.$bus.$on('previous-video', () => {
      videodata.paused = false;
      if (this.previousVideo) {
        this.$store.commit('LOOP_UPDATE', false);
        if (this.isFolderList) this.openVideoFile(this.previousVideo);
        else this.playFile(this.previousVideo, this.previousVideoId);
      } else {
        this.$store.commit('LOOP_UPDATE', true);
      }
    });
    this.$bus.$on('seek', (e: number) => { this.seekTime = [e]; });
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
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  },
  beforeDestroy() {
    if (process.mas) this.$bus.$emit(`stop-accessing-${this.originSrc}`, this.originSrc);
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  },
  methods: {
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
    async onMetaLoaded(event: Event) {
      const target = event.target as HTMLVideoElement;
      this.videoElement = target;
      this.videoConfigInitialize({
        paused: false,
        volume: this.volume * 100,
        muted: this.muted,
        rate: this.nowRate,
        duration: target.duration,
        currentTime: 0,
      });
      if (target.duration && Number.isFinite(target.duration)) {
        const generationInterval = Math.round(target.duration
          / (window.screen.width / 4)) || 1;
        const maxThumbnailCount = Math.floor(target.duration / generationInterval);
        this.$bus.$emit('generate-thumbnails', maxThumbnailCount);
      }
      this.updateMetaInfo({
        intrinsicWidth: target.videoWidth,
        intrinsicHeight: target.videoHeight,
        ratio: target.videoWidth / target.videoHeight,
      });
      const mediaInfo = this.videoId
        ? await playInfoStorageService.getMediaItem(this.videoId)
        : null;
      if (mediaInfo && mediaInfo.lastPlayedTime
        && target.duration - mediaInfo.lastPlayedTime > 10) {
        this.$bus.$emit('seek', mediaInfo.lastPlayedTime);
      } else {
        this.$bus.$emit('seek', 0);
      }
      if (mediaInfo && mediaInfo.audioTrackId) this.lastAudioTrackId = mediaInfo.audioTrackId;
      this.$bus.$emit('video-loaded');
      this.changeWindowRotate(this.winAngle);

      let maxVideoSize;
      let videoSize;
      if (this.videoExisted && (this.winAngle === 0 || this.winAngle === 180)) {
        maxVideoSize = this.winSize;
        videoSize = [this.videoWidth, this.videoHeight];
      } else if (this.videoExisted) {
        maxVideoSize = this.winSize;
        videoSize = [this.videoHeight, this.videoWidth];
      } else {
        videoSize = [this.videoWidth, this.videoHeight];
        this.videoExisted = true;
      }
      const oldRect = this.winPos.concat(this.winSize);
      windowRectService.calculateWindowRect(videoSize, true, oldRect, maxVideoSize);
    },
    onAudioTrack(event: TrackEvent) {
      const { type, track } = event;
      this[`${type}AudioTrack`](track);
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
        const recentPlayedData = {
          ...playlistRecord,
          playedIndex: this.playingIndex,
        };
        await playInfoStorageService
          .updateRecentPlayedBy(playlistId, recentPlayedData as PlaylistItem);
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
      if (result) this.$bus.$emit('database-saved');
    },
    saveSubtitleStyle() {
      return settingStorageService.updateSubtitleStyle({
        chosenStyle: this.chosenStyle,
        chosenSize: this.subToTop ? this.lastChosenSize : this.chosenSize,
        enabledSecondarySub: this.enabledSecondarySub,
      });
    },
    savePlaybackStates() {
      return settingStorageService.updatePlaybackStates({ volume: this.volume, muted: this.muted });
    },
    async handleLeaveVideo(videoId: number) {
      const screenshot: ShortCut = await this.generateScreenshot();
      if (this.hideNSFW) {
        if (await nsfwThumbnailFilterService.checkImage(screenshot.shortCut)) {
          this.$store.dispatch('addMessages', {
            type: 'result',
            title: '🙀',
            content: '发现了奇怪的东西~',
            dismissAfter: 5000,
          });
          await playInfoStorageService.deleteRecentPlayedBy(this.playListId);
          return null;
        }
      }

      let savePromise = this.saveScreenshot(videoId, screenshot)
        .then(() => this.updatePlaylist(this.playListId));
      if (process.mas && this.$store.getters.source === 'drop') {
        savePromise = savePromise.then(async () => {
          await playInfoStorageService.deleteRecentPlayedBy(this.playListId);
        });
      }
      return savePromise
        .then(this.saveSubtitleStyle)
        .then(this.savePlaybackStates)
        .then(this.removeAllAudioTrack);
    },
    beforeUnloadHandler(e: BeforeUnloadEvent) {
      // 如果当前有翻译任务进行，而不是再后台进行
      if (this.isTranslating) {
        this.showTranslateBubble(AudioTranslateBubbleOrigin.WindowClose);
        this.addTranslateBubbleCallBack(() => {
          window.close();
        });
        e.returnValue = true;
      }
      // 如果有back翻译任务，直接丢弃掉
      this.discardTranslate();
      if (!this.asyncTasksDone && !this.needToRestore) {
        e.returnValue = false;
        this.handleLeaveVideo(this.videoId)
          .finally(() => {
            this.$store.dispatch('SRC_SET', { src: '', mediaHash: '', id: NaN });
            this.asyncTasksDone = true;
            window.close();
          });
      }
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
