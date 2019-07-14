<template>
  <div
    :style="{
      height: heightSize,
      backgroundImage: !isChosen ? '' :
        'linear-gradient(90deg, rgba(255,255,255,0.03) ' +
        '0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
      marginTop: rowType === rowTypeEnum.RATE ? '8px' : ''
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    class="itemContainer"
  >
    <div
      :style="{
        backgroundImage: !isChosen && hoveredText && isPrimarySub ?
          'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.045) 20%, ' +
          'rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%)' : '',
        transition: 'opacity 200ms',
      }"
      class="detail"
    >
      <div
        :style="{
          cursor: isChosen || !isPrimarySub ? 'default' : 'pointer',
          color: !isPrimarySub ? 'rgba(255, 255, 255, 0.2)' : !isChosen && hoveredText ?
            'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          transition: 'color 300ms',
        }"
        class="textContainer"
      >
        <p>{{ rowType === rowTypeEnum.RATE ? $t('advance.rateTitle') : $t('advance.fontSize') }}</p>
        <div
          v-show="!isChosen || rowType === rowTypeEnum.RATE"
          :style="{
            color: isPrimarySub ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'
          }"
          class="rightItem"
        >
          {{ showDetail }}
        </div>
      </div>
      <transition name="detail">
        <div
          v-show="isChosen"
          class="listContainer"
        >
          <div class="rowContainer">
            <div
              v-for="(list, index) in lists"
              :id="'list'+index"
              :key="list"
              :style="{
                width: index === difIndex[0] || index === difIndex[1] ?
                  `${difWidth[0]}%` : `${difWidth[1]}%`,
                cursor: selectedIndex === index ? 'default' : 'pointer',
              }"
              @mouseover="handleOver(index)"
              @mouseout="handleOut(index)"
              @click="handleClick(index)"
              class="rowNumDetail"
            >
              <p
                :style="{
                  color: selectedIndex === index || index === hoverIndex ?
                    'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  margin: 'auto',
                  transition: 'color 300ms',
                }"
                class="text"
              >
                {{ list }}
              </p>
            </div>
            <div
              v-show="rowType !== rowTypeEnum.RATE || lists.includes(rate)"
              :class="cardType"
              :style="{
                left: `${moveLength}px`,
                transition: 'left 200ms cubic-bezier(0.17, 0.67, 0.17, 0.98), width 200ms',
                boxSizing: 'border-box'
              }"
              class="selected-back"
            />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">

export default {
  name: 'AdvanceRowItems',
  props: {
    lists: {
      type: Array,
      require: true,
      default: () => [],
    },
    rate: {
      type: Number,
      default: 1,
    },
    chosenSize: {
      type: Number,
      default: 1,
    },
    cardWidth: {
      type: Number,
      required: true,
    },
    isChosen: {
      type: Boolean,
    },
    size: {
      type: Number,
      required: true,
    },
    rowType: {
      type: String,
      required: true,
    },
    chosenSizeContent: {
      type: String,
      default: 'Normal',
    },
    handleRowClick: {
      type: Function,
      required: true,
    },
    isPrimarySub: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      hoverIndex: -1,
      hoveredText: false,
      rowTypeEnum: {
        RATE: 'rate',
        FONTSIZE: 'fontSize',
      },
    };
  },
  computed: {
    showDetail() {
      return this.rowType === this.rowTypeEnum.RATE ? `${this.rate} x` : this.chosenSizeContent;
    },
    cardType() {
      if (this.selectedIndex === this.difIndex[0] || this.selectedIndex === this.difIndex[1]) {
        return this.rowType === this.rowTypeEnum.RATE ? 'smallSpeedCard' : 'smallFontCard';
      }
      return this.rowType === this.rowTypeEnum.RATE ? 'bigSpeedCard' : 'bigFontCard';
    },
    heightSize() {
      if (this.size >= 289 && this.size <= 480) {
        return this.isChosen ? '74px' : '37px';
      }
      if (this.size >= 481 && this.size < 1080) {
        return this.isChosen ? `${74 * 1.2}px` : `${37 * 1.2}px`;
      }
      return this.isChosen ? `${74 * 1.2 * 1.4}px` : `${37 * 1.2 * 1.4}px`;
    },
    difIndex() {
      return this.rowType !== this.rowTypeEnum.RATE ? [0, 2] : [1, 4];
    },
    difWidth() {
      if (this.size >= 289 && this.size <= 480) {
        return this.rowType !== this.rowTypeEnum.RATE ? [23, 27] : [18.5, 23];
      }
      if (this.size >= 481 && this.size < 1080) {
        return this.rowType !== this.rowTypeEnum.RATE
          ? [23 * 1.2, 27 * 1.2] : [18.5 * 1.2, 23 * 1.2];
      }
      return this.rowType !== this.rowTypeEnum.RATE ? [23 * 1.2 * 1.4, 27 * 1.2 * 1.4]
        : [18.5 * 1.2 * 1.4, 23 * 1.2 * 1.4];
    },
    moveLength() {
      const rateFactors = [17, 46, 71, 100, 129];
      const fontFactors = [17, 49, 86, 117];
      return this.rowType === this.rowTypeEnum.RATE
        ? (rateFactors[this.selectedIndex] / 170) * this.cardWidth
        : (fontFactors[this.selectedIndex] / 170) * this.cardWidth;
    },
    selectedIndex() {
      return this.rowType === this.rowTypeEnum.RATE
        ? this.lists.indexOf(this.rate) : this.chosenSize;
    },
  },
  methods: {
    handleMouseEnter() {
      this.hoveredText = true;
    },
    handleMouseLeave() {
      this.hoveredText = false;
    },
    handleOver(index: number) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(index: number) {
      this.handleRowClick(this.rowType === this.rowTypeEnum.RATE ? this.lists[index] : index);
    },
  },
};
</script>

<style lang="scss" scoped>
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .itemContainer {
    width: 100%;
    .textContainer {
      width: auto;
      height: 37px;
      margin: auto 17px auto 17px;
      p {
        font-size: 13px;
      }
      .rightItem {
        font-size: 11px;
      }
    }
    .listContainer {
      height: 37px;
      .rowContainer {
        width: 80%;
        height: 27px;
        .text {
          font-size: 10px;
        }
        .selected-back {
          height: 27px;
        }
        .smallSpeedCard {
          width: 14.8%;
        }
        .smallFontCard {
          width: 18.4%;
        }
        .bigSpeedCard {
          width: 16.8%;
        }
        .bigFontCard {
          width: 21.6%;
        }
      }
    }
  }
  .detail-enter-active {
    animation: showP1 100ms;
  }
  .detail-enter, .detail-leave-to {
    opacity: 0;
  }
  .detail-leave-active {
    animation: hideP1 100ms;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .itemContainer {
    width: 100%;
    .textContainer {
      width: auto;
      height: 44.4px;
      margin: auto 20.4px auto 20.4px;
      p {
        font-size: 15.6px;
      }
      .rightItem {
        font-size: 13.2px;
      }
    }
    .listContainer {
      height: 44.4px;
      .rowContainer {
        width: 80%;
        height: 32.4px;
        .text {
          font-size: 12px;
        }
        .selected-back {
          height: 32.4px;
        }
        .smallSpeedCard {
          width: 14.8%;
        }
        .smallFontCard {
          width: 18.4%;
        }
        .bigSpeedCard {
          width: 16.8%;
        }
        .bigFontCard {
          width: 21.6%;
        }
      }
    }
  }
  .detail-enter-active {
    animation: showP2 100ms;
  }
  .detail-enter, .detail-leave-to {
    opacity: 0;
  }
  .detail-leave-active {
    animation: hideP2 100ms;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .itemContainer {
    width: 100%;
    .textContainer {
      width: 228.48px;
      height: 62.16px;
      margin: auto auto auto 28.56px;
      p {
        font-size: 21.84px;
      }
      .rightItem {
        font-size: 18.48px;
      }
    }
    .listContainer {
      height: 62.16px;
      .rowContainer {
        width: 80%;
        height: 45.36px;
        .text {
          font-size: 16.8px;
        }
        .selected-back {
          height: 45.36px;
        }
        .smallSpeedCard {
          width: 14.8%;
        }
        .smallFontCard {
          width: 18.4%;
        }
        .bigSpeedCard {
          width: 16.8%;
        }
        .bigFontCard {
          width: 21.6%;
        }
      }
    }
  }
  .detail-enter-active {
    animation: showP3 100ms;
  }
  .detail-enter, .detail-leave-to {
    opacity: 0;
  }
  .detail-leave-active {
    animation: hideP3 100ms;
  }
}
.itemContainer {
  display: flex;
  border-radius: 7px;
  z-index: 10;
  transition: height 100ms linear, background-color 100ms linear, opacity 300ms;
  .detail {
    width: 100%;
  }
  .textContainer {
    display: flex;
    flex: 1;
    color: rgba(255, 255, 255, 0.6);
    p {
      letter-spacing: 0.2px;
      margin: auto auto auto 0;
    }
    .rightItem {
      margin: auto 0 auto auto;
    }
  }
  .listContainer {
    flex: 1;
    display: flex;
    cursor: default;
    .rowContainer {
      display: flex;
      justify-content: space-around;
      margin: -2px auto;
      .text {
        text-shadow: 0px 1px 1px rgba(0, 0, 0, .1);
      }
      .rowNumDetail {
        position: relative;
        display: flex;
      }
      .selected-back {
        position: absolute;
        z-index: -1;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        background-image: radial-gradient(
          60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
      }
    }
  }
}

@keyframes showP1 {
  0% {
    opacity: 0;
    height: 0;
  }
  100% {
    opacity: 1;
    height: 37px;
  }
}
@keyframes hideP1 {
  0% {
    opacity: 1;
    height: 37px;
  }
  100% {
    opacity: 0;
    height: 0;
  }
}
@keyframes showP2 {
  0% {
    opacity: 0;
    height: 0;
  }
  100% {
    opacity: 1;
    height: 44.4px;
  }
}
@keyframes hideP2 {
  0% {
    opacity: 1;
    height: 44.4px;
  }
  100% {
    opacity: 0;
    height: 0;
  }
}
@keyframes showP3 {
  0% {
    opacity: 0;
    height: 0;
  }
  100% {
    opacity: 1;
    height: 62.16px;
  }
}
@keyframes hideP3 {
  0% {
    opacity: 1;
    height: 62.16px;
  }
  100% {
    opacity: 0;
    height: 0;
  }
}
</style>
