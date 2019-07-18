<template>
  <div class="dropdown">
    <div
      :class="showSelection ? 'dropdown__toggle--list' : 'dropdown__toggle--display'"
      @mouseup.stop="showSelection = !showSelection"
      class="no-drag"
    >
      <div class="dropdown__displayItem">
        <span :class="`${selected.value ? '' : 'un_select'}`">
          {{ selected.label }}
        </span>
        <span
          v-show="!showSelection"
          class="arrow"
        >→</span>
        <span
          v-show="!showSelection"
          class="static_label"
        >{{ staticLabel }}</span>
      </div>
      <div
        @mouseup.stop=""
        class="dropdown__listItems"
      >
        <div
          v-for="(item) in list"
          :key="item.value"
          @mouseup.stop="change(item);showSelection= false;"
          class="dropdownListItem"
        >
          {{ item.label }}
        </div>
      </div>
      <div class="iconWrap">
        <svg :class="showSelection ? 'dropdown__icon--arrowUp' : 'dropdown__icon--arrowDown'">
          <use v-bind="{'xlink:href': `#rightArrow-default-icon`}" />
        </svg>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Select',
  components: {
  },
  props: {
    selected: {
      type: Object,
      required: true,
    },
    list: {
      type: Array,
      required: true,
    },
    staticLabel: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      showSelection: false,
    };
  },
  computed: {
  },
  mounted() {
    document.addEventListener('mouseup', this.globalMouseUp);
  },
  destroyed() {
    document.removeEventListener('mouseup', this.globalMouseUp);
  },
  methods: {
    globalMouseUp() {
      if (this.showSelection) {
        this.showSelection = false;
      }
    },
    change(item: { value: string, label: string }) {
      this.$emit('update:selected', item);
    },
  },
});

</script>
<style lang="scss" scoped>
.dropdown {
  width: 100%;
  position: relative;
  height: 30px;
  font-size: 11px;
  color: rgba(255,255,255,0.80);
  letter-spacing: 0;
  text-align: center;
  &__toggle {
    position: absolute;
    width: calc(100% - 2px);
    border-radius: 2px;
    overflow: hidden;
    transition: all 200ms;
    &--display {
      @extend .dropdown__toggle;
      height: 28px;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 2px;
      background-color: rgba(0, 0, 0, .04);
      &:hover {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background-color: rgba(255, 255, 255, 0.08);
      }
    }
    &--list {
      @extend .dropdown__toggle;
      height: 148px;
      border: 1px solid rgba(255,255,255,0.3);
      background-color: rgba(120, 120, 120, 1);
      border-radius: 2px;
      .dropdown__displayItem {
        border-bottom: 0.5px solid rgba(255,255,255,0.10);
      }
    }
  }

  &__displayItem {
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    .un_select, .static_label, .arrow {
      opacity: 0.3;
    }
    .arrow {
      margin-left: 4px;
      margin-right: 4px;
    }
  }

  &__listItems {
    cursor: pointer;
    position: relative;
    height: 112px;
    margin: 4px 4px 4px 6px;
    overflow-y: scroll;
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
  .iconWrap {
    position: absolute;
    height: 28px;
    top: 0;
    right: 8px;
    display: flex;
    align-items: center;
  }
  &__icon {
    width: 13px;
    height: 13px;
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
