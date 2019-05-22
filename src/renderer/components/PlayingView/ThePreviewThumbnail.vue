<template>
  <div
    class="thumbnail-wrapper"
    :style="{
      width: thumbnailWidth +'px',
      height: thumbnailHeight +'px',
      transform: `translateX(${positionOfThumbnail}px)`
    }"
  >
    <div
      class="the-preview-thumbnail"
      :style="{height: thumbnailHeight + 2 +'px'}"
    >
      <thumbnail-display
        :quick-hash="mediaHash"
        :max-thumbnail-width="maxThumbnailWidth"
        :current-time="currentTime"
        :thumbnail-width="thumbnailWidth"
        :thumbnail-height="thumbnailHeight"
      />
    </div>
    <div class="thumbnail-gradient" />
    <div class="time">
      <span
        class="flex-items"
        :style="{ color: hoveredEnd ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)'}"
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

<script>
import { mapGetters } from 'vuex';
import Icon from '../BaseIconContainer.vue';
import ThumbnailDisplay from './ThumbnailDisplay.vue';

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
    maxThumbnailWidth: {
      type: Number,
      required: true,
    },
    videoRatio: {
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
      videoCurrentTime: 0,
      generationInterval: 3,
      mountVideo: false,
      mountImage: false,
      maxThumbnailCount: 0,
      lastGenerationIndex: 0,
      currentIndex: 0,
    };
  },
  computed: {
    ...mapGetters(['originSrc', 'convertedSrc', 'mediaHash', 'duration']),
  },
  watch: {
  },
  created() {
  },
  methods: {
  },
};
</script>
<style lang="scss" scoped>
.thumbnail-wrapper {
  position: absolute;
  bottom: 15px;
  -webkit-app-region: no-drag;
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
