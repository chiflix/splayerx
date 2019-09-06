<template>
  <div
    class="pip-control"
  >
    <div
      @mouseup="handleGlobalPip"
      class="pip-icon no-drag"
    >
      <Icon
        :type="picInPicType"
      />
    </div>
    <div
      @mouseup="switchPipType"
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
    handleGlobalPip: {
      type: Function,
      required: true,
    },
    hasVideo: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    picInPicType() {
      return this.hasVideo ? 'pip' : 'pipDisabled';
    },
  },
  methods: {
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
