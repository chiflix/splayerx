<template>
  <div class="cont">
    <div class="timing"
      :data-component-name="$options.name"
      @mousedown="switchTimeContent">
          <span class="timeContent" :class="{ remainTime: isRemainTime }" v-if="hasDuration">{{ timeContent }}</span>
    </div>
    <rateLabel class="rate"></rateLabel>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import rateLabel from './RateLabel.vue';
export default {
  name: 'the-time-codes',
  data() {
    return {
      isRemainTime: false,
    };
  },
  methods: {
    switchTimeContent() {
      this.isRemainTime = !this.isRemainTime;
    },
  },
  components: {
    rateLabel,
  },
  computed: {
    ...mapGetters(['roundedCurrentTime', 'duration']),
    hasDuration() {
      return !Number.isNaN(this.duration) && !Number.isNaN(this.roundedCurrentTime);
    },
    convertedCurrentTime() {
      return this.timecodeFromSeconds(this.roundedCurrentTime);
    },
    remainTime() {
      const remainTime
        = -(this.duration - this.roundedCurrentTime);
      return this.timecodeFromSeconds(remainTime);
    },
    timeContent() {
      return this.isRemainTime ?
        this.remainTime : this.convertedCurrentTime;
    },
  },
};
</script>

<style lang="scss">
@media screen and (max-width: 512px) {
  .cont {
    bottom: 20px;
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
    bottom: 24px;
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
    bottom: 31px;
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
