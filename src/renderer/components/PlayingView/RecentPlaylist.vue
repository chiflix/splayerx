<template>
  <div class="recent-playlist"
    @mousedown="handleMousedown">
    <div class="info"
      @mousedown.stop="">
      <div class="top">{{lastPlayedTime}} / 
      <span>{{timecodeFromSeconds(duration)}}</span>&nbsp&nbsp·&nbsp&nbsp{{inWhichSource}} {{indexInPlaylist}} / {{numberOfPlaylistItem}}</div>
      <div class="file-name">{{filename}}</div>
    </div>
    <div class="playlist-items"
      @mousedown.stop=""
      :style="{
        right: `${distance}px`,
      }">
      <RecentPlaylistItem v-for="(item, index) in playingList" class="item"
        :key="index"
        :index="index"
        :path="item"
        :isInRange="index >= firstIndex && index <= lastIndex"
        :isPlaying="index === playingIndex"
        :winWidth="winWidth"
        :isShifting="shifting"
        :DBInfo="itemInfos[index]"
        :DBloaded="DBloaded"
        :showVideo="showAttached"
        :thumbnailWidth="thumbnailWidth"
        @mouseupItem="itemMouseup"
        @mouseoverItem="itemMouseover"/>
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
    mousedownOnOther: Boolean,
    mouseupOnOther: Boolean,
  },
  data() {
    return {
      itemInfos: [],
      filename: '',
      firstIndex: 0, // first index of current page
      hoverIndex: 0,
      shifting: false,
      snapShoted: false,
      DBloaded: false,
      imgPaths: [],
    };
  },
  mounted() {
    this.searchInfoDB();
  },
  methods: {
    handleMousedown() {
      this.$emit('update:showRecentPlaylist', false);
    },
    itemMouseleave() {
    },
    itemMouseover(payload) {
      this.hoverIndex = payload.index;
      this.filename = payload.filename;
    },
    itemMouseup(index) {
      // last page
      if (index === this.firstIndex - 1) {
        this.lastIndex = index;
        this.shifting = true;
        setTimeout(() => {
          this.shifting = false;
        }, 400);
      } else if (index === this.lastIndex + 1) { // next page
        this.firstIndex = index;
        this.shifting = true;
        setTimeout(() => {
          this.shifting = false;
        }, 400);
      } else if (index !== this.playingIndex) {
        this.openFile(this.playingList[index]);
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
      this.DBloaded = true;
    },
  },
  watch: {
    firstIndex() {
      if (this.lastIndex > this.maxIndex) {
        this.lastIndex = this.maxIndex;
      }
    },
    mousedownOnOther(val) {
      if (val && this.mouseupOnOther) {
        this.$emit('update:showattached', false);
      }
    },
    mouseupOnOther(val) {
      if (val) {
        this.$emit('update:showattached', false);
      }
    },
    playingIndex(val) {
      if (val > this.lastIndex) {
        this.firstIndex = val;
      } else if (val < this.firstIndex) {
        this.lastIndex = val;
      }
    },
  },
  computed: {
    ...mapGetters(['playingList', 'isFolderList', 'winWidth', 'playingIndex']),
    inWhichSource() {
      if (this.isFolderList) {
        return '文件夹';
      }
      return '播放列表';
    },
    lastPlayedTime() {
      if (this.itemInfos[this.hoverIndex]) {
        if (this.itemInfos[this.hoverIndex].lastPlayedTime) {
          return `${this.timecodeFromSeconds(this.itemInfos[this.hoverIndex].lastPlayedTime)} /`;
        }
      }
      return '';
    },
    duration() {
      if (this.itemInfos[this.hoverIndex]) {
        if (this.itemInfos[this.hoverIndex].duration) {
          return this.itemInfos[this.hoverIndex].duration;
        }
      }
      return 0;
    },
    indexInPlaylist() {
      return this.hoverIndex + 1;
    },
    numberOfPlaylistItem() {
      return this.playingList.length;
    },
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
  @media screen and (min-width: 512px) {
    height: fit-content;
  }
  .info {
    margin: 53px 41px 0px 0px;
    padding-left: 40px;
    height: 44px;
    width: 90%;
    .top {
      margin-top: 1px;
      opacity: 0.4;
      font-family: Avenir-Heavy;
      font-size: 14px;
      color: #FFFFFF;
      letter-spacing: 0.64px;
      line-height: 13px;
      width: max-content;
    }
    .file-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      margin-top: 9px;
      font-family: Avenir-Heavy;
      font-size: 18px;
      color: rgba(255,255,255,0.70);
      letter-spacing: 1px;
      line-height: 20px;
      width: 100%;
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
