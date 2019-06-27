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
import { windowRectService } from '@/services/window/WindowRectService';
import { playInfoStorageService } from '@/services/storage/PlayInfoStorageService';
import { settingStorageService } from '@/services/storage/SettingStorageService';
import { generateShortCutImageBy } from '@/libs/utils';
import { Video as videoActions } from '@/store/actionTypes';
import { videodata } from '@/store/video';
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer.vue';
import { MediaItem, PlaylistItem } from '../interfaces/IDB';

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
      lastPlayedTime: 0,
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
      'videoId', 'nextVideoId', 'originSrc', 'convertedSrc', 'volume', 'muted', 'rate', 'paused', 'duration', 'ratio', 'currentAudioTrackId', 'enabledSecondarySub', 'lastWinSize', 'lastChosenSize', 'subToTop',
      'winSize', 'winPos', 'winAngle', 'isFullScreen', 'winWidth', 'winHeight', 'chosenStyle', 'chosenSize', 'nextVideo', 'loop', 'playinglistRate', 'isFolderList', 'playingList', 'playingIndex', 'playListId', 'items']),
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
      if (oldVal) this.saveScreenshot(oldVal, this.videoId);
    },
    videoId(val: number, oldVal: number) {
      if (!this.isFolderList) this.saveScreenshot(this.playListId, oldVal);
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
    this.$electron.ipcRenderer.on('quit', (needToRestore: boolean) => {
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
    this.$bus.$on('send-lastplayedtime', (e: number) => {
      this.lastPlayedTime = e;
    });
    this.$bus.$on('send-audiotrackid', (id: string) => {
      this.lastAudioTrackId = id;
    });
    this.$bus.$on('toggle-playback', () => {
      this[this.paused ? 'play' : 'pause']();
      this.$ga.event('app', 'toggle-playback');
    });
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
    }),
    onMetaLoaded(event: Event) {
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
      if (target.duration - this.lastPlayedTime > 10) {
        this.$bus.$emit('seek', this.lastPlayedTime);
      } else {
        this.$bus.$emit('seek', 0);
      }
      this.lastPlayedTime = 0;
      this.$bus.$emit('video-loaded');
      this.changeWindowRotate(this.winAngle);

      let maxVideoSize = [];
      let videoSize = [];
      if (this.videoExisted && (this.winAngle === 0 || this.winAngle === 180)) {
        maxVideoSize = this.winSize;
        videoSize = [this.videoWidth, this.videoHeight];
      } else if (this.videoExisted) {
        maxVideoSize = this.winSize;
        videoSize = [this.videoHeight, this.videoWidth];
      } else {
        maxVideoSize = this.lastWinSize;
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
        const scale = windowRectService.calculateWindowScaleBy(this.isFullScreen, val, this.ratio);
        this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${val}deg) scale(${scale}, ${scale})`);
      });
    },
    toFullScreen() {
      this.winSizeBeforeFullScreen = this.winSize;
      this.winAngleBeforeFullScreen = this.winAngle;
      requestAnimationFrame(() => {
        const scale = windowRectService.calculateWindowScaleBy(true, this.winAngle, this.ratio);
        this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg) scale(${scale}, ${scale})`);
      });
      windowRectService.uploadWindowBy(true);
    },
    offFullScreen() {
      requestAnimationFrame(() => {
        const scale = windowRectService.calculateWindowScaleBy(false, this.winAngle, this.ratio);
        this.$refs.videoCanvas.$el.style.setProperty('transform', `rotate(${this.winAngle}deg) scale(${scale}, ${scale})`);
      });
      windowRectService.uploadWindowBy(false, 'playing-view', this.winAngle, this.winAngleBeforeFullScreen, this.winSizeBeforeFullScreen, this.winPos);
    },
    async saveScreenshot(playlistId: number, videoId: number) {
      const { videoElement } = this;
      const canvas = this.$refs.thumbnailCanvas;
      // todo: use metaloaded to get videoHeight and videoWidth
      const { videoHeight, videoWidth } = this;
      const shortCut = generateShortCutImageBy(videoElement, canvas, videoWidth, videoHeight);

      const data = {
        shortCut: shortCut.shortCut,
        smallShortCut: shortCut.smallShortCut,
        lastPlayedTime: videodata.time,
        duration: this.duration,
        audioTrackId: this.currentAudioTrackId,
      };

      const result = await playInfoStorageService.updateMediaItemBy(videoId, data as MediaItem);
      if (result) {
        this.$bus.$emit('database-saved');
      }
      const playlistRecord = await playInfoStorageService.getPlaylistRecord(playlistId);
      const recentPlayedData = {
        ...playlistRecord,
        items: this.isFolderList ? [videoId] : this.items,
        playedIndex: this.isFolderList ? 0 : this.playingIndex,
      };
      await playInfoStorageService
        .updateRecentPlayedBy(playlistId, recentPlayedData as PlaylistItem);
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
    beforeUnloadHandler(e: Event) {
      if (!this.asyncTasksDone && !this.needToRestore) {
        let savePromise = this.saveScreenshot(this.playListId, this.videoId);
        if (process.mas && this.$store.getters.source === 'drop') {
          savePromise = savePromise.then(async () => {
            await playInfoStorageService.deleteRecentPlayedBy(this.playListId);
          });
        }
        savePromise
          .then(this.saveSubtitleStyle)
          .then(this.savePlaybackStates)
          .then(this.$store.dispatch('saveWinSize', this.isFullScreen ? { size: this.winSizeBeforeFullScreen, angle: this.winAngleBeforeFullScreen } : { size: this.winSize, angle: this.winAngle }))
          .then(this.removeAllAudioTrack)
          .finally(() => {
            this.$store.dispatch('SRC_SET', { src: '', mediaHash: '', id: NaN });
            this.asyncTasksDone = true;
            window.close();
          });
        e.returnValue = false;
      } else if (!this.quit) {
        e.returnValue = false;
        this.$bus.$off(); // remove all listeners before back to landing view
        // need to init Vuex States
        this.$router.push({
          name: 'landing-view',
        });
        windowRectService.uploadWindowBy(false, 'landing-view');
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
