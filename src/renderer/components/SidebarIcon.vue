<template>
  <div
    :title="$t(title)"
    :class="{ light: selected }"
    :style="{
      transform: isDragging ? `translateY(${iconTranslateY}px)` : '',
      zIndex: isDragging ? '10' : '0',
      opacity: isDragging ? '1.0' : '',
    }"
    @mousedown="handleMousedown"
    class="icon-hover"
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
import { setElementStyle } from '@/libs/dom';

export default {
  components: {
    Icon,
  },
  props: {
    index: {
      type: Number,
    },
    title: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isDragging: false,
      mousedown: false,
      mousedownY: NaN,
      iconTranslateY: 0,
    };
  },
  methods: {
    handleMousedown(e: MouseEvent) {
      this.mousedown = true;
      this.mousedownY = e.clientY;
      document.addEventListener('mousemove', this.handleMousemove);
      document.addEventListener('mouseup', this.handleMouseup);
    },
    handleMousemove(e: MouseEvent) {
      this.isDragging = true;
      this.iconTranslateY = e.clientY - this.mousedownY;
    },
    handleMouseup(index: number) {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.handleMousemove);
      this.mousedown = false;
      console.log('mouseup');
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
  position: relative;
  top: -50px;
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
</style>
