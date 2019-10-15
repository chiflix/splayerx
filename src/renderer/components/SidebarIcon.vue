<template>
  <div
    :title="$t(title)"
    :class="[{ light: selected }, { drag: isDragging }]"
    :style="{
      transform: `translateY(${iconTranslateY}px)`,
      zIndex: isDragging ? '10' : '',
      opacity: isDragging ? '1.0' : '',
      transition: itemDragging && !isDragging ? 'transform 100ms linear' : '',
    }"
    @mousedown="handleMousedown"
    class="icon-hover no-drag"
  >
    <Icon
      :type="icon"
    />
    <div
      :class="{ selected: selected }"
      class="mask"
    />
  </div>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    index: {
      type: Number,
      default: NaN,
    },
    title: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
    path: {
      type: String,
      default: '',
    },
    selected: {
      type: Boolean,
      default: false,
    },
    selectSidebar: {
      type: Function,
      default: null,
    },
    itemDragging: {
      type: Boolean,
      default: false,
    },
    indexOfMovingItem: {
      type: Number,
      default: NaN,
    },
    indexOfMovingTo: {
      type: Number,
      default: NaN,
    },
  },
  data() {
    return {
      isDragging: false,
      mousedown: false, // about to delete
      mousedownY: NaN,
      iconTranslateY: 0,
    };
  },
  watch: {
    itemDragging() {
      this.iconTranslateY = 0;
    },
    indexOfMovingTo(index: number) {
      if (!this.isDragging) {
        if (index >= this.index && this.indexOfMovingItem < this.index) {
          this.iconTranslateY = -56;
        } else if (index <= this.index && this.indexOfMovingItem > this.index) {
          this.iconTranslateY = 56;
        } else if (this.iconTranslateY !== 0) {
          this.iconTranslateY = 0;
        }
      }
    },
  },
  methods: {
    handleMousedown(e: MouseEvent) {
      this.mousedown = true;
      this.mousedownY = e.clientY;
      this.$emit('index-of-moving-item', this.index);
      document.addEventListener('mousemove', this.handleMousemove);
      document.addEventListener('mouseup', this.handleMouseup, { once: true });
    },
    handleMousemove(e: MouseEvent) {
      this.isDragging = true;
      this.iconTranslateY = e.clientY - this.mousedownY;
      this.$emit('is-dragging', true);
      const offset = 15;
      let movingTo = e.clientY - this.mousedownY > 0
        ? Math.floor((e.clientY - this.mousedownY + offset) / 56 + this.index)
        : Math.ceil((e.clientY - this.mousedownY - offset) / 56 + this.index);
      if (movingTo < 0) movingTo = 0;
      this.$emit('index-of-moving-to', movingTo);
    },
    handleMouseup() {
      document.removeEventListener('mousemove', this.handleMousemove);
      if (this.isDragging) {
        this.isDragging = false;
        this.$emit('is-dragging', false);
        this.iconTranslateY = 0;
        this.mousedown = false;
      } else {
        this.selectSidebar(this.url, this.path);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
div {
  transition: opacity 100ms ease-in;
  opacity: 0.7;
  width: 44px;
  height: 44px;
}
.icon-hover {
  position: relative;
  &:hover {
    opacity: 1.0;
  }
}
.mask {
  width: 44px;
  height: 44px;
  position: absolute;
  top: 0px;
}
.light {
  opacity: 1;
}
.selected {
  opacity: 1;
  border: 2px solid #E0E0EA;
  border-radius: 100%;
  box-sizing: border-box;
}
.drag {
  border-radius: 100%;
  box-shadow: 0 0 6px 2px rgba(0,0,0,0.7);
}
</style>
