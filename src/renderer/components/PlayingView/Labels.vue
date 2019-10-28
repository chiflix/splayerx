<template>
  <div class="labels">
    <transition name="cycle-label">
      <div
        :key="showCycleLabel"
        v-show="showCycleLabel || showPlaylistLoopLabel"
        class="cycle-label"
      >
        <Icon
          :type="showCycleLabel ? 'cycleOne': 'cycle'"
          class="cycle-icon"
        />
      </div>
    </transition>
    <transition name="label">
      <div
        key="speed"
        v-show="showSpeedLabel"
        class="speed-label"
      >
        <Icon
          type="speed"
          class="speed-icon"
        />
        <div class="rate-num">
          {{ Number.parseFloat(rate).toFixed(1) }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'SpeedLabel',
  components: {
    Icon,
  },
  props: {
    rate: {
      type: Number,
      default: 1,
    },
    showCycleLabel: Boolean,
    showSpeedLabel: Boolean,
    showPlaylistLoopLabel: Boolean,
  },
};
</script>

<style lang="scss" scoped>
.labels {
  display: flex;
  .speed-label {
    background-image: radial-gradient(
      60% 134%,
      rgba(255,255,255,0.09) 44%,
      rgba(255,255,255,0.05) 100%
    );
    border: 0.5px solid rgba(255,255,255,0.20);
    backdrop-filter: blur(5px);
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    .rate-num {
      color: rgba(255, 255, 255, 0.36);
      font-weight: 600;
    }
  }
  .cycle-label {
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: radial-gradient(
      60% 134%,
      rgba(255,255,255,0.09) 44%,
      rgba(255,255,255,0.05) 100%
    );
    border: 0.5px solid rgba(255,255,255,0.20);
    backdrop-filter: blur(5px);
    border-radius: 5px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
  .labels {
    height: 15px;
    .speed-label {
      .speed-icon {
        margin: auto 0 auto 7.5px;
      }
      .rate-num {
        line-height: 10px;
        font-size: 10px;
        margin: auto 7px auto 2.5px;
      }
    }
    .cycle-label {
      width: 23px;
      margin-right: 5px;
    }
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .labels {
    height: 15px;
    .speed-label {
      .speed-icon {
        margin: auto 0 auto 7.5px;
      }
      .rate-num {
        line-height: 10px;
        font-size: 10px;
        margin: auto 7px auto 2.5px;
      }
    }
    .cycle-label {
      width: 23px;
      margin-right: 5px;
    }
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .labels {
    height: 18px;
    .speed-label {
      .speed-icon {
        margin: auto 0 auto 8px;
      }
      .rate-num {
        line-height: 12px;
        font-size: 12px;
        margin: auto 8px auto 3px;
      }
    }
    .cycle-label {
      width: 28px;
      margin-right: 6px;
    }
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .labels {
    height: 28px;
    .speed-label {
      .speed-icon {
        margin: 8px 0 0 12px;
      }
      .rate-num {
        line-height: 16px;
        font-size: 16px;
        margin: 6px 10px 0 4px;
      }
    }
    .cycle-label {
      width: 38px;
      margin-right: 9px;
    }
  }
}
.label-enter-active, .label-leave-active {
  transition: opacity .3s;
}
.label-enter, .label-leave-to {
  opacity: 0;
}
.cycle-label-enter-active {
  transition: opacity 300ms;
}
.cycle-label-enter, .cycle-label-leave-to {
  opacity: 0;
}
</style>
