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
      <div class="fake-progress" :style="{ height: this.hovering ? '10px' : '4px', backgroundColor: this.leftFakeProgressBackgroundColor }"></div></div>
    <div class="progress"
      :style="{ height: this.hovering ? '10px' : '4px', backgroundColor: this.progressBackgroundColor }">
      <div class="hovered" :style="{ width: this.hoveredPercent, backgroundColor: this.hoveredBackgroundColor }"></div>
      <div class="played" :style="{ width: this.playedPercent, backgroundColor: this.playedBackgroundColor }"></div>
    </div>
    <div class="fake-button right"
      :style="{ height: fakeButtonHeight }">
      <div class="fake-progress" :style="{ height: this.hovering ? '10px' : '4px', backgroundColor: this.rightFakeProgressBackgroundColor }"></div></div>
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
      mouseleave: true,
      thumbnailWidth: 272,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'duration', 'currentTime', 'ratio']),
    hoveredPercent() {
      return `${this.pageXToProportion(this.hoveredPageX, 20, this.winWidth) * 100}%`;
    },
    hoveredCurrentTime() {
      return Math.round(this.duration *
        this.pageXToProportion(this.hoveredPageX, 20, this.winWidth));
    },
    convertedHoveredCurrentTime() {
      return this.timecodeFromSeconds(this.hoveredCurrentTime);
    },
    playedPercent() {
      return `${100 * (this.currentTime / this.duration)}%`;
    },
    hoveredSmallerThanPlayed() {
      return Number.parseInt(this.hoveredPercent, 10) < Number.parseInt(this.playedPercent, 10);
    },
    thumbnailHeight() {
      return Math.round(this.thumbnailWidth / this.ratio);
    },
    thumbnailPosition() {
      return this.pageXToThumbnailPosition(
        this.hoveredPageX, 20,
        this.thumbnailWidth, this.winWidth,
      );
    },
    fakeButtonHeight() {
      return `${this.thumbnailHeight + 20}px`;
    },
    hoveredBackgroundColor() {
      if (this.hovering) {
        return this.hoveredSmallerThanPlayed ?
          this.whiteWithOpacity(0.86) : this.whiteWithOpacity(0.3);
      }
      return this.whiteWithOpacity(0);
    },
    playedBackgroundColor() {
      if (this.hovering) {
        return this.hoveredSmallerThanPlayed ?
          this.whiteWithOpacity(0.3) : this.whiteWithOpacity(0.9);
      }
      return this.whiteWithOpacity(0.9);
    },
    progressBackgroundColor() {
      return this.hovering ? this.whiteWithOpacity(0.1) : this.whiteWithOpacity(0);
    },
    leftFakeProgressBackgroundColor() {
      return this.whiteWithOpacity(0.9);
    },
    rightFakeProgressBackgroundColor() {
      const hoveredNumber = Math.round((this.hoveredCurrentTime / this.duration) * 100);
      const playedNumber = Math.round((this.currentTime / this.duration) * 100);
      if (this.hovering) {
        if (
          (hoveredNumber === 100 && playedNumber < 100) ||
          (hoveredNumber < 100 && playedNumber === 100)) return this.whiteWithOpacity(0.37);
        if (hoveredNumber < 100 && playedNumber < 100) return this.whiteWithOpacity(0.1);
        if (playedNumber === 100) return this.whiteWithOpacity(0.37);
      }
      if (playedNumber === 100) return this.whiteWithOpacity(0.9);
      return this.whiteWithOpacity(0);
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
      this.mouseleave = false;
    },
    handleDocumentMousemove(event) {
      if (this.mousedown) this.hoveredPageX = event.pageX;
    },
    handleMouseleave() {
      if (!this.mousedown) this.hovering = false;
      this.mouseleave = true;
    },
    handleMousedown() {
      this.mousedown = true;
      this.$bus.$emit('seek', this.hoveredCurrentTime);
      if (this.hoveredCurrentTime === 0) this.$bus.$emit('play');
    },
    handleDocumentMouseup() {
      if (this.mousedown) {
        this.mousedown = false;
        if (this.mouseleave) this.hovering = false;
        this.$bus.$emit('seek', this.hoveredCurrentTime);
      }
    },
    pageXToProportion(pageX, fakeButtonWidth, winWidth) {
      if (pageX <= fakeButtonWidth) return 0;
      if (pageX >= winWidth - fakeButtonWidth) return 1;
      return (pageX - fakeButtonWidth) / (winWidth - (fakeButtonWidth * 2));
    },
    pageXToThumbnailPosition(pageX, fakeButtonWidth, thumbnailWidth, winWidth) {
      if (pageX <= fakeButtonWidth + (thumbnailWidth / 2)) return fakeButtonWidth;
      if (pageX > winWidth - (fakeButtonWidth + (thumbnailWidth / 2))) {
        return winWidth - (fakeButtonWidth + thumbnailWidth);
      }
      return pageX - (thumbnailWidth / 2);
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
    whiteWithOpacity(opacity) {
      return `rgba(255, 255, 255, ${opacity}`;
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
  & > div {
    transition: background-color 300ms, height 150ms;
  }
  &:hover {
    cursor: pointer;
  }

  .the-preview-thumbnail {
    position: absolute;
  }

  .fake-button {
    position: relative;
    width: 20px;
    .fake-progress {
      transition: background-color 300ms, height 150ms;
      width: inherit;
      position: absolute;
      bottom: 0;
    }
  }

  .progress {
    position: relative;
    width: calc(100% - 40px);
    & div {
      position: absolute;
      bottom: 0;
      height: inherit;
    }
  }
}
</style>
