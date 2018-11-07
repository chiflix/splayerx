<template>
<base-info-card class="card"
  :style="{
    height: cardHeight,
    transition: 'height 100ms linear',
  }">
  <transition name="setUp">
  <div class="mainItems" v-show="readyShow === 'mainMenu'"
    :style="{
      bottom: readyShow === 'mainMenu' ? '' : '0px',
    }">
    <div class="playSpeed"
      @click.left="handleClick"
      @mouseenter="handleMouseenter($event, 1)"
      @mouseleave="handleMouseleave($event, 1)"
      :style="{
        height: speedChosen ? '74px' : '37px',
        transition: 'height 100ms linear',
      }">
      <div class="item1" v-show="!speedChosen"
        :style="{
          color: hoverIndex === 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
        }">
        <div>播放速度</div>
        <div>{{ `${rateNum} x` }}</div>
      </div>
      <advance-row-items :lists="numList" :item="itemSpeedName" v-show="speedChosen"></advance-row-items>
    </div>
    <div class="subtitleControl"
      @mouseenter="handleMouseenter($event, 2)"
      @mouseleave="handleMouseleave($event, 2)"
      @click.left="handleSubClick">
      <div class="item2"
        :style="{
          color: hoverIndex === 2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
        }">
        <div>字幕设置</div>
        <Icon type="rightArrow" v-show="hoverIndex === 2"></Icon>
      </div>
    </div>
    <div class="audioItems"
      @mouseenter="handleMouseenter($event, 3)"
      @mouseleave="handleMouseleave($event, 3)"
      @click.left="handleAudioClick">
      <div class="item3"
        :style="{
          color: hoverIndex === 3 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
        }">
        <div>音频选项</div>
        <Icon type="rightArrow" v-show="hoverIndex === 3"></Icon>
      </div>
    </div>
  </div>
  </transition>

  <transition name="setUp">
  <div class="mainItems1" v-show="readyShow === 'subMenu'"
    :style="{
      bottom: readyShow === 'subMenu' ? '' : '0px',
    }">
    <div class="topContainer"
         @click.left="handleSubBackClick"
         @mouseenter="handleSubBackEnter"
         @mouseleave="handleSubBackLeave">
      <div class="topContent">
        <Icon :type="backSubHover ? 'leftArrowHover' : 'leftArrow'"></Icon>
        <div class="text"
             :style="{
            color: backSubHover ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
          }">字幕设置</div>
      </div>
    </div>

    <div class="itemSize" @click.left="handleSizeClick"
         @mouseenter="handleSubMouseenter($event, 1)"
         @mouseleave="handleSubMouseleave($event)"
         :style="{
        height: subSizeChosen ? '74px' : '37px',
        transition: 'height 100ms linear',
      }">
      <transition name="rowTransIn" mode="in-out">
        <div class="item1" v-show="!subSizeChosen"
          :style="{
            color: hoverSubIndex === 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          }">
          <div class="leftItem">字体大小</div>
          <div class="rightItem">{{ ChosenSize }}</div>
        </div>
      </transition>
      <transition name="rowTransOut" mode="in-out">
        <advance-row-items :lists="textList" :item="itemFontName" v-show="subSizeChosen"></advance-row-items>
      </transition>
    </div>

    <div class="subtitleStyle" @click.left="handleColorClick"
         @mouseenter="handleSubMouseenter($event, 2)"
         @mouseleave="handleSubMouseleave($event)"
         :style="{
        height: subColorChosen ? '74px' : '37px',
        transition: 'height 100ms linear',
      }">
      <transition name="rowTransIn" mode="in-out">
        <div class="item2" v-show="!subColorChosen"
          :style="{
            color: hoverSubIndex === 2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          }">
          <div class="leftItem">字幕样式</div>
          <div class="rightItem"><img :src="ChosenColor" class="imgType"></div>
        </div>
      </transition>
      <transition name="rowTransOut" mode="in-out">
        <advance-color-items :item="itemColorName" v-show="subColorChosen"></advance-color-items>
      </transition>
    </div>

    <div class="subtitleDelay" @click.left="handleDelayClick"
         @mouseenter="handleSubMouseenter($event, 3)"
         @mouseleave="handleSubMouseleave($event)"
         :style="{
        height: subDelayChosen ? '74px' : '37px',
        transition: 'height 100ms linear',
      }">
      <transition name="rowTransIn" mode="in-out">
        <div class="item3" v-show="!subDelayChosen"
          :style="{
            color: hoverSubIndex === 3 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          }">
          <div class="leftItem">字幕延迟</div>
          <div class="rightItem">0 ms</div>
        </div>
      </transition>
      <transition name="rowTransOut" mode="in-out">
        <advance-selected-items :item="itemDelayName" v-show="subDelayChosen"></advance-selected-items>
      </transition>
    </div>
  </div>
  </transition>

  <transition name="setUp">
  <div class="mainItems2" v-show="readyShow === 'audioMenu'"
    :style="{
      bottom: readyShow === 'audioMenu' ? '' : '0px',
    }">
    <div class="topContainer"
         @click.left="handleAudioBackClick"
         @mouseenter="handleAudioBackEnter"
         @mouseleave="handleAudioBackLeave">
      <div class="topContent">
        <Icon :type="backAudioHover ? 'leftArrowHover' : 'leftArrow'"></Icon>
        <div class="text"
             :style="{
              color: backAudioHover ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            }">音频选项</div>
      </div>
    </div>
    <div class="audioDelay" @click.left="handleAudioDelayClick"
         @mouseenter="handleAudioMouseenter($event, 1)"
         @mouseleave="handleAudioMouseleave($event)"
         :style="{
          height: showDelay ? '74px' : '37px',
          transition: 'height 100ms linear',
        }">
      <transition name="audioTransIn">
        <div class="item1" v-show="!showDelay"
             :style="{
            color: hoverAudioIndex === 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          }">
          <div>音频延迟</div>
          <div>200ms</div>
        </div>
      </transition>
      <transition name="audioTransOut">
        <advance-selected-items :item="audioDelayName" v-show="showDelay"></advance-selected-items>
      </transition>
    </div>
    <div class="changeTrack" @click.left="handleTrackClick"
         @mouseenter="handleAudioMouseenter($event, 2)"
         @mouseleave="handleAudioMouseleave($event)"
         :style="{
          height: showTrack ? `${trackHeight}px` : '37px',
          transition: 'height 100ms linear',
        }">
      <transition name="audioTransIn">
        <div class="item2" v-show="!showTrack || trackNum === 1"
             :style="{
            color: hoverAudioIndex === 2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          }">
          <div>切换轨道</div>
          <div>音轨 1</div>
        </div>
      </transition>
      <transition name="audioTransOut">
        <advance-column-items :item="itemTrack" v-show="showTrack && trackNum !== 1"></advance-column-items>
      </transition>
    </div>
  </div>
  </transition>
</base-info-card>
</template>

<script>
import { mapGetters } from 'vuex';
import AdvanceRowItems from './AdvanceRowItems.vue';
import BaseInfoCard from '../BaseInfoCard.vue';
import Icon from '../../BaseIconContainer.vue';
import AdvanceColorItems from './AdvanceColorItems.vue';
import AdvanceSelectedItemts from './AdvanceSelectItems.vue';
import AdvanceColumnItems from './AdvanceColumnItems.vue';
import style0 from '../../../assets/subtitle-style1-normal.png';
import style1 from '../../../assets/subtitle-style2-normal.png';
import style2 from '../../../assets/subtitle-style3-normal.png';
import style3 from '../../../assets/subtitle-style4-normal.png';
import style4 from '../../../assets/subtitle-style5-normal.png';
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
      readyShow: 'mainMenu',

      backSubHover: false,
      textList: [['小'], ['默认'], ['大'], ['超大']],
      itemFontName: '字体大小',
      subSizeChosen: false,
      subColorChosen: false,
      subDelayChosen: false,
      itemColorName: '字幕样式',
      itemDelayName: '字幕延迟',
      hoverSubIndex: -1,


      audioDelayName: '音频延迟',
      itemTrack: '切换轨道',
      showDelay: false,
      showTrack: false,
      hoverAudioIndex: -1,
      backAudioHover: false,

    };
  },
  watch: {
    subSizeChosen(val) {
      if (!val) {
        this.$refs.size.style.height = '37px';
      }
    },
  },
  computed: {
    ...mapGetters(['rate']),
    cardHeight() {
      if (this.readyShow === 'mainMenu' && this.speedChosen) {
        return '164px';
      } else if (this.readyShow === 'subMenu' && !this.subColorChosen && !this.subSizeChosen && !this.subDelayChosen) {
        return '156px';
      } else if (this.readyShow === 'subMenu' && (this.subColorChosen || this.subSizeChosen || this.subDelayChosen)) {
        return '193px';
      } else if (this.readyShow === 'audioMenu' && !this.showDelay && !this.showTrack) {
        return '119px';
      } else if (this.readyShow === 'audioMenu' && this.showDelay) {
        return '156px';
      } else if (this.readyShow === 'audioMenu' && this.showTrack) {
        return `${this.containerHeight}px`;
      }
      return '127px';
    },
    rateNum() {
      return this.rate;
    },
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
    'advance-row-items': AdvanceRowItems,
    'advance-color-items': AdvanceColorItems,
    'advance-selected-items': AdvanceSelectedItemts,
    'advance-column-items': AdvanceColumnItems,
    Icon,
  },
  methods: {
    handleClick() {
      this.speedChosen = true;
    },
    handleSubClick() {
      this.readyShow = 'subMenu';
      this.speedChosen = false;
    },
    handleAudioClick() {
      this.readyShow = 'audioMenu';
      this.speedChosen = false;
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


    handleSubBackClick() {
      this.readyShow = 'mainMenu';
      this.subSizeChosen = false;
      this.subDelayChosen = false;
      this.subColorChosen = false;
    },
    handleSubBackEnter() {
      this.backSubHover = true;
    },
    handleSubBackLeave() {
      this.backSubHover = false;
    },
    handleSubMouseenter(e, index) {
      if ((!this.subSizeChosen && e.target.classList[0].includes('itemSize')) ||
        (!this.subColorChosen && e.target.classList[0].includes('subtitleStyle')) ||
        (!this.subDelayChosen && e.target.classList[0].includes('subtitleDelay'))) {
        e.target.style.backgroundImage = this.preStyle;
        this.hoverSubIndex = index;
      }
    },
    handleSubMouseleave(e) {
      e.target.style.backgroundImage = null;
      this.hoverSubIndex = -1;
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


    handleAudioBackEnter() {
      this.backAudioHover = true;
    },
    handleAudioBackLeave() {
      this.backAudioHover = false;
    },
    handleAudioBackClick() {
      this.readyShow = 'mainMenu';
      this.showDelay = false;
      this.showTrack = false;
    },
    handleAudioMouseenter(e, index) {
      if ((!this.showDelay && e.target.classList[0].includes('audioDelay')) ||
        (!this.showTrack && e.target.classList[0].includes('changeTrack'))) {
        e.target.style.backgroundImage = this.preStyle;
        this.hoverIndex = index;
      }
    },
    handleAudioMouseleave(e) {
      e.target.style.backgroundImage = null;
      this.hoverIndex = -1;
    },
    handleAudioDelayClick() {
      this.showDelay = true;
      this.showTrack = false;
    },
    handleTrackClick() {
      this.showDelay = false;
      this.showTrack = true;
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
  position: absolute;
  .playSpeed {
    display: flex;
    width: 170px;
    margin-top: 8px;
    -webkit-transition: background-image 2s;
    .item1 {
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

.mainItems1 {
  display: flex;
  flex-direction: column;
  position: absolute;
  .leftItem {
    letter-spacing: 0.2px;
    margin-top: 1px;
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
      line-height: 15px;
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
      line-height: 15px;
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
      line-height: 15px;
      margin: auto;
    }
  }
}


.mainItems2 {
  display: flex;
  flex-direction: column;
  position: absolute;
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
      margin: auto;
    }
  }
}

.rowTransOut-leave-active {
  transition-delay: 80ms;
}

.rowTransOut-enter, .rowTrans-leave-to {
  opacity: 0;
}
.rowTransIn-enter-active {
  transition-delay: 80ms;
}
.rowTransIn-enter, .rowTransIn-leave-to {
  opacity: 0;
}

.audioTransOut-leave-active {
  transition-delay: 80ms;
}
.audioTransOut-enter, .audioTrans-leave-to {
  opacity: 0;
}
.audioTransIn-enter-active {
  transition-delay: 80ms;
}
.audioTransIn-enter, .audioTransIn-leave-to {
  opacity: 0;
}

.setUp-enter-active {
  animation: show .2s;
}
.setUp-enter, .setUp-leave-to {
  opacity: 0;
}
.setUp-leave-active {
  animation: hide .2s;
}

@keyframes show {
  0% {
    opacity: 0;
    right: 170px;
  }
  100% {
    opacity: 1;
    right: 0;
  }
}
@keyframes hide {
  0% {
    opacity: 1;
    right: 0;
  }
  100% {
    opacity: 0;
    right: -170px;
  }
}
</style>
