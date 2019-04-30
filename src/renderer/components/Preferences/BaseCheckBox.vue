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
$interactor-backgroundColor-default: rgba(255,255,255,0.03);
$interactor-border-default: 1px solid rgba(255,255,255,0.1);
$interactor-backgroundColor-hover: rgba(255,255,255,0.1);
$interactor-border-hover: 1px solid rgba(255,255,255,0.2);

.container {
  -webkit-app-region: no-drag;
  display: block;
  position: relative;
  padding-left: 29px;
  margin-bottom: 15px;
  width: fit-content;
  cursor: pointer;
  font-family: $font-medium;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.3px;
  line-height: 19px;
  user-select: none;

  &:hover .checkmark {
    border: $interactor-border-hover;
    background-color: $interactor-backgroundColor-hover;
  }
      
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
    border-radius: 2px;
    background-color: $interactor-backgroundColor-default;
    border: $interactor-border-default;
    transition: border 200ms, background-color 200ms;
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
