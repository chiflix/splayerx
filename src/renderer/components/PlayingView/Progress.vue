<template>
  <div>
    <div
      v-if="type === 'line'"
      :style="`--tooltip-width: ${progress}%;`"
      class="line"
    />
    <div
      v-if="type === 'circle'"
      :style="`--tooltip-width: ${progress}%;`"
      class="cirlce"
    />
  </div>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Progress',
  props: {
    progress: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: 'line',
    },
  },
});
</script>
<style lang="scss" scoped>
  .line {
    height: 100%;
    min-height: 9px;
    background: rgba(0,0,0,0.10);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    &::before {
      content: "";
      position: absolute;
      width: var(--tooltip-width);
      height: 100%;
      background: #ffffff;
      border-radius: 6px;
    }
  }
  .circle {
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.10);
  }
</style>
