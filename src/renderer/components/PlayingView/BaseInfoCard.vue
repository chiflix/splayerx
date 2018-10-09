<template>
  <div class="container" :style="{ width: containerWidth + 'px', height: containerHeight + 'px' }">
    <div class="element bottom"><div class="element middle"><div class="element content"><slot></slot></div></div></div>
  </div>
</template>
<script>
export default {
  name: 'base-info-card',
  props: {
    containerWidth: {
      type: Number,
      default: 6,
    },
    containerHeight: {
      type: Number,
      default: 400,
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  border-radius: 1px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  position: absolute;
  box-sizing: content-box;
  .element {
    border-radius: 1px;
    position: absolute;
    box-sizing: inherit;
  }
  .bottom {
    width: 100%;
    height: 100%;
    top: 0;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    clip-path: inset(0 round 1px);
  }
  .middle {
    width: 100%;
    height: 100%;
    top: 0;
    background: rgba(255, 255, 255, 0.2);
  }
  .content {
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    top: 1px;
    left: 1px;
    background-color: transparent;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
  }
}
</style>

