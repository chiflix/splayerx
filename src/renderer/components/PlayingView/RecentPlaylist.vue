<template>
  <div class="recent-playlist"
    v-show="showAttached"
    @mousedown="handleMousedown">
    <div class="info"
      @mousedown.stop="">
      <div class="top">{{lastPlayedTime}} / {{duration}} · {{inWhichSource}} {{indexInPlaylist}} / {{numberOfPlaylistItem}}</div>
      <div class="file-name">{{filename}}</div>
    </div>
    <div class="playlist-items"
      @mousedown.stop=""
      :style="{
        right: `${distance}px`,
      }">
      <RecentPlaylistItem v-for="(item, index) in playingList" class="item"
        :index="index"
        :path="item"
        :isPlaying="item === currentSrc"
        :winWidth="winWidth"
        :DBInfo="itemInfos[index]"
        :showVideo="showAttached"
        :thumbnailWidth="thumbnailWidth"
        @mousedownItem="itemMousedown(index)"
        @mouseoverItem="itemMouseover(index)"/>
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
  props: {
    showAttached: Boolean,
    mousedownOnOther: Boolean,
    mouseupOnOther: Boolean,
  },
  data() {
    return {
      lastPlayedTime: '44:34',
      duration: '1:02:33',
      inWhichSource: '播放列表',
      indexInPlaylist: 1,
      numberOfPlaylistItem: 24,
      filename: '[h龙].Red.Dragon.2002.BluRay.720p.x264.AC3-CMCT',
      itemInfos: [],
      firstIndex: 0, // first index of current page
      chosenIndex: 0,
    };
  },
  mounted() {
    this.searchInfoDB();
  },
  methods: {
    handleMousedown() {
      console.log('you click me!');
    },
    itemMouseleave() {
      this.chosenIndex = -1;
    },
    itemMouseover(index) {
      this.chosenIndex = index;
    },
    itemMousedown(index) {
      // last page
      if (index === this.firstIndex - 1) {
        this.lastIndex = index;
      } else if (index === this.lastIndex + 1) { // next page
        this.firstIndex = index;
      }
    },
    async searchInfoDB() {
      const waitArray = [];
      for (let i = 0; i < this.playingList.length; i += 1) {
        const res = this.infoDB().get('recent-played', 'path', this.playingList[i]);
        waitArray.push(res);
      }
      const resArray = await Promise.all(waitArray);
      this.itemInfos = resArray;
    },
  },
  watch: {
    firstIndex() {
      if (this.lastIndex > this.maxIndex) {
        this.lastIndex = this.maxIndex;
      }
    },
    showAttached(val) {
      console.log('showAttached', val);
    },
    mousedownOnOther(val) {
      console.log('mousedownOnOther', val);
    },
    mouseupOnOther(val) {
      console.log('mouseupOnOther', val);
    },
  },
  computed: {
    ...mapGetters(['playingList', 'isFolderList', 'winWidth']),
    // last index of current page
    lastIndex: {
      get() {
        return (this.firstIndex + this.thumbnailNumber) - 1;
      },
      set(val) {
        if ((val - this.thumbnailNumber) + 1 < 0) {
          this.firstIndex = 0;
        } else {
          this.firstIndex = (val - this.thumbnailNumber) + 1;
        }
      },
    },
    currentSrc() {
      return this.$store.getters.originSrc;
    },
    distance() {
      return this.firstIndex * (this.thumbnailWidth + 15);
    },
    maxIndex() {
      return this.playingList.length - 1;
    },
    maxDistance() {
      return (this.maxIndex - (this.thumbnailNumber - 1)) * this.thumbnailWidth;
    },
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
      return Math.floor(width);
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
    margin: 53px 41px 0px 0px;
    padding-left: 40px;
    height: 44px;
    width: fit-content;
    .top {
      margin-top: 1px;
      opacity: 0.4;
      font-family: Avenir-Heavy;
      font-size: 14px;
      color: #FFFFFF;
      letter-spacing: 0.64px;
      line-height: 13px;
      width: fit-content;
    }
    .file-name {
      margin-top: 9px;
      font-family: Avenir-Heavy;
      font-size: 18px;
      color: rgba(255,255,255,0.70);
      letter-spacing: 1px;
      line-height: 20px;
      width: fit-content;
    }
  }
  .playlist-items {
    position: relative;
    transition: right 400ms ease-in;
    display: flex;
    padding-top: 20px;
    padding-bottom: 40px;
    padding-left: 40px;
  }
}
</style>
