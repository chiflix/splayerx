<template>
  <div class="sub-menu">
    <div
      ref="scroll"
      :style="{
        transition: '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
        height: `${scopeHeight + hoverHeight}px`,
        overflowY: isOverFlow,
      }"
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
          @mouseup="toggleItemClick($event, -1)"
          @mouseover="toggleItemsMouseOver(-1)"
          @mouseleave="toggleItemsMouseLeave(-1)"
          :class="`menu-item-text-wrapper ${currentSubtitleIndex === -1 ? ' focused' : ''}`"
        >
          <div
            class="text"
            style="display: flex; align-items: center; height: 100%;"
          >
            {{ noSubtitle }}
          </div>
        </div>

        <div
          v-for="(item, index) in computedAvailableItems"
          :key="item.rank"
        >
          <div
            :id="'reference-item'+index"
            :style="{
              transition: isOverFlow ? '' : '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)',
              color: hoverIndex === index || currentSubtitleIndex === index ?
                'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
              cursor: currentSubtitleIndex === index ? 'default' : 'pointer',
              display: 'flex',
            }"
            @mouseup="toggleItemClick($event, index)"
            @mouseover="toggleItemsMouseOver(index)"
            @mouseleave="toggleItemsMouseLeave(index)"
            :class="`menu-item-text-wrapper ${currentSubtitleIndex === index
              ? ' focused' : ''}`"
          >
            <div
              :style="{
                display: 'flex',
                justifyContent: 'space-between',
                width: 'calc(100% - 2px)',
                height: hoverIndex === index ? `${itemHeight + hoverHeight}px` : `${itemHeight}px`,
              }"
            >
              <div
                :style="{
                  width: 'auto',
                }"
                class="textContainer"
              >
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
            </div>
          </div>
        </div>
        <div
          ref="backCard"
          v-if="0 <= computedAvailableItems.length"
          :style="{
            height: currentSubtitleIndex === hoverIndex ?
              `${itemHeight + hoverHeight}px` : `${itemHeight}px`,
            marginTop: currentSubtitleIndex <= hoverIndex ?
              `${-cardPos - hoverHeight}px` : `${-cardPos}px`,
            transition: transFlag ?
              'all 100ms cubic-bezier(0.17, 0.67, 0.17, 0.98)' : '',
          }"
          class="card"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';

export default {
  name: 'SubtitleList',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  props: {
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
    itemHeight: {
      type: Number,
      required: true,
    },
    hoverHeight: {
      type: Number,
      required: true,
    },
    transFlag: {
      type: Boolean,
      required: true,
    },
    showAttached: {
      type: Boolean,
      required: true,
    },
    changeSubtitle: {
      type: Function,
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
    currentScrollTop() {
      const marginFactors = [4, 5, 7];
      return this.currentSubtitleIndex
        * (this.itemHeight + marginFactors[[27, 32, 44].indexOf(this.itemHeight)]);
    },
    cardPos() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return this.computedAvailableItems.length > 0
          ? (this.computedAvailableItems.length - this.currentSubtitleIndex) * 31
          : this.scopeHeight + 4;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return this.computedAvailableItems.length > 0
          ? (this.computedAvailableItems.length - this.currentSubtitleIndex) * 37
          : this.scopeHeight + 5;
      }
      return this.computedAvailableItems.length > 0
        ? (this.computedAvailableItems.length - this.currentSubtitleIndex) * 51
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
      setImmediate(() => {
        this.$refs.scroll.scrollTop = this.currentScrollTop;
      });
    },
  },
  methods: {
    showSubtitleDetails(index: number) {
      if (index >= 0) {
        clearTimeout(this.detailTimer);
        const hoverItem: HTMLElement|null = document.querySelector(`#reference-item${index} .text`);
        if (hoverItem && hoverItem.clientWidth < hoverItem.scrollWidth) {
          this.detailTimer = setTimeout(() => {
            this.$emit('update:hoverHeight', this.textHeight
              * (Math.ceil(hoverItem.scrollWidth / hoverItem.clientWidth) - 1));
            this.showAllName = true;
          }, 1500);
        }
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
      const { computedAvailableItems } = this;
      const currentItem = computedAvailableItems[index];
      if (currentItem) {
        this.changeSubtitle(currentItem);
        setTimeout(() => {
          this.showSubtitleDetails(index);
        }, 0);
      } else {
        this.changeSubtitle(undefined);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.sub-menu {
  overflow: hidden;
  padding-right: 2px;
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
.itemContainer {
  padding: 0 12px;
}
.menu-item-text-wrapper {
  position: relative;
  &::before {
    width: 100%;
    height: calc(100% - 1px);
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    z-index: -5;
    transform: translateX(calc(-50% - 1px));
    box-sizing: inherit;
    border-radius: 7px;
    opacity: 0;
    background: transparent;
    box-shadow: 0 1px 2px rgba(0, 0, 0, .2);
    border: 0.5px solid rgba(255, 255, 255, 0.40);
    background-image: radial-gradient(
      60% 134%,
    rgba(255, 255, 255, 0.25) 44%,
      rgba(255, 255, 255, 0.21) 100%
    );
  }
  &.focused {
    border-radius: 7px;
    overflow: hidden;
    &::before {
      opacity: 1;
    }
  }
  .deleteIcon, .detach-icon {
    transition-delay: 75ms;
  }
  .iconContainer {
    display: flex;
    align-items: center;
    .txt {
      font-family: $font-medium;
      font-size: 9px;
      color: rgba(255,255,255,0.6);
      letter-spacing: 0.45px;
      cursor: pointer;
    }
  }
  .deleteIcon {
    transition-delay: 75ms;
  }
  .down-arrow-icon-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    z-index: 2;
    .down-arrow-icon {
      width: 100%;
      height: 48%;
      display: flex;
      transition: transform 0.1s ease-in-out;
      &.up {
        transform: rotate(180deg);
      }
    }
  }
  .text {
    transition: color 90ms linear;
    transition-delay: 75ms;
    overflow: hidden; //超出的文本隐藏
    text-overflow: ellipsis;
  }
  .modified-subtitle-advanced-panel {
    width: calc(100% - 2px);
    background: rgba(0,0,0,0.05);
    overflow: hidden;
    transition: height 0.1s ease-in-out;
    .icons-wrap, .confirm-delete-wrap {
      height: 100%;
    }
    .icons-wrap {
      display: flex;
      justify-content: space-around;
      align-items: center;
      &>div {
        // width: 16.95px;
        height: 53.5%;
        cursor: pointer;
      }
      &>div:nth-child(2) {
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }
      &>div:nth-child(1) {
        cursor: default;
      }
    }
    .two-icons-wrap {
      &>div:nth-child(2) {
        border-right: none;
      }
    }
    .confirm-delete-wrap {
      text-align: right;
      .submit, .cancel {
        color: #FFFFFF;
        margin-right: 15px;
      }
      .submit {
        opacity: 0.4;
      }
      .cancel {
        opacity: 0.2;
      }
    }
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
.translateProgress {
  width: 10px;
  height: 10px;
  margin-right: 8px;
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .itemContainer {
    padding: 0 6px;
  }
  .scrollScope {
    max-height: 89px
  }
  .menu-item-text-wrapper {
    display: flex;
    margin: auto auto 4px auto;
    .textContainer {
      width: 100% !important;
      display: flex;
    }
    .text {
      font-size: 11px;
      letter-spacing: 0.2px;
      line-height: 13px;
      margin: auto 5px;
    }
    .iconContainer {
      width: 30px;
      height: 27px;
      .deleteIcon {
        margin: auto 8px auto auto;
      }
      .txt {
        margin-right: 10px;
        font-size: 9px;
        line-height: 13px;
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
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .translateProgress {
    width: 14px;
    height: 14px;
    margin-right: 10px;
  }
  .scrollScope {
    max-height: 180px
  }
  .menu-item-text-wrapper {
    display: flex;
    margin: auto auto 5px auto;
    .textContainer {
      width: 100% !important;
      display: flex;
    }
    .text {
      font-size: 13.2px;
      letter-spacing: 0.2px;
      line-height: 16px;
      margin: auto 8px;
    }
    .iconContainer {
      width: 36px;
      height: 32px;
      .deleteIcon {
        margin: auto 10px auto auto;
      }
      .txt {
        margin-right: 12px;
        font-size: 10.8px;
        line-height: 16px;
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
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .translateProgress {
    width: 20px;
    height: 20px;
    margin-right: 14px;
  }
  .scrollScope {
    max-height: 350px
  }
  .menu-item-text-wrapper {
    display: flex;
    margin: auto auto 7px auto;
    .textContainer {
      width: 100% !important;
      display: flex;
    }
    .text {
      font-size: 18.48px;
      letter-spacing: 0.27px;
      line-height: 20px;
      margin: auto 14.4px;
    }
    .iconContainer {
      width: 50.4px;
      height: 44px;
      .deleteIcon {
        margin: auto 12.4px auto auto;
      }
      .txt {
        margin-right: 14.4px;
        font-size: 15.12px;
        line-height: 20px;
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
      margin: auto 0 auto 20.16px;
    }
  }
  .card {
  }
}
.sub-delete-enter-active, .sub-delete-leave-active {
  transition: opacity 150ms;
}
.sub-delete-enter, .sub-delete-leave-to {
  opacity: 0;
}
</style>
