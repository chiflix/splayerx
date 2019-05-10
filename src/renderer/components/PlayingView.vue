<template>
  <div class="player">
    <the-video-canvas ref="videoCanvas" />
    <the-video-controller ref="videoctrl" />
  </div>
</template>

<script>
import { mapMutations, mapActions } from 'vuex';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TheVideoController from './PlayingView/TheVideoController.vue';
import { videodata } from '../store/video';

export default {
  name: 'playing-view',
  components: {
    'the-video-controller': TheVideoController,
    'the-video-canvas': VideoCanvas,
  },
  methods: {
    ...mapMutations({
      windowMinimumSize: 'windowMinimumSize',
    }),
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
  mounted() {
    this.$store.dispatch('initWindowRotate');
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [320, 180]);
    // 这里设置了最小宽高，需要同步到vuex
    this.windowMinimumSize([320, 180]);
    videodata.checkTick();
    videodata.onTick = this.onUpdateTick;
  },
  beforeDestroy() {
    this.updateSubToTop(false);
    videodata.stopCheckTick();
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
