<template>
  <div
    :style="{
      height: heightSize,
      backgroundImage: !isChosen ? '' :
        'linear-gradient(90deg, rgba(255,255,255,0.03) ' +
        '0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
    }"
    @mouseenter="handleSubMouseEnter"
    @mouseleave="handleSubMouseLeave"
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
          color: !isPrimarySub ? 'rgba(255, 255, 255, 0.2)' : !isChosen && hoveredText ?
            'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          transition: 'color 300ms',
          cursor: isChosen || !isPrimarySub ? 'default' : 'pointer',
        }"
        class="textContainer"
      >
        <p>{{ $t('advance.fontStyle') }}</p>
        <div
          v-show="!isChosen"
          :style="{ opacity: isPrimarySub ? '1' : '0.3333' }"
          class="rightItem"
        >
          <img :src="chosenStyle">
        </div>
      </div>
      <transition name="detail">
        <div
          v-show="isChosen"
          class="listContainer"
        >
          <div class="rowContainer">
            <div
              v-for="(img, index) in imgs"
              :key="img"
              class="imgContainer"
            >
              <img
                :src="img === chosenStyle || index === hoverImgIndex ? imgsSelected[index] : img"
                :style="{ cursor: img === chosenStyle ? 'default' : 'pointer'}"
                @mouseover="handleOver(index)"
                @mouseout="handleOut"
                @click.left="handleClick(index)"
                draggable="false"
                class="imgType"
              >
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import style0 from '../../../assets/subtitle-style1-normal.png';
import style1 from '../../../assets/subtitle-style2-normal.png';
import style2 from '../../../assets/subtitle-style3-normal.png';
import style3 from '../../../assets/subtitle-style4-normal.png';
import style4 from '../../../assets/subtitle-style5-normal.png';
import styleSelected0 from '../../../assets/subtitle-style1-selected.png';
import styleSelected1 from '../../../assets/subtitle-style2-selected.png';
import styleSelected2 from '../../../assets/subtitle-style3-selected.png';
import styleSelected3 from '../../../assets/subtitle-style4-selected.png';
import styleSelected4 from '../../../assets/subtitle-style5-selected.png';

export default {
  name: 'AdvanceColorItems',
  props: {
    isChosen: Boolean,
    size: {
      type: Number,
      required: true,
    },
    changeStyle: {
      type: Function,
      required: true,
    },
    storedStyle: {
      type: Number,
      required: true,
    },
    isPrimarySub: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      hoverImgIndex: -1,
      imgs: [style0, style1, style2, style3, style4],
      imgsSelected: [styleSelected0, styleSelected1, styleSelected2,
        styleSelected3, styleSelected4],
      hoveredText: false,
    };
  },
  computed: {
    heightSize() {
      if (this.size >= 289 && this.size <= 480) {
        return this.isChosen ? '74px' : '37px';
      }
      if (this.size >= 481 && this.size < 1080) {
        return this.isChosen ? `${74 * 1.2}px` : `${37 * 1.2}px`;
      }
      return this.isChosen ? `${74 * 1.2 * 1.4}px` : `${37 * 1.2 * 1.4}px`;
    },
    chosenStyle() {
      if (this.storedStyle) {
        return this.imgs[this.storedStyle];
      }
      return style0;
    },
  },
  methods: {
    handleSubMouseEnter() {
      this.hoveredText = true;
    },
    handleSubMouseLeave() {
      this.hoveredText = false;
    },
    handleOver(index: number) {
      this.hoverImgIndex = index;
    },
    handleOut() {
      this.hoverImgIndex = -1;
    },
    handleClick(index: number) {
      this.changeStyle(index);
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
      width: 100%;
      height: 37px;
      p {
        margin: auto auto auto 17px;
        font-size: 13px;
      }
      .rightItem {
        width: 17px;
        height: 17px;
        margin: auto 17px auto auto;
      }
    }
    .listContainer {
      height: 37px;
      .rowContainer {
        width: 80%;
        height: 27px;
        .imgContainer {
          width: 17px;
          height: 17px;
          margin-top: 5.5px;
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
      width: 100%;
      height: 44.4px;
      p {
        margin: auto auto auto 20.4px;
        font-size: 15.6px;
      }
      .rightItem {
        width: 20.4px;
        height: 20.4px;
        margin: auto 20.4px auto auto;
      }
    }
    .listContainer {
      height: 44.4px;
      .rowContainer {
        width: 80%;
        height: 32.4px;
        .imgContainer {
          width: 21px;
          height: 21px;
          margin-top: 6.6px;
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
      width: 100%;
      height: 62.16px;
      p {
        margin: auto auto auto 28.56px;
        font-size: 21.84px;
      }
      .rightItem {
        width: 28.56px;
        height: 28.56px;
        margin: auto 28.56px auto auto;
      }
    }
    .listContainer {
      height: 62.16px;
      .rowContainer {
        width: 80%;
        height: 45.36px;
        .imgContainer {
          width: 29px;
          height: 29px;
          margin-top: 9.24px;
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
  transition: height 100ms linear, background-color 100ms linear;
  .detail {
    width: 100%;
    height: 100%;
  }
  .textContainer {
    display: flex;
    flex: 1;
    color: rgba(255, 255, 255, 0.6);
    .textItem {
      letter-spacing: 0.2px;
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
      .imgType {
        width: 100%;
        height: 100%;
        margin-right: 7px;
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
