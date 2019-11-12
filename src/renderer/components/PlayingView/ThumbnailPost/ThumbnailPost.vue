<template>
  <div class="post">
    <div class="images">
      <div
        v-for="(thumbnail, index) in thumbnails"
        :key="thumbnail.src"
        class="image"
      >
        <img
          :src="thumbnail.src"
          @load="thumbnail.loaded = true"
        />
        <div class="duration">{{ info.duration }}</div>
      </div>
    </div>
    <div class="content">
      <img
        @load="logoLoaded = true"
        :src="splayer"
        class="logo"
      />
      <div class="description">
        <div class="name">{{ info.name }}</div>
        <div class="info">{{ info.details }}</div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { toPng } from 'html-to-image';
import { join, basename } from 'path';
import { mapGetters } from 'vuex';
import { writeFileSync } from 'fs';
import { thumbnailPostService } from '@/services/media/ThumbnailPostService';
import splayer from '@/assets/splayer.png';

export default {
  data() {
    return {
      thumbnails: [],
      info: { name: '', details: '', durationFmt: '' },
      logoLoaded: false,
      splayer,
    };
  },
  created() {
    thumbnailPostService.getPostMediaInfo(this.originSrc).then((val) => {
      this.info = val;
    });
  },
  methods: {
    exportPng() {
      toPng(this.$el).then((val) => {
        const imgPath = val.replace(/^data:image\/\w+;base64,/, '');
        writeFileSync(join(__static, 'abc.png'), imgPath, 'base64');
      });
    },
  },
  watch: {
    duration(val: number) {
      if (val) {
        thumbnailPostService.getPostPng(this.originSrc, val).then((thumbnails: string[]) => {
          this.thumbnails = thumbnails.map((val: string) => ({ src: val }));
        });
      }
    },
    canExportPng(val: boolean) {
      if (val) {
        console.log(this.thumbnails);
        this.exportPng();
      }
    },
  },
  computed: {
    ...mapGetters(['duration', 'originSrc']),
    canExportPng() {
      return this.info && this.logoLoaded
        && (
          this.thumbnails.length > 0
          && this.thumbnails.every((thumbnail: { loaded: boolean }) => thumbnail.loaded)
        );
    },
    filename() {
      return basename(this.originSrc);
    },
  },
};
</script>
<style lang="scss" scoped>
.post {
  background-color: white;
  width: 1280px;
  height: fit-content;
}
.logo {
  margin-left: 60px;
  margin-bottom: 60px;
  width: 316px;
  height: 80px;
}
.images {
  padding-top: 60px;
  margin-left: 60px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  width: 1170px;
  .image {
    position: relative;
    margin-right: 10px;
    margin-bottom: 10px;
    width: 380px;
    img {
      display: block;
    }
  }
  .duration {
    position: absolute;
    bottom: 10px;
    right: 12px;
    border: 0 solid #FFFFFF;
    font-family: PingFangSC-Medium;
    font-size: 20px;
    color: rgba(255,255,255,0.80);
    letter-spacing: -0.33px;
    line-height: 20px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.80);
  }
}
.content {
  margin-top: 30px;
  display: flex;
}
.description {
  height: fit-content;
  border-left: 5px solid #FF6830;
  margin-left: 75px;
  margin-right: 60px;
  margin-bottom: 60px;
  padding-left: 30px;
}
.name {
  font-family: PingFangSC-Semibold;
  font-size: 20px;
  color: rgba(0,0,0,0.63);
  letter-spacing: 0.2px;
  line-height: 28px;
}
.info {
  margin-top: 21px; 
  font-family: PingFangSC-Regular;
  font-size: 20px;
  color: rgba(0,0,0,0.63);
  letter-spacing: -0.33px;
  line-height: 20px;
}
</style>
