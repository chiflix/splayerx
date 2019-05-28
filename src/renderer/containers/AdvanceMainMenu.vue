<template>
  <base-info-card
    ref="cardWidth"
    class="card"
    :border-radius="7"
    :content-min-height="119"
    :content-min-width="cardWidth > minInfoCardWidth ? cardWidth : minInfoCardWidth"
    :style="{
      cursor: 'default',
      height: readyShow === 'mainMenu' ?
        menuCardHeight : readyShow === 'subMenu' ?
          subtitleCardHeight : audioCardHeight,
      transition: 'height 100ms linear, width 100ms linear',
      fontWeight: '700',
      letterSpacing: '0.2px',
      width: cardWidth > minInfoCardWidth ? `${cardWidth}px` : `${minInfoCardWidth}px`,
    }"
  >
    <transition :name="readyShow === 'mainMenu' ? 'setUp' : 'setUpLeft'">
      <div
        v-show="readyShow === 'mainMenu'"
        class="mainItems"
      >
        <advance-row-items
          :lists="numList"
          :card-width="cardWidth > minInfoCardWidth ? cardWidth : minInfoCardWidth"
          :rate="rate"
          row-type="rate"
          :size="computedSize"
          :change-rate="changeRate"
          :is-chosen="speedChosen"
          @click.left.native="handleClick"
        />
        <div
          class="subtitleControl"
          :style="{
            cursor: 'pointer',
            backgroundImage: hoverIndex === 1 ?
              'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.045) 20%, ' +
              'rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%)' : '',
            transition: 'opacity 200ms',
          }"
          @mouseenter="handleMouseenter(1)"
          @mouseleave="handleMouseleave()"
          @click.left="handleSubClick"
        >
          <div
            class="item2"
            :style="{
              color: hoverIndex === 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
              transition: 'color 300ms',
            }"
          >
            <div class="subSettings">
              {{ this.$t('advance.subMenu') }}
            </div>
            <transition name="arrow">
              <Icon
                v-show="hoverIndex === 1"
                class="arrowRight"
                type="rightArrow"
              />
            </transition>
          </div>
        </div>
        <div
          class="audioItems"
          :style="{ cursor: 'pointer' }"
          @mouseenter="handleMouseenter(2)"
          @mouseleave="handleMouseleave()"
          @click.left="handleAudioClick"
        >
          <transition name="arrow">
            <div
              v-show="hoverIndex === 2"
              class="hoverAudioBack"
            ></div>
          </transition>
          <div class="audioContainer">
            <div
              class="item3"
              :style="{
                color: hoverIndex === 2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                transition: 'color 300ms',
              }"
            >
              <div class="audioSettings">
                {{ this.$t('advance.audioMenu') }}
              </div>
              <transition name="arrow">
                <Icon
                  v-show="hoverIndex === 2"
                  class="arrowRight"
                  type="rightArrow"
                />
              </transition>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition :name="readyShow === 'mainMenu' ? 'setUp' : 'setUpLeft'">
      <div
        v-show="readyShow === 'subMenu'"
        class="mainItems1"
      >
        <div
          class="topContainer"
          @click.left="handleSubBackClick"
          @mouseenter="handleSubBackEnter"
          @mouseleave="handleSubBackLeave"
        >
          <div class="topContent">
            <Icon :type="backSubHover ? 'leftArrowHover' : 'leftArrow'" />
            <div
              class="text"
              :style="{
                color: backSubHover ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
              }"
            >
              {{ this.$t('advance.subMenu') }}
            </div>
          </div>
        </div>
        <advance-row-items
          :card-width="cardWidth > minInfoCardWidth ? cardWidth : minInfoCardWidth"
          :chosen-size-content="ChosenSizeContent"
          row-type="fontSize"
          :lists="$t('advance.fontItems')"
          :size="computedSize"
          :change-font-size="updateSubSize"
          :chosen-size="chosenSize"
          :is-chosen="subSizeChosen"
          @click.left.native="handleSizeClick"
        />
        <advance-color-items
          :size="computedSize"
          :is-chosen="subColorChosen"
          :change-style="changeStyle"
          :stored-style="chosenStyle"
          @click.left.native="handleColorClick"
        />
        <advance-selected-items
          :is-subtitle-available="isSubtitleAvailable"
          selected-type="subtitle"
          :change-subtitle-delay="changeSubtitleDelay"
          :size="computedSize"
          :is-chosen="subDelayChosen"
          :subtitle-delay="subtitleDelay"
          @click.left.native="handleDelayClick"
        />
      </div>
    </transition>

    <transition :name="readyShow === 'mainMenu' ? 'setUp' : 'setUpLeft'">
      <div
        v-show="readyShow === 'audioMenu'"
        class="mainItems2"
      >
        <div
          class="topContainer"
          @click.left="handleAudioBackClick"
          @mouseenter="handleAudioBackEnter"
          @mouseleave="handleAudioBackLeave"
        >
          <div class="topContent">
            <Icon :type="backAudioHover ? 'leftArrowHover' : 'leftArrow'" />
            <div
              class="text"
              :style="{
                color: backAudioHover ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
              }"
            >
              {{ this.$t('advance.audioMenu') }}
            </div>
          </div>
        </div>
        <advance-selected-items
          :size="computedSize"
          selected-type="audio"
          :is-chosen="showDelay"
          :audio-delay="audioDelay"
          @click.left.native="1"
        />
        <advance-column-items
          :size="computedSize"
          :is-chosen="showTrack"
          :current-track-name="currentAudioTrack"
          :current-track-id="currentAudioTrackId"
          :tracks="audioTrackList"
          :switch-audio-track="switchAudioTrack"
          @click.left.native="handleTrackClick"
        />
      </div>
    </transition>
  </base-info-card>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import asyncStorage from '@/helpers/asyncStorage';
import { Subtitle as subtitleActions, Video as videoActions } from '@/store/actionTypes';
import AdvanceRowItems from '@/components/PlayingView/AdvanceControlFunctionalities/AdvanceRowItems.vue';
import BaseInfoCard from '@/components/PlayingView/InfoCard.vue';
import Icon from '@/components/BaseIconContainer.vue';
import AdvanceColorItems from '@/components/PlayingView/AdvanceControlFunctionalities/AdvanceColorItems.vue';
import AdvanceSelectedItemts from '@/components/PlayingView/AdvanceControlFunctionalities/AdvanceSelectItems.vue';
import AdvanceColumnItems from '@/components/PlayingView/AdvanceControlFunctionalities/AdvanceColumnItems.vue';

export default {
  name: 'AdvanceMainMenu',
  components: {
    'base-info-card': BaseInfoCard,
    'advance-row-items': AdvanceRowItems,
    'advance-color-items': AdvanceColorItems,
    'advance-selected-items': AdvanceSelectedItemts,
    'advance-column-items': AdvanceColumnItems,
    Icon,
  },
  props: {
    clearState: {
      type: Boolean,
    },
  },
  data() {
    return {
      numList: [0.5, 1, 1.2, 1.5, 2],
      speedChosen: false,
      rightArrowSub: false,
      rightArrowMed: false,
      hoverIndex: -1,
      readyShow: 'mainMenu',
      backSubHover: false,
      subSizeChosen: false,
      subColorChosen: false,
      subDelayChosen: false,
      showDelay: false,
      showTrack: false,
      hoverAudioIndex: -1,
      backAudioHover: false,
      cardWidth: 170,
      normalFont: 'Avenir, Roboto-Regular, PingFang SC, Microsoft Yahei',
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'currentFirstSubtitleId', 'winHeight', 'rate', 'chosenSize', 'subToTop',
      'subtitleDelay', 'displayLanguage', 'winRatio', 'chosenStyle', 'audioTrackList', 'currentAudioTrackId',
      'computedHeight', 'computedWidth', 'audioDelay', 'lastChosenSize']),
    /**
     * @return {string}
     */
    ChosenSizeContent() {
      const compareContent = ['S', 'M', 'L', 'XL'];
      const enContent = ['Small', 'Normal', 'Large', 'Extra Large'];
      return this.$t(`advance.fontItems[${this.chosenSize}]`) === compareContent[this.chosenSize] ?
        enContent[this.chosenSize] : this.$t(`advance.fontItems[${this.chosenSize}]`);
    },
    minInfoCardWidth() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 170;
      } else if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 204;
      }
      return 285.6;
    },
    leftTitleToShow() { // 菜单左侧显示的text
      if (this.readyShow === 'audioMenu') {
        return [
          this.$t('advance.changeTrack'),
          this.$t('advance.audioDelay'),
          this.$t('advance.audioMenu'),
        ];
      } else if (this.readyShow === 'subMenu') {
        return [
          this.$t('advance.subDelay'),
          this.$t('advance.fontSize'),
          this.$t('advance.fontStyle'),
          this.$t('advance.subMenu'),
        ];
      }
      return [
        this.$t('advance.rateTitle'),
        this.$t('advance.subMenu'),
        this.$t('advance.audioMenu'),
      ];
    },
    maxTextLength() { // 不同菜单界面，一行文字加起来最大的长度
      if (this.readyShow === 'audioMenu') {
        const firstLine = this.getTextWidth(
          `${this.textItemFontSize}px`,
          this.normalFont,
          this.leftTitleToShow[0],
        ) + this.getTextWidth(
          `${this.rightItemFontSize}px`,
          this.normalFont,
          '0 ms',
        );
        const secondLine = this.getTextWidth(
          `${this.textItemFontSize}px`,
          this.normalFont,
          this.leftTitleToShow[1],
        ) + this.getTextWidth(
          `${this.rightItemFontSize}px`,
          this.normalFont,
          this.currentAudioTrack,
        );
        const thirdLine = this.getTextWidth(
          `${this.rightItemFontSize}px`,
          this.normalFont,
          this.leftTitleToShow[2],
        ) + this.rightItemFontSize;
        return Math.max(firstLine, secondLine, thirdLine);
      } else if (this.readyShow === 'subMenu') {
        const firstLine = this.getTextWidth(
          `${this.textItemFontSize}px`,
          this.normalFont,
          this.leftTitleToShow[0],
        ) + this.getTextWidth(
          `${this.rightItemFontSize}px`,
          this.normalFont,
          this.ChosenSizeContent,
        );
        const secondLine = this.getTextWidth(
          `${this.textItemFontSize}px`,
          this.normalFont,
          this.leftTitleToShow[1],
        ) + this.subStyleWidth;
        const thirdLine = this.getTextWidth(
          `${this.textItemFontSize}px`,
          this.normalFont,
          this.leftTitleToShow[2],
        ) + this.getTextWidth(
          `${this.rightItemFontSize}px`,
          this.normalFont,
          `${this.subtitleDelay / 1000} s`,
        );
        const fourthLine = this.getTextWidth(
          `${this.rightItemFontSize}px`,
          this.normalFont,
          this.leftTitleToShow[3],
        ) + this.rightItemFontSize;
        return Math.max(firstLine, secondLine, thirdLine, fourthLine);
      }
      const firstLine = this.getTextWidth(
        `${this.textItemFontSize}px`,
        this.normalFont,
        this.leftTitleToShow[0],
      ) + this.getTextWidth(
        `${this.rightItemFontSize}px`,
        this.normalFont,
        `${this.rate} x`,
      );
      const secondLine = this.getTextWidth(
        `${this.textItemFontSize}px`,
        this.normalFont,
        this.leftTitleToShow[1],
      ) + this.textItemFontSize;
      const thirdLine = this.getTextWidth(
        `${this.textItemFontSize}px`,
        this.normalFont,
        this.leftTitleToShow[2],
      ) + this.textItemFontSize;
      return Math.max(firstLine, secondLine, thirdLine);
    },
    subStyleWidth() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 17;
      } else if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 20.4;
      }
      return 28.56;
    },
    rightItemFontSize() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 11;
      } else if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 13.2;
      }
      return 18.48;
    },
    textItemFontSize() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 13;
      } else if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 15.6;
      }
      return 21.84;
    },
    computedSize() {
      return this.winRatio >= 1 ? this.winHeight : this.winWidth;
    },
    computedVideoSize() {
      return this.winRatio >= 1 ? this.computedHeight : this.computedWidth;
    },
    currentAudioTrack() {
      const track = this.$store.getters.audioTrackList.filter(track => track.enabled)[0];
      if (track) {
        if (track.language === '' || track.language === 'und') {
          return `${
            this.$t('advance.track')} ${this.$store.getters.audioTrackList.indexOf(track) + 1}`;
        } else if (this.$store.getters.audioTrackList.length === 1) {
          return `${track.language}`;
        }
        return `${track.name}`;
      }
      return this.$t('advance.chosenTrack');
    },
    menuCardHeight() {
      return this.speedChosen ? `${this.initialSize(164)}px` : `${this.initialSize(127)}px`;
    },
    subtitleCardHeight() {
      return !this.subColorChosen && !this.subSizeChosen && !this.subDelayChosen ?
        `${this.initialSize(156)}px` : `${this.initialSize(193)}px`;
    },
    audioCardHeight() {
      if (this.showDelay) {
        return `${this.initialSize(156)}px`;
      } else if (this.showTrack) {
        return `${this.initialSize(this.containerHeight)}px`;
      }
      return `${this.initialSize(119)}px`;
    },
    isSubtitleAvailable() {
      return this.currentFirstSubtitleId !== '';
    },
    trackNum() {
      return this.$store.getters.audioTrackList.length;
    },
    containerHeight() {
      if (this.trackNum <= 2) {
        return 133 + (this.trackNum * 27) + ((this.trackNum - 1) * 5);
      }
      return 230;
    },
  },
  watch: {
    subToTop(val) {
      if (val) {
        this.updateLastSubSize(this.chosenSize);
        this.updateSubSize(0);
      } else {
        this.updateSubSize(this.lastChosenSize);
      }
    },
    chosenSize(val) {
      if (this.winRatio >= 1) {
        this.updatePCVideoScaleByFactors(val);
      } else if (this.winRatio < 1) {
        this.updateMobileVideoScaleByFactors(val);
      }
    },
    computedVideoSize(val) {
      if (val >= 1080) {
        this.updateVideoScaleByFactors(val);
      } else if (this.winRatio >= 1) {
        this.updatePCVideoScaleByFactors(this.chosenSize);
      } else if (this.winRatio < 1) {
        this.updateMobileVideoScaleByFactors(this.chosenSize);
      }
    },
    displayLanguage() {
      this.cardWidth = this.maxTextLength + (3 * this.subStyleWidth);
    },
    readyShow() {
      this.cardWidth = this.maxTextLength + (3 * this.subStyleWidth);
    },
    textItemFontSize() {
      this.cardWidth = this.maxTextLength + (3 * this.subStyleWidth);
    },
    clearState(val) {
      this.cardWidth = this.maxTextLength + (3 * this.subStyleWidth);
      if (!val) {
        setTimeout(() => {
          this.readyShow = 'mainMenu';
          this.speedChosen = false;
          this.subSizeChosen = false;
          this.subColorChosen = false;
          this.subDelayChosen = false;
          this.showDelay = false;
          this.showTrack = false;
        }, 150);
      }
    },
    trackNum(val) {
      if (val < 1) {
        this.showTrack = false;
      }
    },
  },
  mounted() {
    this.$bus.$on('switch-audio-track', (index) => {
      this.switchAudioTrack(this.audioTrackList[index]);
    });
    this.$bus.$on('change-size-by-menu', (index) => {
      this.updateSubSize(index);
    });
  },
  created() {
    asyncStorage.get('subtitle-style').then((data) => {
      if (data.chosenSize) {
        this.updateSubSize(data.chosenSize);
      }
    });
  },
  methods: {
    ...mapActions({
      updateSubScale: subtitleActions.UPDATE_SUBTITLE_SCALE,
      updateLastSubSize: subtitleActions.UPDATE_LAST_SUBTITLE_SIZE,
      updateSubSize: subtitleActions.UPDATE_SUBTITLE_SIZE,
      changeRate: videoActions.CHANGE_RATE,
    }),
    // update video scale that width is larger than height
    updatePCVideoScaleByFactors(index) {
      const firstFactors = [21, 29, 37, 45];
      const secondFactors = [24, 26, 28, 30];
      this.updateSubScale(`${(((firstFactors[index] / 900) * this.computedVideoSize) +
        (secondFactors[index] / 5)) / 9}`);
    },
    // update video scale that height is larger than width
    updateMobileVideoScaleByFactors(index) {
      const firstFactors = [21, 29, 37, 45];
      const secondFactors = [12, -92, -196, -300];
      this.updateSubScale(`${(((firstFactors[index] / 760) * this.computedVideoSize) +
        (secondFactors[index] / 76)) / 9}`);
    },
    // update video scale when width or height is larger than 1080
    updateVideoScaleByFactors(val) {
      const factors = [30, 40, 50, 60];
      this.updateSubScale(`${((val / 1080) * factors[this.chosenSize]) / 9}`);
    },
    switchAudioTrack(track) {
      this.$store.dispatch(videoActions.SWITCH_AUDIO_TRACK, track);
    },
    changeSubtitleDelay(num) {
      this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_DELAY, num);
    },
    changeStyle(index) {
      this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_STYLE, index);
    },
    initialSize(size) {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return size;
      } else if (this.computedSize >= 481 && this.computedSize < 1080) {
        return size * 1.2;
      }
      return size * 1.2 * 1.4;
    },
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
      if (this.isSubtitleAvailable) {
        this.subDelayChosen = true;
        this.subSizeChosen = false;
        this.subColorChosen = false;
      }
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
      if (this.trackNum > 0) {
        this.showDelay = false;
        this.showTrack = true;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .playSpeed, .hoverBack {
    width: 100%;
  }
  .subtitleControl, .audioItems, .topContainer, .itemSize, .subtitleStyle, .subtitleDelay,
  .audioDelay, .hoverSubBack, .subContainer, .hoverAudioBack, .audioContainer, .trackContainer {
    width: 100%;
    height: 37px;
  }
  .item2, .item3 {
    font-size: 13px;
    width: 100%;
    height: 18px;
    .subSettings, .audioSettings, .leftTrackTitle {
      margin: auto auto auto 17px;
    }
    .arrowRight, .rightTrackItem {
      margin: auto 17px auto auto;
    }
  }
  .topContent {
    width: auto;
    height: 12px;
    margin: auto 9px;
  }
  .text {
    font-size: 11px;
    line-height: 13px;
    margin-left: 3px;
  }
  .setUp-enter-active {
    animation: showP1 .2s;
  }
  .setUp-enter, .setUp-leave-to {
    opacity: 0;
  }
  .setUp-leave-active {
    animation: hideP1 .2s;
  }

  .setUpLeft-enter-active {
    animation: showLeftP1 .2s;
  }
  .setUpLeft-enter, .setUpLeft-leave-to {
    opacity: 0;
  }
  .setUpLeft-leave-active {
    animation: hideLeftP1 .2s;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .playSpeed, .hoverBack {
    width: 100%
  }
  .subtitleControl, .audioItems, .topContainer, .itemSize, .subtitleStyle, .subtitleDelay,
  .audioDelay, .hoverSubBack, .subContainer, .hoverAudioBack, .audioContainer, .trackContainer {
    width: 100%;
    height: 44.4px;
  }
  .item2, .item3 {
    font-size: 15.6px;
    width: 100%;
    height: 22px;
    .subSettings, .audioSettings, .leftTrackTitle {
      margin: auto auto auto 20.4px;
    }
    .arrowRight, .rightTrackItem {
      margin: auto 20.4px auto auto;
    }
  }
  .topContent {
    width: auto;
    height: 14.4px;
    margin: auto 10.8px;
  }
  .text {
    font-size: 13.2px;
    line-height: 15.6px;
    margin-left: 3.6px;
  }
  .setUp-enter-active {
    animation: showP2 .2s;
  }
  .setUp-enter, .setUp-leave-to {
    opacity: 0;
  }
  .setUp-leave-active {
    animation: hideP2 .2s;
  }
  .setUpLeft-enter-active {
    animation: showLeftP2 .2s;
  }
  .setUpLeft-enter, .setUpLeft-leave-to {
    opacity: 0;
  }
  .setUpLeft-leave-active {
    animation: hideLeftP2 .2s;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .playSpeed, .hoverBack {
    width: 100%
  }
  .subtitleControl, .audioItems, .topContainer, .itemSize, .subtitleStyle, .subtitleDelay,
  .audioDelay, .hoverSubBack, .subContainer, .hoverAudioBack, .audioContainer, .trackContainer {
    height: 62.16px;
    width: 100%;
  }
  .item2, .item3 {
    font-size: 21.84px;
    width: 100%;
    height: 30px;
    .subSettings, .audioSettings, .leftTrackTitle {
      margin: auto auto auto 28.48px;
    }
    .arrowRight, .rightTrackItem {
      margin: auto 28.48px auto auto;
    }
  }
  .topContent {
    width: auto;
    height: 20.16px;
    margin: auto 15.12px;
  }
  .text {
    font-size: 18.48px;
    line-height: 21.84px;
    margin-left: 5.04px;
  }
  .setUp-enter-active {
    animation: showP3 .2s;
  }
  .setUp-enter, .setUp-leave-to {
    opacity: 0;
  }
  .setUp-leave-active {
    animation: hideP3 .2s;
  }
  .setUpLeft-enter-active {
    animation: showLeftP3 .2s;
  }
  .setUpLeft-enter, .setUpLeft-leave-to {
    opacity: 0;
  }
  .setUpLeft-leave-active {
    animation: hideLeftP3 .2s;
  }

}

.card {
  -webkit-app-region: no-drag;
}
.hoverBack {
  background-image: linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.045) 20%,
    rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%);
}
.mainItems {
  display: flex;
  flex-direction: column;
  position: absolute;
  width: 100%;
  .playSpeed {
    display: flex;
  }
  .subtitleControl {
    display: flex;
    .hoverSubBack {
      background-image: linear-gradient(90deg, rgba(255,255,255,0.00) 0%,
        rgba(255,255,255,0.045) 20%, rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%);
    }
    .subContainer {
      position: absolute;
      display: flex;
    }
    .item2 {
      margin: auto;
      display: flex;
      justify-content: space-between;
    }
  }
  .audioItems {
    display: flex;
    .audioContainer {
      position: absolute;
      display: flex;
    }
    .hoverAudioBack {
      background-image: linear-gradient(90deg, rgba(255,255,255,0.00) 0%,
        rgba(255,255,255,0.045) 20%, rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%);
    }
    .item3 {
      margin: auto;
      display: flex;
      justify-content: space-between;
    }
  }
}

.mainItems1 {
  display: flex;
  flex-direction: column;
  position: absolute;
  width: 100%;
  .leftItem {
    margin-top: 1px;
    font-size: 13px;
  }
  .rightItem {
    font-size: 11px;
  }
  .topContainer {
    display: flex;
    cursor: pointer;
    .topContent {
      display: flex;
      justify-content: flex-start;
    }
  }
  .itemSize {
    display: flex;
  }
  .subtitleStyle {
    display: flex;
  }
  .subtitleDelay {
    display: flex;
  }
}

.mainItems2 {
  display: flex;
  flex-direction: column;
  position: absolute;
  width: 100%;
  .topContainer {
    display: flex;
    cursor: pointer;
    .topContent {
      display: flex;
      justify-content: flex-start;
    }
  }
  .trackContainer {
    display: flex;
    position: absolute;
  }
  .audioDelay {
    display: flex;
  }
  .changeTrack {
    display: flex;
    .item2 {
      display: flex;
      justify-content: space-between;
      margin: auto;
    }
  }
}

.arrow-enter-active, .arrow-leave-active {
  transition: opacity .2s;
}
.arrow-enter, .arrow-leave-to {
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

@keyframes showP1 {
  0% {
    opacity: 0;
    right: 170px;
  }
  100% {
    opacity: 1;
    right: 0;
  }
}
@keyframes hideP1 {
  0% {
    opacity: 1;
    right: 0;
  }
  100% {
    opacity: 0;
    right: -170px;
  }
}
@keyframes showP2 {
  0% {
    opacity: 0;
    right: 204px;
  }
  100% {
    opacity: 1;
    right: 0;
  }
}
@keyframes hideP2 {
  0% {
    opacity: 1;
    right: 0;
  }
  100% {
    opacity: 0;
    right: -204px;
  }
}
@keyframes showP3 {
  0% {
    opacity: 0;
    right: 285.6px;
  }
  100% {
    opacity: 1;
    right: 0;
  }
}
@keyframes hideP3 {
  0% {
    opacity: 1;
    right: 0;
  }
  100% {
    opacity: 0;
    right: -285.6px;
  }
}
@keyframes showLeftP1 {
  0% {
    opacity: 0;
    right: -170px;
  }
  100% {
    opacity: 1;
    right: 0;
  }
}
@keyframes hideLeftP1 {
  0% {
    opacity: 1;
    right: 0;
  }
  100% {
    opacity: 0;
    right: 170px;
  }
}
@keyframes showLeftP2 {
  0% {
    opacity: 0;
    right: -204px;
  }
  100% {
    opacity: 1;
    right: 0;
  }
}
@keyframes hideLeftP2 {
  0% {
    opacity: 1;
    right: 0;
  }
  100% {
    opacity: 0;
    right: 204px;
  }
}
@keyframes showLeftP3 {
  0% {
    opacity: 0;
    right: -285.6px;
  }
  100% {
    opacity: 1;
    right: 0;
  }
}
@keyframes hideLeftP3 {
  0% {
    opacity: 1;
    right: 0;
  }
  100% {
    opacity: 0;
    right: 285.6px;
  }
}
</style>
