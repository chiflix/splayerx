<template>
  <div
    ref="container"
    class="container"
  >
    <div
      :class="{
        'element': true,
        'bottom': true,
        'backdrop': useBlur,
      }"
    >
      <div class="element content">
        <slot />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'BaseInfoCard',
  props: {
    borderRadius: {
      type: Number,
      default: 1,
      validator: (value: number) => value > 0,
    },
    contentMinWidth: {
      type: Number,
      default: 1,
      validator: (value: number) => value > 0,
    },
    contentMinHeight: {
      type: Number,
      default: 1,
      validator: (value: number) => value > 0,
    },
    useBlur: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    contentMinWidth(newVal: number) {
      this.$refs.container.style.setProperty('--content-min-width', `${newVal}px`);
    },
    contentMinHeight(newVal: number) {
      this.$refs.container.style.setProperty('--content-min-height', `${newVal}px`);
    },
  },
  mounted() {
    this.$refs.container.style.setProperty('--border-radius', `${this.borderRadius}px`);
    this.$refs.container.style.setProperty('--content-min-width', `${this.contentMinWidth}px`);
    this.$refs.container.style.setProperty('--content-min-height', `${this.contentMinHeight}px`);
  },
};
</script>

<style lang="scss" scoped>
.container {
  --border-radius: 1px;
  --content-min-width: 1px;
  --content-min-height: 1px;
  min-width: calc(var(--content-min-width) + 2px);
  min-height: calc(var(--content-min-height) + 2px);
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
    min-height: calc(var(--content-min-height) + 2px);
    width: 100%;
    height: 100%;
    top: 0;
    border: 1px solid rgba(160,160,160,0.9);
    // box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.5);
    background-image: radial-gradient(
      80% 130%,
      rgba(85,85,85,0.88) 20%,
      rgba(85,85,85,0.78) 50%,
      rgba(85,85,85,0.72) 60%,
      rgba(85,85,85,0.46) 80%,
      rgba(85,85,85,0.00) 100%
    );
  }
  .backdrop {
    border-width: 0px;
    background-image: none;
    background-color: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }
  .middle {
    min-width: calc(var(--content-min-width) + 2px);
    min-height: calc(var(--content-min-height) + 2px);
    width: 100%;
    height: 100%;
    top: 0;
    background: rgba(255, 255, 255, 0.2);
  }
  .content {
    min-width: var(--content-min-width);
    min-height: var(--content-min-height);
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    top: 1px;
    left: 1px;
    background-color: transparent;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
    display: flex;
    overflow: hidden;
  }

}
</style>
