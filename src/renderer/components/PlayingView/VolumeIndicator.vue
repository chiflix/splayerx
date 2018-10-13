<template>
  <div class="indicator-container" :style="{ height: backgroundHeight + 24 + 'px', top: containerTop + 'px' }">
    <base-info-card :containerWidth="winWidth > 1920 ? 12 : 6" :containerHeight="backgroundHeight">
      <div class="indicator" :style="{ height: volume * 100 + '%', opacity: mute ? 0.25 : 0.8 }"></div>
    </base-info-card>
    <base-icon v-show="mute || volume <= 0" class="mute" type="volume" :style="{ top: muteTop + 'px' }" effect="mute" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BaseInfoCard from './BaseInfoCard.vue';
import BaseIcon from '../BaseIconContainer.vue';
export default {
  name: 'volume-indicator',
  components: {
    'base-info-card': BaseInfoCard,
    'base-icon': BaseIcon,
  },
  computed: {
    ...mapGetters(['volume', 'mute', 'winWidth', 'winHeight']),
    backgroundHeight() {
      return this.winWidth > 1920 ? Math.round(this.winHeight * 0.37)
        : Math.round(100 + ((this.winWidth - 320) / 5.33));
    },
    containerTop() {
      return Math.round(this.winHeight - this.backgroundHeight) / 2;
    },
    muteTop() {
      return this.backgroundHeight + (this.winWidth > 1920 ? 4 : 2);
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
    .indicator {
      width: 8px;
    }
  }
  .indicator {
    width: 4px;
    background: white;
    border-radius: 0 1px 1px 0;
    position: absolute;
    bottom: 0;
  }
  .mute {
    position: absolute;
  }
}
</style>
