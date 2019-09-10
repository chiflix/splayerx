<template>
  <div
    class="pip-control"
  >
    <div
      @mouseup="handleEnterPip(pipMode === 'Enter')"
      :class="hasVideo ? 'button-hover' : ''"
      class="pip-icon no-drag"
    >
      <Icon
        :type="pipIconType"
      />
    </div>
    <div
      @mouseup="switchPipType"
      @mouseover="mouseover = true"
      @mouseout="mouseover = false"
      :style="{
        opacity: hasVideo ? '1.0' : '0.3',
      }"
      :class="[
        { switch: switchPip },
        { 'icon-hover': hasVideo },
      ]"
      class="down-icon no-drag"
    >
      <Icon
        type="switchMode"
        class="icon"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import Icon from '@/components/BaseIconContainer.vue';
import { Browsing as browsingActions } from '@/store/actionTypes';

export default {
  components: {
    Icon,
  },
  props: {
    handleEnterPip: {
      type: Function,
      required: true,
    },
    hasVideo: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      switchPip: false,
    };
  },
  computed: {
    ...mapGetters(['pipMode']),
    pipIconType() {
      return this.pipMode === 'Enter' ? this.pipType : this.popType;
    },
    pipType() {
      return this.hasVideo ? 'pip' : 'pipDisabled';
    },
    popType() {
      return this.hasVideo ? 'pop' : 'popDisabled';
    },
  },
  methods: {
    ...mapActions({
      updatePipMode: browsingActions.UPDATE_PIP_MODE,
    }),
    switchPipType() {
      if (!this.hasVideo) return;
      this.updatePipMode(this.pipMode === 'Enter' ? 'Global' : 'Enter');
      this.switchPip = true;
      setTimeout(() => {
        this.switchPip = false;
      }, 300);
    },
  },
};
</script>
<style lang="scss" scoped>
.pip-control {
  min-width: 62px;
  z-index: 6;
  display: flex;
  width: 62px;
  height: 100%;
  justify-content: flex-start;
  align-items: center;
  border-left: 1px solid #F2F1F4;
  .pip-icon {
    width: 34px;
    height: 30px;
    margin-left: 8px;
    border-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 100ms ease-in, opacity 100ms ease-in;
  }
  .button-hover:hover {
    background-color: #ECEEF0;
  }
  .down-icon {
    width: 12px;
    height: 30px;
    margin-left: 0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    opacity: 0.3;
    transition: opacity 50ms linear, margin-left 100ms ease-in;
    .icon {
      margin-top: 1px;
    }
  }
  .icon-hover:hover {
    margin-left: 2px;
  }
  @keyframes icon-translate {
    0% { margin-left: 2px; }
    50% { margin-left: 6px; }
    100% { margin-left: 2px; }
  }
  .switch {
    animation: icon-translate 350ms linear 1;
  }
}
</style>
