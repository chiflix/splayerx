<template>
  <div style="width: 100%; height: 100%;">
    <div
      v-if="type === 'line'"
      :style="`--tooltip-width: ${progress}%;`"
      class="line"
    />
    <div
      v-if="type === 'circle'"
      :style="`--tooltip-width: ${progress}%;`"
      class="circle"
    >
      <div
        :style="{
          clip: progress <= 50 ? 'rect(0, 20px, 20px, 10px)' : 'rect(auto, auto, auto, auto)'
        }"
        class="pie"
      >
        <div
          :style="{
            transform: `rotate(${progress*(180/50)}deg)`
          }"
          class="left"
        />
        <div
          :style="{
            display: progress <= 50 ? 'none': 'block',
            transform: 'rotate(180deg)',
          }"
          class="right"
        />
      </div>
      <div class="shadow" />
    </div>
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
  watch: {
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
    position: relative;
    .pie {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      clip: rect(auto, auto, auto, auto);
      .left, .right {
        height: 100%;
        width: 100%;
        border: 3px solid #ffffff;
        border-radius: 50%;
        clip: rect(0, 10px, 20px, 0);
        left: 0;
        position: absolute;
        top: 0;
        box-sizing: border-box;
      }
      .left {
      }
      .right {
      }
    }
    .shadow {
      height: 100%;
      width: 100%;
      border: 3px solid rgba(0,0,0,0.10);
      border-radius: 50%;
      box-sizing: border-box;
    }
  }
</style>
