<template>
  <div class="the-progress-bar"
    @mousemove="handleMousemove"
    @mouseleave="hovering = false"
    @mousedown="handleMousedown">
    <div class="fake-button left"></div>
    <div class="progress">
      <div class="hovered" :style="{ width: this.hoveredPercent, opacity: this.hovering ? this.hoveredBackgroundOpacity : 0 }"></div>
      <div class="played" :style="{ width: this.playedPercent, opacity: this.hovering ? this.playedBackgroundOpacity : 0.9 }"></div>
    </div>
    <div class="fake-button right"></div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
export default {
  name: 'the-progress-bar',
  data() {
    return {
      hoveredPageX: 0,
      hovering: false,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'duration', 'roundedCurrentTime']),
    hoveredPercent() {
      return `${this.pageXToProportion(this.hoveredPageX) * 100}%`;
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
  },
  methods: {
    handleMousemove(event) {
      this.hoveredPageX = event.pageX;
      this.hovering = true;
    },
    handleMousedown(event) {
      const hoveredPart = this.pageXToProportion(event.pageX);
      this.$bus.$emit('seek', Math.round(hoveredPart * this.duration));
    },
    pageXToProportion(pageX) {
      if (pageX <= 20) return 0;
      if (pageX >= this.winWidth - 20) return 1;
      return (pageX - 20) / (this.winWidth - 40);
    },
  },
};
</script>
<style lang="scss" scoped>
.the-progress-bar {
  display: flex;
  align-items: flex-end;
  position: absolute;
  width: 100%;
  bottom: 60px;
  -webkit-app-region: no-drag;
  height: 20px;
  opacity: 0.9;
  background-color: transparent;
  & div {
    height: 4px;
    transition: height 150ms;
  }
  &:hover {
    & div {
      height: 10px;
    }
    .progress {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .right {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .fake-button {
    width: 20px;
    opacity: 0.9;
  }
  .left {
    background-color: white;
  }

  .progress {
    position: relative;
    width: calc(100% - 40px);
    & div {
      position: absolute;
      bottom: 0;
      transition: opacity 150ms;
      transition: height 150ms;
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
