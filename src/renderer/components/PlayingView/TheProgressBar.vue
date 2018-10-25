<template>
  <div class="the-progress-bar"
    @mousemove="handleMousemove"
    @mouseleave="handleMouseleave"
    @mousedown="handleMousedown">
    <the-preview-thumbnail class="the-preview-thumbnail" v-show="hovering"
      :currentTime="hoveredCurrentTime"
      :maxThumbnailWidth="240"
      :videoRatio="ratio"
      :videoTime="convertedHoveredCurrentTime"
      :thumbnailWidth="thumbnailWidth"
      :thumbnailHeight="thumbnailHeight"
      :positionOfThumbnail="thumbnailPosition"
     />
    <div class="fake-button left"
      :style="{ height: fakeButtonHeight }">
      <div class="fake-progress" :style="{ height: this.hovering ? '10px' : '4px' }"></div></div>
    <div class="progress"
      :style="{ height: this.hovering ? '10px' : '4px' }">
      <div class="hovered" :style="{ width: this.hoveredPercent, opacity: this.hovering ? this.hoveredBackgroundOpacity : 0 }"></div>
      <div class="played" :style="{ width: this.playedPercent, opacity: this.hovering ? this.playedBackgroundOpacity : 0.9 }"></div>
    </div>
    <div class="fake-button right"
      :style="{ height: fakeButtonHeight }">
      <div class="fake-progress" :style="{ height: this.hovering ? '10px' : '4px' }"></div></div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import ThePreviewThumbnail from './ThePreviewThumbnail';
export default {
  name: 'the-progress-bar',
  components: {
    'the-preview-thumbnail': ThePreviewThumbnail,
  },
  data() {
    return {
      hoveredPageX: 0,
      hovering: false,
      mousedown: false,
      thumbnailWidth: 272,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'duration', 'roundedCurrentTime', 'ratio']),
    hoveredPercent() {
      return `${this.pageXToProportion(this.hoveredPageX) * 100}%`;
    },
    hoveredCurrentTime() {
      return Math.round(this.duration * this.pageXToProportion(this.hoveredPageX));
    },
    convertedHoveredCurrentTime() {
      return this.timecodeFromSeconds(this.hoveredCurrentTime);
    },
    playedPercent() {
      return `${100 * (this.roundedCurrentTime / this.duration)}%`;
    },
    hoveredSmallerThanPlayed() {
      return Number.parseInt(this.hoveredPercent, 10) < Number.parseInt(this.playedPercent, 10);
    },
    hoveredBackgroundOpacity() {
      return this.hoveredSmallerThanPlayed ? 0.9 : 0.3;
    },
    playedBackgroundOpacity() {
      return this.hoveredSmallerThanPlayed ? 0.3 : 0.9;
    },
    thumbnailHeight() {
      return Math.round(this.thumbnailWidth / this.ratio);
    },
    thumbnailPosition() {
      return this.pageXToThumbnailPosition(this.hoveredPageX);
    },
    fakeButtonHeight() {
      return `${this.thumbnailHeight + 20}px`;
    },
  },
  watch: {
    winWidth(newValue) {
      this.thumbnailWidth = this.winWidthToThumbnailWidth(newValue);
    },
  },
  methods: {
    handleMousemove(event) {
      this.hoveredPageX = event.pageX;
      this.hovering = true;
    },
    handleDocumentMousemove(event) {
      if (this.mousedown) this.hoveredPageX = event.pageX;
    },
    handleMouseleave() {
      if (!this.mousedown) this.hovering = false;
    },
    handleMousedown() {
      this.mousedown = true;
      this.$bus.$emit('seek', this.hoveredCurrentTime);
    },
    handleDocumentMouseup() {
      if (this.mousedown) {
        this.mousedown = false;
        this.hovering = false;
        this.$bus.$emit('seek', this.hoveredCurrentTime);
      }
    },
    pageXToProportion(pageX) {
      if (pageX <= 20) return 0;
      if (pageX >= this.winWidth - 20) return 1;
      return (pageX - 20) / (this.winWidth - 40);
    },
    pageXToThumbnailPosition(pageX) {
      if (pageX <= 20 + (this.thumbnailWidth / 2)) return 20;
      if (pageX > this.winWidth - (20 + (this.thumbnailWidth / 2))) {
        return this.winWidth - (20 + this.thumbnailWidth);
      }
      return pageX - (this.thumbnailWidth / 2);
    },
    winWidthToThumbnailWidth(winWidth) {
      let thumbnailWidth = 0;
      const reactivePhases = {
        winWidth: [513, 846, 1921, 3841],
        thumbnailWidth: [100, 136, 170, 272],
      };
      reactivePhases.winWidth.some((value, index) => {
        if (winWidth < value) {
          thumbnailWidth = reactivePhases.thumbnailWidth[index];
          return true;
        }
        return false;
      });
      return thumbnailWidth;
    },
  },
  created() {
    document.addEventListener('mousemove', this.handleDocumentMousemove);
    document.addEventListener('mouseup', this.handleDocumentMouseup);
    this.thumbnailWidth = this.winWidthToThumbnailWidth(this.winWidth);
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.handleDocumentMousemove);
    document.removeEventListener('mouseup', this.handleDocumentMouseup);
  },
};
</script>
<style lang="scss" scoped>
.the-progress-bar {
  display: flex;
  align-items: flex-end;
  position: absolute;
  width: 100%;
  bottom: 0;
  -webkit-app-region: no-drag;
  height: 20px;
  opacity: 0.9;
  background-color: transparent;
  & div {
    transition: height 150ms;
  }
  &:hover {
    .progress {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .right .fake-progress{
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .the-preview-thumbnail {
    position: absolute;
  }

  .fake-button {
    position: relative;
    width: 20px;
    opacity: 0.9;
    background-color: transparent;
    .fake-progress {
      width: inherit;
      position: absolute;
      bottom: 0;
    }
  }
  .left .fake-progress{
    background-color: white;
  }

  .progress {
    position: relative;
    width: calc(100% - 40px);
    & div {
      position: absolute;
      bottom: 0;
      transition: opacity 300ms;
      height: inherit;
    }
    .hovered {
      background-color: white;
    }
    .played {
      background-color: white;
    }
  }
}
</style>
