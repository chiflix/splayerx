<template>
  <div class="itemContainer"
    :style="{
      height: heightSize,
      backgroundImage: !isChosen ? '' : 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
    }">
    <div class="detail"
      :style="{
        height: heightSize,
      }">
      <div class="textContainer"
        :style="{
           cursor: isChosen ? 'default' : 'pointer',
        }">
        <div class="textItem" :class="$i18n.locale === 'ja' && !isRateMenu ? 'advanceJaTitle' : 'advanceNormalTitle'"
          :style="{
            color: color,
            transition: 'color 300ms',
          }">{{ item }}</div>
        <div class="rightItem" :class="$i18n.locale === 'ja' && !isRateMenu? 'advanceJaItem' : 'advanceNormalItem'" v-show="!isChosen || isRateMenu">{{ showDetail }}</div>
      </div>
      <transition name="detail">
        <div class="listContainer" v-show="isChosen">
          <div class="rowContainer">
            <div v-for="(list, index) in lists"
              :id="'list'+index"
              :class="rowNumDetail"
              @mouseover="handleOver(index)"
              @mouseout="handleOut(index)"
              @click="handleClick(index)"
              :style="{
                width: index === difIndex[0] || index === difIndex[1] ? `${difWidth[0]}px` : `${difWidth[1]}px`,
                cursor: itemChosen(index) ? 'default' : 'pointer',
              }">
              <div class="text"
                :style="{
                  color: itemChosen(index) || index === hoverIndex ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  margin: 'auto',
                  transition: 'color 300ms',
                }">{{ list }}
              </div>
            </div>
            <div :class="cardType"
              v-show="!this.isRateMenu || this.lists.includes(this.rate)"
              :style="{
                left: cardPos,
                transition: 'left 200ms cubic-bezier(0.17, 0.67, 0.17, 0.98), width 200ms',
              }"></div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import asyncStorage from '@/helpers/asyncStorage';
import { mapGetters, mapActions } from 'vuex';
import { Video as videoActions, Subtitle as subtitleActions } from '@/store/actionTypes';

export default {
  name: 'AdvanceRowItems',
  data() {
    return {
      hoverIndex: -1,
      selectedIndex: 1,
      moveLength: '',
      lastSize: 1,
    };
  },
  props: {
    lists: {
      type: Object.Array,
      require: true,
      default: [],
    },
    item: {
      type: String,
    },
    color: {
      type: String,
    },
    isChosen: {
      type: Boolean,
    },
    size: {
      type: Number,
    },
    isRateMenu: {
      type: Boolean,
    },
  },
  watch: {
    subToTop(val) {
      if (!this.isRateMenu) {
        if (val) {
          this.lastSize = this.chosenSize;
          this.handleClick(0);
        } else {
          this.handleClick(this.lastSize);
        }
      }
    },
    rate(val) {
      if (this.isRateMenu) {
        const numList = [0.5, 1, 1.2, 1.5, 2];
        this.selectedIndex = numList.indexOf(val);
        this.calculateSpeedLength(numList.indexOf(val));
      }
    },
    chosenSize(val) {
      if (!this.isRateMenu) {
        this.selectedIndex = val;
        this.calculateFontLength(val);
      }
    },
    computedSize(val) {
      if (val >= 1080) {
        this.updateVideoScaleByFactors(val);
      } else if (this.videoAspectRatio >= 1) {
        this.updatePCVideoScaleByFactors(this.chosenSize);
      } else if (this.videoAspectRatio < 1) {
        this.updateMobileVideoScaleByFactors(this.chosenSize);
      }
    },
  },
  computed: {
    ...mapGetters(['rate', 'chosenSize', 'intrinsicWidth', 'intrinsicHeight', 'computedHeight', 'computedWidth', 'subToTop']),
    /**
     * @return {string}
     */
    ChosenSize() {
      switch (this.chosenSize) {
        case 0:
          return this.$t(`advance.fontItems[${this.selectedIndex}]`) === 'S' ? 'Small' : this.$t(`advance.fontItems[${this.selectedIndex}]`);
        case 1:
          return this.$t(`advance.fontItems[${this.selectedIndex}]`) === 'M' ? 'Normal' : this.$t(`advance.fontItems[${this.selectedIndex}]`);
        case 2:
          return this.$t(`advance.fontItems[${this.selectedIndex}]`) === 'L' ? 'Large' : this.$t(`advance.fontItems[${this.selectedIndex}]`);
        case 3:
          return this.$t(`advance.fontItems[${this.selectedIndex}]`) === 'XL' ? 'Extra Large' : this.$t(`advance.fontItems[${this.selectedIndex}]`);
        default:
          return this.$t('advance.fontItems[1]');
      }
    },
    computedSize() {
      return this.videoAspectRatio >= 1 ? this.computedHeight : this.computedWidth;
    },
    cardPos() {
      if (this.moveLength) {
        if (this.size >= 289 && this.size <= 480) {
          return `${this.moveLength}px`;
        } else if (this.size >= 481 && this.size < 1080) {
          return `${this.moveLength * 1.2}px`;
        }
        return `${this.moveLength * 1.2 * 1.4}px`;
      }
      return '';
    },
    showDetail() {
      if (this.isRateMenu) {
        return `${this.rate} x`;
      } else if (!this.isRateMenu) {
        return `${this.ChosenSize}`;
      }
      return null;
    },
    cardType() {
      if (this.selectedIndex === this.difIndex[0] || this.selectedIndex === this.difIndex[1]) {
        if (this.isRateMenu) {
          return 'speedCard smallSpeedCard';
        }
        return 'fontCard smallFontCard';
      }
      if (this.isRateMenu) {
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
    rowNumDetail() {
      return !this.isRateMenu ? 'fontRowNumDetail' : 'speedRowNumDetail';
    },
    difIndex() {
      return !this.isRateMenu ? [0, 2] : [1, 4];
    },
    difWidth() {
      if (this.size >= 289 && this.size <= 480) {
        return !this.isRateMenu ? [29, 35] : [25, 29];
      } else if (this.size >= 481 && this.size < 1080) {
        return !this.isRateMenu ? [29 * 1.2, 35 * 1.2] : [25 * 1.2, 29 * 1.2];
      }
      return !this.isRateMenu ? [29 * 1.2 * 1.4, 35 * 1.2 * 1.4] : [25 * 1.2 * 1.4, 29 * 1.2 * 1.4];
    },
    videoAspectRatio() {
      return this.intrinsicWidth / this.intrinsicHeight;
    },
  },
  created() {
    asyncStorage.get('subtitle-style').then((data) => {
      if (data.chosenSize) {
        if (!this.isRateMenu) {
          this.handleClick(data.chosenSize);
        }
      }
    });
  },
  mounted() {
    this.$bus.$on('change-size-by-menu', (index) => {
      this.changeFontSize(index);
    });
  },
  methods: {
    ...mapActions({
      changeRate: videoActions.CHANGE_RATE,
      updateSubScale: subtitleActions.UPDATE_SUBTITLE_SCALE,
      updateSubSize: subtitleActions.UPDATE_SUBTITLE_SIZE,
    }),
    itemChosen(index) {
      if (this.isRateMenu) {
        return [0.5, 1, 1.2, 1.5, 2].indexOf(this.rate) === index;
      }
      return this.chosenSize === index;
    },
    handleOver(index) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(index) {
      this.selectedIndex = index;
      if (this.isRateMenu) {
        this.calculateSpeedLength(index);
      } else {
        this.calculateFontLength(index);
      }
      if (this.isRateMenu) {
        this.changeRate(this.lists[index]);
      } else {
        this.changeFontSize(index);
      }
    },
    calculateSpeedLength(index) {
      switch (index) {
        case 0:
          this.moveLength = 17;
          break;
        case 1:
          this.moveLength = 46;
          break;
        case 2:
          this.moveLength = 71;
          break;
        case 3:
          this.moveLength = 100;
          break;
        case 4:
          this.moveLength = 129;
          break;
        default:
          break;
      }
    },
    calculateFontLength(index) {
      switch (index) {
        case 0:
          this.moveLength = 17;
          break;
        case 1:
          this.moveLength = 49;
          break;
        case 2:
          this.moveLength = 86;
          break;
        case 3:
          this.moveLength = 117;
          break;
        default:
          break;
      }
    },
    // update video scale that width is larger than height
    updatePCVideoScaleByFactors(index) {
      const firstFactors = [21, 29, 37, 45];
      const secondFactors = [24, 26, 28, 30];
      this.updateSubScale(`${(((firstFactors[index] / 900) * this.computedHeight) + (secondFactors[index] / 5)) / 9}`);
    },
    // update video scale that height is larger than width
    updateMobileVideoScaleByFactors(index) {
      const firstFactors = [21, 29, 37, 45];
      const secondFactors = [12, -92, -196, -300];
      this.updateSubScale(`${(((firstFactors[index] / 760) * this.computedHeight) + (secondFactors[index] / 76)) / 9}`);
    },
    // update video scale when width or height is larger than 1080
    updateVideoScaleByFactors(val) {
      const factors = [30, 40, 50, 60];
      this.updateSubScale(`${((val / 1080) * factors[this.chosenSize]) / 9}`);
    },
    changeFontSize(index) {
      this.updateSubSize(index);
      if (this.videoAspectRatio >= 1) {
        this.updatePCVideoScaleByFactors(index);
      } else if (this.videoAspectRatio < 1) {
        this.updateMobileVideoScaleByFactors(index);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .itemContainer {
    width: 170px;
    .textContainer {
      width: 136px;
      height: 37px;
      margin: auto auto auto 17px;
    }
    .listContainer {
      height: 37px;
      .rowContainer {
        width: 137px;
        height: 27px;
        .text {
          line-height: 12px;
          font-size: 10px;
        }
        .speedCard {
          left: 46px;
          height: 27px;
        }
        .fontCard {
          left: 49px;
          height: 27px;
        }
        .smallSpeedCard {
          width: 25px;
        }
        .smallFontCard {
          width: 29px;
        }
        .bigSpeedCard {
          width: 29px;
        }
        .bigFontCard {
          width: 35px;
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
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .itemContainer {
    width: 204px;
    .textContainer {
      width: 163.2px;
      height: 44.4px;
      margin: auto auto auto 20.4px;
    }
    .listContainer {
      height: 44.4px;
      .rowContainer {
        width: 164.4px;
        height: 32.4px;
        .text {
          line-height: 14.4px;
          font-size: 12px;
        }
        .speedCard {
          left: 55.2px;
          height: 32.4px;
        }
        .fontCard {
          left: 58.8px;
          height: 32.4px;
        }
        .smallSpeedCard {
          width: 30px;
        }
        .smallFontCard {
          width: 34.8px;
        }
        .bigSpeedCard {
          width: 34.8px;
        }
        .bigFontCard {
          width: 42px;
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
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .itemContainer {
    width: 285.6px;
    .textContainer {
      width: 228.48px;
      height: 62.16px;
      margin: auto auto auto 28.56px;
    }
    .listContainer {
      height: 62.16px;
      .rowContainer {
        width: 230.16px;
        height: 45.36px;
        .text {
          line-height: 20.16px;
          font-size: 16.8px;
        }
        .speedCard {
          left: 77.28px;
          height: 45.36px;
        }
        .fontCard {
          left: 82.32px;
          height: 45.36px;
        }
        .smallSpeedCard {
          width: 42px;
        }
        .smallFontCard {
          width: 48.72px;
        }
        .bigSpeedCard {
          width: 48.72px;
        }
        .bigFontCard {
          width: 58.8px;
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
  position: absolute;
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
      .speedRowNumDetail {
        position: relative;
        display: flex;
      }
      .fontRowNumDetail {
        position: relative;
        display: flex;
      }
      .speedCard {
        position: absolute;
        z-index: -1;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        background-image: radial-gradient(60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
      }
      .fontCard {
        position: absolute;
        z-index: -1;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
        background-image: radial-gradient(60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
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
