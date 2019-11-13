<template>
  <div class="post">
    <div class="images">
      <div
        v-for="thumbnail in thumbnails"
        :key="thumbnail.src"
        class="image"
      >
        <img
          :src="thumbnail.src"
          @load="thumbnail.loaded = true"
        >
        <div class="duration">
          {{ info.durationFmt }}
        </div>
      </div>
    </div>
    <div class="content">
      <img
        @load="logoLoaded = true"
        :src="splayer"
        class="logo"
      >
      <div class="description">
        <div class="name">
          {{ info.name }}
        </div>
        <div class="info">
          {{ info.details }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters } from 'vuex';
import splayer from '@/assets/splayer.png';
import { log } from '@/libs/Log';
import { thumbnailPostService } from '@/services/media/ThumbnailPostService';

export default {
  data() {
    return {
      thumbnails: [],
      info: {
        name: '', details: '', durationFmt: '', duration: 0,
      },
      logoLoaded: false,
      splayer,
    };
  },
  computed: {
    ...mapGetters(['originSrc']),
    canExportPng() {
      return !!this.info && this.logoLoaded
        && (
          this.thumbnails.length > 0
          && this.thumbnails.every((thumbnail: { loaded: boolean }) => thumbnail.loaded)
        );
    },
  },
  watch: {
    canExportPng(val: boolean) {
      if (val) thumbnailPostService.exportPng(this.$el);
    },
  },
  created() {
    thumbnailPostService.getPostMediaInfo(this.originSrc).then((val) => {
      this.info = val;
      log.debug('generate-post', this.originSrc, val.duration);
      thumbnailPostService.getPostPng(this.originSrc, val.duration)
        .then((thumbnails: string[]) => {
          log.debug('post-generated', this.originSrc, val.duration);
          this.thumbnails = thumbnails.map((val: string) => ({ src: val, loaded: false }));
        });
    });
  },
};
</script>
<style lang="scss" scoped>
.post {
  position: relative;
  z-index: -1;
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
