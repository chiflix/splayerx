<template>
  <div class="player">
    <the-video-canvas ref="videoCanvas" />
    <the-video-controller ref="videoctrl" />
    <thumbnailPost
      v-if="generatePost"
      :generate-type="generateType"
      :save-path="thumbnailPostPath"
      @generated="generatePost = false"
    />
  </div>
</template>

<script lang="ts">
import { Route } from 'vue-router';
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { basename, dirname, join } from 'path';
import { Subtitle as subtitleActions, SubtitleManager as smActions, AudioTranslate as atActions } from '@/store/actionTypes';
import thumbnailPost from '@/components/PlayingView/ThumbnailPost/ThumbnailPost.vue';
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
    thumbnailPost,
  },
  data() {
    return {
      generatePost: false,
      generateType: NaN,
      thumbnailPostPath: '',
      showingPopupDialog: false,
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
        this.generatePost = false;
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
    this.$bus.$on('generate-post', this.generatePostHandler);
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
      this.$refs.videoctrl.onTickUpdate();
    },
    generatePostHandler(type: number) {
      if (this.showingPopupDialog) return;
      this.showingPopupDialog = true;
      process.env.NODE_ENV === 'testing' ? '' : this.$electron.remote.dialog.showSaveDialog({
        title: 'Thumbnail Post Save',
        filters: [{
          name: 'Thumbnail',
          extensions: ['jpg', 'jpeg'],
        }],
        defaultPath: join(
          dirname(this.originSrc), this.generateThumbnailFilename(type),
        ),
      }, (filename: string) => {
        this.thumbnailPostPath = filename;
        this.showingPopupDialog = false;
        if (filename) {
          this.generatePost = true;
          this.generateType = type;
        }
      });
    },
    generateThumbnailFilename(type: number) {
      const date = new Date();
      return `SPlayer-${date.getFullYear()}${date.getMonth()}${date.getDate()}`
          + `-${basename(this.originSrc)}-${type}x${type}`;
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
