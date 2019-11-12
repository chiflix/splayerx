<template>
  <div class="post">
    <img
      @load="handleImgLoad"
      :src="thumbnail"
      class="image"
    />
    <div class="content">
      <img
        @load="handleLogoLoad"
        :src="splayer"
        class="logo"
      />
      <div class="description">
        <div class="name">asdasdasd</div>
        <div class="info">asdasdlkj</div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { toPng } from 'html-to-image';
import { join } from 'path';
import { mapGetters } from 'vuex';
import { writeFileSync } from 'fs';
import { thumbnailPostService } from '@/services/media/ThumbnailPostService';
import splayer from '@/assets/splayer.png';

export default {
  data() {
    return {
      thumbnail: '',
      info: '',
      splayer,
    };
  },
  created() {
    thumbnailPostService.getPostMediaInfo(this.originSrc);
  },
  methods: {
    exportPng() {
      toPng(this.$el).then((val) => {
        const imgPath = val.replace(/^data:image\/\w+;base64,/, '');
        writeFileSync(join(__static, 'abc.png'), imgPath, 'base64');
      });
    },
    handleImgLoad() {
      this.imgLoaded = true;
      if (this.logoLoaded) this.exportPng();
    },
    handleLogoLoad() {
      this.logoLoaded = true;
      if (this.imgLoaded) this.exportPng();
    },
  },
  watch: {
    duration(val: number) {
      if (val) {
        thumbnailPostService.getPostPng(this.originSrc, val).then((val) => {
          this.thumbnail = val;
        });
      }
    },
  },
  computed: {
    ...mapGetters(['duration', 'originSrc']),
  },
};
</script>
<style lang="scss" scoped>
.post {
  background-color: white;
  width: 1280px;
}
.logo {
  margin-left: 60px;
  margin-bottom: 60px;
  width: 316px;
  height: 80px;
}
.image {
  width: 100%;
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
  font-family: PingFangSC-Regular;
  font-size: 20px;
  color: rgba(0,0,0,0.63);
  letter-spacing: -0.33px;
  line-height: 20px;
}
</style>
