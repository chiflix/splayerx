<template>
  <div class="recent-playlist">
    <div class="info">
      <div class="top">{{lastPlayedTime}} / {{duration}} · {{inWhichSource}} {{indexInPlaylist}} / {{numberOfPlaylistItem}}</div>
      <div class="file-name">{{filename}}</div>
    </div>
    <div class="playlist-items">
      <RecentPlaylistItem v-for="(item, index) in playlist" class="item"
        @mouseover="mouseoverItem(index)"
        :class="{ chosen: item.isChosen }"/>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import RecentPlaylistItem from '@/components/PlayingView/RecentPlaylistItem.vue';
export default {
  name: 'recent-playlist',
  components: {
    RecentPlaylistItem,
  },
  data() {
    return {
      lastPlayedTime: '44:34',
      duration: '1:02:33',
      inWhichSource: '播放列表',
      indexInPlaylist: 1,
      numberOfPlaylistItem: 24,
      filename: '[h龙].Red.Dragon.2002.BluRay.720p.x264.AC3-CMCT',
    };
  },
  methods: {
    mouseoverItem(index) {
      this.playlist[index].isChosen = true;
      console.log(this.playlist[index]);
    },
  },
  computed: {
    ...mapGetters(['playingList', 'isFolderList']),
    playlist() {
      return this.playingList.slice(0, 5);
    },
  },
};
</script>
<style lang="scss" scoped>
.recent-playlist {
  width: 100%;
  background-image: linear-gradient(-180deg, rgba(0,0,0,0.00) 0%, #000000 86%);

  @media screen and (min-width: 512px) and (max-width: 720px) {
    height: 220px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    height: 238px;
  }
  @media screen and (min-width: 1921px) {
    height: 345px;
  }
  .info {
    margin: 53px 41px 31px 35px;
    height: 41px;
    .top {
      margin-top: 0.81px;
      opacity: 0.4;
      font-family: Avenir-Heavy;
      font-size: 14px;
      color: #FFFFFF;
      letter-spacing: 0.64px;
      line-height: 13px;
    }
    .file-name {
      margin-top: 5.63px;
      font-family: Avenir-Heavy;
      font-size: 18px;
      color: rgba(255,255,255,0.70);
      letter-spacing: 1px;
      line-height: 20px;
    }
  }
  .playlist-items {
    display: flex;
    margin-bottom: 35px;
    margin-left: 35px;
    .chosen {
      transform: translateX(-1px);
    }
  }
}
</style>
