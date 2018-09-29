<template>
  <div :data-component-name="$options.name" class="player">
    <the-video-canvas :src="uri" />
    <notification-bubble notificationTitle="文件错误" notificationContent="视频文件格式无法识别或文件已损坏。"></notification-bubble>
    <the-video-controller :src="uri" />
  </div>
</template>

<script>
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TheVideoController from './PlayingView/TheVideoController';
import NotificationBubble from './NotificationBubble.vue';

export default {
  name: 'playing-view',
  components: {
    'the-video-controller': TheVideoController,
    'the-video-canvas': VideoCanvas,
    'notification-bubble': NotificationBubble,
  },
  mounted() {
    this.$bus.$emit('play');
    this.$electron.remote.getCurrentWindow().setMinimumSize(320, 180);
    this.$electron.remote.getCurrentWindow().setResizable(true);
  },
  computed: {
    uri() {
      return this.$store.state.PlaybackState.SrcOfVideo;
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
