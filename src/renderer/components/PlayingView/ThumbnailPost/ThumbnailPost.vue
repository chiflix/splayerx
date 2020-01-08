<template>
  <div class="post">
    <div
      :style="{
        marginLeft: generateType === 3 ? '120px' : '104px',
        width: generateType === 3 ? '2340px': '2386px',
      }"
      class="images"
    >
      <div
        :style="{
          width: generateType === 3 ? '760px' : '576px',
          marginLeft: generateType === 3 ? '20px' : '16px',
          marginBottom: generateType === 3 ? '20px' : '16px',
        }"
        v-for="(thumbnail, index) in thumbnails"
        :key="thumbnail.src"
        class="image"
      >
        <img
          :src="thumbnail.src"
          @load="thumbnail.loaded = true"
        >
        <div
          :style="{
            bottom: generateType === 3 ? '20px' : '16px',
            right: generateType === 3 ? '24px' : '20px',
            fontSize: generateType === 3 ? '36px' : '32px',
          }"
          class="duration"
        >
          {{ thumbnailTime(index) }}
        </div>
      </div>
    </div>
    <div class="content">
      <img
        @load="logoLoaded = true"
        :src="logo"
        class="logo"
      >
      <div class="description">
        <div class="name">
          {{ info.name }}
        </div>
        <div class="info">
          <span class="size">{{ info.size }}</span>
          <span class="resolution">{{ info.resolution }}</span>
          <span class="duration">{{ info.durationFmt }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { toJpeg } from 'html-to-image';
import { join } from 'path';
import { writeFile } from 'fs';
import { mapGetters } from 'vuex';
import splayer from '../../../assets/splayer.png';
import splayerEng from '../../../assets/splayer-eng.png';
import { log } from '@/libs/Log';
import { thumbnailPostService } from '@/services/media/ThumbnailPostService';
import { timecodeFromSeconds } from '../../../libs/utils';
import { addBubble } from '../../../helpers/notificationControl';
import { THUMBNAIL_GENERATE, THUMBNAIL_GENERATE_SUCCESS, THUMBNAIL_GENERATE_FAILED } from '../../../helpers/notificationcodes';

export default {
  props: {
    generateType: {
      type: Number,
      required: true,
    },
    savedName: {
      type: String,
      required: true,
    },
  },
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
    ...mapGetters(['originSrc', 'displayLanguage', 'snapshotSavedPath']),
    canExportImage() {
      return !!this.info && this.logoLoaded
        && (
          this.thumbnails.length > 0
          && this.thumbnails.every((thumbnail: { loaded: boolean }) => thumbnail.loaded)
        );
    },
    logo() {
      if (this.displayLanguage === 'zh-Hans' || this.displayLanguage === 'zh-Hant') {
        return splayer;
      }
      return splayerEng;
    },
  },
  watch: {
    async canExportImage(val: boolean) {
      if (val) {
        const jpgUrl = await toJpeg(this.$el, { quality: 0.5 });
        const img = jpgUrl.replace(/^data:image\/\w+;base64,/, '');
        const savedPath = join(this.snapshotSavedPath, this.savedName);
        writeFile(`${savedPath}.jpg`, img, 'base64', (error) => {
          if (error) {
            if (error.message.includes('operation not permitted')) {
              this.chooseThumbnailFolder(
                this.savedName,
                {
                  name: this.savedName,
                  buffer: img,
                  defaultFolder: this.snapshotSavedPath,
                },
              );
            } else {
              log.error('Thumbnail Post Generate', error);
              this.$store.dispatch('removeMessages', 'thumbnail-generate');
              setTimeout(() => {
                addBubble(THUMBNAIL_GENERATE_FAILED, { id: this.savedName });
              }, 500);
            }
          } else {
            this.$emit('generated');
            log.info('render/main', 'Snapshot success .');
            this.$store.dispatch('removeMessages', 'thumbnail-generate');
            setTimeout(() => {
              addBubble(THUMBNAIL_GENERATE_SUCCESS, { snapshotPath: `${savedPath}.jpg`, id: this.savedName });
            }, 500);
          }
        });
      }
    },
  },
  created() {
    thumbnailPostService.getPostMediaInfo(this.originSrc).then((val) => {
      this.info = val;
      addBubble(THUMBNAIL_GENERATE, { id: 'thumbnail-generate' });
      log.debug('generate-post', this.originSrc, val.duration, this.generateType);
      thumbnailPostService.getPostImage(this.originSrc, val.duration, this.generateType)
        .then((thumbnails: string[]) => {
          log.debug('post-generated', this.originSrc, val.duration);
          this.thumbnails = thumbnails.map((val: string) => ({ src: val, loaded: false }));
        })
        .catch((err) => {
          log.error('Thumbnail Post Generate', err);
          this.$store.dispatch('removeMessages', 'thumbnail-generate');
          setTimeout(() => {
            addBubble(THUMBNAIL_GENERATE_FAILED, { id: this.savedName });
          }, 500);
        });
    });
  },
  methods: {
    thumbnailTime(index: number) {
      return timecodeFromSeconds(
        (index + 1) * (this.info.duration / ((this.generateType * this.generateType) + 1)), true,
      );
    },
  },
};
</script>
<style lang="scss" scoped>
.post {
  position: relative;
  z-index: -1;
  background-color: white;
  width: 2560px;
  height: fit-content;
}
.logo {
  margin-left: 120px;
  margin-bottom: 73px;
  width: 632px;
  height: 208px;
}
.images {
  padding-top: 120px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  .image {
    position: relative;
    img {
      display: block;
    }
  }
  .duration {
    position: absolute;
    border: 0 solid #FFFFFF;
    font-family: $font-medium;
    color: rgba(255,255,255,0.90);
    letter-spacing: -0.33px;
    line-height: 40px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.70);
  }
}
.content {
  margin-top: 60px;
  display: flex;
}
.description {
  height: fit-content;
  border-left: 5px solid #FF6830;
  margin-top: 20px;
  margin-left: 152px;
  margin-right: 120px;
  margin-bottom: 120px;
  padding-left: 60px;
}
.name {
  word-break: break-word;
  font-family: $font-semibold;
  font-size: 40px;
  color: rgba(0,0,0,0.63);
  letter-spacing: 0.4px;
  line-height: 56px;
}
.info {
  margin-top: 28px;
  font-family: $font-normal;
  font-size: 36px;
  color: rgba(0,0,0,0.63);
  letter-spacing: -0.33px;
  line-height: 40px;
  .size, .resolution {
    margin-right: 52px;
  }
}
</style>
