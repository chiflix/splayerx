<template>
  <div class="cont" v-fade-in="showAllWidgets || progressTriggerStopped">
    <div class="timing"
      :data-component-name="$options.name"
      @mousedown="switchTimeContent">
          <span class="timeContent" ref="timeContent" :class="{ remainTime: isRemainTime }" v-if="hasDuration"></span>
    </div>
    <rateLabel class="rate"></rateLabel>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import rateLabel from './RateLabel.vue';

export default {
  name: 'the-time-codes',
  components: {
    rateLabel,
  },
  props: ['showAllWidgets'],
  data() {
    return {
      isRemainTime: false,
      progressTriggerStopped: false,
      progressTriggerId: 0,
      progressDisappearDelay: 1000,
    };
  },
  computed: {
    ...mapGetters(['duration', 'progressKeydown', 'rate']),
    hasDuration() {
      return !Number.isNaN(this.duration);
    },
  },
  watch: {
    rate() {
      if (!this.progressKeydown) {
        this.progressTriggerStopped = true;
        this.clock.clearTimeout(this.progressTriggerId);
        this.progressTriggerId = this.clock.setTimeout(() => {
          this.progressTriggerStopped = false;
        }, this.progressDisappearDelay);
      }
    },
    progressKeydown(newValue) {
      if (newValue) {
        this.progressTriggerStopped = true;
        this.clock.clearTimeout(this.progressTriggerId);
      } else {
        this.progressTriggerId = this.clock.setTimeout(() => {
          this.progressTriggerStopped = false;
        }, this.progressDisappearDelay);
      }
    },
  },
  methods: {
    switchTimeContent() {
      this.isRemainTime = !this.isRemainTime;
    },
    updateTimeContent(time) {
      if (this.$refs.timeContent) {
        this.$refs.timeContent.textContent =
        this.timecodeFromSeconds(this.isRemainTime ? this.duration - time : time);
      }
    },
  },
};
</script>

<style lang="scss">
@media screen and (max-width: 512px) {
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
@media screen and (min-width: 513px) and (max-width: 854px) {
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
@media screen and (min-width: 855px) and (max-width: 1920px) {
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
@media screen and (min-width: 1921px) {
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
