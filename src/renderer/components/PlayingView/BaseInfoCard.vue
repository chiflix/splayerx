<template>
  <div class="container"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
    }">
    <div class="element"
      :style="{
        borderRadius: `${borderRadius}px`,
        width: `${width - borderWidth}px`,
        height: `${height - borderWidth}px`,
      }"></div>
      <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'base-info-card',
  props: {
    height: {
      type: Number,
    },
    width: {
      type: Number,
    },
    borderWidth: {
      type: Number,
      default: 0.7,
    },
    borderRadius: {
      type: Number,
      default: 2,
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  box-sizing: content-box;
  .element {
    z-index: 500;
    position: absolute;
    border: 0.7px solid rgba(255,255,255,0.2);
    transform: translate(-0.35px, -0.35px);
    box-sizing: inherit;
  }
}
</style>

