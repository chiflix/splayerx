<template>
  <div
    :style="{ height: `${height + contentPos.marginTop[currentPhase]
      + contentPos.marginBottom[currentPhase]}px` }"
    @mouseover="handleMouseover"
    @mouseleave="handleMouseleave"
    class="adv-container"
  >
    <div
      :style="{
        width: `${padding}px`,
        margin: `${contentPos.marginTop[currentPhase]}px 0
          ${contentPos.marginBottom[currentPhase]}px 0`
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
            marginTop: `${contentPos.marginTop[currentPhase]}px`,
            marginBottom: `${contentPos.marginBottom[currentPhase]}px`,
            marginRight: index !== advItems.length - 1 ? `${rightSpace[currentPhase]}px` : '',
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
              width: `${textWidth[currentPhase]}px`,
              height: `${textHeight[currentPhase]}px`,
              margin: `${textPos.top[currentPhase]}px auto auto ${textPos.left[currentPhase]}px`,
              position: 'absolute',
            }"
            class="text-content"
          >
            <span
              :style="{
                fontSize: `${textFontSize[currentPhase]}px`,
                color: '#FFFFFF',
              }"
              v-html="item.text"
            />
          </div>
        </li>
      </ul>
    </div>
    <div
      :style="{
        width: `${padding}px`,
        height: `${height}px`,
        margin: `${contentPos.marginTop[currentPhase]}px 0
          ${contentPos.marginBottom[currentPhase]}px 0`
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
    currentPhase: {
      type: Number,
      required: true,
    },
    adaptSpace: {
      type: Number,
      required: true,
    },
    contentPos: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      advItems: [{ src: adv1, text: this.$t('browsing.homepage.banner1'), url: 'https://feedback.splayer.org/' }, { src: adv2, text: this.$t('browsing.homepage.banner2'), url: 'https://www.sagittarius.ai/blog/2019/10/31/splayer-i18n-project' }, { src: adv3, text: this.$t('browsing.homepage.banner3'), url: getIsBeta() ? 'https://splayer.org/changelog.html?beta' : 'https://splayer.org/changelog.html' }],
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
      return this.winWidth >= 1135 - (this.showSidebar ? 0 : 76) ? 3 : 2;
    },
    adaptAdvWidth() {
      return (this.winWidth - this.padding * 2 - (this.showSidebar ? 76 : 0)
        - this.rightSpace[this.currentPhase] * (this.showAdvNum - 1)) / this.showAdvNum;
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
      return [222.3 * 888 / 1030, 222.3 * this.winWidth / 1030, 222.3];
    },
    textHeight() {
      return [90 * 888 / 1030, 90 * this.winWidth / 1030, 90];
    },
    textPos() {
      return {
        top: [30 * 888 / 1030, 30 * this.winWidth / 1030, 30],
        left: [40 * 888 / 1030, 40 * this.winWidth / 1030, 40],
      };
    },
    textFontSize() {
      return [20 * 888 / 1030, 20 * this.winWidth / 1030, 20];
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
    handleAdvClick(url: string) {
      this.$electron.shell.openExternal(url);
    },
  },
};
</script>

<style scoped lang="scss">
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
    width: 100%;
    position: absolute;
    overflow: hidden;
    white-space: nowrap;
    display: block;
    min-width: 710.6px;
  }
  .adv-content {
    cursor: pointer;
    display: inline-block;
    height: 100%;
    min-width: 302.3px;
    border-radius: 7px;
    &:hover {
      box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
