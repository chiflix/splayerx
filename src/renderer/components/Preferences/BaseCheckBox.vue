<template>
  <label class="container">
    <slot></slot>
    <input type="checkbox"
      :checked="checkboxValue"
      @input="$emit('update:checkbox-value', $event.target.checked)">
    <span class="checkmark"></span>
    <Icon type="nike" class="nike"/>
  </label>
</template>

<script>
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BaseCheckBox',
  components: {
    Icon,
  },
  props: ['checkboxValue'],
};
</script>

<style scoped lang="scss">
.container {
  -webkit-app-region: no-drag;
  display: block;
  position: relative;
  padding-left: 29px;
  padding-top: 2px;
  margin-bottom: 18px;
  width: fit-content;
  cursor: pointer;
  font-family: $font-medium;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.32px;
  line-height: 13px;
  user-select: none;
  input {
    position: absolute;
    display: none;
    cursor: pointer;
  }
  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    width: 17px;
    height: 17px;
    border-radius: 4px;
    border: 0.5px solid rgba(255,255,255,0.20);
    background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);
  }
  input:checked ~ .nike {
    display: block;
  }
  .nike {
    position: absolute;
    display: none;
    top: 2px;
    left: 2px;
  }
}
</style>
