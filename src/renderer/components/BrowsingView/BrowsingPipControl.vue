<template>
  <div
    class="pip-control"
  >
    <Icon
      :type="picInPicType"
      @mouseup.native="handleGlobalPip"
      class="control"
    />
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
  z-index: 6;
  display: flex;
  height: 100%;
  justify-content: space-between;
  align-items: center;
  border-left: 1px solid #F2F1F4;
  .control {
    width: 46px;
    margin-right: 8px;
    margin-left: 8px;
  }
}
</style>
