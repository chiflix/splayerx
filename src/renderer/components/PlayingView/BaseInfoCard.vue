<template>
  <div class="container"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
    }">
    <div class="element"
      :style="{
        transform: `translate(-${borderWidth / 2}px, -${borderWidth / 2}px)`,
        borderRadius: `${borderRadius}px`,
        width: `${width - borderWidth}px`,
        height: `${height - borderWidth}px`,
        border: `${borderWidth}px solid rgba(${borderColor})`,
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
    borderColor: {
      type: String,
      default: '255, 255, 255, 0.2',
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  box-sizing: content-box;
  .element {
    position: absolute;
    box-sizing: inherit;
  }
}
</style>
