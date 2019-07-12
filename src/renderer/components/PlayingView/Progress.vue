<template>
  <div style="width: 100%; height: 100%;">
    <div
      v-if="type === 'line'"
      :style="`--tooltip-width: ${progress}%; --tooltip-color: ${frontColor};`"
      class="line"
    />
    <div
      v-if="type === 'circle'"
      :style="`--tooltip-width: ${progress}%;`"
      class="circle"
    >
      <div
        :class="progress <= 50 ? 'pie--clip' : 'pie--auto'"
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
    frontColor: {
      type: String,
      default: '#ffffff',
    },
  },
  watch: {
  },
});
</script>
<style lang="scss" scoped>
  .line {
    height: 100%;
    min-height: 7px;
    background: rgba(0,0,0,0.10);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    &::before {
      content: "";
      position: absolute;
      width: var(--tooltip-width);
      height: 100%;
      background: var(--tooltip-color);
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
      clip: auto;
      .left, .right {
        height: 100%;
        width: 100%;
        border: 1px solid #ffffff;
        border-radius: 50%;
        clip: rect(0, 5px, 10px, 0);
        left: 0;
        position: absolute;
        top: 0;
        box-sizing: border-box;
      }
      .left {
      }
      .right {
      }
      &--clip {
        clip: rect(0, 10px, 10px, 5px);
      }
      &--auto {
        clip: auto;
      }
    }
    .shadow {
      height: 100%;
      width: 100%;
      border: 1px solid rgba(0,0,0,0.10);
      border-radius: 50%;
      box-sizing: border-box;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      .pie {
        .left, .right {
          border: 2px solid #ffffff;
          clip: rect(0, 7px, 14px, 0);
        }
        &--clip {
          clip: rect(0, 14px, 14px, 7px);
        }
      }
      .shadow {
        border: 2px solid rgba(0,0,0,0.10);
      }
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
    screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      .pie {
        .left, .right {
          border: 2px solid #ffffff;
          clip: rect(0, 10px, 20px, 0);
        }
        &--clip {
          clip: rect(0, 20px, 20px, 10px);
        }
      }
      .shadow {
        border: 3px solid rgba(0,0,0,0.10);
      }
    }
  }
</style>
