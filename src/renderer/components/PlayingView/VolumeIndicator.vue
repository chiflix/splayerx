<template>
  <div
    ref="showArea"
    @mouseenter="enterArea"
    @mouseleave="leaveArea"
    @dblclick="handleDbClick"
    :style="{
      zIndex: isProfessional ? '12': '4',
    }"
    class="show-area"
  >
    <div
      :class="showVolume ? 'fade-in' : 'fade-out'"
      :style="{cursor: showAllWidgets ? 'pointer' : 'none'}"
      @mouseenter="actionArea"
      @mouseleave="leaveActionArea"
      @mousedown="mouseDownOnIndicator"
      @dblclick.stop=""
      class="trigger-area no-drag"
    >
      <div
        :style="{
          top: isDarwin ? '-10px' : '-15px',
          opacity: muted ? 0.25 : 0.8,
        }"
        class="volume-span"
      >
        <transition name="fade">
          <span v-show="volume >= 1 && showIcon">{{ displayVolume }}</span>
        </transition>
      </div>
      <div
        ref="indicatorContainer"
        :class="borderClass"
        class="indicator-container"
      >
        <div class="container card">
          <div class="element bottom">
            <div class="element content">
              <div
                v-show="showHint"
                class="hint"
              />
              <div
                ref="indicator"
                :style="{
                  height: volume * 100 + '%',
                  opacity: muted ? 0.25 : 0.8,
                }"
                class="indicator"
              />
            </div>
          </div>
        </div>
      </div>
      <div
        @mouseup="mouseupOnMuteIcon"
        class="volume"
      >
        <transition name="fade">
          <base-icon
            v-show="showIcon"
            :type="muted || volume <= 0 ? 'mute' : 'volume'"
            class="volume-icon"
          />
        </transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import BaseIcon from '../BaseIconContainer.vue';

export default {
  name: 'VolumeIndicator',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    'base-icon': BaseIcon,
  },
  props: {
    showAllWidgets: Boolean,
    mousedownOnPlayButton: Boolean,
    attachedShown: Boolean,
    muted: Boolean,
    volume: {
      type: Number,
      default: 1,
    },
    volumeKeydown: Boolean,
    ratio: {
      type: Number,
      default: 1,
    },
    isFullScreen: Boolean,
    wheelTriggered: {
      type: Number,
      default: 0,
    },
    volumeWheelTriggered: Boolean,
    currentWidget: {
      type: String,
      default: '',
    },
    handleUpdateVolume: {
      type: Function,
      default: () => {},
    },
    handleUpdateMuted: {
      type: Function,
      default: () => {},
    },
    isProfessional: {
      type: Boolean,
      default: false,
    },
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
      isMoved: false,
      canToggleMute: false,
      firstAppear: true, // appear the volume indicator when switch from LandingView to PlayingView
    };
  },
  computed: {
    showHint() {
      return this.volume >= 1.01;
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
    displayVolume() {
      return Math.floor(this.volume > 1 ? this.volume * 100 : 100);
    },
    showVolume() {
      return (this.inArea && this.showAllWidgets
        && !this.mousedownOnPlayButton && !this.attachedShown)
        || this.firstAppear
        || this.mousedown || this.volumeTriggerStopped || (this.muted && this.showAllWidgets);
    },
    borderClass() {
      return this.volumeTriggerStopped || this.mouseover || this.mousedown ? 'border-in' : 'border-out';
    },
    showIcon() {
      return this.volumeTriggerStopped || this.mouseover || this.mousedown || this.muted;
    },
  },
  watch: {
    showAllWidgets(val: boolean) {
      if (!val) this.volumeTriggerStopped = false;
    },
    wheelTriggered() {
      if (this.volumeWheelTriggered) {
        const { volumeTriggerTimerId } = this;
        this.volumeTriggerStopped = true;
        clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      }
    },
    showVolume(val: boolean) {
      if (!val) document.onmouseup = null;
    },
    muted(val: boolean) {
      const { volumeTriggerTimerId } = this;
      if (!this.volumeKeydown && this.volume !== 0) {
        this.volumeTriggerStopped = true;
        clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      } else if (this.volumeKeydown && val) {
        if (!this.showAllWidgets) {
          this.volumeTriggerStopped = true;
          clearTimeout(volumeTriggerTimerId);
          this.volumeTriggerTimerId = setTimeout(() => {
            this.volumeTriggerStopped = false;
          }, 1000);
        } else {
          this.volumeTriggerStopped = this.showAllWidgets;
          clearTimeout(volumeTriggerTimerId);
        }
      }
    },
    volume() {
      const { volumeTriggerTimerId } = this;
      if (!this.volumeKeydown) {
        this.volumeTriggerStopped = true;
        clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      }
    },
    volumeKeydown(newVal: boolean, oldVal: boolean) {
      const { volumeTriggerTimerId } = this;
      if (newVal) {
        this.volumeTriggerStopped = true;
        clearTimeout(volumeTriggerTimerId);
      } else if (!newVal && oldVal) {
        clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      }
    },
  },
  created() {
    this.enterArea();
    this.actionArea();
    setTimeout(() => {
      this.leaveArea();
      this.firstAppear = false;
    }, 2000);
    if (this.muted) {
      this.volumeTriggerStopped = this.showAllWidgets;
    }
  },
  methods: {
    handleDbClick() {
      this.$bus.$emit('toggle-fullscreen');
    },
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
    mouseDownOnIndicator(e: MouseEvent) {
      this.canToggleMute = true;
      const backgroundHeight = 100 + ((window.innerHeight - 180) / 3);
      const containerTop = (window.innerHeight - (backgroundHeight + 26)) / 2;
      const percentOfVolume = ((window.innerHeight - e.clientY) - (containerTop) - 19)
        / this.$refs.indicatorContainer.clientHeight;
      if (percentOfVolume >= 0) {
        this.handleUpdateVolume(percentOfVolume * 100);
      }
      this.mousedown = true;
      this.$emit('update:volume-state', true);
      this.isMoved = false;
      document.addEventListener('mousemove', this.globalMousemoveHandler);
      document.addEventListener('mouseup', this.globalMouseupHandler);
    },
    globalMousemoveHandler(e: MouseEvent) {
      this.isMoved = true;
      const backgroundHeight = 100 + ((window.innerHeight - 180) / 3);
      const containerTop = (window.innerHeight - (backgroundHeight + 26)) / 2;
      const percentOfVolume = ((window.innerHeight - e.clientY) - (containerTop) - 19)
        / this.$refs.indicatorContainer.clientHeight;
      this.handleUpdateVolume(percentOfVolume * 100);
    },
    globalMouseupHandler() {
      if (this.isMoved) {
        this.$ga.event('app', 'volume', 'drag');
      } else {
        this.$ga.event('app', 'volume', 'mousedown');
      }
      document.removeEventListener('mousemove', this.globalMousemoveHandler);
      document.removeEventListener('mouseup', this.globalMouseupHandler);
      this.mousedown = false;
      this.$emit('update:volume-state', false);
      if (!this.inArea) this.mouseover = false;
      this.canToggleMute = false;
    },
    mouseupOnMuteIcon() {
      if (this.canToggleMute && !this.isMoved) {
        if (this.volume <= 0) {
          this.handleUpdateVolume(10);
        } else {
          this.handleUpdateMuted();
        }
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
    .volume-span {
      position: absolute;
      opacity: 0.8;
      font-family: DINCondensed-Bold;
      font-size: 16px;
      color: #FFFFFF;
      text-align: center;
    }
    .indicator-container {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      border-radius: 2.5px;
      width: var(--indicator-container-width);
      height: calc(var(--background-height) + 4px);
      top: 0;
      .hint {
        position: relative;
        z-index: 1;
        height: 4px;
        background-color: #F55F5F;
        width: 100%;
      }
      .container {
        min-width: 3px;
        min-height: 3px;;
        border-radius: 1px;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        position: absolute;
        box-sizing: content-box;
        .element {
          border-radius: 1px;
          position: absolute;
          box-sizing: inherit;
        }
        .bottom {
          min-width: 3px;
          min-height: 3px;;
          width: 100%;
          height: 100%;
          top: 0;
          background-image: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }
        .middle {
          min-width: 3px;
          min-height: 3px;;
          width: 100%;
          height: 100%;
          top: 0;
          background: rgba(255, 255, 255, 0.2);
        }
        .content {
          min-width: var(--content-min-width);
          min-height: var(--content-min-height);
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          top: 1px;
          left: 1px;
          background-color: transparent;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
          display: flex;
          overflow: hidden;
        }
      }
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
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 auto 0 auto;
      width: 100%;
      height: calc(var(--indicator-container-width) + 10px);
      .volume-icon {
        margin: 0 auto 0 auto;
        width: var(--indicator-container-width);
        height: var(--indicator-container-width);
      }
    }
    @media
      screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
      screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
      margin-right: 23px;
    }
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
      margin-right: 30px;
    }
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
      margin-right: 38px;
    }
    @media
      screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
      screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
      margin-right: 57px;
    }
  }
}
</style>
