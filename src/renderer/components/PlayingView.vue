<template>
  <div class="player">
    <the-video-canvas ref="videoCanvas" />
    <subtitle-image-renderer
      :windowWidth="winWidth"
      :windowHeight="winHeight"
      :currentCues="allCues"
    />
    <the-video-controller ref="videoctrl" />
    <thumbnailPost
      :key="savedName"
      v-if="generatePost"
      :generate-type="generateType"
      :saved-name="savedName"
      @generated="generatePost = false"
    />
  </div>
</template>

<script lang="ts">
import { Route } from 'vue-router';
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { basename } from 'path';
import { Subtitle as subtitleActions, SubtitleManager as smActions, AudioTranslate as atActions } from '@/store/actionTypes';
import SubtitleImageRenderer from '@/components/SubtitleImageRenderer.vue';
import thumbnailPost from '@/components/PlayingView/ThumbnailPost/ThumbnailPost.vue';
import VideoCanvas from '@/containers/VideoCanvas.vue';
import TheVideoController from '@/containers/TheVideoController.vue';
import { AudioTranslateBubbleType } from '@/store/modules/AudioTranslate';
import { offListenersExceptWhiteList } from '@/libs/utils';
import { videodata } from '../store/video';
import { getStreams } from '../plugins/mediaTasks';

export default {
  name: 'PlayingView',
  components: {
    'the-video-controller': TheVideoController,
    'the-video-canvas': VideoCanvas,
    'subtitle-image-renderer': SubtitleImageRenderer,
    thumbnailPost,
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
      generatePost: false,
      generateType: NaN,
      showingPopupDialog: false,
      savedName: '',
    };
  },
  computed: {
    ...mapGetters(['originSrc', 'duration', 'isTranslateBubbleVisible', 'translateBubbleType', 'winWidth', 'winHeight', 'isProfessional', 'primarySubtitleId', 'secondarySubtitleId']),
    allCues() {
      return Array.isArray(this.currentCues)
        ? this.currentCues.flatMap(({ cues }: { cues: [] }) => cues)
        : [];
    },
  },
  watch: {
    originSrc: {
      immediate: true,
      // eslint-disable-next-line
      handler: function (newVal: string) {
        this.generatePost = false;
        this.resetManager();
        if (newVal) {
          getStreams(newVal);
          this.initializeManager();
        }
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
    // 这里设置了最小宽高，需要同步到vuex
    this.windowMinimumSize([320, 180]);
    videodata.checkTick();
    videodata.onTick = this.onUpdateTick;
    requestAnimationFrame(this.loopCues);
    this.$bus.$on('add-subtitles', (subs: { src: string, type: string }[]) => {
      const paths = subs.map((sub: { src: string, type: string }) => (sub.src));
      this.addLocalSubtitlesWithSelect(paths);
    });
    this.$bus.$on('generate-post', this.generatePostHandler);
  },
  beforeRouteLeave(to: Route, from: Route, next: (to: void) => void) {
    this.$bus.$once('videocanvas-saved', () => {
      this.$store.dispatch('Init');
      // event bus 解绑 过滤白名单的事件
      offListenersExceptWhiteList(this.$bus);
      next();
    });
    if (to.name !== 'browsing-view') this.$store.dispatch('UPDATE_SHOW_SIDEBAR', false);
    this.$bus.$emit('back-to-landingview');
  },
  beforeDestroy() {
    this.updateSubToTop(false);
    videodata.stopCheckTick();
  },
  methods: {
    ...mapMutations({
      windowMinimumSize: 'windowMinimumSize',
    }),
    ...mapActions({
      updateSubToTop: subtitleActions.UPDATE_SUBTITLE_TOP,
      resetManager: smActions.resetManager,
      initializeManager: smActions.initializeManager,
      addLocalSubtitlesWithSelect: smActions.addLocalSubtitlesWithSelect,
      hideTranslateBubble: atActions.AUDIO_TRANSLATE_HIDE_BUBBLE,
      getCues: smActions.getCues,
      updatePlayTime: smActions.updatePlayedTime,
    }),
    // Compute UI states
    // When the video is playing the ontick is triggered by ontimeupdate of Video tag,
    // else it is triggered by setInterval.
    onUpdateTick() {
      requestAnimationFrame(this.loopCues);
      // when next video trigger translate bubble,
      // user trigger video data, hide translate bubble
      if (this.isTranslateBubbleVisible
        && (this.translateBubbleType === AudioTranslateBubbleType.NextVideoWhenGrab
        || this.translateBubbleType === AudioTranslateBubbleType.NextVideoWhenTranslate)
        && Math.ceil(videodata.time) < Math.ceil(this.duration)) {
        this.hideTranslateBubble();
      }
      this.$refs.videoctrl.onTickUpdate();
    },
    generatePostHandler(type: number) {
      this.generatePost = true;
      this.generateType = type;
      this.savedName = this.generateThumbnailFilename(type);
    },
    generateThumbnailFilename(type: number) {
      const date = new Date();
      return `SPlayer-${date.getFullYear()}${date.getMonth()}${date.getDate()}`
          + `-${basename(this.originSrc)}-${type}x${type}`;
    },
    async loopCues() {
      if (!this.time) this.time = videodata.time;
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
  will-change: width;
  transition-property: width;
  transition-duration: 100ms;
  transition-timing-function: ease-out;

  position: absolute;
  right: 0;

  height: 100%;
  background-color: black;
}
</style>
