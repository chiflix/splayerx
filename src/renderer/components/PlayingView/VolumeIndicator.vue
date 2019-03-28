<template>
<div class="show-area" ref="showArea"
  @mouseenter="enterArea"
  @mouseleave="leaveArea">
  <div class="trigger-area"
    :class="showVolume ? 'fade-in' : 'fade-out'"
    :style="{cursor: showAllWidgets ? 'pointer' : 'none'}"
    @mouseenter="actionArea"
    @mouseleave="leaveActionArea"
    @mousedown="mouseDownOnIndicator">
    <div ref="indicatorContainer"
      :class="borderClass"
      class="indicator-container">
      <base-info-card class="card" ref="card">
        <div class="indicator" ref="indicator"
          :style="{
            height: volume * 100 + '%',
            opacity: muted ? 0.25 : 0.8,
          }"/>
      </base-info-card>
    </div>
    <div class="volume"
      @mouseup="mouseupOnMuteIcon">
      <transition name="fade">
        <base-icon v-show="showIcon" class="volume-icon" type="volume" :effect="muted || volume <= 0 ? 'mute' : 'icon'" />
      </transition>
    </div>
  </div>
</div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { Video as videoActions } from '@/store/actionTypes';
import BaseInfoCard from './InfoCard.vue';
import BaseIcon from '../BaseIconContainer.vue';

export default {
  name: 'volume-indicator',
  components: {
    'base-info-card': BaseInfoCard,
    'base-icon': BaseIcon,
  },
  data() {
    return {
      volumeTriggerStopped: false, // true when volume's changing
      volumeTriggerTimerId: 0,
      volumeFadingId: NaN,
      borderFadingId: NaN,
      inArea: false,
      mouseover: false,
      mousedown: false,
      canToggleMute: false,
    };
  },
  props: ['showAllWidgets', 'mousedownOnPlayButton', 'attachedShown'],
  computed: {
    ...mapGetters(['muted', 'volumeKeydown', 'ratio', 'isFullScreen', 'wheelTriggered', 'volumeWheelTriggered']),
    ...mapState({
      currentWidget: ({ Input }) => Input.mousemoveComponentName,
    }),
    showVolume() {
      return (this.inArea && this.showAllWidgets
        && !this.mousedownOnPlayButton && !this.attachedShown)
        || this.mousedown || this.volumeTriggerStopped || (this.muted && this.showAllWidgets);
    },
    volume: {
      get() {
        return this.$store.getters.volume;
      },
      set(val) {
        this.$store.dispatch(videoActions.VOLUME_UPDATE, val * 100);
      },
    },
    borderClass() {
      return this.volumeTriggerStopped || this.mouseover || this.mousedown ? 'border-in' : 'border-out';
    },
    showIcon() {
      return this.volumeTriggerStopped || this.mouseover || this.mousedown || this.muted;
    },
  },
  methods: {
    enterArea() {
      this.inArea = true;
      if (this.volumeFadingId) clearTimeout(this.volumeFadingId);
    },
    leaveArea() {
      if (this.volumeFadingId) clearTimeout(this.volumeFadingId);
      this.volumeFadingId = setTimeout(() => {
        this.inArea = false;
      }, 200);
    },
    actionArea() {
      this.mouseover = true;
      if (this.borderFadingId) clearTimeout(this.borderFadingId);
    },
    leaveActionArea() {
      if (!this.mousedown) {
        if (this.borderFadingId) clearTimeout(this.borderFadingId);
        this.borderFadingId = setTimeout(() => {
          this.mouseover = false;
        }, 200);
      }
    },
    mouseDownOnIndicator(e) {
      this.canToggleMute = true;
      const backgroundHeight = 100 + ((window.innerHeight - 180) / 3);
      const containerTop = (window.innerHeight - (backgroundHeight + 26)) / 2;
      const percentOfVolume = ((window.innerHeight - e.clientY) - (containerTop) - 19) /
        this.$refs.indicatorContainer.clientHeight;
      if (percentOfVolume > 0) this.volume = percentOfVolume;
      this.mousedown = true;
      this.$emit('update:volume-state', true);
      let isMoved = false;
      document.onmousemove = (e) => {
        isMoved = true;
        const percentOfVolume = ((window.innerHeight - e.clientY) - (containerTop) - 19) /
          this.$refs.indicatorContainer.clientHeight;
        if (percentOfVolume > 0) this.volume = percentOfVolume;
      };
      document.onmouseup = () => {
        if (isMoved) {
          this.$ga.event('app', 'volume', 'drag');
        } else {
          this.$ga.event('app', 'volume', 'mousedown');
        }
        document.onmousemove = null;
        this.mousedown = false;
        this.$emit('update:volume-state', false);
        if (!this.inArea) this.mouseover = false;
        this.canToggleMute = false;
      };
    },
    mouseupOnMuteIcon() {
      if (this.canToggleMute) {
        if (this.volume <= 0) {
          this.volume = 0.1;
        } else {
          this.$store.dispatch(videoActions.TOGGLE_MUTED);
        }
      }
    },
    handleFullScreen() {
      const winHeight = window.screen.height;
      const winWidth = window.screen.width;
      const winRatio = winWidth / winHeight;
      // the height of video after scaling
      const videoRealHeight = winRatio > this.ratio ? winHeight : winWidth / this.ratio;
      const backgroundHeight = videoRealHeight <= 1080 ? ((videoRealHeight - 180) / 3) + 100
        : winHeight * 0.37;
      const muteTop = videoRealHeight <= 1080 ? backgroundHeight + 2 : backgroundHeight + 4;
      if (!this.isFullScreen) {
        requestAnimationFrame(() => {
          this.$refs.showArea.style.setProperty('--background-height', `${backgroundHeight}px`);
          this.$refs.showArea.style.setProperty('--mute-top', `${muteTop}px`);
        });
      } else {
        requestAnimationFrame(() => {
          this.$refs.showArea.style.setProperty('--background-height', '');
          this.$refs.showArea.style.setProperty('--mute-top', '');
        });
      }
    },
  },
  created() {
    if (this.muted) {
      this.volumeTriggerStopped = this.showAllWidgets;
    }
    this.$bus.$on('toggle-fullscreen', this.handleFullScreen);
    this.$bus.$on('to-fullscreen', this.handleFullScreen);
    this.$bus.$on('off-fullscreen', this.handleFullScreen);
  },
  watch: {
    showAllWidgets(val) {
      if (!val) this.volumeTriggerStopped = false;
    },
    wheelTriggered() {
      if (this.volumeWheelTriggered) {
        const { clock, volumeTriggerTimerId } = this;
        this.volumeTriggerStopped = true;
        clock.clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = clock.setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      }
    },
    showVolume(val) {
      if (!val) document.onmouseup = null;
    },
    muted(val) {
      const { clock, volumeTriggerTimerId } = this;
      if (!this.volumeKeydown && this.volume !== 0) {
        this.volumeTriggerStopped = true;
        clock.clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = clock.setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      } else if (this.volumeKeydown && val) {
        if (!this.showAllWidgets) {
          this.volumeTriggerStopped = true;
          clock.clearTimeout(volumeTriggerTimerId);
          this.volumeTriggerTimerId = clock.setTimeout(() => {
            this.volumeTriggerStopped = false;
          }, 1000);
        } else {
          this.volumeTriggerStopped = this.showAllWidgets;
          clock.clearTimeout(volumeTriggerTimerId);
        }
      }
    },
    volume() {
      const { clock, volumeTriggerTimerId } = this;
      if (!this.volumeKeydown) {
        this.volumeTriggerStopped = true;
        clock.clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = clock.setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      }
    },
    volumeKeydown(newVal, oldVal) {
      const { clock, volumeTriggerTimerId } = this;
      if (newVal) {
        this.volumeTriggerStopped = true;
        clock.clearTimeout(volumeTriggerTimerId);
      } else if (!newVal && oldVal) {
        clock.clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = clock.setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@keyframes fadein {
  0% {opacity: 0};
  100% {opacity: 1};
}
@keyframes fadeout {
  0% {opacity: 1};
  100% {opacity: 0};
}
@keyframes borderout {
  0% {
    border-width: 1.5px;
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.4);
  };
  100% {
    border-width: 1.5px;
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.0);
  };
}
@keyframes borderin {
  100% {
    border-width: 1.5px;
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.4);
  };
  0% {
    border-width: 1.5px;
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.0);
  };
}
.fade-enter-active {
  transition: opacity 150ms linear;
}
.fade-leave-active {
  transition: opacity 300ms linear;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.fade-in {
  animation: fadein 100ms linear 1 normal forwards;
}
.fade-out {
  animation: fadeout 300ms linear 1 normal forwards;
}
.border-in {
  animation: borderin 100ms linear 1 normal forwards;
}
.border-out {
  animation: borderout 300ms linear 1 normal forwards;
}
.show-area {
  position: absolute;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  right: 0;
  z-index: 5;
  width: 100px;
  height: calc(var(--background-height) + 30px);
  top: var(--container-top);
  --indicator-container-width: 9px;
  --window-height: 100vh;
  --window-width: 100vw;
  --init-height: 100px;
  --extra-height: calc((var(--window-height) - 180px) / 3);
  --background-height: calc(var(--init-height) + var(--extra-height)); // indicator-height
  --remain-height: calc(var(--window-height) - var(--background-height) - 30px);
  --container-top: calc(var(--remain-height) / 2);
  --mute-top: var(--background-height);
  .trigger-area {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    width: calc(var(--indicator-container-width) + 10px);
    height: calc(var(--background-height) + 30px);
    cursor: pointer;
    .indicator-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      border-radius: 2.5px;
      width: calc(var(--indicator-container-width));
      height: calc(var(--background-height) + 4px);
      top: 0;
      .card {
        width: calc(var(--indicator-container-width) / 2);
        height: var(--background-height);
      }
      .indicator {
        position: absolute;
        width: 100%;
        background: white;
        border-radius: 0 1px 1px 0;
        bottom: 0px;
      }
    }
    .volume {
      padding: 0 auto 0 auto;
      width: 100%;
      height: calc(var(--indicator-container-width) + 10px);
      .volume-icon {
        margin: 0 auto 0 auto;
        width: var(--indicator-container-width);
        height: var(--indicator-container-width);
      }
    }
    @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      margin-right: 23px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-right: 30px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-right: 38px;
    }
    @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-right: 57px;
    }
  }
}
</style>
