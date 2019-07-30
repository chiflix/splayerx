
<template>
  <div
    :style="{
      bottom: chosen ? '9px' : '0',
      width: `${thumbnailWidth}px`,
      height: `${thumbnailHeight}px`,
      backgroundImage: backgroundUrl,
      transform: `translate(${movementX}px, ${movementY}px)`,
      zIndex: mousedown ? '5' : '',
      cursor: isInRange ? 'pointer' : `${cursorUrl}, pointer`,
    }"
    class="item"
  >
    <div
      :style="{
        width: `${thumbnailWidth}px`,
        height: chosen ? `${thumbnailHeight + 10}px` : `${thumbnailHeight}px`,
      }"
      @click.stop="onRecentItemClick(item)"
      @mouseout="onRecentItemMouseout"
      @mouseover="onRecentItemMouseover"
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
</template>

<script lang="ts">
import { join } from 'path';
import { filePathToUrl } from '@/helpers/path';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'VideoItem',
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
      default: NaN,
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
      item: null,
      coverSrc: '',
      isDragging: false,
      aboutToDelete: false,
      chosen: false,
      mousedown: false,
      mousedownX: NaN,
      mousedownY: NaN,
      movementX: NaN,
      movementY: NaN,
      cursorUrl: '',
    };
  },
  created() {
    this.cursorUrl = `url("${filePathToUrl(join(__static, 'cursor/cursor.svg') as string)}")`;
  },
  destroyed() {
    document.removeEventListener('mousemove', this.onRecentItemMousemove);
    document.removeEventListener('mouseup', this.onRecentItemMouseup);
  },
  methods: {
    onRecentItemMouseover() {
      if ((this.isInRange || this.isFullScreen) && !this.shifting && this.canHover) {
        this.onItemMouseover(this.index);
        this.chosen = true;
      }
    },
    onRecentItemMouseout() {
      this.chosen = false;
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
      if (Math.abs(this.movementX) >= this.thumbnailWidth
        || Math.abs(this.movementY) >= this.thumbnailHeight) {
        this.aboutToDelete = true;
      } else {
        this.aboutToDelete = false;
      }
    },
    onRecentItemMouseup() {
      document.removeEventListener('mousemove', this.onRecentItemMousemove);
      document.removeEventListener('mouseup', this.onRecentItemMouseup);
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
.item {
  transition: bottom 100ms ease-in;
  position: relative;
  border-radius: $border-radius;
  cursor: pointer;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-color: rgb(60, 60, 60);
}

.mask {
  background-color: rgba(0,0,0,0.43);
  opacity: 1;
  border-radius: $border-radius;
  width: 100%;
  height: calc(100% - 9px);
}
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
</style>
