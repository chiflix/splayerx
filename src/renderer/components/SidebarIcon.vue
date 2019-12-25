<template>
  <transition name="fade-100">
    <div
      :title="icon.includes('Sidebar') ? $t(title) : title"
      :class="[{ light: selected }, { drag:
        isDragging }, icon.length <= 1 && !isSeparator ? `${selectedStyle}` : '']"
      :style="{
        width: isSeparator ? '52px' : '44px',
        height: isSeparator ? '9px' : `${iconHeight}px`,
        transform: `translateY(${iconTranslateY}px)`,
        zIndex: isDragging ? '10' : '',
        opacity: isDragging ? '1.0' : '',
        transition: itemDragging && !isDragging
          ? 'transform 100ms linear, opacity 100ms linear' : 'opacity 100ms linear',
        pointerEvents: isSeparator ? 'none' : 'auto',
      }"
      @mousedown="handleMousedown"
      class="icon-hover no-drag"
    >
      <div
        v-if="isSeparator"
        :style="{
          width: '52px',
          height: '1px',
          marginTop: '4px',
          borderTop: '1px solid #6F7078',
        }"
      />
      <div
        v-if="!icon.length && !isSeparator"
        class="loading-content"
      >
        <div
          v-for="(item) in [0, 1, 2]"
          :style="{
            background: item === loadingIndex ?
              'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)',
          }"
          class="loading"
        />
      </div>
      <span v-if="!isSeparator && icon.length === 1">{{ icon }}</span>
      <Icon
        v-if="!isSeparator && icon.length > 1 && icon.includes('Sidebar')"
        :type="icon"
      />
      <div
        v-if="!isSeparator"
        :class="{ selected: selected }"
        class="mask"
      />
    </div>
  </transition>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    index: {
      type: Number,
      required: true,
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
      required: true,
    },
    temporaryChannelsLength: {
      type: Number,
      default: 0,
    },
    channelsLength: {
      type: Number,
      default: 0,
    },
    handleMenu: {
      type: Function,
      required: true,
    },
    channelInfo: {
      type: Object,
      required: true,
    },
    gettingViewInfo: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      isDragging: false,
      mousedown: false, // about to delete
      mousedownY: NaN,
      iconTranslateY: 0,
      iconHeight: 44,
      tmpMovingItem: NaN,
      offsetItem: 0,
      offsetY: 0,
      movementY: 0,
      dragDown: false,
      loadingIndex: 0,
      timer: 0,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    selectedStyle() {
      return `bookmark-style${this.selectedIndex}`;
    },
    isSeparator() {
      return this.index === this.temporaryChannelsLength - 1;
    },
  },
  watch: {
    gettingViewInfo(val: boolean) {
      if (val) {
        this.timer = setInterval(() => {
          this.loadingIndex = this.loadingIndex < 2 ? this.loadingIndex + 1 : 0;
        }, 200);
      } else {
        clearTimeout(this.timer);
        this.loadingIndex = 0;
      }
    },
    movementY(val: number, oldVal: number) {
      this.dragDown = val > oldVal;
    },
    itemDragging() {
      this.iconTranslateY = 0;
      this.offsetItem = 0;
      this.offsetY = 0;
      this.tmpMovingItem = 0;
    },
    indexOfMovingTo(to: number) {
      // permanent sites drag to temporary
      if (this.temporaryChannelsLength > 1 && this.indexOfMovingItem >= this.temporaryChannelsLength
        && to < this.temporaryChannelsLength) {
        return;
      }
      if (!this.isDragging) {
        if (to >= this.index && this.indexOfMovingItem < this.index) {
          this.iconTranslateY = -56;
        } else if (to <= this.index && this.indexOfMovingItem > this.index) {
          this.iconTranslateY = 56;
        } else if (this.iconTranslateY !== 0) {
          this.iconTranslateY = 0;
        }
      }
    },
    isDragging(val: boolean) {
      if (val) document.addEventListener('mousedown', this.handleDocumentDown, { once: true });
    },
  },
  mounted() {
    this.tmpMovingItem = this.index;
  },
  methods: {
    handleDocumentDown(e: MouseEvent) {
      if (e.button === 2 && this.isDragging) {
        e.stopImmediatePropagation();
      }
    },
    handleMousedown(e: MouseEvent) {
      if (e.button === 2) {
        this.handleMenu(this.index, this.channelInfo);
      } else {
        if (this.index === 0 && this.gettingViewInfo) return;
        this.mousedown = true;
        this.mousedownY = e.clientY;
        this.$emit('update:index-of-moving-item', this.index);
        document.addEventListener('mousemove', this.handleMousemove);
        document.addEventListener('mouseup', this.handleMouseup, { once: true });
      }
    },
    handleMousemove(e: MouseEvent) {
      this.isDragging = true;
      this.$emit('is-dragging', true);
      let offset = 15; // easier to move as offset become bigger
      let distance = 56; // distance between two sidebar icons
      this.movementY = this.iconTranslateY = e.clientY - this.mousedownY;
      if ((this.tmpMovingItem === this.temporaryChannelsLength - 2 && this.dragDown)
        || (this.tmpMovingItem === this.temporaryChannelsLength - 1 && !this.dragDown)) {
        distance = 21;
        offset = 6;
      }
      if (this.dragDown) {
        if (Math.floor((this.movementY + offset - this.offsetY) / distance) >= 1) {
          this.offsetItem += 1;
          this.offsetY += distance;
        }
      } else if (Math.ceil((this.movementY - offset - this.offsetY) / distance) <= -1) {
        this.offsetItem -= 1;
        this.offsetY -= distance;
      }
      const movingTo = this.index + this.offsetItem < 0 ? 0 : this.index + this.offsetItem;
      this.tmpMovingItem = movingTo;
      const maxIndex = this.channelsLength - 1;
      if ((this.indexOfMovingItem >= this.temporaryChannelsLength
        && movingTo < this.temporaryChannelsLength) || movingTo > maxIndex) return;
      this.$emit('update:index-of-moving-to', movingTo);
    },
    handleMouseup() {
      document.removeEventListener('mousemove', this.handleMousemove);
      document.removeEventListener('mousedown', this.handleDocumentDown);
      if (this.isDragging) {
        this.isDragging = false;
        this.$emit('is-dragging', false);
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
  .loading-content{
    width: 21px;
    height: 5px;
    margin: auto;
    display: flex;
    justify-content: space-between;
    .loading {
      width: 5px;
      height: 5px;
      border-radius: 100%;
      transition: background-color 200ms linear;
    }
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
