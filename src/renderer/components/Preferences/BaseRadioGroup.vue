<template>
  <div class="radio">
    <label class="radio__label">
      <slot />
      <input
        name=""
        :checked="radioValue"
        @change="$emit('change', $event.target.checked)"
        type="radio"
        class="radio__input"
      >
      <span class="radio__checkmark" />
      <Icon
        type="radio"
        class="radio__icon"
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
    prop: 'radioValue',
    event: 'change',
  },
  props: {
    radioValue: Boolean,
  },
};
</script>

<style scoped lang="scss">
.radio {
  -webkit-app-region: no-drag;
  margin-top: 15px;
  width: fit-content;
  position: relative;

  &__label {
    display: block;
    cursor: pointer;
    padding-left: 29px;
    font-family: $font-medium;
    font-size: 13px;
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
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background-color: rgba(255,255,255,0.03);
    transition: border 200ms, background-color 200ms;
  }

  &:hover .radio__checkmark {
    border: 1px solid rgba(255,255,255,0.2);
    background-color: rgba(255,255,255,0.1);
  }

  &__input {
    position: absolute;
    display: none;
    cursor: pointer;

    &:checked ~ .radio__icon {
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
