<template>
  <div
    class="container"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
    }"
  >
    <slot />
    <div
      class="element"
      :style="{
        left: `-${borderWidth / 2}px`,
        top: `-${borderWidth / 2}px`,
        borderRadius: `${borderRadius}px`,
        width: `${width + borderWidth}px`,
        height: `${height + borderWidth}px`,
        border: `${borderWidth}px solid rgba(${borderColor})`,
      }"
    />
  </div>
</template>
<script>
export default {
  name: 'BaseInfoCard',
  props: {
    height: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
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
  box-sizing: content-box;
}
.element {
  position: absolute;
  box-sizing: border-box;
}
</style>
