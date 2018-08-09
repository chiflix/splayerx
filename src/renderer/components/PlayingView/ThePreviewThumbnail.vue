<template>
  <div class="the-preview-thumbnail"
    :style="{width: thumbnailWidth +'px', height: thumbnailHeight + 'px', left: positionOfThumbnail + 'px'}">
    <thumbnail-video-player
      :quickHash="quickHash"
      :currentTime="currentTime"
      :thumbnailWidth="thumbnailWidth"
      :thumbnailHeight="thumbnailHeight"
      :outerThumbnailInfo="outerThumbnailInfo">
      <span class="time">{{ videoTime }}</span>
    </thumbnail-video-player>
  </div>
</template>

<script>
import ThumbnailVideoPlayer from './ThumbnailVideoPlayer';
import { Dexie } from 'dexie';
export default {
  components: {
    'thumbnail-video-player': ThumbnailVideoPlayer,
  },
  props: {
    src: String,
    currentTime: Number,
    maxThumbnailWidth: Number,
    videoRatio: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    positionOfThumbnail: Number,
    videoTime: String,
  },
  data() {
    return {
      outerThumbnailInfo: {
        videoSrc: this.src,
        videoDuration: -1,
        generationInterval: -1,
        screenWidth: 1920,
        maxThumbnailWidth: 240,
        videoRatio: this.videoRatio,
      },
      quickHash: null,
      thumbnailDB: new Dexie('splayerx-preview-thumbnails'),
      tablesIndex: [],
      version: 1,
      thumbnailSchema: '&index, imageBlob',
    };
  },
  watch: {
    src(newValue) {
      this.updateMediaQuickHash(newValue);
      if (this.tablesIndex.includes(this.quickHash)) {
        console.log(`[ThePreviewThumbnail|Database]: database ${this.quickHash} already exists.`);
      } else {
        this.addTable(this.quickHash, this.thumbnailSchema).then((db) => {
          this.version = db.verno;
          this.thumbnailDB = db;
          this.tablesIndex = db.tables;
        });
      }
      this.$set(this.outerThumbnailInfo, 'videoSrc', newValue);
    },
  },
  created() {
    this.thumbnailDB.open().then((db) => {
      this.version = db.verno;
      console.log(`[ThePreviewThumbnail|Database]: Open thumbnail at version ${this.version}.`);
      this.tablesIndex = db.tables;
      this.tablesIndex.forEach((name) => {
        console.log(`[ThePreviewThumbnail|Database]: Found a table with name: ${name}.`);
      });
    });
    this.updateMediaQuickHash(this.src);
    this.thumbnailDB.version(this.version).stores({
      [this.quickHash]: this.thumbnailSchema,
    });
  },
  methods: {
    updateMediaQuickHash(src) {
      const regexes = {
        file: new RegExp('^file:///?'),
        http: new RegExp('^(http|https)://'),
      };

      let filePath = src;
      Object.keys(regexes).forEach((fileType) => {
        if (regexes[fileType].test(src)) {
          filePath = src.replace(regexes[fileType], '');
        }
      });
      this.quickHash = this.mediaQuickHash(filePath);
    },
    addTable(tableName, tableSchema) {
      this.version = this.thumbnailDB.verno;
      this.thumbnailDB.close();
      const newSchema = {
        [tableName]: tableSchema,
      };

      const upgraderDB = new Dexie('splayerx-preview-thumbnails');
      upgraderDB.version(this.version + 1).stores(newSchema);
      return upgraderDB.open().then((db) => {
        upgraderDB.close();
        return db.open();
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.the-preview-thumbnail {
  position: absolute;
  bottom: 20px;
  -webkit-app-region: no-drag;
  border: 1px solid;
  border-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5), rgba(84, 84, 84, 0.5)) 10;
  border-radius: 1px;
  box-sizing: content-box;
  background-image: linear-gradient(-165deg, rgba(231, 231, 231, 0.5), rgba(84, 84, 84, 0.5));
}
.time {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.2px;
  @media screen and (max-width: 854px) {
    font-size: 20px;
  }
  @media screen and (min-width: 854px) and (max-width: 1920px) {
    font-size: 24px;
  }
  @media screen and (min-width: 1920px) {
    font-size: 40px;
  }
}
</style>
