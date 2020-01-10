<template>
  <div
    :style="{ height: `${height + contentPos.marginTop
      + contentPos.marginBottom}px` }"
    @mouseover="handleMouseover"
    @mouseleave="handleMouseleave"
    class="adv-container"
  >
    <div
      :style="{
        width: `${padding - 5}px`,
        margin: `${contentPos.marginTop}px 0
          ${contentPos.marginBottom}px 0`
      }"
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
        maxWidth: '1321px',
        padding: '0 5px',
      }"
    >
      <ul
        :style="{
          height: '100%',
          listStyle: 'none',
        }"
        class="scroll-elements"
      >
        <li
          :style="{
            height: `${height}px`,
            marginTop: `${contentPos.marginTop}px`,
            marginBottom: `${contentPos.marginBottom}px`,
            marginRight: index !== advItems.length - 1 ? `${rightSpace}px` : '',
            width: `${finalAdvWidth}`,
            background: `url(${item.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateX(${calcTranslateX})`,
            transition: 'transform 300ms linear, box-shadow 100ms linear',
          }"
          v-for="(item, index) in advItems"
          @click="handleAdvClick(item.url)"
          class="adv-content"
        >
          <div
            :style="{
              width: `${textWidth}px`,
              height: `${textHeight}px`,
              margin: `${textPos.top}px auto auto ${textPos.left}px`,
              position: 'absolute',
            }"
            class="text-content"
          >
            <span
              :style="{
                fontSize: `${textFontSize}px`,
                color: '#FFFFFF',
              }"
              v-html="$t(item.text)"
            />
          </div>
        </li>
      </ul>
    </div>
    <div
      :style="{
        width: `${padding - 5}px`,
        height: `${height}px`,
        margin: `${contentPos.marginTop}px 0
          ${contentPos.marginBottom}px 0`
      }"
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
import { getIsBeta } from '@/libs/utils';
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
    contentPos: {
      type: Object,
      required: true,
    },
    calcSizeByPhase: {
      type: Function,
      required: true,
    },
    rightSpace: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      advItems: [{ src: adv1, text: 'browsing.homepage.banner1', url: 'https://feedback.splayer.org/' }, { src: adv2, text: 'browsing.homepage.banner2', url: 'https://www.sagittarius.ai/blog/2019/10/31/splayer-i18n-project' }, { src: adv3, text: 'browsing.homepage.banner3', url: getIsBeta() ? 'https://splayer.org/changelog.html?beta' : 'https://splayer.org/changelog.html' }],
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
    showAdvNum() {
      return this.winWidth >= 1135 - (this.showSidebar ? 0 : 76) ? 3 : 2;
    },
    adaptAdvWidth() {
      return (this.winWidth - this.padding * 2 - (this.showSidebar ? 76 : 0)
        - this.rightSpace * (this.showAdvNum - 1)) / this.showAdvNum;
    },
    finalAdvWidth() {
      switch (true) {
        case this.winWidth > 1441 + (this.showSidebar ? 76 : 0):
          return '429.6px';
        case this.winWidth < 812 + (this.showSidebar ? 76 : 0):
          return '349.8px';
        default:
          return `${this.adaptAdvWidth}px`;
      }
    },
    hasNextItem() {
      return this.currentAdvIndex + this.showAdvNum < this.advItems.length;
    },
    hasPreItem() {
      return this.currentAdvIndex > 0;
    },
    textWidth() {
      return this.calcSizeByPhase(222.3);
    },
    textHeight() {
      return this.calcSizeByPhase(90);
    },
    textPos() {
      return {
        top: this.calcSizeByPhase(30),
        left: this.calcSizeByPhase(40),
      };
    },
    textFontSize() {
      return this.calcSizeByPhase(20);
    },
  },
  watch: {
    winWidth() {
      this.translateSpace = -this.currentAdvIndex * this.rightSpace;
    },
    currentAdvIndex(val: number) {
      this.translateX = -val * 100;
      this.translateSpace = -val * this.rightSpace;
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
    handleAdvClick(url: string) {
      this.$bus.$emit('add-temporary-site', url);
    },
  },
};
</script>

<style scoped lang="scss">
@media (prefers-color-scheme: light), (prefers-color-scheme: no-preference) {
  .adv-content {
    &:hover {
      box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.3);
    }
  }
}
@media (prefers-color-scheme: dark) {
  .adv-content {
    &:hover {
      box-shadow: 0 2px 6px 2px rgba(0, 0, 0, 0.5);
    }
  }
}
.adv-container {
  min-width: 710.6px;
  min-height: 107px;
  width: 100%;
  display: flex;
  position: relative;
  .pre-item, .next-item {
    height: auto;
    display: flex;
  }
  .next-item {
    position: absolute;
    right: 0;
  }
  .text-content {
    span {
      width: 100%;
      height: auto;
      white-space: pre-wrap;
      word-break: break-all;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      text-overflow: ellipsis;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.69);
    }
  }
  .scroll-elements {
    width: calc(100% - 10px);
    padding: 0 5px;
    position: absolute;
    overflow: hidden;
    white-space: nowrap;
    display: block;
    min-width: 710.6px;
    left: 0;
  }
  .adv-content {
    cursor: pointer;
    display: inline-block;
    height: 100%;
    min-width: 302.3px;
    border-radius: 7px;
  }
}
</style>
