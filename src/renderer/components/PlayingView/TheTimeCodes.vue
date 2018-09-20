<template>
  <div class="timing"
    :data-component-name="$options.name"
    @mousedown="switchStateOfContent">
        <span class="firstContent" :class="{ remainTime: isRemainTime.first }">{{ content.first }}</span>
        <span class="splitSign">/</span>
        <span class="secondContent" :class="{ remainTime: isRemainTime.second }" v-if="hasDuration">{{ content.second }}</span>
  </div>
</template>
<script>
export default {
  name: 'the-time-codes',
  data() {
    return {
      contentState: 0,
      ContentStateEnum: {
        DEFAULT: 0,
        CURRENT_REMAIN: 1,
        REMAIN_DURATION: 2,
      },
    };
  },
  methods: {
    switchStateOfContent() {
      this.contentState = (this.contentState + 1) % 3;
    },
  },
  computed: {
    hasDuration() {
      return !Number.isNaN(this.$store.state.PlaybackState.Duration);
    },
    isRemainTime() {
      return {
        first: this.contentState === this.ContentStateEnum.REMAIN_DURATION,
        second: this.contentState === this.ContentStateEnum.CURRENT_REMAIN,
      };
    },
    duration() {
      return this.timecodeFromSeconds(this.$store.state.PlaybackState.Duration);
    },
    currentTime() {
      return this.timecodeFromSeconds(this.$store.state.PlaybackState.CurrentTime);
    },
    remainTime() {
      const remainTime
        = -(this.$store.state.PlaybackState.Duration - this.$store.state.PlaybackState.CurrentTime);
      return this.timecodeFromSeconds(remainTime);
    },
    content() {
      switch (this.contentState) {
        case this.ContentStateEnum.DEFAULT:
          return { first: this.currentTime, second: this.duration };
        case this.ContentStateEnum.CURRENT_REMAIN:
          return { first: this.currentTime, second: this.remainTime };
        case this.ContentStateEnum.REMAIN_DURATION:
          return { first: this.remainTime, second: this.duration };
        default: return { first: this.currentTime, second: this.duration };
      }
    },
  },
};
</script>

<style lang="scss">

.timing {
  position: absolute;
  width: auto;

  .firstContent {
    display: inline-block;
    color: rgba(255, 255, 255, 1);
    text-shadow:  0 1px 0 rgba(0,0,0,.1),
                  1px 1px 0 rgba(0,0,0,.1);
    font-weight: 500;
    letter-spacing: 0.2px;
    user-select: none;
  }

  .secondContent {
    color: rgba(255, 255, 255, 0.5);
  }

  .remainTime {
    &::before {
      content: '-';
      padding-right: 2px;
      font-family: sans-serif;
      display: inline-block;
    }
  }

  .splitSign {
    color: rgba(255, 255, 255, 0.5);
  }

  @media screen and (max-width: 854px) {
    bottom: 17px;
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
    bottom: 20px;
    left: 20px;
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
    bottom: 24px;
    left: 27px;
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
    bottom: 35px;
    left: 37px;
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
