<template>
  <div
    :title="$t(title)"
    :class="{ light: selected }"
    class="icon-hover"
  >
    <Icon
      :type="icon"
    />
    <div
      :class="{ selected: selected }"
      class="mask"
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
    title: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
<style lang="scss" scoped>
div {
  transition: opacity 100ms ease-in;
  opacity: 0.7;
  width: 44px;
  height: 44px;
}
.icon-hover:hover {
  opacity: 1.0;
}
.mask {
  width: 44px;
  height: 44px;
  position: relative;
  top: -50px;
}
.light {
  opacity: 1;
}
.selected {
  opacity: 1;
  border: 2px solid #E0E0EA;
  border-radius: 100%;
  box-sizing: border-box;
}
</style>
