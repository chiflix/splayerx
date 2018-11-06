<template>
<base-info-card class="card"
  :style="{
    height: speedChosen ? '164px' : '127px',
    transition: 'height 80ms linear',
  }">
  <div class="mainItems">
    <div class="playSpeed"
      @click.left="handleClick"
      @mouseenter="handleMouseenter($event, 1)"
      @mouseleave="handleMouseleave($event, 1)"
      :style="{
        height: speedChosen ? '74px' : '37px',
        transition: 'height 80ms linear',
      }">
      <div class="item1" v-show="!speedChosen">
        <div>播放速度</div>
        <div>{{ `${rateNum} x` }}</div>
      </div>
      <advance-row-items :lists="numList" :item="itemSpeedName" v-show="speedChosen"></advance-row-items>
    </div>
    <div class="subtitleControl"
      @mouseenter="handleMouseenter($event, 2)"
      @mouseleave="handleMouseleave($event, 2)"
      @click.left="handleSubClick">
      <div class="item2">
        <div>字幕设置</div>
        <Icon type="rightArrow" v-show="hoverIndex === 2"></Icon>
      </div>
    </div>
    <div class="audioItems"
      @mouseenter="handleMouseenter($event, 3)"
      @mouseleave="handleMouseleave($event, 3)"
      @click.left="handleAudioClick">
      <div class="item3">
        <div>音频选项</div>
        <Icon type="rightArrow" v-show="hoverIndex === 3"></Icon>
      </div>
    </div>
  </div>
</base-info-card>
</template>

<script>
import { mapGetters } from 'vuex';
import AdvanceRowItems from './AdvanceRowItems.vue';
import BaseInfoCard from '../BaseInfoCard.vue';
import Icon from '../../BaseIconContainer.vue';
export default {
  name: 'AdvanceMainMenu',
  data() {
    return {
      numList: [[0.5], [1], [1.2], [1.5], [2]],
      itemSpeedName: '播放速度',
      speedChosen: false,
      rightArrowSub: false,
      rightArrowMed: false,
      preStyle: 'linear-gradient(-90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.10) 35%,rgba(255,255,255,0.00) 98%)',
      hoverIndex: -1,
    };
  },
  computed: {
    ...mapGetters(['rate']),
    rateNum() {
      return this.rate;
    },
  },
  components: {
    'base-info-card': BaseInfoCard,
    'advance-row-items': AdvanceRowItems,
    Icon,
  },
  methods: {
    handleClick() {
      this.speedChosen = !this.speedChosen;
    },
    handleSubClick() {
      this.$store.dispatch('updateState', 1);
    },
    handleAudioClick() {
      this.$store.dispatch('updateState', 2);
    },
    handleMouseenter(e, index) {
      if (!this.speedChosen || !e.target.classList[0].includes('playSpeed')) {
        e.target.style.backgroundImage = this.preStyle;
      }
      this.hoverIndex = index;
    },
    handleMouseleave(e) {
      e.target.style.backgroundImage = null;
      this.hoverIndex = -1;
    },
  },
};
</script>

<style lang="scss" scoped>
.card {
  min-width: 170px;
  min-height: 127px;
}
.mainItems {
  display: flex;
  flex-direction: column;
  .playSpeed {
    display: flex;
    width: 170px;
    margin-top: 8px;
    -webkit-transition: background-image 2s;
    .item1 {
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;
      line-height: 14px;
      margin: auto;
      width: 136px;
      height: 13px;
      display: flex;
      justify-content: space-between;
    }
  }
  .subtitleControl {
    display: flex;
    width: 170px;
    height: 37px;
    .item2 {
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;
      line-height: 15px;
      margin: auto;
      width: 136px;
      height: 13px;
      display: flex;
      justify-content: space-between;
    }
  }
  .audioItems {
    display: flex;
    width: 170px;
    height: 37px;
    .item3 {
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;
      line-height: 15px;
      margin: auto;
      width: 136px;
      height: 13px;
      display: flex;
      justify-content: space-between;
    }
  }
}
</style>
