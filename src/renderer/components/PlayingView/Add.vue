<template>
  <div
    ref="button"
    @mouseenter="addMouseenter"
    @mouseleave="addMouseleave"
    @mouseup.left="addMouseup"
    :style="{
      cursor: isInRange ? 'pointer' : `${cursorUrl}, pointer`,
    }"
    class="button"
  >
    <div
      ref="btnMask"
      class="btnMask"
    >
      <Icon
        class="addUi"
        type="add"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { log } from '@/libs/Log';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    cursorUrl: {
      type: String,
      default: '',
    },
    isInRange: {
      type: Boolean,
      default: false,
    },
    addMouseup: {
      type: Function,
      default: () => {
        log.debug('Add.vue', 'mouse up on add button');
      },
    },
    itemMoving: {
      type: Boolean,
    },
    onItemMouseout: {
      type: Function,
      default: () => {
        log.debug('Add.vue', 'mouse out on add button');
      },
    },
    onItemMouseover: {
      type: Function,
      default: () => {
        log.debug('Add.vue', 'mouse over on add button');
      },
    },
  },
  methods: {
    addMouseenter() {
      if (!this.itemMoving && this.isInRange) {
        this.$refs.button.style.setProperty('background-color', 'rgba(123, 123, 123, 0.12)');
        this.$refs.btnMask.style.setProperty('border-color', 'rgba(255, 255, 255, 0.6)');
        this.onItemMouseover(null, null, true);
      }
    },
    addMouseleave() {
      this.$refs.button.style.setProperty('background-color', 'rgba(0, 0, 0, 0.12)');
      this.$refs.btnMask.style.setProperty('border-color', 'rgba(255, 255, 255, 0.15)');
      this.onItemMouseout();
    },
  },
};
</script>
<style lang="scss" scoped>
.button {
  transition: background-color 150ms ease-out;
  border-radius: 2.5px;
  background-color: rgba(0, 0, 0, 0.12);
  transition: background-color 150ms ease-out, transform 100ms ease-out;
  cursor: pointer;
}

.btnMask {
  box-sizing: border-box;
  border-radius: 2.5px;
  width: 100%;
  height: 100%;
  border-width: 1px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.15);
  transition: border-color 150ms ease-out;
  display: flex;
}

.addUi {
  margin: auto;
}
</style>
