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
      @mouseenter="handleMouseenter(1)"
      @mouseleave="handleMouseleave()"
      :style="{
        height: speedChosen ? '74px' : '37px',
        transition: 'height 100ms linear',
         backgroundImage: speedChosen ? '' : hoverIndex === 1 ? preStyle : '',
      }">
      <advance-row-items :lists="numList" :item="itemSpeedName" :height="speedChosen ? 74 : 37" :color="hoverIndex === 1 && !speedChosen ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)'"></advance-row-items>
    </div>
    <div class="subtitleControl"
      @mouseenter="handleMouseenter(2)"
      @mouseleave="handleMouseleave()"
      @click.left="handleSubClick"
      :style="{
        backgroundImage: hoverIndex === 2 ? preStyle : '',
      }">
      <div class="item2"
        :style="{
          color: hoverIndex === 2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
        }">
        <div>字幕设置</div>
        <Icon type="rightArrow" v-show="hoverIndex === 2"></Icon>
      </div>
    </div>
    <div class="audioItems"
      @mouseenter="handleMouseenter(3)"
      @mouseleave="handleMouseleave()"
      @click.left="handleAudioClick"
      :style="{
        backgroundImage: hoverIndex === 3 ? preStyle : '',
      }">
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
         @mouseenter="handleSubMouseenter(1)"
         @mouseleave="handleSubMouseleave()"
         :style="{
        height: subSizeChosen ? '74px' : '37px',
        transition: 'height 100ms linear',
        backgroundImage: subSizeChosen ? '' : hoverSubIndex === 1 ? preStyle : '',
      }">
        <advance-row-items :lists="textList" :item="itemFontName" :height="subSizeChosen ? 74 : 37" :color="hoverSubIndex === 1 && !subSizeChosen ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)'"></advance-row-items>
    </div>

    <div class="subtitleStyle" @click.left="handleColorClick"
         @mouseenter="handleSubMouseenter(2)"
         @mouseleave="handleSubMouseleave()"
         :style="{
        height: subColorChosen ? '74px' : '37px',
        transition: 'height 100ms linear',
        backgroundImage: subColorChosen ? '' : hoverSubIndex === 2 ? preStyle : '',
      }">
        <advance-color-items :item="itemColorName" :height="subColorChosen ? 74 : 37" :color="hoverSubIndex === 2 && !subColorChosen ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)'"></advance-color-items>
    </div>

    <div class="subtitleDelay" @click.left="handleDelayClick"
         @mouseenter="handleSubMouseenter(3)"
         @mouseleave="handleSubMouseleave()"
         :style="{
        height: subDelayChosen ? '74px' : '37px',
        transition: 'height 100ms linear',
        backgroundImage: subDelayChosen ? '' : hoverSubIndex === 3 ? preStyle : '',
      }">
        <advance-selected-items :item="itemDelayName" :height="subDelayChosen ? 74 : 37" :color="hoverSubIndex === 3 && !subDelayChosen ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)'"></advance-selected-items>
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
         @mouseenter="handleAudioMouseenter(1)"
         @mouseleave="handleAudioMouseleave()"
         :style="{
          height: showDelay ? '74px' : '37px',
          transition: 'height 100ms linear',
           backgroundImage: showDelay ? '' : hoverAudioIndex === 1 ? preStyle : '',
        }">
        <advance-selected-items :item="audioDelayName" :height="showDelay ? 74 : 37" :color="hoverAudioIndex === 1 && !showDelay ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)'"></advance-selected-items>
    </div>
    <div class="changeTrack" @click.left="handleTrackClick"
         @mouseenter="handleAudioMouseenter(2)"
         @mouseleave="handleAudioMouseleave()"
         :style="{
          height: showTrack ? `${trackHeight}px` : '37px',
          transition: 'height 100ms linear',
           backgroundImage: showTrack ? '' : hoverAudioIndex === 2 ? preStyle : '',
        }">
      <transition name="audioTransIn">
        <div class="item2" v-show="!showTrack || trackNum === 1"
             :style="{
            color: hoverAudioIndex === 2 && !showTrack ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
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
import AdvanceRowItems from './AdvanceRowItems.vue';
import BaseInfoCard from '../BaseInfoCard.vue';
import Icon from '../../BaseIconContainer.vue';
import AdvanceColorItems from './AdvanceColorItems.vue';
import AdvanceSelectedItemts from './AdvanceSelectItems.vue';
import AdvanceColumnItems from './AdvanceColumnItems.vue';
export default {
  name: 'AdvanceMainMenu',
  data() {
    return {
      numList: [[0.5], [1], [1.2], [1.5], [2]],
      itemSpeedName: '播放速度',
      speedChosen: false,
      rightArrowSub: false,
      rightArrowMed: false,
      preStyle: 'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.045) 20%, rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%)',
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
  computed: {
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
    handleMouseenter(index) {
      this.hoverIndex = index;
    },
    handleMouseleave() {
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
    handleSubMouseenter(index) {
      this.hoverSubIndex = index;
    },
    handleSubMouseleave() {
      this.hoverSubIndex = -1;
    },
    handleSizeClick() {
      this.hoverSubIndex = -1;
      this.subSizeChosen = true;
      this.subDelayChosen = false;
      this.subColorChosen = false;
    },
    handleColorClick() {
      this.hoverSubIndex = -1;
      this.subColorChosen = true;
      this.subSizeChosen = false;
      this.subDelayChosen = false;
    },
    handleDelayClick() {
      this.hoverSubIndex = -1;
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
    handleAudioMouseenter(index) {
      this.hoverAudioIndex = index;
    },
    handleAudioMouseleave() {
      this.hoverAudioIndex = -1;
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
  min-height: 119px;
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
  }
  .subtitleStyle {
    display: flex;
    width: 170px;
    height: 37px;
  }
  .subtitleDelay {
    display: flex;
    width: 170px;
    height: 37px;
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
