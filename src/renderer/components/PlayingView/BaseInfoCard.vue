<template>
  <div class="container" ref="container">
    <div class="element bottom"><div class="element middle"><div class="element content"><slot></slot></div></div></div>
  </div>
</template>
<script>
export default {
  name: 'base-info-card',
  props: {
    borderRadius: {
      type: Number,
      default: 1,
      validator: value => value >= 1 && !Number.isFinite(value),
    },
    contentMinWidth: {
      type: Number,
      default: 1,
      validator: value => value >= 1 && !Number.isFinite(value),
    },
  },
  mounted() {
    this.$refs.container.style.setProperty('--border-radius', `${this.borderRadius}px`);
    this.$refs.container.style.setProperty('--content-min-width', `${this.contentMinWidth}px`);
  },
};
</script>

<style lang="scss" scoped>
.container {
  --border-radius: 1px;
  --content-min-width: 20px;
  min-width: calc(var(--content-min-width) + 2px);
  border-radius: var(--border-radius);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  position: absolute;
  box-sizing: content-box;
  .element {
    border-radius: var(--border-radius);
    position: absolute;
    box-sizing: inherit;
  }
  .bottom {
    min-width: calc(var(--content-min-width) + 2px);
    width: 100%;
    height: 100%;
    top: 0;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    clip-path: inset(0 round var(--border-radius));
  }
  .middle {
    min-width: calc(var(--content-min-width) + 2px);
    width: 100%;
    height: 100%;
    top: 0;
    background: rgba(255, 255, 255, 0.2);
  }
  .content {
    min-width: var(--content-min-width);
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    top: 1px;
    left: 1px;
    background-color: transparent;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
    display: flex;
  }
}
</style>

