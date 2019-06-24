<template>
  <div class="player">
    <the-video-canvas ref="videoCanvas" />
    <the-video-controller ref="videoctrl" />
    <subtitle-renderer
      :key="originSrc"
      :currentCues="concatCurrentCues"
      :subPlayRes="subPlayRes"
      :scaleNum="scaleNum"
      :subToTop="subToTop"
      :currentFirstSubtitleId="currentFirstSubtitleId"
      :winHeight="winHeight"
      :chosenStyle="chosenStyle"
      :chosenSize="chosenSize"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { audioGrabService } from '@/services/media/AudioGrabService';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import SubtitleRenderer from '@/components/Subtitle/SubtitleRenderer.vue';
import VideoCanvas from '@/containers/VideoCanvas.vue';
import TheVideoController from '@/containers/TheVideoController.vue';
import { videodata } from '../store/video';

export default {
  name: 'PlayingView',
  components: {
    SubtitleRenderer,
    'the-video-controller': TheVideoController,
    'the-video-canvas': VideoCanvas,
    'subtitle-renderer': SubtitleRenderer,
  },
  watch: {
    originSrc(v) {
      setTimeout(() => {
        audioGrabService.send({
          time: Date.now(),
          videoSrc: v,
          mediaHash: this.mediaHash,
        });
      }, 100);
    },
  },
  computed: {
    ...mapGetters(['currentCues', 'scaleNum', 'subToTop', 'currentFirstSubtitleId', 'winHeight', 'chosenStyle', 'chosenSize', 'originSrc', 'mediaHash']),
    concatCurrentCues() {
      return [this.currentCues[0].cues, this.currentCues[1].cues];
    },
    subPlayRes() {
      return [
        { x: this.currentCues[0].subPlayResX, y: this.currentCues[0].subPlayResY },
        { x: this.currentCues[1].subPlayResX, y: this.currentCues[1].subPlayResY },
      ];
    },
  },
  mounted() {
    this.$store.dispatch('initWindowRotate');
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [320, 180]);
    videodata.checkTick();
    videodata.onTick = this.onUpdateTick;
    setTimeout(() => {
      audioGrabService.send({
        time: Date.now(),
        videoSrc: this.originSrc,
        mediaHash: this.mediaHash,
      });
    }, 1000);
    this.$electron.ipcRenderer.on('grab-audio-complete', (event, args) => {
      // temp code
      const coustTime = (Date.now() - args.time) / 1000;
      this.$store.dispatch('addMessages', {
        type: 'result',
        title: '提取音频结束',
        content: `花费时间 ${coustTime}s`,
        dismissAfter: 10000,
      });
    });
  },
  beforeDestroy() {
    this.updateSubToTop(false);
    videodata.stopCheckTick();
  },
  methods: {
    ...mapActions({
      updateSubToTop: subtitleActions.UPDATE_SUBTITLE_TOP,
    }),
    // Compute UI states
    // When the video is playing the ontick is triggered by ontimeupdate of Video tag,
    // else it is triggered by setInterval.
    onUpdateTick() {
      this.$refs.videoctrl.onTickUpdate();
    },
  },
};
</script>

<style lang="scss">
.player {
  width: 100%;
  height: 100%;
  background-color: black;
}
</style>
