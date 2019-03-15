<template>
  <div class="button"
    @mouseup="addMouseup">
    <div class="btnMask">
      <Icon class="addUi" type="add"></Icon>
    </div>
  </div>
</template>
<script>
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    index: {
      type: Number,
    },
    addMouseup: {
      type: Function,
    },
  },
};
</script>
<style lang="scss" scoped>
.button {
  border-radius: 2.5px;
  background-color: rgba(0, 0, 0, 0.12);
  transition: background-color 150ms ease-out, transform 100ms ease-out;
  backdrop-filter: blur(9.8px);
  cursor: pointer;
}

.button:hover {
  background-color: rgba(123, 123, 123, 0.12);
  transition: background-color 150ms ease-out;
}

.btnMask {
  border-radius: 2.5px;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
}

.btnMask:hover {
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.addUi {
  margin: auto;
}
</style>
