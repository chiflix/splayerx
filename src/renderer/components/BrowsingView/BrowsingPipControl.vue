<template>
  <div
    :style="{
      width: '80px',
      display: 'flex',
      zIndex: '6',
      webkitAppRegion: 'no-drag',
      cursor: hasVideo ? 'pointer' : '',
    }"
  >
    <Icon
      :type="picInPicType"
      @mouseup.native="handleGlobalPip"
    />
    <Icon
      :type="picInPicType"
      @mouseup.native="handleEnterPip"
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

</style>