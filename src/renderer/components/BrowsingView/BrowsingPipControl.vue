<template>
  <div
    :style="{
      borderLeft: isDarwin ? isDarkMode ? '1px solid #4B4B50' : '1px solid #F2F1F4' : '',
    }"
    class="pip-control"
  >
    <div
      @mouseup="handleEnterPip(pipMode === 'Enter')"
      :title="$t(`browsing.${pipMode === 'Enter' ? 'enterPip' : 'enterPop'}`)"
      :class="hasVideo ? isDarkMode ? 'button-hover-dark' : 'button-hover' : ''"
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
        opacity: hasVideo ? '1.0' : isDarkMode ? '0.2' : '0.3',
      }"
      :class="[
        { switch: switchPip },
        { 'icon-hover': hasVideo },
      ]"
      class="down-icon no-drag"
    >
      <Icon
        :type="isDarkMode ? 'switchModeDark' : 'switchMode'"
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
    isDarkMode: {
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
    isDarwin() {
      return process.platform === 'darwin';
    },
    pipIconType() {
      return this.pipMode === 'Enter' ? this.pipType : this.popType;
    },
    pipType() {
      const type = this.hasVideo ? 'pip' : 'pipDisabled';
      return this.isDarkMode ? `${type}Dark` : type;
    },
    popType() {
      const type = this.hasVideo ? 'pop' : 'popDisabled';
      return this.isDarkMode ? `${type}Dark` : type;
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
      }, 400);
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
  .button-hover-dark:hover {
    background-color: #54545A;
  }
  .down-icon {
    width: 28px;
    height: 30px;
    padding-left: 0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    opacity: 0.3;
    transition: opacity 50ms linear, padding-left 100ms ease-in;
    .icon {
      width: 12px;
    }
  }
  .icon-hover:hover {
    padding-left: 2px;
  }
  @keyframes icon-translate {
    0% { padding-left: 2px; }
    50% { padding-left: 6px; }
    100% { padding-left: 2px; }
  }
  .switch {
    animation: icon-translate 400ms ease-out 1;
  }
}
</style>
