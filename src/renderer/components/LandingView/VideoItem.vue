
<template>
  <div
    ref="item"
    :style="{
      bottom: chosen ? '9px' : '0',
      width: `${thumbnailWidth}px`,
      height: `${thumbnailHeight}px`,
      backgroundImage: backgroundUrl,
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
        ref="border"
        :style="{
          left: `-${0.7 / 2}px`,
          top: `-${0.7 / 2}px`,
          width: `${thumbnailWidth - 0.7}px`,
          height: `${thumbnailHeight - 0.7}px`,
          border: chosen ? '0.7px solid rgba(255,255,255,0.6)'
            : '0.7px solid rgba(255,255,255,0.15)',
        }"
        class="border"
      >
        <div
          ref="deleteUi"
          class="deleteUi"
        >
          <Icon type="delete" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'VideoItem',
  components: { Icon },
  props: {
    backgroundUrl: {
      type: String,
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
      showShadow: true,
      chosen: false,
      disX: NaN,
      disY: NaN,
    };
  },
  destroyed() {
    document.removeEventListener('mousemove', this.onRecentItemMousemove);
    document.removeEventListener('mouseup', this.onRecentItemMouseup);
  },
  methods: {
    onRecentItemMouseover() {
      if ((this.isInRange || this.isFullScreen) && !this.shifting) {
        this.onItemMouseover(this.index);
        this.chosen = true;
        this.$refs.border.style.setProperty('background-color', 'rgba(255,255,255,0.2)');
      }
    },
    onRecentItemMouseout() {
      this.chosen = false;
      this.$refs.border.style.setProperty('background-color', '');
    },
    onRecentItemMousedown(e: MouseEvent) {
      this.disX = e.pageX;
      this.disY = e.pageY;
      this.isDragging = false;

      if (this.isInRange) {
        document.addEventListener('mousemove', this.onRecentItemMousemove);
        document.addEventListener('mouseup', this.onRecentItemMouseup);
        this.showShadow = false;
        this.$refs.item.style.setProperty('z-index', '5');
      }
    },
    onRecentItemMousemove(e: MouseEvent) {
      this.isDragging = true;
      const movementX = e.pageX - this.disX;
      const movementY = e.pageY - this.disY;
      this.$refs.item.style.setProperty('transform', `translate(${movementX}px, ${movementY}px)`);
      if (Math.abs(movementX) >= this.thumbnailWidth
        || Math.abs(movementY) >= this.thumbnailHeight) {
        this.$refs.border.style.setProperty('background-color', 'rgba(0,0,0,0.43)');
        this.$refs.deleteUi.style.setProperty('opacity', '1');
        this.aboutToDelete = true;
      } else {
        this.$refs.border.style.setProperty('background-color', 'rgba(255,255,255,0.2');
        this.$refs.deleteUi.style.setProperty('opacity', '0');
        this.aboutToDelete = false;
      }
    },
    onRecentItemMouseup() {
      document.removeEventListener('mousemove', this.onRecentItemMousemove);
      this.showShadow = true;
      this.$refs.item.style.setProperty('transform', 'translate(0,0)');
      this.$refs.item.style.setProperty('z-index', '');
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
  transition: bottom 100ms ease-in, transform 10ms ease-in;
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
  .deleteUi {
    opacity: 0;
    transition: opacity 100ms ease-out;
  }
}
</style>
