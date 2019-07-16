<template>
  <div class="player">
    <the-video-canvas ref="videoCanvas" />
    <subtitle-renderer
      :key="originSrc"
      :currentCues="concatCurrentCues"
      :subPlayRes="subPlayRes"
      :scaleNum="scaleNum"
      :subToTop="subToTop"
      :currentFirstSubtitleId="primarySubtitleId"
      :currentSecondarySubtitleId="secondarySubtitleId"
      :winHeight="winHeight"
      :chosenStyle="chosenStyle"
      :chosenSize="chosenSize"
      :enabledSecondarySub="enabledSecondarySub"
    />
    <the-video-controller ref="videoctrl" />
  </div>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex';
import { Subtitle as subtitleActions, SubtitleManager as smActions, AudioTranslate as atActions } from '@/store/actionTypes';
import SubtitleRenderer from '@/components/Subtitle/SubtitleRenderer.vue';
import VideoCanvas from '@/containers/VideoCanvas.vue';
import TheVideoController from '@/containers/TheVideoController.vue';
import { AudioTranslateBubbleType } from '@/store/modules/AudioTranslate';
import { videodata } from '../store/video';

export default {
  name: 'PlayingView',
  components: {
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
    ...mapGetters(['scaleNum', 'subToTop', 'primarySubtitleId', 'secondarySubtitleId', 'winHeight', 'chosenStyle', 'chosenSize', 'originSrc', 'enabledSecondarySub', 'duration', 'isTranslateBubbleVisiable', 'translateBubbleType']),
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
    originSrc: {
      immediate: true,
      // eslint-disable-next-line
      handler: function (newVal: string) {
        this.resetManager();
        if (newVal) this.initializeManager();
      },
    },
    async primarySubtitleId() {
      this.currentCues = await this.getCues(videodata.time);
    },
    async secondarySubtitleId() {
      this.currentCues = await this.getCues(videodata.time);
    },
  },
  mounted() {
    this.$store.dispatch('initWindowRotate');
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [320, 180]);
    videodata.checkTick();
    videodata.onTick = this.onUpdateTick;
    requestAnimationFrame(this.loopCues);
    this.$bus.$on('add-subtitles', (subs: { src: string, type: string }[]) => {
      const paths = subs.map((sub: { src: string, type: string }) => (sub.src));
      this.addLocalSubtitlesWithSelect(paths);
    });
  },
  beforeDestroy() {
    this.updateSubToTop(false);
    videodata.stopCheckTick();
  },
  methods: {
    ...mapActions({
      updateSubToTop: subtitleActions.UPDATE_SUBTITLE_TOP,
      resetManager: smActions.resetManager,
      initializeManager: smActions.initializeManager,
      addLocalSubtitlesWithSelect: smActions.addLocalSubtitlesWithSelect,
      getCues: smActions.getCues,
      updatePlayTime: smActions.updatePlayedTime,
      hideTranslateBubble: atActions.AUDIO_TRANSLATE_HIDE_BUBBLE,
    }),
    // Compute UI states
    // When the video is playing the ontick is triggered by ontimeupdate of Video tag,
    // else it is triggered by setInterval.
    onUpdateTick() {
      requestAnimationFrame(this.loopCues);
      // when next video trigger translate bubble,
      // user trigger video data, hide translate bubble
      if (this.isTranslateBubbleVisiable
        && (this.translateBubbleType === AudioTranslateBubbleType.NextVideoWhenGrab
        || this.translateBubbleType === AudioTranslateBubbleType.NextVideoWhenTranslate)
        && Math.ceil(videodata.time) < Math.ceil(this.duration)) {
        this.hideTranslateBubble();
      }
      this.$refs.videoctrl.onTickUpdate();
    },
    async loopCues() {
      if (!this.time) this.time = videodata.time;
      // TODO @Yvon Yan confirm the impact on subtitle play time
      // onUpdateTick Always get the latest subtitles
      // if (this.time !== videodata.time) {
      const cues = await this.getCues(videodata.time);
      this.updatePlayTime({ start: this.time, end: videodata.time });
      this.currentCues = cues;
      // }
      this.time = videodata.time;
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
