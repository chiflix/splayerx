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
        <div class="textItem"
          :style="{
            color: color,
            transition: 'color 300ms',
          }">{{ item }}</div>
        <div class="rightItem" v-show="!isChosen">{{ showDetail }}</div>
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
                width: index === difIndex[0] || index === difIndex[1] ? `${difWidth[0]}px` : `${difWidth[1]}px`
              }">
              <div class="text"
                :style="{
                  color: list.chosen || index === hoverIndex ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  margin: 'auto',
                  transition: 'color 300ms',
                }">{{ list[0] }}
              </div>
            </div>
            <div :class="cardType" :style="{
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
import { mapGetters } from 'vuex';
import { Video as videoActions } from '@/store/actionTypes';
export default {
  name: 'AdvanceRowItems',
  data() {
    return {
      hoverIndex: -1,
      selectedIndex: 1,
      moveLength: '',
      styleNum: 1,
      ChosenSize: this.$t('advance.fontItems[1]'),
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
    winWidth: {
      type: Number,
    },
  },
  watch: {
    rate(val) {
      if (this.item === '播放速度') {
        const numList = [0.5, 1, 1.2, 1.5, 2];
        this.lists.forEach((i, ind) => {
          if (ind !== numList.indexOf(val)) {
            this.$set(this.lists[ind], 'chosen', false);
          } else {
            this.$set(this.lists[ind], 'chosen', true);
          }
        });
        this.selectedIndex = numList.indexOf(val);
        this.calculateSpeedLength(numList.indexOf(val));
      }
    },
    winWidth(val) {
      if (val > 1920) {
        if (this.styleNum === 0) {
          this.$store.dispatch('updateScale', `${(30 / 11) * (val / 1920)}`);
        }
        if (this.styleNum === 1) {
          this.$store.dispatch('updateScale', `${(40 / 11) * (val / 1920)}`);
        }
        if (this.styleNum === 2) {
          this.$store.dispatch('updateScale', `${(50 / 11) * (val / 1920)}`);
        }
        if (this.styleNum === 3) {
          this.$store.dispatch('updateScale', `${(60 / 11) * (val / 1920)}`);
        }
      } else {
        if (this.styleNum === 0) {
          this.$store.dispatch('updateScale', `${((21 / (11 * 1600)) * val) + (24 / 55)}`);
        }
        if (this.styleNum === 1) {
          this.$store.dispatch('updateScale', `${((29 / (11 * 1600)) * val) + (26 / 55)}`);
        }
        if (this.styleNum === 2) {
          this.$store.dispatch('updateScale', `${((37 / (11 * 1600)) * val) + (28 / 55)}`);
        }
        if (this.styleNum === 3) {
          this.$store.dispatch('updateScale', `${((45 / (11 * 1600)) * val) + (30 / 55)}`);
        }
      }
    },
  },
  computed: {
    ...mapGetters(['rate']),
    cardPos() {
      if (this.moveLength) {
        if (this.winWidth > 514 && this.winWidth <= 854) {
          return `${this.moveLength}px`;
        } else if (this.winWidth > 854 && this.winWidth <= 1920) {
          return `${this.moveLength * 1.2}px`;
        }
        return `${this.moveLength * 1.2 * 1.4}px`;
      }
      return '';
    },
    showDetail() {
      if (this.item === '播放速度') {
        return `${this.rate} x`;
      } else if (this.item === '字体大小') {
        return `${this.ChosenSize}`;
      }
      return null;
    },
    cardType() {
      if (this.selectedIndex === this.difIndex[0] || this.selectedIndex === this.difIndex[1]) {
        if (this.item === '播放速度') {
          return 'speedCard smallSpeedCard';
        }
        return 'fontCard smallFontCard';
      }
      if (this.item === '播放速度') {
        return 'speedCard bigSpeedCard';
      }
      return 'fontCard bigFontCard';
    },
    heightSize() {
      if (this.winWidth > 514 && this.winWidth <= 854) {
        return this.isChosen ? '74px' : '37px';
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return this.isChosen ? `${74 * 1.2}px` : `${37 * 1.2}px`;
      }
      return this.isChosen ? `${74 * 1.2 * 1.4}px` : `${37 * 1.2 * 1.4}px`;
    },
    rowNumDetail() {
      return this.item === '字体大小' ? 'fontRowNumDetail' : 'speedRowNumDetail';
    },
    difIndex() {
      return this.item === '字体大小' ? [0, 2] : [1, 4];
    },
    difWidth() {
      if (this.winWidth > 514 && this.winWidth <= 854) {
        return this.item === '字体大小' ? [29, 35] : [25, 29];
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return this.item === '字体大小' ? [29 * 1.2, 35 * 1.2] : [25 * 1.2, 29 * 1.2];
      }
      return this.item === '字体大小' ? [29 * 1.2 * 1.4, 35 * 1.2 * 1.4] : [25 * 1.2 * 1.4, 29 * 1.2 * 1.4];
    },
    subStyle() {
      return this.$store.getters.curStyle;
    },
  },
  mounted() {
    this.$set(this.lists[1], 'chosen', true);
  },
  methods: {
    handleOver(index) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(index) {
      this.selectedIndex = index;
      if (this.item === '播放速度') {
        this.calculateSpeedLength(index);
      } else {
        this.calculateFontLength(index);
      }
      this.lists.forEach((i, ind) => {
        if (ind !== index) {
          this.$set(this.lists[ind], 'chosen', false);
        } else {
          this.$set(this.lists[ind], 'chosen', true);
        }
      });
      if (this.item === '播放速度') {
        this.$store.dispatch(videoActions.CHANGE_RATE, this.lists[index][0]);
      } else if (this.item === '字体大小') {
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
    changeFontSize(index) {
      switch (index) {
        case 0:
          this.styleNum = 0;
          this.ChosenSize = this.$t('advance.fontItems[0]');
          this.$store.dispatch('updateScale', `${((21 / (11 * 1600)) * this.winWidth) + (24 / 55)}`);
          break;
        case 1:
          this.styleNum = 1;
          this.ChosenSize = this.$t('advance.fontItems[1]');
          this.$store.dispatch('updateScale', `${((29 / (11 * 1600)) * this.winWidth) + (26 / 55)}`);
          break;
        case 2:
          this.styleNum = 2;
          this.ChosenSize = this.$t('advance.fontItems[2]');
          this.$store.dispatch('updateScale', `${((37 / (11 * 1600)) * this.winWidth) + (28 / 55)}`);
          break;
        case 3:
          this.styleNum = 3;
          this.ChosenSize = this.$t('advance.fontItems[3]');
          this.$store.dispatch('updateScale', `${((45 / (11 * 1600)) * this.winWidth) + (30 / 55)}`);
          break;
        default:
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@media screen and (min-width: 513px) and (max-width: 854px) {
  .itemContainer {
    width: 170px;
    .textContainer {
      width: 136px;
      height: 37px;
      font-size: 13px;
      margin: auto auto auto 17px;
      .rightItem {
        font-size: 11px;
      }
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
@media screen and (min-width: 855px) and (max-width: 1920px) {
  .itemContainer {
    width: 204px;
    .textContainer {
      width: 163.2px;
      height: 44.4px;
      font-size: 15.6px;
      margin: auto auto auto 20.4px;
      .rightItem {
        font-size: 13.2px;
      }
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
@media screen and (min-width: 1921px) {
  .itemContainer {
    width: 285.6px;
    .textContainer {
      width: 228.48px;
      height: 62.16px;
      font-size: 21.84px;
      margin: auto auto auto 28.56px;
      .rightItem {
        font-size: 18.48px;
      }
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
