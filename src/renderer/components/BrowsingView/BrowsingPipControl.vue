<template>
  <div
    class="pip-control"
  >
    <div
      @mouseup="handlePip"
      :style="{
        opacity: hasVideo ? 1.0 : 0.3,
      }"
      :class="hasVideo ? 'button-hover': ''"
      class="pip-icon no-drag"
    >
      <Icon
        :type="pipType"
      />
    </div>
    <div
      @mouseup="switchPipType"
      @mouseover="mouseover = true"
      @mouseout="mouseover = false"
      :style="{
        opacity: mouseover ? 1.0 : 0.3,
      }"
      class="down-icon"
    >
      <Icon
        type="down"
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
    };
  },
  computed: {
    pipType() {
      if (!this.hasVideo) return 'pipDisabled';
      return this.pip === 'Enter' ? 'pipDisabled' : 'pop';
    },
  },
  methods: {
    handlePip() {
      this.pip === 'Enter' ? this.handleEnterPip(true) : this.handleEnterPip(false);
    },
    switchPipType() {
      this.pip = this.pip === 'Enter' ? 'Global' : 'Enter';
    },
  },
};
</script>
<style lang="scss" scoped>
.pip-control {
  min-width: 65px;
  z-index: 6;
  display: flex;
  width: 62px;
  height: 100%;
  align-items: center;
  border-left: 1px solid #F2F1F4;
  .pip-icon {
    width: 30px;
    height: 30px;
    margin-left: 15px;
    border-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 100ms ease-in, opacity 100ms ease-in;
  }
  .button-hover:hover {
    background-color: #F5F6F8;
  }
  .down-icon {
    width: 23px;
    height: 20px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .icon {
      margin-top: 1px;
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
