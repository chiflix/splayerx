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
import { Subtitle as subtitleActions, SubtitleManager as smActions } from '@/store/actionTypes';
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
  data() {
    return {
      currentCues: [
        {
          cues: [],
          subPlayResX: 720,
          subPlayResY: 405,
        },
        {
          cues: [],
          subPlayResX: 720,
          subPlayResY: 405,
        },
      ],
    };
  },
  computed: {
    ...mapGetters(['scaleNum', 'subToTop', 'currentFirstSubtitleId', 'winHeight', 'chosenStyle', 'chosenSize', 'originSrc']),
    concatCurrentCues() {
      if (this.currentCues.length === 2) {
        return [this.currentCues[0].cues, this.currentCues[1].cues];
      }
      return [];
    },
    subPlayRes() {
      if (this.currentCues.length === 2) {
        return [
          { x: this.currentCues[0].subPlayResX, y: this.currentCues[0].subPlayResY },
          { x: this.currentCues[1].subPlayResX, y: this.currentCues[1].subPlayResY },
        ];
      }
      return [];
    },
  },
  watch: {
    originSrc(newVal) {
      if (newVal) {
        this.initializeManager();
      }
    },
  },
  created() {
    this.initializeManager();
  },
  mounted() {
    this.$store.dispatch('initWindowRotate');
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [320, 180]);
    videodata.checkTick();
    videodata.onTick = this.onUpdateTick;
    requestAnimationFrame(this.loopCues);
  },
  beforeDestroy() {
    this.updateSubToTop(false);
    videodata.stopCheckTick();
  },
  methods: {
    ...mapActions({
      updateSubToTop: subtitleActions.UPDATE_SUBTITLE_TOP,
      initializeManager: smActions.initializeManager,
      getCues: smActions.getCues,
    }),
    // Compute UI states
    // When the video is playing the ontick is triggered by ontimeupdate of Video tag,
    // else it is triggered by setInterval.
    onUpdateTick() {
      requestAnimationFrame(this.loopCues);
      this.$refs.videoctrl.onTickUpdate();
    },
    async loopCues() {
      const cues = await this.getCues(videodata.time);
      this.currentCues = cues;
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
