<template>
  <div
    :title="icon.includes('Sidebar') ? $t(title) : title"
    :class="[{ light: selected }, { drag:
      isDragging }, icon.length === 1 ? `${selectedStyle}` : '']"
    :style="{
      height: `${iconHeight}px`,
      transform: `translateY(${iconTranslateY}px)`,
      zIndex: isDragging ? '10' : '',
      opacity: isDragging ? '1.0' : '',
      transition: itemDragging && !isDragging ? 'transform 100ms linear' : '',
    }"
    @mousedown="handleMousedown"
    class="icon-hover no-drag"
  >
    <span v-if="icon.length === 1">{{ icon }}</span>
    <img
      :style="{
        width: '44px',
        height: '44px',
        borderRadius: '100%'
      }"
      v-if="icon.length > 1 && !icon.includes('Sidebar')"
      :src="icon"
    >
    <Icon
      v-if="icon.length > 1 && icon.includes('Sidebar')"
      :type="icon"
    />
    <div
      :class="{ selected: selected }"
      class="mask"
    />
  </div>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';
import BrowsingChannelMenu from '@/services/browsing/BrowsingChannelMenu';

export default {
  components: {
    Icon,
  },
  props: {
    index: {
      type: Number,
      required: true,
    },
    startIndex: {
      type: Number,
      default: NaN,
    },
    endIndex: {
      type: Number,
      default: NaN,
    },
    title: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    selectedIndex: {
      type: Number,
      default: 0,
    },
    url: {
      type: String,
      default: '',
    },
    channel: {
      type: String,
      default: '',
    },
    selected: {
      type: Boolean,
      default: false,
    },
    selectSidebar: {
      type: Function,
      default: null,
    },
    itemDragging: {
      type: Boolean,
      default: false,
    },
    indexOfMovingItem: {
      type: Number,
      default: NaN,
    },
    indexOfMovingTo: {
      type: Number,
      default: NaN,
    },
  },
  data() {
    return {
      isDragging: false,
      mousedown: false, // about to delete
      mousedownY: NaN,
      iconTranslateY: 0,
      iconHeight: 44,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    selectedStyle() {
      return `bookmark-style${this.selectedIndex}`;
    },
  },
  watch: {
    itemDragging() {
      this.iconTranslateY = 0;
    },
    indexOfMovingTo(to: number) {
      if (!this.isDragging) {
        const distance = 56; // distance between two sidebar icons
        const seperatorHeight = 20; // seperator's height
        if (this.indexOfMovingItem < this.startIndex && this.indexOfMovingTo >= this.startIndex) {
          this.iconTranslateY = to <= this.index ? distance : 0;
        } else if (this.indexOfMovingItem > this.endIndex) {
          this.iconTranlstateY = 0;
        } else if (to >= this.index && this.indexOfMovingItem < this.index) {
          this.iconTranslateY = -distance;
        } else if (to <= this.index && this.indexOfMovingItem > this.index) {
          this.iconTranslateY = distance;
        } else if (this.iconTranslateY !== 0) {
          this.iconTranslateY = 0;
        }
      }
    },
  },
  methods: {
    handleMousedown(e: MouseEvent) {
      if (e.button === 2) {
        if (this.isDarwin) {
          BrowsingChannelMenu.createChannelMenu(this.channel);
        } else {
          this.$bus.$emit('open-channel-menu', { channel: this.channel });
        }
      } else {
        this.mousedown = true;
        this.mousedownY = e.clientY;
        this.$emit('index-of-moving-item', this.index);
        document.addEventListener('mousemove', this.handleMousemove);
        document.addEventListener('mouseup', this.handleMouseup, { once: true });
      }
    },
    handleMousemove(e: MouseEvent) {
      this.$emit('is-dragging', this.isDragging = true);
      const offset = 15; // easier to move as offset become bigger
      const distance = 56; // distance between two sidebar icons
      const movementY = this.iconTranslateY = e.clientY - this.mousedownY;

      let movingTo = movementY > 0
        ? Math.floor((movementY + offset) / distance + this.index)
        : Math.ceil((movementY - offset) / distance + this.index);
      if (movingTo < this.startIndex) movingTo = this.startIndex;
      this.$emit('index-of-moving-to', movingTo);
    },
    handleMouseup() {
      document.removeEventListener('mousemove', this.handleMousemove);
      if (this.isDragging) {
        this.isDragging = false;
        this.$emit('is-dragging', false);
        this.iconTranslateY = 0;
        this.mousedown = false;
      } else {
        this.selectSidebar(this.url, this.channel, this.category);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
div {
  opacity: 0.85;
  width: 44px;
  height: 44px;
}
.icon-hover {
  position: relative;
  display: flex;
  border-radius: 100%;
  span {
    margin: auto;
    font-size: 20px;
    color: #FFFFFF;
    font-weight: bold;
  }
  &:hover {
    opacity: 1.0;
  }
}
.mask {
  width: 44px;
  height: 44px;
  position: absolute;
  top: 0;
}
.light {
  opacity: 1;
}
.selected {
  opacity: 1;
  border: 2px solid #E0E0EA;
  border-radius: 100%;
  box-sizing: border-box;
}
.drag {
  border-radius: 100%;
  box-shadow: 0 0 6px 2px rgba(0,0,0,0.7);
}
</style>
