<template>
  <div class="sub-menu">
    <div
      ref="scroll"
      :class="refAnimation"
      :style="{
        transition: '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
        height: `${scopeHeight + hoverHeight}px`,
        overflowY: isOverFlow,
      }"
      @animationend="finishAnimation"
      class="scrollScope"
    >
      <div class="itemContainer">
        <div
          :style="{
            color: hoverIndex === -1 || currentSubtitleIndex === -1 ?
              'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
            height: `${itemHeight}px`,
            cursor: currentSubtitleIndex === -1 ? 'default' : 'pointer',
          }"
          @mouseup="$emit('off-subtitle')"
          @mouseover="toggleItemsMouseOver(-1)"
          @mouseleave="toggleItemsMouseLeave(-1)"
          class="menu-item-text-wrapper"
        >
          <div class="text">
            {{ noSubtitle }}
          </div>
        </div>

        <div
          v-for="(item, index) in computedAvailableItems"
          :key="item.rank"
        >
          <div
            :id="'item'+index"
            :style="{
              transition: isOverFlow ? '' : '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
              color: hoverIndex === index || currentSubtitleIndex === index ?
                'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
              height: hoverIndex === index ?
                `${itemHeight + hoverHeight}px` : `${itemHeight}px`,
              cursor: currentSubtitleIndex === index ? 'default' : 'pointer',
            }"
            @mouseup="toggleItemClick($event, index)"
            @mouseover="toggleItemsMouseOver(index)"
            @mouseleave="toggleItemsMouseLeave(index)"
            class="menu-item-text-wrapper"
          >
            <div class="textContainer">
              <div
                :style="{
                  wordBreak: hoverIndex === index && showAllName ? 'break-all' : '',
                  whiteSpace: hoverIndex === index && showAllName ? '' : 'nowrap'
                }"
                class="text"
              >
                {{ item.name }}
              </div>
            </div>
            <div class="iconContainer">
              <transition name="sub-delete">
                <Icon
                  v-show="item.type === 'local' && hoverIndex === index"
                  @mouseup.native="handleSubDelete($event, item)"
                  type="deleteSub"
                  class="deleteIcon"
                />
              </transition>
              <transition
                v-if="item.type === 'translated'
                  && (item.language !== translateLanguage || translateProgress <= 0)"
                name="sub-delete"
              >
                <span
                  v-show="item.type === 'translated' && hoverIndex === index"
                  @mouseup.native="handleSubDelete($event, item)"
                  class="txt"
                >生成</span>
              </transition>
              <div
                v-else-if="translateProgress > 0 && item.type === 'translated'
                  && item.language === translateLanguage"
                style="width: 20px; height: 20px"
              >
                <Progress
                  :progress="translateProgress"
                  :type="'circle'"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          v-for="(item, index) in loadingTypes"
          :key="`${item}-${index}`"
          class="placeholders-wrapper"
        >
          <div class="placeholder-item-text-wrapper">
            <div class="text">
              {{ item }}
            </div>
          </div>
        </div>
        <div
          v-if="0 <= computedAvailableItems.length"
          :style="{
            height: currentSubtitleIndex === hoverIndex ?
              `${itemHeight + hoverHeight}px` : `${itemHeight}px`,
            marginTop: currentSubtitleIndex <= hoverIndex ?
              `${-cardPos - hoverHeight}px` : `${-cardPos}px`,
            transition: transFlag ?
              'all 100ms cubic-bezier(0.17, 0.67, 0.17, 0.98)' : '',
          }"
          :class="{ 'backdrop': useBlur }"
          class="card"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import { SubtitleControlListItem } from '@/interfaces/ISubtitle';
import Icon from '../BaseIconContainer.vue';
import Progress from './Progress.vue';

export default {
  name: 'SubtitleList',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    Icon,
    Progress,
  },
  props: {
    useBlur: {
      type: Boolean,
      default: false,
    },
    computedSize: {
      type: Number,
      required: true,
    },
    currentSubtitleIndex: {
      type: Number,
      required: true,
    },
    noSubtitle: {
      type: String,
      required: true,
    },
    realItemsNum: {
      type: Number,
      required: true,
    },
    computedAvailableItems: {
      type: Array,
      default: () => [],
    },
    loadingTypes: {
      type: Array,
      default: () => [],
    },
    hoverHeight: {
      type: Number,
      required: true,
    },
    transFlag: {
      type: Boolean,
      required: true,
    },
    isFirstSubtitle: {
      type: Boolean,
      required: true,
    },
    refAnimation: {
      type: String,
      required: true,
    },
    showAttached: {
      type: Boolean,
      required: true,
    },
    enabledSecondarySub: {
      type: Boolean,
      required: true,
    },
    changeSubtitle: {
      type: Function,
      required: true,
    },
    translateProgress: {
      type: Number,
      default: 0,
    },
    translateLanguage: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      detailTimer: null,
      hoverIndex: -5,
      showAllName: false,
    };
  },
  computed: {
    textHeight() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 13;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 14;
      }
      return 18;
    },
    itemHeight() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 27;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 32;
      }
      return 44;
    },
    currentScrollTop() {
      const marginFactors = [4, 5, 7];
      return this.currentSubtitleIndex
        * (this.itemHeight + marginFactors[[27, 32, 44].indexOf(this.itemHeight)]);
    },
    cardPos() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return this.computedAvailableItems.length > 0
          ? ((this.computedAvailableItems.length + this.loadingTypes.length)
          - this.currentSubtitleIndex) * 31
          : this.scopeHeight + 4;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return this.computedAvailableItems.length > 0
          ? ((this.computedAvailableItems.length + this.loadingTypes.length)
          - this.currentSubtitleIndex) * 37
          : this.scopeHeight + 5;
      }
      return this.computedAvailableItems.length > 0
        ? ((this.computedAvailableItems.length + this.loadingTypes.length)
        - this.currentSubtitleIndex) * 51
        : this.scopeHeight + 7;
    },
    isOverFlow() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return this.scopeHeight + this.hoverHeight > 89 ? 'scroll' : '';
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return this.scopeHeight + this.hoverHeight > 180 ? 'scroll' : '';
      }
      return this.scopeHeight + this.hoverHeight > 350 ? 'scroll' : '';
    },
    scopeHeight() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return (this.realItemsNum * 31) - 4;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return (this.realItemsNum * 37) - 5;
      }
      return (this.realItemsNum * 51) - 7;
    },
  },
  watch: {
    currentSubtitleIndex(val: number) {
      if (val === 0) {
        this.$refs.scroll.scrollTop = 0;
      }
    },
    showAttached() {
      this.$refs.scroll.scrollTop = this.currentScrollTop;
    },
    isFirstSubtitle() {
      this.$refs.scroll.scrollTop = this.currentScrollTop;
    },
    enabledSecondarySub(val: boolean) {
      this.$refs.scroll.scrollTop = val ? 0 : this.currentScrollTop;
    },
  },
  methods: {
    finishAnimation() {
      this.$emit('update:refAnimation', '');
    },
    showSubtitleDetails(index: number) {
      if (index >= 0) {
        clearTimeout(this.detailTimer);
        const hoverItem: HTMLElement|null = document.querySelector(`#item${index} .text`);
        if (hoverItem && hoverItem.clientWidth < hoverItem.scrollWidth) {
          this.detailTimer = setTimeout(() => {
            this.$emit('update:hoverHeight', this.textHeight
              * (Math.ceil(hoverItem.scrollWidth / hoverItem.clientWidth) - 1));
            this.showAllName = true;
          }, 1500);
        }
      }
    },
    handleSubDelete(e: MouseEvent, item: SubtitleControlListItem) {
      if ((e.target as HTMLElement).nodeName !== 'DIV') {
        setTimeout(() => {
          this.$emit('update:transFlag', false);
          this.$emit('update:hoverHeight', 0);
          this.$emit('remove-subtitle', [item]);
        }, 0);
      }
    },
    toggleItemsMouseOver(index: number) {
      this.showSubtitleDetails(index);
      this.hoverIndex = index;
    },
    toggleItemsMouseLeave() {
      clearTimeout(this.detailTimer);
      this.$emit('update:hoverHeight', 0);
      this.showAllName = false;
      this.hoverIndex = -5;
    },
    toggleItemClick(event: MouseEvent, index: number) {
      if ((event.target as HTMLElement).nodeName === 'DIV') {
        const { computedAvailableItems } = this;
        this.changeSubtitle(computedAvailableItems[index]);
        setTimeout(() => {
          this.showSubtitleDetails(index);
        }, 0);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.sub-menu {
  overflow: hidden;
}
::-webkit-scrollbar {
  width: 2px;
}
::-webkit-scrollbar-thumb {
  border-radius: 1.2px;
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.15);
}
.refresh-animation .text {
  animation: menu-refresh 300ms linear 1 normal forwards;
}
@keyframes menu-refresh {
  0% { opacity: 1 }
  25% { opacity: 0.5 }
  50% { opacity: 0 }
  75% { opacity: 0.5 }
  100% { opacity: 1 }
}
.menu-item-text-wrapper {
  .iconContainer {
    display: flex;
    align-items: center;
    .txt {
      font-size: 9px;
      color: rgba(255,255,255,0.90);
      letter-spacing: 0.45px;
      cursor: pointer;
    }
  }
  .deleteIcon {
    transition-delay: 75ms;
  }
  .text {
    transition: color 90ms linear;
    transition-delay: 75ms;
    overflow: hidden; //超出的文本隐藏
    text-overflow: ellipsis;
  }
}
.placeholder-item-text-wrapper {
  .text {
    overflow: hidden; //超出的文本隐藏
    white-space: nowrap;
    text-overflow: ellipsis;
    color: grey;
  }
}
.placeholders-wrapper {
  cursor: default;
}
.card {
  position: relative;
  z-index: -5;
  border-radius: 7px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .2);
  border: 0.5px solid rgba(255, 255, 255, 0.40);
  background-image: radial-gradient(
    60% 134%,
  rgba(255, 255, 255, 0.25) 44%,
    rgba(255, 255, 255, 0.21) 100%
  );
  box-sizing: border-box;
}
.backdrop {
  border: 0.5px solid rgba(255, 255, 255, 0.20);
  opacity: 0.4;
  background-image: radial-gradient(
    60% 134%,
  rgba(255, 255, 255, 0.09) 44%,
  rgba(255, 255, 255, 0.05) 100%
  );
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .scrollScope {
    width: 160px;
    margin: auto auto 10px auto;
    max-height: 89px
  }
  .menu-item-text-wrapper {
    width: 142px;
    display: flex;
    margin: auto auto 4px 9px;
    .textContainer {
      width: 116px;
      display: flex;
    }
    .text {
      font-size: 11px;
      letter-spacing: 0.2px;
      line-height: 13px;
      margin: auto 0 auto 9px;
    }
    .iconContainer {
      width: 26px;
      height: 27px;
      .deleteIcon {
        margin: auto 9px auto auto;
      }
    }
  }
  .placeholder-item-text-wrapper {
    width: 142px;
    height: 27px;
    display: flex;
    margin-left: 9px;
    margin-bottom: 4px;
    .text {
      font-size: 11px;
      letter-spacing: 0.2px;
      line-height: 15px;
      margin: auto 9.43px;
    }
  }
  .card {
    width: 142px;
    margin-left: 9px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .scrollScope {
    width: 191px;
    margin: auto auto 12px auto;
    max-height: 180px
  }
  .menu-item-text-wrapper {
    width: 174px;
    display: flex;
    margin: auto auto 5px 9.5px;
    .textContainer {
      width: 141px;
      display: flex;
    }
    .text {
      font-size: 13.2px;
      letter-spacing: 0.2px;
      line-height: 16px;
      margin: auto 0 auto 12.73px;
    }
    .iconContainer {
      width: 33px;
      height: 32px;
      .deleteIcon {
        margin: auto 10.8px auto auto;
      }
    }
  }
  .placeholder-item-text-wrapper {
    width: 174px;
    height: 32px;
    display: flex;
    margin-left: 9.5px;
    margin-bottom: 5px;
    .text {
      font-size: 12px;
      letter-spacing: 0.2px;
      line-height: 16px;
      margin: auto 12.73px;
    }
  }
  .card {
    width: 172px;
    margin-left: 9.5px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .scrollScope {
    width: 266px;
    margin: auto auto 19px auto;
    max-height: 350px
  }
  .menu-item-text-wrapper {
    width: 242px;
    display: flex;
    margin: auto auto 7px 12px;
    .textContainer {
      width: 196px;
      display: flex;
    }
    .text {
      font-size: 18.48px;
      letter-spacing: 0.27px;
      line-height: 20px;
      margin: auto 0 auto 17.89px;
    }
    .iconContainer {
      width: 46px;
      height: 44px;
      .deleteIcon {
        margin: auto 15.12px auto auto;
      }
    }
  }
  .placeholder-item-text-wrapper {
    width: 242px;
    height: 44px;
    display: flex;
    margin-left: 12px;
    margin-bottom: 7px;
    .text {
      font-size: 16px;
      letter-spacing: 0.27px;
      line-height: 16px;
      margin: auto 17.89px;
    }
  }
  .card {
    width: 242px;
    margin-left: 12px;
  }
}
</style>
