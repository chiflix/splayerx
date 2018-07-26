<template>
  <transition name="fade">
  <div class="timing" id="timing"
    @mousedown.stop="switchStateOfContent"
    @mouseover.stop="appearTimeCode"
    @mousemove.stop="throttledCall"
    v-show="showTimeCode">
        <span class="firstContent" :class="{ remainTime: isRemainTime.first }">{{ content.first }}</span>
        <span class="splitSign">/</span>
        <span class="secondContent" :class="{ remainTime: isRemainTime.second }" v-if="hasDuration">{{ content.second }}</span>
  </div>
</transition>
</template>;

<script>
import _ from 'lodash';

export default {
  name: 'TimeCodes',
  data() {
    return {
      showTimeCode: false,
      timeoutIdOftimeCodeDisappearDelay: 0,
      contentState: 0,
      ContentStateEnum: {
        DEFAULT: 0,
        CURRENT_REMAIN: 1,
        REMAIN_DURATION: 2,
      },
      throttledCall: null,
    };
  },
  methods: {
    switchStateOfContent() {
      this.$_clearTimeoutDelay();
      this.contentState = (this.contentState + 1) % 3;
    },
    appearTimeCode() {
      this.$_clearTimeoutDelay();
      this.showTimeCode = true;
    },
    hideTimeCode() {
      this.showTimeCode = false;
    },
    clearAllWidgetsTimeout() {
      this.$bus.$emit('clearAllWidgetDisappearDelay');
    },
    $_clearTimeoutDelay() {
      if (this.timeoutIdOftimeCodeDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOftimeCodeDisappearDelay);
      }
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
  created() {
    this.$bus.$on('timecode-appear-delay', () => {
      this.appearTimeCode();
      if (this.timeoutIdOftimeCodeDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOftimeCodeDisappearDelay);
        this.timeoutIdOftimeCodeDisappearDelay
          = setTimeout(this.hideTimeCode, 3000);
      } else {
        this.timeoutIdOftimeCodeDisappearDelay
          = setTimeout(this.hideTimeCode, 3000);
      }
    });
    this.$bus.$on('timecode-appear', this.appearTimeCode);
    this.$bus.$on('timecode-hide', this.hideTimeCode);
  },
  beforeMount() {
    this.throttledCall = _.throttle(this.clearAllWidgetsTimeout, 500);
  },
};
</script>

<style lang="scss">

.video-controller .timing {
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
    bottom: 23px;
    left: 25px;
    height: 18px;
    font-size: 18px;
    line-height: 18px;
    .secondContent {
      font-size: 12px;
    }
  }
  @media screen and (min-width: 854px) and (max-width: 1920px) {
    bottom: 28.75px;
    left: 31.25px;
    height: 22.5px;
    font-size: 22.5px;
    line-height: 24px;
    .secondContent {
      font-size: 16px;
    }
  }
  @media screen and (min-width: 1920px) {
    bottom: 46px;
    left: 50px;
    height: 36px;
    font-size: 36px;
    line-height: 36px;
    .secondContent {
      font-size: 24px;
    }
  }
}
.timing:hover {
  cursor: pointer;
}

.video-controller .timing .timing--current {
  opacity: 1;
}

.fade-enter-active {
 transition: opacity 100ms;
}

.fade-leave-active {
 transition: opacity 400ms;
}

.fade-enter-to, .fade-leave {
 opacity: 1;
}

.fade-enter, .fade-leave-to {
 opacity: 0;
}
</style>
