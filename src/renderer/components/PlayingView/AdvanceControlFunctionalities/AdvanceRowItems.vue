<template>
  <div
    class="itemContainer"
    :style="{
      height: heightSize,
      backgroundImage: !isChosen ? '' :
        'linear-gradient(90deg, rgba(255,255,255,0.03) ' +
        '0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
      marginTop: rowType === rowTypeEnum.RATE ? '8px' : ''
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      class="detail"
      :style="{
        backgroundImage: !isChosen && hoveredText ?
          'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.045) 20%, ' +
          'rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%)' : '',
        transition: 'opacity 200ms',
      }"
    >
      <div
        class="textContainer"
        :style="{
          cursor: isChosen ? 'default' : 'pointer',
          color: !isChosen && hoveredText ?
            'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          transition: 'color 300ms',
        }"
      >
        <div class="textItem advanceNormalTitle">
          {{ rowType === rowTypeEnum.RATE ? $t('advance.rateTitle') : $t('advance.fontSize') }}
        </div>
        <div
          v-show="!isChosen || rowType === rowTypeEnum.RATE"
          class="rightItem advanceNormalItem"
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
              class="rowNumDetail"
              :style="{
                width: index === difIndex[0] || index === difIndex[1] ?
                  `${difWidth[0]}%` : `${difWidth[1]}%`,
                cursor: selectedIndex === index ? 'default' : 'pointer',
              }"
              @mouseover="handleOver(index)"
              @mouseout="handleOut(index)"
              @click="handleClick(index)"
            >
              <p
                class="text"
                :style="{
                  color: selectedIndex === index || index === hoverIndex ?
                    'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  margin: 'auto',
                  transition: 'color 300ms',
                }"
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
            >
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>

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
    changeFontSize: {
      type: Function,
      default: null,
    },
    changeRate: {
      type: Function,
      default: null,
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
      if (this.rowType === this.rowTypeEnum.RATE) {
        return `${this.rate} x`;
      }
      return `${this.chosenSizeContent}`;
    },
    cardType() {
      if (this.selectedIndex === this.difIndex[0] || this.selectedIndex === this.difIndex[1]) {
        if (this.rowType === this.rowTypeEnum.RATE) {
          return 'speedCard smallSpeedCard';
        }
        return 'fontCard smallFontCard';
      }
      if (this.rowType === this.rowTypeEnum.RATE) {
        return 'speedCard bigSpeedCard';
      }
      return 'fontCard bigFontCard';
    },
    heightSize() {
      if (this.size >= 289 && this.size <= 480) {
        return this.isChosen ? '74px' : '37px';
      } else if (this.size >= 481 && this.size < 1080) {
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
      } else if (this.size >= 481 && this.size < 1080) {
        return this.rowType !== this.rowTypeEnum.RATE ?
          [23 * 1.2, 27 * 1.2] : [18.5 * 1.2, 23 * 1.2];
      }
      return this.rowType !== this.rowTypeEnum.RATE ? [23 * 1.2 * 1.4, 27 * 1.2 * 1.4] :
        [18.5 * 1.2 * 1.4, 23 * 1.2 * 1.4];
    },
    moveLength() {
      const rateFactors = [17, 46, 71, 100, 129];
      const fontFactors = [17, 49, 86, 117];
      if (this.rowType === this.rowTypeEnum.RATE) {
        return (rateFactors[this.selectedIndex] / 170) * this.cardWidth;
      }
      return (fontFactors[this.selectedIndex] / 170) * this.cardWidth;
    },
    selectedIndex() {
      if (this.rowType === this.rowTypeEnum.RATE) {
        return this.lists.indexOf(this.rate);
      }
      return this.chosenSize;
    },
  },
  methods: {
    handleMouseEnter() {
      this.hoveredText = true;
    },
    handleMouseLeave() {
      this.hoveredText = false;
    },
    handleOver(index) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(index) {
      if (this.rowType === this.rowTypeEnum.RATE) {
        this.changeRate(this.lists[index]);
      } else {
        this.changeFontSize(index);
      }
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
    }
    .listContainer {
      height: 37px;
      .rowContainer {
        width: 80%;
        height: 27px;
        .text {
          font-size: 10px;
        }
        .speedCard {
          /*left: 46px;*/
          height: 27px;
        }
        .fontCard {
          /*left: 49px;*/
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
    }
    .listContainer {
      height: 44.4px;
      .rowContainer {
        width: 80%;
        height: 32.4px;
        .text {
          font-size: 12px;
        }
        .speedCard {
          /*left: 55.2px;*/
          height: 32.4px;
        }
        .fontCard {
          /*left: 58.8px;*/
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
    }
    .listContainer {
      height: 62.16px;
      .rowContainer {
        width: 80%;
        height: 45.36px;
        .text {
          font-size: 16.8px;
        }
        .speedCard {
          /*left: 77.28px;*/
          height: 45.36px;
        }
        .fontCard {
          /*left: 82.32px;*/
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
  clip-path: inset(0 round 8px);
  transition: height 100ms linear, background-color 100ms linear, opacity 300ms;
  .detail {
    width: 100%;
  }
  .textContainer {
    display: flex;
    flex: 1;
    color: rgba(255, 255, 255, 0.6);
    .textItem {
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
      .speedCard {
        position: absolute;
        z-index: -1;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        background-image: radial-gradient(
          60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
      }
      .fontCard {
        position: absolute;
        z-index: -1;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
        background-image: radial-gradient(
          60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
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
