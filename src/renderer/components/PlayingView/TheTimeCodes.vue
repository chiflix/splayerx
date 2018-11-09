<template>
  <div class="timing"
    :data-component-name="$options.name"
    @mousedown="switchTimeContent">
        <span class="timeContent" :class="{ remainTime: isRemainTime }" v-if="hasDuration">{{ timeContent }}</span>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
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

.timing {
  position: absolute;
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

  @media screen and (max-width: 512px) {
    bottom: 20px;
    left: 20px;
    height: 18px;
    font-size: 18px;
    .secondContent {
      font-size: 13px;
    }
    .splitSign {
      font-size: 13px;
    }
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    bottom: 24px;
    left: 28px;
    height: 20px;
    font-size: 18px;
    .secondContent {
      font-size: 14px;
    }
    .splitSign {
      font-size: 14px;
    }
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    bottom: 31px;
    left: 33px;
    height: 24px;
    font-size: 24px;
    .secondContent {
      font-size: 18px;
    }
    .splitSign {
      font-size: 18px;
    }
  }
  @media screen and (min-width: 1921px) {
    bottom: 44px;
    left: 51px;
    height: 36px;
    font-size: 36px;
    .secondContent {
      font-size: 26px;
    }
    .splitSign {
      font-size: 26px;
    }
  }
}
.timing:hover {
  cursor: pointer;
}

.timing .timing--current {
  opacity: 1;
}
</style>