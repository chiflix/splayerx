<template>
  <div class="dropdown">
    <div
      :class="showSelection ? 'dropdown__toggle--list' : 'dropdown__toggle--display'"
      @mouseup.stop="showSelection = !showSelection"
      class="dropdown__toggle no-drag"
    >
      <div class="dropdown__displayItem">
        {{ selected }}
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
      <Icon
        :class="showSelection ? 'dropdown__icon--arrowUp' : 'dropdown__icon--arrowDown'"
        type="rightArrow"
      />
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'General',
  props: {
    selected: {
      type: String,
      default: '',
    },
    list: {
      type: [],
      default: [],
    },
    change: {
      type: Function,
      default: () => {},
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
  },
});

</script>
<style lang="scss" scoped>
.dropdown {
  width: 100%;
  position: relative;
  height: 28px;

  &__toggle {
    position: absolute;
    width: 100%;
    margin-top: -1px;
    margin-left: -1px;
    transition: all 200ms;
    border-radius: 2px;
    // overflow: hidden;
    &--display {
      height: 28px;
      border: 1px solid rgba(255,255,255,0);
      background-color: rgba(255, 255, 255, 0);
      .dropdown__listItems {
        height: 0px;
        top: 0px;
      }
    }

    &--list {
      // height: 148px;
      .dropdown__listItems {
        height: 112px;
        top: -112px;
        border: 1px solid rgba(255,255,255,0.3);
        background-color: rgba(120,120,120,1);
      }
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
    width: 100%;
    position: absolute;
    height: 112px;
    top: -112px;
    left: -1px;
    // margin: 4px 4px 4px 6px;
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
