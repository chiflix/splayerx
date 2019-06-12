<template>
  <div
    ref="button"
    @mouseenter="addMouseenter"
    @mouseleave="addMouseleave"
    @mouseup.left="addMouseup"
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
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    addMouseup: {
      type: Function,
      default: () => {
        console.log('mouse up on add button');
      },
    },
    itemMoving: {
      type: Boolean,
    },
  },
  methods: {
    addMouseenter() {
      if (!this.itemMoving) {
        this.$refs.button.style.setProperty('background-color', 'rgba(123, 123, 123, 0.12)');
        this.$refs.btnMask.style.setProperty('border-color', 'rgba(255, 255, 255, 0.6)');
      }
    },
    addMouseleave() {
      this.$refs.button.style.setProperty('background-color', 'rgba(0, 0, 0, 0.12)');
      this.$refs.btnMask.style.setProperty('border-color', 'rgba(255, 255, 255, 0.15)');
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
  backdrop-filter: blur(9.8px);
  cursor: pointer;
}

.btnMask {
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
