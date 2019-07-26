<template>
  <div style="width: 100%; height: 100%;">
    <div
      v-if="type === 'line'"
      class="line"
    >
      <div
        :style="{
          width: `${progress}%`,
          background: frontColor,
        }"
        :class="`${animate ? 'animate line-progress' : 'line-progress'}`"
      />
    </div>
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
    animate: {
      type: Boolean,
      default: true,
    },
  },
  watch: {
  },
});
</script>
<style lang="scss" scoped>
  @keyframes progress {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }
  .line {
    height: 100%;
    min-height: 7px;
    background: rgba(0,0,0,0.10);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    .line-progress {
      position: absolute;
      height: 100%;
      border-radius: 6px;
      overflow: hidden;
      &.animate {
        &::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 100%;
          background-image: linear-gradient(
            270deg,
          rgba(255,255,255,0.00) 0%,
          rgba(255,255,255,0.75) 34%,
          rgba(255,255,255,0.92) 49%,
          rgba(255,255,255,0.76) 64%,
          rgba(255,255,255,0.00) 100%,
          rgba(255,255,255,0.00) 100%
          );
          animation: progress 2s infinite;
        }
      }
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
