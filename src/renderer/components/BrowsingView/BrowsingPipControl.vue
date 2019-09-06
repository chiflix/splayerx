<template>
  <div
    class="pip-control"
  >
    <div
      @mouseup="handlePip"
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
        opacity: mouseover ? 1.0 : 0.7,
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
      if (this.pip === 'Enter') return 'pip';
      return 'pop';
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
    transition: background-color 100ms ease-in;
    &:hover {
      background-color: #F5F6F8;
    }
  }
  .down-icon {
    width: 8px;
    height: 20px;
    margin-right: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    .icon {
      margin-top: 1px;
    }
  }
}
</style>
