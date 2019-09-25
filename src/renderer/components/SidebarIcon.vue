<template>
  <div
    @click="selectSidebarIcon(url)"
    :class="{ selected: selected }"
    class="icon-hover"
  >
    <Icon
      :type="icon"
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
    url: {
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
    selectSidebarIcon: {
      type: Function,
      required: true,
    },
  },
  methods: {

  },
};
</script>
<style lang="scss" scoped>
div {
  transition: opacity 100ms ease-in;
  opacity: 0.7;
  width: 44px;
  height: 44px;
  margin-bottom: 12px;
}
.icon-hover:hover {
  opacity: 1.0;
}
.selected {
  opacity: 1.0;
  &::before {
    content: '';
    position: absolute;
    width: 44px;
    height: 44px;
    border: 2px solid #E0E0EA;
    border-radius: 100%;
    box-sizing: border-box;
  }
}
</style>
