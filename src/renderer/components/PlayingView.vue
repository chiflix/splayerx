<template>
  <div :data-component-name="$options.name" class="player">
    <the-video-canvas />
    <the-video-controller />
    <transition name="fade">
      <div class="recent-playlist-container"
        v-show="showRecentPlaylist"
        @mousedown.stop="handlePlaylistMousedown">
        <recent-playlist v-bind:showRecentPlaylist.sync="showRecentPlaylist" v-show="true" class="recent-playlist"/>
      </div>
    </transition>
  </div>
</template>

<script>
import VideoCanvas from './PlayingView/VideoCanvas.vue';
import TheVideoController from './PlayingView/TheVideoController';
import RecentPlaylist from './PlayingView/RecentPlaylist.vue';

export default {
  name: 'playing-view',
  components: {
    'the-video-controller': TheVideoController,
    'the-video-canvas': VideoCanvas,
    'recent-playlist': RecentPlaylist,
  },
  data() {
    return {
      showRecentPlaylist: false,
    };
  },
  methods: {
    handlePlaylistMousedown() {
      this.showRecentPlaylist = false;
    },
  },
  mounted() {
    this.$electron.remote.getCurrentWindow().setMinimumSize(320, 180);
    this.$bus.$on('show-recent-playlist', () => {
      this.showRecentPlaylist = true;
    });
  },
};
</script>

<style lang="scss">
.player {
  width: 100%;
  height: 100%;
  background-color: black;
}
.recent-playlist-container{
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1000; // in front of all widgets
  .recent-playlist {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 400ms cubic-bezier(0.2, 0.3, 0.01, 1), transform 400ms cubic-bezier(0.2, 0.3, 0.01, 1);
}
.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(100px);
}
</style>
