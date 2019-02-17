<template>
  <div v-fade-in="showVolume" class="indicator-container" ref="indicatorContainer">
    <base-info-card class="card" ref="card">
      <div class="indicator" ref="indicator"
        :style="{
          height: volume * 100 + '%',
          opacity: muted ? 0.25 : 0.8,
        }"></div>
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
    ...mapGetters(['volume', 'muted', 'volumeKeydown', 'ratio', 'isFullScreen']),
    ...mapState({
      validWheelTarget: ({ Input }) => Input.wheelTarget === 'the-video-controller',
      wheelTimestamp: ({ Input }) => Input.wheelTimestamp,
    }),
    showVolume() {
      return this.volumeTriggerStopped;
    },
  },
  methods: {
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
          this.$refs.indicatorContainer.style.setProperty('--background-height', `${backgroundHeight}px`);
          this.$refs.indicatorContainer.style.setProperty('--mute-top', `${muteTop}px`);
        });
      } else {
        requestAnimationFrame(() => {
          this.$refs.indicatorContainer.style.setProperty('--background-height', '');
          this.$refs.indicatorContainer.style.setProperty('--mute-top', '');
        });
      }
    },
  },
  created() {
    this.$bus.$on('toggle-fullscreen', this.handleFullScreen);
    this.$bus.$on('to-fullscreen', this.handleFullScreen);
    this.$bus.$on('off-fullscreen', this.handleFullScreen);
  },
  watch: {
    showAllWidgets(newVal) {
      if (this.muted) {
        this.volumeTriggerStopped = newVal;
      }
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
  width: var(--indicator-container-width);
  height: calc(var(--background-height) + 24px);
  top: var(--container-top);
  --indicator-container-width: 12px;
  --window-height: 100vh;
  --window-width: 100vw;
  --init-height: 100px;
  --extra-height: calc((var(--window-height) - 180px) / 3);
  --background-height: calc(var(--init-height) + var(--extra-height)); // indicator-height
  --remain-height: calc(var(--window-height) - var(--background-height));
  --container-top: calc(var(--remain-height) / 2);
  --mute-top: calc(var(--background-height) + 2px);
  .card {
    top: 0;
    width: calc(var(--indicator-container-width) / 2);
    height: var(--background-height);
  }
  .indicator {
    width: 100%;
    background: white;
    border-radius: 0 1px 1px 0;
    position: absolute;
    bottom: 0px;
  }
  .mute {
    position: absolute;
    top: var(--mute-top);
    width: var(--indicator-container-width);
    height: var(--indicator-container-width);
  }
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px), screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    right: 23px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    right: 30px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    right: 38px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    right: 57px;
    --background-height: calc(var(--window-height) * 0.37);
    --indicator-container-width: 24px;
    --mute-top: calc(var(--background-height) + 4px);
  }
}
</style>
