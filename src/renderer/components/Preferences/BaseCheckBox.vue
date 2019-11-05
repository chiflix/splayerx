<template>
  <div class="checkbox">
    <label class="checkbox__label">
      <slot />
      <input
        :checked="checkboxValue"
        @change="$emit('change', $event.target.checked)"
        type="checkbox"
        class="checkbox__input"
      >
      <span class="checkbox__checkmark" />
      <Icon
        type="nike"
        class="checkbox__icon"
      />
    </label>
  </div>
</template>

<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BaseCheckBox',
  components: {
    Icon,
  },
  model: {
    prop: 'checkboxValue',
    event: 'change',
  },
  props: {
    checkboxValue: Boolean,
  },
};
</script>

<style scoped lang="scss">
.checkbox {
  -webkit-app-region: no-drag;
  margin-top: 15px;
  width: fit-content;
  position: relative;

  &__label {
    display: block;
    cursor: pointer;
    padding-left: 29px;
    font-family: $font-medium;
    font-size: 14px;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.3px;
    line-height: 19px;
    user-select: none;
  }

  &__checkmark {
    position: absolute;
    top: 0;
    left: 0;
    width: 17px;
    height: 17px;
    border-radius: 2px;
    border: 1px solid rgba(255,255,255,0.1);
    background-color: rgba(255,255,255,0.03);
    transition: border 200ms, background-color 200ms;
  }

  &:hover .checkbox__checkmark {
    border: 1px solid rgba(255,255,255,0.2);
    background-color: rgba(255,255,255,0.1);
  }

  &__input {
    position: absolute;
    display: none;
    cursor: pointer;

    &:checked ~ .checkbox__icon {
      display: block;
    }
  }
  &__icon {
    position: absolute;
    display: none;
    top: 2px;
    left: 2px;
  }
}
</style>
