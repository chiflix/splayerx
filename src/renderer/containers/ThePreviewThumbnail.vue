<template>
  <div
    :style="{
      width: thumbnailWidth +'px',
      height: thumbnailHeight +'px',
      transform: `translateX(${positionOfThumbnail}px)`
    }"
    class="thumbnail-wrapper no-drag"
  >
    <div
      :style="{height: thumbnailHeight + 2 +'px'}"
      class="the-preview-thumbnail"
    >
      <thumbnail-display
        :thumbnail-width="thumbnailWidth"
        :thumbnail-height="thumbnailHeight"
        :src="src"
        :background-position="backgroundPosition"
        :background-size="backgroundSize"
      />
    </div>
    <div class="thumbnail-gradient" />
    <div class="time">
      <span
        :style="{ color: hoveredEnd ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)'}"
        class="flex-items"
      >{{ videoTime }}</span>
      <transition name="hovered-end">
        <base-icon
          v-if="hoveredEnd"
          class="flex-items hovered-end"
          type="hoveredEnd"
        />
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import { log } from '@/libs/Log';
import { filePathToUrl } from '@/helpers/path';
import { thumbnailService } from '@/services/media/ThumbnailService';
import ThumbnailDisplay from '@/components/PlayingView/ThumbnailDisplay.vue';
// @ts-ignore
import Icon from '@/components/BaseIconContainer.vue';
import { getThumbnailPath } from '../plugins/mediaTasks';
import { ThumbnailReplyType } from '../plugins/mediaTasks/thumbnailQueue';

export default {
  components: {
    'thumbnail-display': ThumbnailDisplay,
    'base-icon': Icon,
  },
  props: {
    currentTime: {
      type: Number,
      required: true,
    },
    thumbnailWidth: {
      type: Number,
      required: true,
    },
    thumbnailHeight: {
      type: Number,
      required: true,
    },
    positionOfThumbnail: {
      type: Number,
      required: true,
    },
    videoTime: {
      type: String,
      required: true,
    },
    hoveredEnd: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      thumbnailInterval: 1,
      thumbnailCols: 20,
      thumbnailCount: 0,
      isSaved: false,
      imgExisted: false,
      imgSrc: '',
      backgroundSize: '',
      backgroundPosition: '',
    };
  },
  computed: {
    ...mapGetters(['originSrc', 'mediaHash', 'duration']),
    src() {
      return this.imgExisted || this.isSaved ? `url("${filePathToUrl(this.imgSrc)}")` : '';
    },
  },
  watch: {
    currentTime(val: number) {
      const postion = thumbnailService.calculateThumbnailPosition(
        val, this.thumbnailInterval, this.thumbnailCols,
      );
      this.backgroundPosition = `-${postion[0]}% -${postion[1]}%`;
    },
    originSrc() {
      this.isSaved = false;
      this.imgExisted = false;
      this.imgSrc = '';
    },
  },
  mounted() {
    this.$bus.$on('set-thumbnail-src', (src: string) => {
      if (src === this.originSrc) {
        this.isSaved = true;
      }
    });
    this.$bus.$on('generate-thumbnails', async () => {
      const maxThumbnailCount = 1024;
      const width = 272;
      this.thumbnailInterval = Math.ceil(
        this.duration / Math.min(this.duration, window.screen.width, maxThumbnailCount),
      );
      this.thumbnailCount = Math.ceil(this.duration / this.thumbnailInterval);
      this.backgroundSize = `2000% ${Math.ceil(this.thumbnailCount / this.thumbnailCols) * 100}%`;

      log.debug('generate-thumbnails', this.thumbnailInterval, this.thumbnailCount);
      getThumbnailPath(this.originSrc, this.thumbnailInterval, width, this.thumbnailCols)
        .then((thumbnail?: ThumbnailReplyType) => {
          if (thumbnail && thumbnail.videoPath === this.originSrc) {
            this.imgSrc = thumbnail.imgPath;
            this.imgExisted = true;
          }
        })
        .catch(console.error);
    });
  },
  methods: {
  },
};
</script>
<style lang="scss" scoped>
.thumbnail-wrapper {
  position: absolute;
  bottom: 15px;
  box-sizing: content-box;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 3px;
}
.the-preview-thumbnail {
  position: absolute;
}
.thumbnail-gradient {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
}
.time {
  display: flex;
  justify-content: center;
  align-items: center;
  width: auto;
  height: 100%;
  position: relative;

  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    font-size: 20px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    font-size: 20px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    font-size: 24px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    font-size: 40px;
  }
  span {
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.8px;
    font-weight: 600;
    margin-right: 3px;
  }
  .hovered-end-enter-active {
    transition: all 5s;
  }
  .hovered-end-enter-leave {
    transition: all 8s;
  }
}
</style>
