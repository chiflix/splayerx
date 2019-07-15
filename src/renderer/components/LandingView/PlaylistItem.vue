
<template>
  <div
    :style="{
      transform: `translate(${movementX}px, ${movementY}px)`,
      zIndex: mousedown ? '5' : '',
    }"
    class="playlist-item"
  >
    <div
      :style="{
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
        transform: `translateY(-${layer1Y}px) scale(0.8, 0.8)`,
      }"
      class="layer1"
    />
    <div
      :style="{
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
        transform: `translateY(-${layer2Y}px) scale(0.9, 0.9)`,
      }"
      class="layer2"
    />
    <div
      :style="{
        bottom: chosen ? '10px' : '0',
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
        backgroundImage: backgroundUrl,
      }"
      class="item"
    >
      <div
        :style="{
          width: `${thumbnailWidth}px`,
          height: chosen ? `${thumbnailHeight + 11}px` : `${thumbnailHeight}px`,
        }"
        @click.stop="onRecentItemClick"
        @mouseenter="onRecentItemMouseenter"
        @mouseleave="onRecentItemMouseleave"
        @mousedown.stop="onRecentItemMousedown"
        @mouseup="onRecentItemMouseup"
        class="content"
      >
        <div
          :style="{
            left: `-${0.7 / 2}px`,
            top: `-${0.7 / 2}px`,
            width: `${thumbnailWidth - 0.7}px`,
            height: `${thumbnailHeight - 0.7}px`,
            border: chosen ? '0.7px solid rgba(255,255,255,0.6)'
              : '0.7px solid rgba(255,255,255,0.15)',
            backgroundColor: aboutToDelete ? 'rgba(0,0,0,0.43)'
              : chosen ? 'rgba(255,255,255,0.2)' : '',
          }"
          class="border"
        >
          <transition name="fade-100">
            <Icon
              v-show="aboutToDelete"
              type="delete"
            />
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'PlaylistItem',
  components: { Icon },
  props: {
    backgroundUrl: {
      type: String,
      default: '',
    },
    shifting: {
      type: Boolean,
    },
    isInRange: {
      type: Boolean,
    },
    index: {
      type: Number,
      default: 0,
    },
    thumbnailHeight: {
      type: Number,
      default: 63,
    },
    thumbnailWidth: {
      type: Number,
      default: 112,
    },
    canHover: {
      type: Boolean,
      default: false,
    },
    isFullScreen: {
      type: Boolean,
    },
    onItemMouseover: {
      type: Function,
      required: true,
    },
    onItemClick: {
      type: Function,
      required: true,
    },
    onItemDelete: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      displayInfo: [],
      coverVideo: null,
      coverSrc: '',
      isDragging: false,
      aboutToDelete: false,
      chosen: false,
      mousedown: false,
      mousedownX: NaN,
      mousedownY: NaN,
      movementX: NaN,
      movementY: NaN,
      layer1Y: NaN,
      layer2Y: NaN,
    };
  },
  destroyed() {
    document.removeEventListener('mousemove', this.onRecentItemMousemove);
    document.removeEventListener('mouseup', this.onRecentItemMouseup);
  },
  methods: {
    onRecentItemMouseenter() {
      if ((this.isInRange || this.isFullScreen) && !this.shifting && this.canHover) {
        this.onItemMouseover(this.index);
        this.chosen = true;
        this.layer2Y = 4;
      }
    },
    onRecentItemMouseleave() {
      this.chosen = false;
      this.layer2Y = 0;
    },
    onRecentItemMousedown(e: MouseEvent) {
      this.mousedown = true;
      this.isDragging = false;
      this.mousedownX = e.pageX;
      this.mousedownY = e.pageY;

      if (this.isInRange) {
        document.addEventListener('mousemove', this.onRecentItemMousemove);
        document.addEventListener('mouseup', this.onRecentItemMouseup);
      }
    },
    onRecentItemMousemove(e: MouseEvent) {
      this.isDragging = true;
      this.movementX = e.pageX - this.mousedownX;
      this.movementY = e.pageY - this.mousedownY;

      if (Math.abs(this.movementX) >= this.thumbnailWidth - 5
        || Math.abs(this.movementY) >= this.thumbnailHeight - 10) {
        this.layer1Y = 8;
        this.layer2Y = 10;
        this.aboutToDelete = true;
      } else if (Math.abs(this.movementX) >= this.thumbnailWidth - 30
        || Math.abs(this.movementY) >= this.thumbnailHeight - 30) {
        const percentageX = (Math.abs(this.movementX) - (this.thumbnailWidth - 30)) / 25;
        const percentageY = (Math.abs(this.movementY) - (this.thumbnailHeight - 30)) / 24;
        const percentage = percentageX > percentageY ? percentageX : percentageY;
        this.layer1Y = 8 * percentage;
        this.layer2Y = 4 + (6 * percentage);
        this.aboutToDelete = false;
      } else {
        this.layer1Y = 0;
        this.layer2Y = 4;
        this.aboutToDelete = false;
      }
    },
    onRecentItemMouseup() {
      document.removeEventListener('mousemove', this.onRecentItemMousemove);
      document.removeEventListener('mouseup', this.onRecentItemMouseup);
      this.layer1Y = 0;
      this.layer2Y = 4;
      this.mousedown = false;
      this.movementX = this.movementY = 0;
      if (this.aboutToDelete) {
        this.onItemDelete(this.index);
        this.aboutToDelete = false;
      }
    },
    onRecentItemClick() {
      if (!this.isDragging && !this.shifting) {
        this.onItemClick(this.index);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$border-radius: 3px;
.layer1 {
  position: absolute;
  bottom: 1px;
  transform-origin: bottom center;
  transform: scale(0.8, 0.8);
  transition: transform 80ms ease-in;

  background-color: rgba(74,74,74,0.60);
  border: 0.7px solid rgba(255,255,255,0.1);
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.30);
  border-radius: $border-radius;
}
.layer2 {
  position: absolute;
  bottom: 1px;
  transform-origin: bottom center;
  transform: scale(0.9, 0.9);
  transition: transform 80ms ease-in;

  background-color: rgba(60,60,60,0.80);
  border: 0.7px solid rgba(255,255,255,0.25);
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.40);
  border-radius: $border-radius;
}
.item {
  transition: bottom 100ms ease-in;
  position: relative;
  cursor: pointer;
  border-radius: $border-radius;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-color: rgb(60, 60, 60);

  .shadow {
    position: absolute;
    z-index: -1;
    top: 50%;
    left: 10px;
    right: 10px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    border-radius: 50px;
  }
  .content {
    position: absolute;
    top: 0;
    border-radius: $border-radius;
  }
  .border {
    position: absolute;
    box-sizing: content-box;
    border-radius: $border-radius;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: border 100ms ease-out, background-color 100ms ease-out;
  }
}
</style>
