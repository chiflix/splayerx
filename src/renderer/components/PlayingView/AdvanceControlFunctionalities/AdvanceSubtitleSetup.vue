<template>
  <div class="subMainContainer" ref="sub"
    :style="{
      height: subColorChosen || subSizeChosen || subDelayChosen ? '193px' : '156px',
    }">
    <base-info-card class="card"
      :style="{
        height: subColorChosen || subSizeChosen || subDelayChosen ? '193px' : '156px',
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
            height: subSizeChosen ? '74px' : '37px'
          }">
          <div class="item1" v-show="!subSizeChosen">
            <div class="leftItem">字体大小</div>
            <div class="rightItem">中</div>
          </div>
          <advance-row-items :lists="textList" :item="itemFontName" v-show="subSizeChosen"></advance-row-items>
        </div>
        <div class="subtitleStyle" @click.left="handleColorClick"
          @mouseenter="handleMouseenter($event)"
          @mouseleave="handleMouseleave($event)"
          :style="{
            height: subColorChosen ? '74px' : '37px'
          }">
          <div class="item2" v-show="!subColorChosen">
            <div class="leftItem">字幕样式</div>
            <div class="rightItem"></div>
          </div>
          <advance-color-items :item="itemColorName" v-show="subColorChosen"></advance-color-items>
        </div>
        <div class="subtitleDelay" @click.left="handleDelayClick"
          @mouseenter="handleMouseenter($event)"
          @mouseleave="handleMouseleave($event)"
          :style="{
            height: subDelayChosen ? '74px' : '37px'
          }">
          <div class="item3" v-show="!subDelayChosen">
            <div class="leftItem">字幕延迟</div>
            <div class="rightItem">0 ms</div>
          </div>
          <advance-selected-items :item="itemDelayName" v-show="subDelayChosen"></advance-selected-items>
        </div>
      </div>
    </base-info-card>
  </div>
</template>

<script>
import BaseInfoCard from '../BaseInfoCard.vue';
import AdvanceRowItems from './AdvanceRowItems.vue';
import AdvanceColorItems from './AdvanceColorItems.vue';
import AdvanceSelectedItemts from './AdvanceSelectItems.vue';
import Icon from '../../BaseIconContainer.vue';
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
      e.target.style.backgroundImage = this.preStyle;
    },
    handleMouseleave(e) {
      e.target.style.backgroundImage = null;
    },
  },
};
</script>

<style lang="scss" scoped>
  .subMainContainer {
    min-width: 170px;
    min-height: 156px;
    z-index: 5;
  }
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
</style>
