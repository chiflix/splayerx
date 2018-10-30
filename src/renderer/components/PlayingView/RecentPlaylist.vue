<template>
  <div class="recent-playlist">
    <div class="info">
      <div class="top">{{lastPlayedTime}} / {{duration}} · {{inWhichSource}} {{indexInPlaylist}} / {{numberOfPlaylistItem}}</div>
      <div class="file-name">{{filename}}</div>
    </div>
    <div class="playlist-items">
      <RecentPlaylistItem v-for="(item, index) in playingList" class="item"
        @mouseover="mouseoverItem(index)"
        :thumbnailWidth="thumbnailWidth"
        :winWidth="winWidth"
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
    ...mapGetters(['playingList', 'isFolderList', 'winWidth']),
    // if you wanna know the meanings of wABC, please look up the product doc
    thumbnailNumber() {
      let number = 0;
      const w = 112;
      const B = 15;
      if (this.winWidth >= 512 && this.winWidth < 720) {
        number = Math.floor(3 + ((this.winWidth - 512) / (w + B)));
      } else if (this.winWidth === 720) {
        number = 5;
      } else if (this.winWidth > 720 && this.winWidth <= 1355) {
        number = Math.floor(((this.winWidth - 720) / (w + B)) + 5);
      } else if (this.winWidth > 1355) {
        number = 10;
      }
      return number;
    },
    thumbnailWidth() {
      let width = 0;
      const A = 35;
      const B = 15;
      const C = 65;
      if (this.winWidth > 512 && this.winWidth <= 1355) {
        width = ((((this.winWidth - A) - C) + B) / this.thumbnailNumber) - B;
      } else if (this.winWidth > 1355) {
        width = (((this.winWidth - A) - C) - (B * 9)) / 10;
      }
      return width;
    },
  },
};
</script>
<style lang="scss" scoped>
.recent-playlist {
  width: 100%;
  background-image: linear-gradient(-180deg, rgba(0,0,0,0.00) 0%, #000000 86%);
  @media screen and (max-width: 512px) {
    display: none;
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
