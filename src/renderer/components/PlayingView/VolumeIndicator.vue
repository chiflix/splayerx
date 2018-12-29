<template>
  <div v-hidden="showVolume" class="indicator-container">
    <base-info-card class="card">
      <div class="indicator" :style="{ height: volume * 100 + '%', opacity: muted ? 0.25 : 0.8 }"></div>
    </base-info-card>
    <base-icon v-show="muted || volume <= 0" class="mute" type="volume" effect="mute" />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
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
      volumeTriggerStopped: false,
      volumeTriggerTimerId: 0,
    };
  },
  props: ['showAllWidgets'],
  computed: {
    ...mapGetters(['volume', 'muted', 'volumeKeydown']),
    ...mapState({
      validWheelTarget: ({ Input }) => Input.wheelTarget === 'the-video-controller',
      wheelTimestamp: ({ Input }) => Input.wheelTimestamp,
    }),
    showVolume() {
      return this.volumeTriggerStopped;
    },
  },
  watch: {
    showAllWidgets(newVal) {
      const { clock, muted, volumeTriggerTimerId } = this;
      if (muted) {
        this.volumeTriggerStopped = newVal;
      }
    },
    muted() {
      const { clock, volumeTriggerTimerId } = this;
      if (!this.volumeKeydown && this.volume !== 0) {
        this.volumeTriggerStopped = true;
        clock.clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = clock.setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
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
    volumeKeydown(newVal) {
      const { clock, volumeTriggerTimerId } = this;
      if (newVal) {
        this.volumeTriggerStopped = true;
        clock.clearTimeout(volumeTriggerTimerId);
        this.volumeTriggerTimerId = clock.setTimeout(() => {
          this.volumeTriggerStopped = false;
        }, 1000);
      }
    },
    wheelTimestamp(newVal) {
      const { validWheelTarget, clock, volumeTriggerTimerId } = this;
      if (process.platform !== 'darwin' && validWheelTarget) {
        if (newVal) {
          this.volumeTriggerStopped = true;
          clock.clearTimeout(volumeTriggerTimerId);
          this.volumeTriggerTimerId = clock.setTimeout(() => {
            this.volumeTriggerStopped = false;
          }, 1000);
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.indicator-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12px;
  height: calc(var(--background-height) + 24px);
  top: var(--container-top);
  --window-height: 100vh;
  --window-width: 100vw;
  --extra-width: calc(var(--window-width) - 320px);
  --extra-height: calc(var(--extra-width) / 5.53);
  --background-height: calc(100px + var(--extra-height));
  --remain-height: calc(var(--window-height) - var(--background-height));
  --container-top: calc(var(--remain-height) / 2);
  --mute-top: calc(var(--background-height) + 2px);
  .card {
    top: 0;
    left: 3px;
    width: 6px;
    height: var(--background-height);
  }
  .indicator {
    width: 4px;
    background: white;
    border-radius: 0 1px 1px 0;
    position: absolute;
    bottom: 0px;
  }
  .mute {
    position: absolute;
    top: var(--mute-top);
  }
  @media screen and (max-width: 512px) {
    right: 23px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    right: 30px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    right: 38px;
  }
  @media screen and (min-width: 1921px) {
    right: 57px;
    width: 24px;
    --background-height: calc(var(--window-height) * 0.37);
    --mute-top: calc(var(--background-height) + 4px);
    .card {
      left: 6px;
      width: 12px;
    }
    .indicator {
      width: 10px;
    }
  }
}
</style>
