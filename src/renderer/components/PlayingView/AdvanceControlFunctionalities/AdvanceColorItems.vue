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
          color: color,
          transition: 'color 300ms',
          cursor: isChosen ? 'default' : 'pointer',
        }">
        <div class="textItem" :class="$i18n.locale === 'ja' ? 'advanceJaTitle' : 'advanceNormalTitle'">{{ item }}</div>
        <div class="rightItem" v-show="!isChosen"><img :src="chosenStyle"></div>
      </div>
      <transition name="detail">
        <div class="listContainer" v-show="isChosen">
          <div class="rowContainer">
            <div class="imgContainer" v-for="(img, index) in imgs">
              <img :src="img === chosenStyle || index === hoverIndex ? imgsSelected[index] : img" class="imgType"
                :style="{ cursor: img === chosenStyle ? 'default' : 'pointer'}"
                @mouseover="handleOver(index)"
                @mouseout="handleOut"
                @click.left="handleClick($event, index)">
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { Subtitle as subtitleActions } from '@/store/actionTypes';
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
  data() {
    return {
      hoverIndex: -1,
      imgs: [style0, style1, style2, style3, style4],
      imgsSelected: [styleSelected0, styleSelected1, styleSelected2,
        styleSelected3, styleSelected4],
    };
  },
  props: {
    item: {
      type: String,
    },
    height: {
      type: Number,
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
  },
  computed: {
    heightSize() {
      if (this.size >= 289 && this.size <= 480) {
        return this.isChosen ? '74px' : '37px';
      } else if (this.size >= 481 && this.size < 1080) {
        return this.isChosen ? `${74 * 1.2}px` : `${37 * 1.2}px`;
      }
      return this.isChosen ? `${74 * 1.2 * 1.4}px` : `${37 * 1.2 * 1.4}px`;
    },
    subStyle() {
      return this.$store.getters.curStyle;
    },
    chosenStyle() {
      if (this.$store.getters.chosenStyle) {
        return this.imgs[this.$store.getters.chosenStyle];
      }
      return style0;
    },
  },
  methods: {
    handleOver(index) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(e, index) {
      this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_STYLE, index);
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
      .rightItem {
        width: 17px;
        height: 17px;
      }
    }
    .listContainer {
      height: 37px;
      .rowContainer {
        width: 137px;
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
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .itemContainer {
    width: 204px;
    .textContainer {
      width: 163.2px;
      height: 44.4px;
      margin: auto auto auto 20.4px;
      .rightItem {
        width: 21px;
        height: 21px;
      }
    }
    .listContainer {
      height: 44.4px;
      .rowContainer {
        width: 164.4px;
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
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .itemContainer {
    width: 285.6px;
    .textContainer {
      width: 228.48px;
      height: 62.16px;
      margin: auto auto auto 28.56px;
      .rightItem {
        width: 29px;
        height: 29px;
      }
    }
    .listContainer {
      height: 62.16px;
      .rowContainer {
        width: 230.16px;
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
  position: absolute;
  display: flex;
  border-radius: 7px;
  z-index: 10;
  clip-path: inset(0 round 8px);
  transition: height 100ms linear, background-color 100ms linear;
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

