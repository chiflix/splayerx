<template>
  <div class="settingItem__input dropdown no-drag">
    <div
      :class="showSelection ? 'dropdown__toggle--list' : 'dropdown__toggle--display'"
      @mousedown.stop="handleMousedown"
      @mouseup.stop="handleMouseup"
    >
      <div
        :style="{
          color: selectNone ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)'
        }"
        class="dropdown__displayItem"
      >
        {{ selectedFormater(selectionFormater(selected)) }}
      </div>
      <div
        @mouseup.stop=""
        class="dropdown__listItems no-drag"
      >
        <div
          v-for="({ selection, disabled }, index) in selections"
          :key="index"
          :class="{ 'disabled': disabled }"
          @mouseup.stop="handleSelection(selection)"
          class="dropdownListItem"
        >
          {{ selectionFormater(selection) }}
        </div>
      </div>
      <Icon
        :class="showSelection ? 'dropdown__icon--arrowUp' : 'dropdown__icon--arrowDown'"
        type="rightArrow"
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
  model: {
    prop: 'showSelection',
    event: 'toggle',
  },
  props: {
    selectNone: {
      type: Boolean,
      default: false,
    },
    showSelection: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: String,
      default: '',
    },
    selections: {
      type: Array,
      default: () => [],
    },
    handleSelection: {
      type: Function,
      default: (selection: string) => { console.log(`Select: ${selection}`); },
    },
    selectedFormater: {
      type: Function,
      default: (selected: string) => selected,
    },
    selectionFormater: {
      type: Function,
      default: (selection: string) => selection,
    },
  },
  data() {
    return {
      mousedown: false,
    };
  },
  created() {
    document.addEventListener('mouseup', this.globalMouseupHandler);
  },
  destroyed() {
    document.removeEventListener('mouseup', this.globalMouseupHandler);
  },
  methods: {
    globalMouseupHandler() {
      this.mousedown = false;
    },
    handleMousedown() {
      this.mousedown = true;
    },
    handleMouseup() {
      if (this.mousedown) this.$emit('toggle', !this.showSelection);
      this.mousedown = false;
    },
  },
};
</script>
<style lang="scss" scoped>
.settingItem {
  &__input {
    box-sizing: border-box;
    cursor: pointer;
    font-family: $font-semibold;
    font-size: 11px;
    color: #FFFFFF;
    text-align: center;
    border-radius: 2px;
    border: 1px solid rgba(255,255,255,0.1);
    background-color: rgba(0, 0, 0, 0.04);
    transition-property: background-color, border-color;
    transition-duration: 200ms;

    &:not(.disabled):hover {
      border: 1px solid rgba(255,255,255,0.2);
      background-color: rgba(255,255,255,0.08);
    }
  }
}
.dropdown {
  position: relative;
  width: 240px;
  height: 28px;
  margin-top: 10px;

  &__toggle {
    position: absolute;
    width: 100%;
    margin-top: -1px;
    margin-left: -1px;
    transition: all 200ms;
    border-radius: 2px;
    overflow: hidden;

    &--display {
      @extend .dropdown__toggle;
      height: 28px;
      border: 1px solid rgba(255,255,255,0);
      background-color: rgba(255, 255, 255, 0);
    }

    &--list {
      @extend .dropdown__toggle;
      height: 148px;
      border: 1px solid rgba(255,255,255,0.3);
      background-color: rgba(120,120,120,1);
      .dropdown__displayItem {
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
    }
  }

  &__displayItem {
    height: 28px;
    line-height: 28px;
    border-bottom: 1px solid rgba(255,255,255,0);
  }

  &__listItems {
    cursor: pointer;
    position: relative;
    height: 112px;
    margin: 4px 4px 4px 6px;
    overflow-y: scroll;
  }

  .disabled {
    color: rgba(255,255,255,0.3);
    cursor: default;
  }

  .dropdownListItem {
    height: 28px;
    line-height: 28px;

    &:hover {
      background-image: linear-gradient(
        90deg,
        rgba(255,255,255,0.00) 0%,
        rgba(255,255,255,0.069) 23%,
        rgba(255,255,255,0.00) 100%
      );
    }
  }

  &__icon {
    position: absolute;
    top: 7px;
    right: 8px;
    transition: transform 200ms;
    &--arrowDown {
      @extend .dropdown__icon;
      transform: rotate(90deg);
    }
    &--arrowUp {
      @extend .dropdown__icon;
      z-index: 100;
      transform: rotate(-90deg);
    }
  }

  ::-webkit-scrollbar {
    width: 3px;
    user-select: none;
  }
  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1.5px;
  }
  ::-webkit-scrollbar-track {
    border-radius: 2px;
    width: 10px;
    user-select: none;
  }
}
</style>
