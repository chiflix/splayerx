<template>
  <div
    v-fade-in="showAllWidgets || progressTriggerStopped"
    class="cont"
  >
    <div
      @mousedown="switchTimeContent"
      class="timing"
    >
      <span
        ref="timeContent"
        v-if="hasDuration"
        :class="{ remainTime: isRemainTime }"
        class="timeContent"
      />
    </div>
    <Labels
      :rate="rate"
      :show-cycle-label="showCycleLabel"
      :show-speed-label="showSpeedLabel"
      class="rate"
    />
  </div>
</template>
<script lang="ts">
import { videodata } from '@/store/video';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import Labels from './Labels.vue';

export default {
  name: 'TheTimeCodes',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    Labels,
  },
  props: {
    duration: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      default: 1,
    },
    showCycleLabel: Boolean,
    showSpeedLabel: Boolean,
    showAllWidgets: Boolean,
    progressTriggerStopped: Boolean,
  },
  data() {
    return {
      isRemainTime: false,
      progressTriggerId: 0,
      progressDisappearDelay: 1000,
    };
  },
  computed: {
    hasDuration() {
      return !Number.isNaN(this.duration);
    },
  },
  watch: {
  },
  created() {
  },
  methods: {
    switchTimeContent() {
      this.isRemainTime = !this.isRemainTime;
      if (this.$refs.timeContent) {
        if (this.isRemainTime) {
          this.$refs.timeContent.textContent = this.timecodeFromSeconds(
            Math.floor(this.duration) - Math.floor(videodata.time),
          );
        } else {
          this.$refs.timeContent.textContent = this.timecodeFromSeconds(Math.floor(videodata.time));
        }
      }
    },
    updateTimeContent(time: number) {
      if (this.$refs.timeContent) {
        this.$refs.timeContent.textContent = this.timecodeFromSeconds(this.isRemainTime
          ? Math.floor(this.duration) - Math.floor(time) : Math.floor(time));
      }
    },
  },
};
</script>

<style lang="scss">
@media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
  .cont {
    bottom: 23px;
    left: 20px;
  }
  .timing {
    height: 18px;
    font-size: 18px;
    .secondContent {
      font-size: 13px;
    }
    .splitSign {
      font-size: 13px;
    }
  }
  .rate {
    margin: 4px 1px auto 7px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .cont {
    bottom: 27px;
    left: 28px;
  }
  .timing {
     height: 20px;
     font-size: 18px;
     .secondContent {
       font-size: 14px;
     }
     .splitSign {
       font-size: 14px;
     }
   }
  .rate {
    margin: auto 2px 0 9px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .cont {
    bottom: 34px;
    left: 33px;
  }
  .timing {
    height: 24px;
    font-size: 24px;
    .secondContent {
      font-size: 18px;
    }
    .splitSign {
      font-size: 18px;
    }
  }
  .rate {
    margin: auto 3px 0 11px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .cont {
    bottom: 44px;
    left: 51px;
  }
  .timing {
    height: 36px;
    font-size: 36px;
    .secondContent {
      font-size: 26px;
    }
    .splitSign {
      font-size: 26px;
    }
  }
  .rate {
    margin: 9px 4px auto 13px;
  }
}
.cont {
  position: absolute;
  width: auto;
  height: auto;
  display: flex;
  flex-direction: row;
  z-index: 5;
}
.timing {
  position: relative;
  width: auto;
  .timeContent {
    display: inline-block;
    color: rgba(255, 255, 255, 1);
    text-shadow:  0 1px 0 rgba(0,0,0,.1),
                  1px 1px 0 rgba(0,0,0,.1);
    font-weight: 600;
    letter-spacing: 0.9px;
    user-select: none;
  }

  .remainTime {
    &::before {
      content: '-';
      padding-right: 4px;
      font-weight: 600;
      display: inline-block;
    }
  }

  .splitSign {
    color: rgba(255, 255, 255, 0.5);
  }

}
.timing:hover {
  cursor: pointer;
}

.timing .timing--current {
  opacity: 1;
}
</style>
