<template>
  <div class="audioMainContainer"
    :style="{
      height: showDelay ? '156px' : showTrack ? `${containerHeight}px` : '119px'
    }">
    <base-info-card class="card"
      :style="{
        height: showDelay ? '156px' : showTrack ? `${containerHeight}px` : '119px',
      }">
      <div class="mainItems">
        <div class="topContainer" @click.left="handleQuitClick">
          <div class="topContent">
            <Icon type="leftArrow"></Icon>
            <div class="text">音频选项</div>
          </div>
        </div>
        <div class="audioDelay" @click.left="handleDelayClick"
          @mouseenter="handleMouseenter($event)"
          @mouseleave="handleMouseleave($event)"
          :style="{
            height: showDelay ? '74px' : '37px',
          }">
          <div class="item1" v-show="!showDelay">
            <div>音频延迟</div>
            <div>200ms</div>
          </div>
          <advance-selected-items :item="itemDelayName" v-show="showDelay"></advance-selected-items>
        </div>
        <div class="changeTrack" @click.left="handleTrackClick"
          @mouseenter="handleMouseenter($event)"
          @mouseleave="handleMouseleave($event)"
          :style="{
            height: showTrack ? `${trackHeight}px` : '37px',
          }">
          <div class="item2" v-show="!showTrack || trackNum === 1">
            <div>切换轨道</div>
            <div>音轨 1</div>
          </div>
          <advance-column-items :lists="columnList" :item="itemTrack" v-show="showTrack && trackNum !== 1"></advance-column-items>
        </div>
      </div>
    </base-info-card>
  </div>
</template>

<script>
import BaseInfoCard from '../BaseInfoCard.vue';
import Icon from '../../BaseIconContainer.vue';
import AdvanceSelectedItemts from './AdvanceSelectItems.vue';
import AdvanceColumnItems from './AdvanceColumnItems.vue';
export default {
  name: 'AdvanceAudioItems',
  data() {
    return {
      itemDelayName: '音频延迟',
      itemTrack: '切换轨道',
      showDelay: false,
      showTrack: false,
      preStyle: 'linear-gradient(-90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.10) 35%,rgba(255,255,255,0.00) 98%)',
    };
  },
  computed: {
    trackNum() {
      return this.$store.getters.track.length;
    },
    containerHeight() {
      if (this.trackNum === 1) {
        return 119;
      } else if (this.trackNum >= 2 && this.trackNum <= 3) {
        return (this.trackNum * 37) + 119;
      }
      return 230;
    },
    trackHeight() {
      if (this.trackNum === 1) {
        return 37;
      } else if (this.trackNum >= 2 && this.trackNum <= 3) {
        return (this.trackNum * 37) + 37;
      }
      return 148;
    },
  },
  components: {
    'base-info-card': BaseInfoCard,
    'advance-selected-items': AdvanceSelectedItemts,
    'advance-column-items': AdvanceColumnItems,
    Icon,
  },
  methods: {
    handleQuitClick() {
      this.$store.dispatch('updateState', 0);
    },
    handleDelayClick() {
      this.showDelay = true;
      this.showTrack = false;
    },
    handleTrackClick() {
      this.showDelay = false;
      this.showTrack = true;
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
  .audioMainContainer {
    min-width: 170px;
    min-height: 119px;
    z-index: 5;
  }
  .card {
    min-width: 170px;
    min-height: 119px;
  }
  .mainItems {
    display: flex;
    flex-direction: column;
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
    .audioDelay {
      display: flex;
      width: 170px;
      height: 37px;
      .item1 {
        display: flex;
        justify-content: space-between;
        height: 15px;
        width: 136px;
        font-size: 13px;
        line-height: 14px;
        color: rgba(255, 255, 255, 0.6);
        margin: auto;
      }
    }
    .changeTrack {
      display: flex;
      width: 170px;
      height: 37px;
      .item2 {
        display: flex;
        justify-content: space-between;
        height: 15px;
        width: 136px;
        font-size: 13px;
        line-height: 14px;
        color: rgba(255, 255, 255, 0.6);
        margin: auto;
      }
    }
  }
</style>
