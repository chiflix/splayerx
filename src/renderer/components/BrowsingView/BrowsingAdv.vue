<template>
  <div
    :style="{ height: `${height}px` }"
    @mouseover="handleMouseover"
    @mouseleave="handleMouseleave"
    class="adv-container"
  >
    <div
      :style="{ width: `${padding}px` }"
      @click="handlePreItem"
      class="pre-item"
    >
      <Icon
        v-show="hoveredItem && hasPreItem"
        type="browsingPre"
      />
    </div>
    <div
      :style="{
        position: 'relative',
        width: `${winWidth - (showSidebar ? 76 : 0) - padding * 2}px`,
        maxWidth: '1664px',
      }"
    >
      <ul
        :style="{
          height: `${height}px`,
          listStyle: 'none',
        }"
        class="scroll-elements"
      >
        <li
          :style="{
            marginRight: index !== advItems.length - 1 ? `${rightSpace[currentPhase]}px` : '',
            width: winWidth > 1744 + (showSidebar ? 76 : 0) ? '544px' : `${advWidth}px`,
            background: `url(${item.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateX(${calcTranslateX})`,
            transition: 'transform 300ms linear',
          }"
          v-for="(item, index) in advItems"
          class="adv-content"
        />
      </ul>
    </div>
    <div
      :style="{ width: `${padding}px` }"
      @click="handleNextItem"
      class="next-item"
    >
      <Icon
        v-show="hoveredItem && hasNextItem"
        type="browsingNext"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import Icon from '../BaseIconContainer.vue';
import adv1 from '../../assets/adv-1.png';
import adv2 from '../../assets/adv-2.png';
import adv3 from '../../assets/adv-3.png';

export default {
  name: 'BrowsingAdv',
  components: {
    Icon,
  },
  props: {
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    padding: {
      type: Number,
      required: true,
    },
    currentPhase: {
      type: Number,
      required: true,
    },
    adaptSpace: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      advItems: [{ src: adv1 }, { src: adv2 }, { src: adv3 }],
      currentAdvIndex: 0,
      hoveredItem: false,
      translateX: 0,
      translateSpace: 0,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'showSidebar']),
    calcTranslateX() {
      return this.translateX === 0 ? 0 : `calc(${this.translateX}% + ${this.translateSpace}px)`;
    },
    rightSpace() {
      return [11, this.adaptSpace, 16];
    },
    showAdvNum() {
      return this.winWidth >= 1340 - (this.showSidebar ? 0 : 76) ? 3 : 2;
    },
    advWidth() {
      return (this.winWidth - this.padding * 2 - (this.showSidebar ? 76 : 0)
        - this.rightSpace[this.currentPhase] * (this.showAdvNum - 1)) / this.showAdvNum;
    },
    hasNextItem() {
      return this.currentAdvIndex + this.showAdvNum < this.advItems.length;
    },
    hasPreItem() {
      return this.currentAdvIndex > 0;
    },
  },
  watch: {
    winWidth() {
      this.translateSpace = -this.currentAdvIndex * this.rightSpace[this.currentPhase];
    },
    currentAdvIndex(val: number) {
      this.translateX = -val * 100;
      this.translateSpace = -val * this.rightSpace[this.currentPhase];
    },
    showAdvNum(val: number, oldVal: number) {
      if (val > oldVal && this.hasPreItem) {
        this.currentAdvIndex -= 1;
      }
    },
  },
  methods: {
    handleNextItem() {
      if (this.hasNextItem) {
        this.currentAdvIndex += 1;
      }
    },
    handlePreItem() {
      if (this.hasPreItem) {
        this.currentAdvIndex -= 1;
      }
    },
    handleMouseover() {
      this.hoveredItem = true;
    },
    handleMouseleave() {
      this.hoveredItem = false;
    },
  },
};
</script>

<style scoped lang="scss">
.adv-container {
  min-width: 732px;
  min-height: 107px;
  max-height: 144px;
  width: 100%;
  display: flex;
  position: relative;
  .pre-item, .next-item {
    height: 100%;
    display: flex;
  }
  .next-item {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    top: 50%;
  }
  .scroll-elements {
    width: 100%;
    position: absolute;
    overflow: hidden;
    white-space: nowrap;
    display: block;
    min-width: 732px;
  }
  .adv-content {
    display: inline-block;
    height: 100%;
    min-width: 360px;
    border-radius: 7px;
  }
}
</style>
