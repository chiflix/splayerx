<template>
  <div class="dropdown">
    <div
      :class="showSelection ? 'dropdown__toggle--list' : 'dropdown__toggle--display'"
      @mouseup.stop="showSelection = !showSelection"
      class="dropdown__toggle no-drag"
    >
      <div class="dropdown__displayItem">
        {{ selected.label }}
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
import Icon from '@/components/BaseIconContainer.vue';

export default Vue.extend({
  name: 'Select',
  components: {
    Icon,
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
    change(item: any) {
      this.$emit('update:selected', item);
    },
  },
});

</script>
<style lang="scss" scoped>
.dropdown {
  width: 100%;
  position: relative;
  height: 28px;
  font-size: 11px;
  color: rgba(255,255,255,0.80);
  letter-spacing: 0;
  text-align: center;
  line-height: 28px;
  &__toggle {
    position: absolute;
    width: calc(100% - 2px);
    margin-top: -1px;
    margin-left: -1px;
    transition: all 200ms;
    border-radius: 2px;
    overflow: hidden;
    &--display {
      height: 28px;
      border: 1px solid rgba(255,255,255,0);
      background-color: rgba(255, 255, 255, 0);
    }

    &--list {
      height: 148px;
      // background: #555555;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 2px;
      .dropdown__displayItem {
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
    }
  }

  &__displayItem {
    height: 28px;
    line-height: 28px;
    border-bottom: 1px solid rgba(255,255,255,0);
    background: rgba(0,0,0,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 2px;
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
