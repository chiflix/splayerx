<template>
  <div class="the-progress-bar"
    @mousemove="handleMousemove"
    @mouseleave="handleMouseleave"
    @mousedown="handleMousedown">
    <the-preview-thumbnail class="the-preview-thumbnail" v-show="showThumbnail"
      :currentTime="hoveredCurrentTime"
      :maxThumbnailWidth="240"
      :videoRatio="ratio"
      :videoTime="convertedHoveredCurrentTime"
      :thumbnailWidth="thumbnailWidth"
      :thumbnailHeight="thumbnailHeight"
      :positionOfThumbnail="thumbnailPosition"
      :hoveredEnd="hoveredPercent === '100%' && !!nextVideo"
     />
    <div class="fake-button left" ref="leftInvisible"
      :style="{ height: fakeButtonHeight }">
      <div class="fake-progress" :style="{ height: this.hovering ? '10px' : '4px', backgroundColor: this.leftFakeProgressBackgroundColor }">
        <div class="radius" v-if="hoveredCurrentTime === 0"></div>
      </div>
    </div>
    <div class="progress"
      :style="{ height: this.hovering ? '10px' : '4px', backgroundColor: this.progressBackgroundColor }">
      <div class="hovered" :style="{ width: this.hoveredPercent, backgroundColor: this.hoveredBackgroundColor }"></div>
      <div class="played" :style="{ width: this.playedPercent, backgroundColor: this.playedBackgroundColor }"></div>
    </div>
    <div class="fake-button right" ref="rightInvisible"
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
  props: {
    hovering: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      hoveredPageX: 0,
      showThumbnail: false,
      mousedown: false,
      mouseleave: true,
      thumbnailWidth: 272,
      hoveringId: 0,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'duration', 'currentTime', 'ratio', 'nextVideo']),
    hoveredPercent() {
      return `${this.pageXToProportion(this.hoveredPageX, 20, this.winWidth) * 100}%`;
    },
    hoveredCurrentTime() {
      return this.duration * this.pageXToProportion(this.hoveredPageX, 20, this.winWidth);
    },
    convertedHoveredCurrentTime() {
      return this.timecodeFromSeconds(this.hoveredCurrentTime);
    },
    playedPercent() {
      return `${100 * (this.currentTime / this.duration)}%`;
    },
    hoveredSmallerThanPlayed() {
      return !this.mouseleave && this.hoveredCurrentTime < this.currentTime;
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
      return this.showThumbnail ? `${this.thumbnailHeight + 20}px` : '20px';
    },
    hoveredBackgroundColor() {
      if (!this.mouseleave) {
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
      let opacity = 0.908;
      if (this.hoveredCurrentTime === 0 && this.hoveredSmallerThanPlayed) opacity = 0.3;
      if (this.hoveredCurrentTime > 0) opacity = 0.908;
      return this.whiteWithOpacity(opacity);
    },
    rightFakeProgressBackgroundColor() {
      const hoveredEnd = this.hoveredPercent === '100%';
      const playedEnd = Math.round(this.currentTime) >= Math.round(this.duration);
      const opacity = this.mouseleave ? // eslint-disable-line no-nested-ternary
        (playedEnd ? 0.9 : 0) :
        (((hoveredEnd && !playedEnd) || (!hoveredEnd && playedEnd)) ? 0.37 : 0.1);
      return this.whiteWithOpacity(hoveredEnd && playedEnd ? 0.9 : opacity);
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
      this.$emit('update:hovering', true);
      if (this.hoveringId) clearTimeout(this.hoveringId);
      if (event.target !== this.$refs.leftInvisible) this.showThumbnail = true;
      this.mouseleave = false;
    },
    handleDocumentMousemove(event) {
      if (this.mousedown) this.hoveredPageX = event.pageX;
    },
    handleMouseleave() {
      if (!this.mousedown) {
        this.setHoveringToFalse(true);
        this.showThumbnail = false;
      }
      this.mouseleave = true;
    },
    handleMousedown(event) {
      this.mousedown = true;
      if (event.target === this.$refs.leftInvisible || event.target === this.$refs.rightInvisible) {
        this.showThumbnail = false;
        this.$bus.$emit('currentWidget', 'the-video-controller');
        this.setHoveringToFalse(false);
      }
      this.$bus.$emit('seek', this.hoveredCurrentTime);
      if (this.hoveredCurrentTime === 0) {
        this.$bus.$emit('play');
      }
    },
    handleDocumentMouseup() {
      if (this.mousedown) {
        this.mousedown = false;
        if (this.mouseleave) {
          this.setHoveringToFalse(false);
          this.showThumbnail = false;
        }
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
    setHoveringToFalse(direct) {
      if (!direct) {
        if (this.hoveringId) {
          clearTimeout(this.hoveringId);
        }
        this.hoveringId = setTimeout(() => {
          this.$emit('update:hovering', false);
        }, 3000);
      } else {
        this.$emit('update:hovering', false);
      }
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
  z-index: 12;
  & > div {
    transition: background-color 150ms, height 150ms;
  }
  &:hover {
    cursor: pointer;
    & .left .radius {
      border-radius: 0 20px 20px 0;
    }
  }

  .the-preview-thumbnail {
    position: absolute;
  }

  .fake-button {
    position: relative;
    width: 20px;
    .fake-progress {
      transition: background-color 150ms, height 150ms;
      width: inherit;
      position: absolute;
      bottom: 0;
    }
    &.left .radius{
      content: '';
      width: inherit;
      height: inherit;
      background-color: rgba(255, 255, 255, 0.9);
      position: absolute;
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
