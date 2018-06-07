<template>
  <transition name="fade">
  <div class="timing" id="timing"
    @mousedown.capture.stop="switchStateOfContext"
    @mouseover.capture.stop="appearTimeCode"
    v-show="showTimeCode">
        <span class="firstContext">{{ firstContext }}<span class="secondContext" v-if="hasDuration"> / {{ secondContext }}</span></span>
  </div>
</transition>
</template>;

<script>

export default {
  name: 'TimeCodes',
  data() {
    return {
      contextState: 0,
      showTimeCode: false,
      timeoutIdOftimeCodeDisappearDelay: 0,
    };
  },
  methods: {
    switchStateOfContext() {
      this.$_clearTimeoutDelay();
      switch (this.contextState) {
        case 0:
          this.contextState = 1;
          break;
        case 1:
          this.contextState = 2;
          break;
        case 2:
          this.contextState = 0;
          break;
        default: this.contextState = 0;
      }
    },
    appearTimeCode() {
      this.$_clearTimeoutDelay();
      this.showTimeCode = true;
    },
    hideTimeCode() {
      this.showTimeCode = false;
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
    firstContext() {
      switch (this.contextState) {
        case 0:
          return this.currentTime;
        case 1:
          return this.remainTime;
        case 2:
          return this.currentTime;
        default: return this.currentTime;
      }
    },
    secondContext() {
      switch (this.contextState) {
        case 0:
          return this.duration;
        case 1:
          return this.duration;
        case 2:
          return this.remainTime;
        default: return this.duration;
      }
    },
  },
  created() {
    this.$bus.$on('timecode-appear', () => {
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
    this.$bus.$on('timecode-hide', () => {
      this.hideTimeCode();
    });
  },
};
</script>

<style lang="scss">

.video-controller .timing {
  position: absolute;
  bottom: 31px;
  left: 37px;
  height: 22px;
  width: auto;

  .firstContext {
    display: inline-block;
    color: rgba(255, 255, 255, 1);
    text-shadow:  0 1px 0 rgba(0,0,0,.1),
                  1px 1px 0 rgba(0,0,0,.1);
    font-weight: 500;
    font-size: 23px;
    line-height: 24px;
    letter-spacing: 0.2px;
    user-select: none;

    .secondContext {
      color: rgba(255, 255, 255, 0.5);
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
