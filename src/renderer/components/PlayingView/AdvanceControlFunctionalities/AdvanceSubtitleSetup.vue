<template>
<base-info-card class="card"
  :style="{
    height: subColorChosen || subSizeChosen || subDelayChosen ? '193px' : '156px',
    transition: 'height 80ms linear',
  }">
  <div class="mainItems">
    <div class="topContainer" @click.left="handleQuitClick">
      <div class="topContent">
        <Icon type="leftArrow"></Icon>
        <div class="text">字幕设置</div>
      </div>
    </div>
    <div class="itemSize" @click.left="handleSizeClick"
      @mouseenter="handleMouseenter($event)"
      @mouseleave="handleMouseleave($event)"
      :style="{
        height: subSizeChosen ? '74px' : '37px',
        transition: 'height 80ms linear',
      }">
      <transition name="rowTransIn" mode="in-out">
      <div class="item1" v-show="!subSizeChosen">
        <div class="leftItem">字体大小</div>
        <div class="rightItem">{{ ChosenSize }}</div>
      </div>
      </transition>
      <transition name="rowTransOut" mode="in-out">
      <advance-row-items :lists="textList" :item="itemFontName" v-show="subSizeChosen"></advance-row-items>
      </transition>
    </div>
    <div class="subtitleStyle" @click.left="handleColorClick"
      @mouseenter="handleMouseenter($event)"
      @mouseleave="handleMouseleave($event)"
      :style="{
        height: subColorChosen ? '74px' : '37px',
        transition: 'height 80ms linear',
      }">
      <transition name="rowTransIn" mode="in-out">
      <div class="item2" v-show="!subColorChosen">
        <div class="leftItem">字幕样式</div>
        <div class="rightItem"><img :src="ChosenColor" class="imgType"></div>
      </div>
      </transition>
      <transition name="rowTransOut" mode="in-out">
      <advance-color-items :item="itemColorName" v-show="subColorChosen"></advance-color-items>
      </transition>
    </div>
    <div class="subtitleDelay" @click.left="handleDelayClick"
      @mouseenter="handleMouseenter($event)"
      @mouseleave="handleMouseleave($event)"
      :style="{
        height: subDelayChosen ? '74px' : '37px',
        transition: 'height 80ms linear',
      }">
      <transition name="rowTransIn" mode="in-out">
      <div class="item3" v-show="!subDelayChosen">
        <div class="leftItem">字幕延迟</div>
        <div class="rightItem">0 ms</div>
      </div>
      </transition>
      <transition name="rowTransOut" mode="in-out">
      <advance-selected-items :item="itemDelayName" v-show="subDelayChosen"></advance-selected-items>
      </transition>
    </div>
  </div>
</base-info-card>
</template>

<script>
import BaseInfoCard from '../BaseInfoCard.vue';
import AdvanceRowItems from './AdvanceRowItems.vue';
import AdvanceColorItems from './AdvanceColorItems.vue';
import AdvanceSelectedItemts from './AdvanceSelectItems.vue';
import Icon from '../../BaseIconContainer.vue';
import style0 from '../../../assets/subtitle-style1-normal.png';
import style1 from '../../../assets/subtitle-style2-normal.png';
import style2 from '../../../assets/subtitle-style3-normal.png';
import style3 from '../../../assets/subtitle-style4-normal.png';
import style4 from '../../../assets/subtitle-style5-normal.png';
export default {
  name: 'AdvanceSubtitleSetup',
  data() {
    return {
      textList: [['小'], ['默认'], ['大'], ['超大']],
      itemFontName: '字体大小',
      subSizeChosen: false,
      subColorChosen: false,
      subDelayChosen: false,
      itemColorName: '字幕样式',
      itemDelayName: '字幕延迟',
      preStyle: 'linear-gradient(-90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.10) 35%,rgba(255,255,255,0.00) 98%)',
    };
  },
  computed: {
    subStyle() {
      return this.$store.getters.curStyle;
    },
    /**
     * @return {string}
     */
    ChosenSize() {
      switch (this.subStyle.fontSize) {
        case 3:
          return '小';
        case 5:
          return '默认';
        case 8:
          return '大';
        case 10:
          return '超大';
        default:
          return '默认';
      }
    },
    ChosenColor() {
      switch (this.subStyle.color) {
        case 'white':
          return style0;
        case 'gray':
          return style1;
        case 'yellow':
          return style2;
        case 'blue':
          return style3;
        case 'black':
          return style4;
        default:
          return style0;
      }
    },
  },
  components: {
    'advance-row-items': AdvanceRowItems,
    'base-info-card': BaseInfoCard,
    'advance-color-items': AdvanceColorItems,
    'advance-selected-items': AdvanceSelectedItemts,
    Icon,
  },
  methods: {
    handleQuitClick() {
      this.$store.dispatch('updateState', 0);
    },
    handleSizeClick() {
      this.subSizeChosen = true;
      this.subDelayChosen = false;
      this.subColorChosen = false;
    },
    handleColorClick() {
      this.subColorChosen = true;
      this.subSizeChosen = false;
      this.subDelayChosen = false;
    },
    handleDelayClick() {
      this.subDelayChosen = true;
      this.subSizeChosen = false;
      this.subColorChosen = false;
    },
    handleMouseenter(e) {
      if ((!this.subSizeChosen && e.target.classList[0].includes('itemSize')) || (!this.subColorChosen && e.target.classList[0].includes('subtitleStyle')) || (!this.subDelayChosen && e.target.classList[0].includes('subtitleDelay'))) {
        e.target.style.backgroundImage = this.preStyle;
      }
    },
    handleMouseleave(e) {
      e.target.style.backgroundImage = null;
    },
  },
};
</script>

<style lang="scss" scoped>
.card {
  min-width: 170px;
  min-height: 156px;
}
.mainItems {
  display: flex;
  flex-direction: column;
  .leftItem {
    font-size: 13px;
  }
  .rightItem {
    font-size: 11px;
  }
  .topContainer {
    display: flex;
    width: 170px;
    height: 37px;
    .topContent {
      display: flex;
      width: 133px;
      height: 12px;
      justify-content: flex-start;
      margin: auto 9px;
      .text {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.2);
        line-height: 13px;
        margin-left: 3px;
      }
    }
  }
  .itemSize {
    display: flex;
    width: 170px;
    height: 37px;
    .item1 {
      display: flex;
      justify-content: space-between;
      height: 15px;
      width: 136px;
      line-height: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin: auto;
    }
  }
  .subtitleStyle {
    display: flex;
    width: 170px;
    height: 37px;
    .item2 {
      display: flex;
      justify-content: space-between;
      height: 15px;
      width: 136px;
      line-height: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin: auto;
      .imgType {
        width: 17px;
        height: 17px;
        margin-top: -2px;
      }
    }
  }
  .subtitleDelay {
    display: flex;
    width: 170px;
    height: 37px;
    .item3 {
      display: flex;
      justify-content: space-between;
      height: 15px;
      width: 136px;
      line-height: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin: auto;
    }
  }
}
.rowTransOut-leave-active {
  transition-delay: 50ms;
}
.rowTransOut-enter, .rowTrans-leave-to {
  opacity: 0;
}
.rowTransIn-enter-active {
  transition-delay: 50ms;
}
.rowTransIn-enter, .rowTransIn-leave-to {
  opacity: 0;
}
</style>
