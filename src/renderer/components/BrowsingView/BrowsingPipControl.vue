<template>
  <div
    class="pip-control"
  >
    <div
      @mouseup="handleEnterPip(pip === 'Enter')"
      :class="hasVideo ? 'button-hover' : ''"
      class="pip-icon no-drag"
    >
      <Icon
        :type="pipMode"
      />
    </div>
    <div
      @mouseup="switchPipType"
      @mouseover="mouseover = true"
      @mouseout="mouseover = false"
      :style="{
      }"
      :class="switchPip ? 'translate' : ''"
      class="down-icon"
    >
      <Icon
        type="switchMode"
        class="icon"
      />
    </div>
  </div>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

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
      pip: 'Enter',
      switchPip: false,
    };
  },
  computed: {
    pipMode() {
      return this.pip === 'Enter' ? this.pipType : this.popType;
    },
    pipType() {
      return this.hasVideo ? 'pip' : 'pipDisabled';
    },
    popType() {
      return this.hasVideo ? 'pop' : 'popDisabled';
    },
  },
  methods: {
    switchPipType() {
      this.pip = this.pip === 'Enter' ? 'Global' : 'Enter';
      this.switchPip = true;
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
    margin-right: 3px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    opacity: 0.3;
    transition: opacity 50ms linear;
    .icon {
      margin-top: 1px;
    }
    &:hover {
      opacity: 1.0;
    }
  }
  @keyframes translate {
    0% {
      transfrom: translateX(0);
    };
    50% {
      transfrom: translateX(10px);
    };
    100% {
      transfrom: translateX(0);
    };
  }
  .translate {
    animation: translate 100ms linear 1 normal forwards;
  }
}
</style>
