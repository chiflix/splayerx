<template>
  <div class="player">
    <the-video-canvas ref="videoCanvas" />
    <the-video-controller ref="videoctrl" />
  </div>
</template>

<script lang="ts">
import { Route } from 'vue-router';
import { mapMutations, mapActions, mapGetters } from 'vuex';
import { Subtitle as subtitleActions, SubtitleManager as smActions, AudioTranslate as atActions } from '@/store/actionTypes';

import VideoCanvas from '@/containers/VideoCanvas.vue';
import TheVideoController from '@/containers/TheVideoController.vue';
import { AudioTranslateBubbleType } from '@/store/modules/AudioTranslate';
import { videodata } from '../store/video';
import { getStreams } from '../plugins/mediaTasks';

export default {
  name: 'PlayingView',
  components: {
    'the-video-controller': TheVideoController,
    'the-video-canvas': VideoCanvas,
  },
  data() {
    return {
    };
  },
  computed: {
    ...mapGetters(['originSrc', 'duration', 'isTranslateBubbleVisible', 'translateBubbleType', 'isProfessional']),

  },
  watch: {
    originSrc: {
      immediate: true,
      // eslint-disable-next-line
      handler: function (newVal: string) {
        this.resetManager();
        if (newVal) {
          getStreams(newVal);
          this.initializeManager();
        }
      },
    },
  },
  mounted() {
    this.$store.dispatch('initWindowRotate');
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [320, 180]);
    // 这里设置了最小宽高，需要同步到vuex
    this.windowMinimumSize([320, 180]);
    videodata.checkTick();
    videodata.onTick = this.onUpdateTick;
    this.$bus.$on('add-subtitles', (subs: { src: string, type: string }[]) => {
      const paths = subs.map((sub: { src: string, type: string }) => (sub.src));
      this.addLocalSubtitlesWithSelect(paths);
    });
  },
  beforeRouteLeave(to: Route, from: Route, next: (to: void) => void) {
    this.$bus.$once('videocanvas-saved', () => {
      this.$store.dispatch('Init');
      this.$bus.$off();
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
    }),
    // Compute UI states
    // When the video is playing the ontick is triggered by ontimeupdate of Video tag,
    // else it is triggered by setInterval.
    onUpdateTick() {
      // when next video trigger translate bubble,
      // user trigger video data, hide translate bubble
      if (this.isTranslateBubbleVisible
        && (this.translateBubbleType === AudioTranslateBubbleType.NextVideoWhenGrab
        || this.translateBubbleType === AudioTranslateBubbleType.NextVideoWhenTranslate)
        && Math.ceil(videodata.time) < Math.ceil(this.duration)) {
        this.hideTranslateBubble();
      }
      if (!this.isProfessional) {
        this.$refs.videoctrl.onTickUpdate();
      }
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
