<template>
  <base-info-card
    ref="cardWidth"
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
    class="no-drag"
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
          :size="computedSize"
          :handle-row-click="changeRate"
          :is-chosen="speedChosen"
          @click.left.native="handleClick"
          row-type="rate"
        />
        <div
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
          class="subtitleControl"
        >
          <div
            :style="{
              color: hoverIndex === 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
              transition: 'color 300ms',
            }"
            class="item2"
          >
            <p>{{ this.$t('advance.subMenu') }}</p>
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
          :style="{ cursor: 'pointer' }"
          @mouseenter="handleMouseenter(2)"
          @mouseleave="handleMouseleave()"
          @click.left="handleAudioClick"
          class="audioItems"
        >
          <transition name="arrow">
            <div
              v-show="hoverIndex === 2"
              class="hoverAudioBack"
            />
          </transition>
          <div class="audioContainer">
            <div
              :style="{
                color: hoverIndex === 2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                transition: 'color 300ms',
              }"
              class="item3"
            >
              <p>{{ this.$t('advance.audioMenu') }}</p>
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
        >
          <div class="topContent">
            <div
              :style="{
                display: 'flex',
                marginTop: 'auto'
              }"
              @click.left="handleSubBackClick"
              @mouseenter="handleSubBackEnter"
              @mouseleave="handleSubBackLeave"
              class="backContent"
            >
              <Icon :type="backSubHover ? 'leftArrowHover' : 'leftArrow'" />
              <p
                :style="{
                  color: backSubHover ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
                }"
                class="text"
              >
                {{ this.$t('advance.subMenu') }}
              </p>
            </div>
            <div
              v-show="enabledSecondarySub && secondarySubtitleId"
              @mouseup="subTypeShift"
              @mouseover="shiftItemHover"
              @mouseleave="shiftItemLeave"
              class="subtitleShift"
            >
              <div
                :style="{
                  color: isPrimarySubSettings || shiftItemHovered ?
                    'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                  background: isPrimarySubSettings ? 'rgba(255, 255, 255, 0.13)' : '',
                  boxShadow: isPrimarySubSettings ? '1px 0 2px rgba(0, 0, 0, 0.09)' : '',
                  borderRadius: isPrimarySubSettings ? '2px' : '',
                }"
                class="firstSub"
              >
                <span>1</span>
              </div>
              <div
                :style="{
                  color: !isPrimarySubSettings || shiftItemHovered ?
                    'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                  background: !isPrimarySubSettings ? 'rgba(255, 255, 255, 0.13)' : '',
                  boxShadow: !isPrimarySubSettings ? '-1px 0 2px rgba(0, 0, 0, 0.09)' : '',
                  borderRadius: !isPrimarySubSettings ? '2px' : '',
                }"
                class="secondarySub"
              >
                <span>2</span>
              </div>
            </div>
          </div>
        </div>
        <advance-row-items
          :is-primary-sub="canEnableSubtitleSizeAndColorSettings"
          :card-width="cardWidth > minInfoCardWidth ? cardWidth : minInfoCardWidth"
          :chosen-size-content="ChosenSizeContent"
          :lists="$t('advance.fontItems')"
          :size="computedSize"
          :handle-row-click="updateSubSize"
          :chosen-size="chosenSize"
          :is-chosen="subSizeChosen"
          @click.left.native="handleSizeClick"
          row-type="fontSize"
        />
        <advance-color-items
          :is-primary-sub="canEnableSubtitleSizeAndColorSettings"
          :size="computedSize"
          :is-chosen="subColorChosen"
          :change-style="changeStyle"
          :stored-style="chosenStyle"
          @click.left.native="handleColorClick"
        />
        <advance-selected-items
          :is-subtitle-available="isSubtitleAvailable"
          :is-primary-sub="canEnableSubtitleDelaySetting"
          :handle-select-click="changeSubtitleDelay"
          :size="computedSize"
          :is-chosen="subDelayChosen"
          :primary-sub-delay="primaryDelay"
          :secondary-sub-delay="secondaryDelay"
          @click.left.native="handleDelayClick"
          selected-type="subtitle"
        />
      </div>
    </transition>

    <transition :name="readyShow === 'mainMenu' ? 'setUp' : 'setUpLeft'">
      <div
        v-show="readyShow === 'audioMenu'"
        class="mainItems2"
      >
        <div
          @click.left="handleAudioBackClick"
          @mouseenter="handleAudioBackEnter"
          @mouseleave="handleAudioBackLeave"
          class="topContainer"
        >
          <div class="topContent">
            <Icon :type="backAudioHover ? 'leftArrowHover' : 'leftArrow'" />
            <p
              :style="{
                color: backAudioHover ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
              }"
              class="text"
            >
              {{ this.$t('advance.audioMenu') }}
            </p>
          </div>
        </div>
        <advance-selected-items
          :size="computedSize"
          :handle-select-click="() => []"
          :is-chosen="showDelay"
          :audio-delay="audioDelay"
          @click.left.native="1"
          selected-type="audio"
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

<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import { Subtitle as subtitleActions, Video as videoActions } from '@/store/actionTypes';
import { calculateTextSize } from '@/libs/utils';
import AdvanceRowItems from '@/components/PlayingView/AdvanceControlFunctionalities/AdvanceRowItems.vue';
// @ts-ignore
import BaseInfoCard from '@/components/PlayingView/InfoCard.vue';
// @ts-ignore
import Icon from '@/components/BaseIconContainer.vue';
import AdvanceColorItems from '@/components/PlayingView/AdvanceControlFunctionalities/AdvanceColorItems.vue';
import AdvanceSelectedItemts from '@/components/PlayingView/AdvanceControlFunctionalities/AdvanceSelectItems.vue';
import AdvanceColumnItems from '@/components/PlayingView/AdvanceControlFunctionalities/AdvanceColumnItems.vue';
import { NOT_SELECTED_SUBTITLE } from '@/interfaces/ISubtitle';

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
      cardWidth: 180,
      normalFont: 'Avenir, Roboto-Regular, PingFang SC, Microsoft Yahei',
      shiftItemHovered: false,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'primarySubtitleId', 'secondarySubtitleId', 'enabledSecondarySub', 'winHeight', 'rate', 'chosenSize', 'subToTop',
      'displayLanguage', 'winRatio', 'chosenStyle', 'audioTrackList', 'currentAudioTrackId', 'isPrimarySubSettings',
      'computedHeight', 'computedWidth', 'audioDelay', 'lastChosenSize', 'primaryDelay', 'secondaryDelay',
      'isPrimarySubtitleIsImage', 'isSecondarySubtitleIsImage']),
    ChosenSizeContent() {
      const compareContent = ['S', 'M', 'L', 'XL'];
      const enContent = ['Small', 'Normal', 'Large', 'Extra Large'];
      return this.$t(`advance.fontItems[${this.chosenSize}]`) === compareContent[this.chosenSize]
        ? enContent[this.chosenSize] : this.$t(`advance.fontItems[${this.chosenSize}]`);
    },
    minInfoCardWidth() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 180;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 216;
      }
      return 302.4;
    },
    leftTitleToShow() { // 菜单左侧显示的text
      if (this.readyShow === 'audioMenu') {
        return [
          this.$t('advance.changeTrack'),
          this.$t('advance.audioDelay'),
          this.$t('advance.audioMenu'),
        ];
      }
      if (this.readyShow === 'subMenu') {
        return [
          this.$t('advance.fontSize'),
          this.$t('advance.fontStyle'),
          this.$t('advance.subDelay'),
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
        const firstLine = calculateTextSize(
          `${this.textItemFontSize}px`, this.normalFont, 'normal', '1',
          this.leftTitleToShow[0],
        ).width + calculateTextSize(
          `${this.rightItemFontSize}px`, this.normalFont, 'normal', '1',
          '0 ms',
        ).width;
        const secondLine = calculateTextSize(
          `${this.textItemFontSize}px`, this.normalFont, 'normal', '1',
          this.leftTitleToShow[1],
        ).width + calculateTextSize(
          `${this.rightItemFontSize}px`, this.normalFont, 'normal', '1',
          this.currentAudioTrack,
        ).width;
        const thirdLine = calculateTextSize(
          `${this.rightItemFontSize}px`, this.normalFont, 'normal', '1',
          this.leftTitleToShow[2],
        ).width + this.rightItemFontSize;
        return Math.max(firstLine, secondLine, thirdLine);
      }
      if (this.readyShow === 'subMenu') {
        const firstLine = calculateTextSize(
          `${this.textItemFontSize}px`, this.normalFont, 'normal', '1',
          this.leftTitleToShow[0],
        ).width + calculateTextSize(
          `${this.rightItemFontSize}px`, this.normalFont, 'normal', '1',
          this.ChosenSizeContent,
        ).width;
        const secondLine = calculateTextSize(
          `${this.textItemFontSize}px`, this.normalFont, 'normal', '1',
          this.leftTitleToShow[1],
        ).width + this.subStyleWidth;
        const thirdLine = calculateTextSize(
          `${this.textItemFontSize}px`, this.normalFont, 'normal', '1',
          this.leftTitleToShow[2],
        ).width + calculateTextSize(
          `${this.rightItemFontSize}px`, this.normalFont, 'normal', '1',
          `${this.subtitleDelay / 1000} s`,
        ).width;
        const fourthLine = calculateTextSize(
          `${this.rightItemFontSize}px`, this.normalFont, 'normal', '1',
          this.leftTitleToShow[3],
        ).width + this.rightItemFontSize;
        return Math.max(firstLine, secondLine, thirdLine, fourthLine);
      }
      const firstLine = calculateTextSize(
        `${this.textItemFontSize}px`, this.normalFont, 'normal', '1',
        this.leftTitleToShow[0],
      ).width + calculateTextSize(
        `${this.rightItemFontSize}px`, this.normalFont, 'normal', '1',
        `${this.rate} x`,
      ).width;
      const secondLine = calculateTextSize(
        `${this.textItemFontSize}px`, this.normalFont, 'normal', '1',
        this.leftTitleToShow[1],
      ).width + this.textItemFontSize;
      const thirdLine = calculateTextSize(
        `${this.textItemFontSize}px`, this.normalFont, 'normal', '1',
        this.leftTitleToShow[2],
      ).width + this.textItemFontSize;
      return Math.max(firstLine, secondLine, thirdLine);
    },
    subStyleWidth() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 17;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 20.4;
      }
      return 28.56;
    },
    rightItemFontSize() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 11;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
        return 13.2;
      }
      return 18.48;
    },
    textItemFontSize() {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return 13;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
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
      const track: {id: string; kind: string; label: string;
        language: string; name: string; enabled: boolean;} = this.$store.getters.audioTrackList
        .filter((track: {id: string; kind: string; label: string;
          language: string; name: string; enabled: boolean;}) => track.enabled)[0];
      if (track) {
        if (track.language === '' || track.language === 'und') {
          return `${
            this.$t('advance.track')} ${this.$store.getters.audioTrackList.indexOf(track) + 1}`;
        }
        if (this.$store.getters.audioTrackList.length === 1) {
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
      return !this.subColorChosen && !this.subSizeChosen && !this.subDelayChosen
        ? `${this.initialSize(156)}px` : `${this.initialSize(193)}px`;
    },
    audioCardHeight() {
      if (this.showDelay) {
        return `${this.initialSize(156)}px`;
      }
      if (this.showTrack) {
        return `${this.initialSize(this.containerHeight)}px`;
      }
      return `${this.initialSize(119)}px`;
    },
    isSubtitleAvailable() {
      if (this.isPrimarySubSettings) {
        return !!this.primarySubtitleId && this.primarySubtitleId !== NOT_SELECTED_SUBTITLE;
      }
      return !!this.enabledSecondarySub && this.secondarySubtitleId !== NOT_SELECTED_SUBTITLE;
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
    canEnablePrimarySubtitleDelaySetting() {
      return !!this.primarySubtitleId && this.primarySubtitleId !== NOT_SELECTED_SUBTITLE;
    },
    canEnablePrimarySubtitleSizeAndColorSettings() {
      return this.canEnablePrimarySubtitleDelaySetting && !this.isPrimarySubtitleIsImage;
    },
    canEnablePrimarySubtitlePartialSettings() {
      return this.canEnablePrimarySubtitleSizeAndColorSettings
        || this.canEnablePrimarySubtitleDelaySetting;
    },
    canEnableSecondarySubtitleDelaySetting() {
      return !!this.secondarySubtitleId && this.secondarySubtitleId !== NOT_SELECTED_SUBTITLE;
    },
    canEnableSecondarySubtitleSizeAndColorSettings() {
      return this.canEnableSecondarySubtitleDelaySetting && !this.isSecondarySubtitleIsImage;
    },
    canEnableSecondarySubtitlePartialSettings() {
      return this.canEnableSecondarySubtitleSizeAndColorSettings
        || this.canEnableSecondarySubtitleDelaySetting;
    },
    canEnableSubtitleSizeAndColorSettings() {
      return this.isPrimarySubSettings
        ? this.canEnablePrimarySubtitleSizeAndColorSettings
        : this.canEnableSecondarySubtitleSizeAndColorSettings;
    },
    canEnableSubtitleDelaySetting() {
      return this.isPrimarySubSettings
        ? this.canEnablePrimarySubtitleDelaySetting
        : this.canEnableSecondarySubtitleDelaySetting;
    },
  },
  watch: {
    secondarySubtitleId(val: string) {
      if (val === '') {
        this.updateSubSettingsType(true);
      }
    },
    isPrimarySubSettings(val: boolean) {
      if (!val) {
        this.subColorChosen = false;
        this.subSizeChosen = false;
      }
    },
    chosenSize(val: number) {
      if (this.winRatio >= 1) {
        this.updatePCVideoScaleByFactors(this.subToTop ? 0 : val);
      } else if (this.winRatio < 1) {
        this.updateMobileVideoScaleByFactors(this.subToTop ? 0 : val);
      }
    },
    subToTop(v: boolean) {
      if (this.computedVideoSize >= 1080) {
        this.updateVideoScaleByFactors(this.computedVideoSize);
      } else if (this.winRatio >= 1) {
        this.updatePCVideoScaleByFactors(v ? 0 : this.chosenSize);
      } else if (this.winRatio < 1) {
        this.updateMobileVideoScaleByFactors(v ? 0 : this.chosenSize);
      }
    },
    computedVideoSize(val: number) {
      if (val >= 1080) {
        this.updateVideoScaleByFactors(val);
      } else if (this.winRatio >= 1) {
        this.updatePCVideoScaleByFactors(this.subToTop ? 0 : this.chosenSize);
      } else if (this.winRatio < 1) {
        this.updateMobileVideoScaleByFactors(this.subToTop ? 0 : this.chosenSize);
      }
    },
    displayLanguage() {
      this.cardWidth = this.maxTextLength + (3 * this.subStyleWidth);
    },
    readyShow(val: string) {
      if (val !== 'subMenu') {
        this.updateSubSettingsType(true);
      }
      this.cardWidth = this.maxTextLength + (3 * this.subStyleWidth);
    },
    textItemFontSize() {
      this.cardWidth = this.maxTextLength + (3 * this.subStyleWidth);
    },
    clearState(val: boolean) {
      this.cardWidth = this.maxTextLength + (3 * this.subStyleWidth);
      if (!val) {
        this.updateSubSettingsType(true);
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
    trackNum(val: number) {
      if (val < 1) {
        this.showTrack = false;
      }
    },
    canEnablePrimarySubtitlePartialSettings(newVal: boolean) {
      if (!newVal) {
        if (this.canEnableSecondarySubtitleSizeAndColorSettings
          || this.canEnableSecondarySubtitleDelaySetting) {
          this.updateSubSettingsType(false);
        }
      } else if (!this.canEnableSecondarySubtitleSizeAndColorSettings
        && !this.canEnableSecondarySubtitleDelaySetting) {
        this.updateSubSettingsType(true);
      }
    },
    canEnableSecondarySubtitlePartialSettings(newVal: boolean) {
      if (!newVal) {
        if (this.canEnablePrimarySubtitleSizeAndColorSettings
          || this.canEnablePrimarySubtitleDelaySetting) {
          this.updateSubSettingsType(true);
        }
      } else if (!this.canEnablePrimarySubtitleSizeAndColorSettings
        && !this.canEnablePrimarySubtitleDelaySetting) {
        this.updateSubSettingsType(false);
      }
    },
  },
  mounted() {
    this.$bus.$on('show-subtitle-settings', () => {
      setTimeout(() => {
        this.handleSubClick();
      }, 0);
    });
    this.$bus.$on('switch-audio-track', (index: number) => {
      this.switchAudioTrack(this.audioTrackList[index]);
    });
    this.$bus.$on('change-size-by-menu', (index: number) => {
      this.updateSubSize(index);
    });
  },
  methods: {
    ...mapActions({
      updateSubScale: subtitleActions.UPDATE_SUBTITLE_SCALE,
      updateSubSize: subtitleActions.UPDATE_SUBTITLE_SIZE,
      changeRate: videoActions.CHANGE_RATE,
      updateSubSettingsType: subtitleActions.UPDATE_SUBTITLE_SETTINGS_TYPE,
    }),
    shiftItemHover() {
      this.shiftItemHovered = true;
    },
    shiftItemLeave() {
      this.shiftItemHovered = false;
    },
    subTypeShift() {
      this.updateSubSettingsType(!this.isPrimarySubSettings);
    },
    // update video scale that width is larger than height
    updatePCVideoScaleByFactors(index: number) {
      const firstFactors = [21, 29, 37, 45];
      const secondFactors = [24, 26, 28, 30];
      this.updateSubScale((((firstFactors[index] / 900) * this.computedVideoSize)
        + (secondFactors[index] / 5)) / 9);
    },
    // update video scale that height is larger than width
    updateMobileVideoScaleByFactors(index: number) {
      const firstFactors = [21, 29, 37, 45];
      const secondFactors = [12, -92, -196, -300];
      this.updateSubScale((((firstFactors[index] / 760) * this.computedVideoSize)
        + (secondFactors[index] / 76)) / 9);
    },
    // update video scale when width or height is larger than 1080
    updateVideoScaleByFactors(val: number) {
      const factors = [30, 40, 50, 60];
      const index = this.subToTop ? 0 : this.chosenSize;
      this.updateSubScale(((val / 1080) * factors[index]) / 9);
    },
    switchAudioTrack(track: {id: string; kind: string; label: string;
      language: string; name: string; enabled: boolean;}) {
      this.$store.dispatch(videoActions.SWITCH_AUDIO_TRACK, track);
    },
    changeSubtitleDelay(num: number) {
      this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_DELAY, num);
    },
    changeStyle(index: number) {
      this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_STYLE, index);
    },
    initialSize(size: number) {
      if (this.computedSize >= 289 && this.computedSize <= 480) {
        return size;
      }
      if (this.computedSize >= 481 && this.computedSize < 1080) {
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
    handleMouseenter(index: number) {
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
      if (this.canEnableSubtitleSizeAndColorSettings) {
        this.subSizeChosen = true;
        this.subDelayChosen = false;
        this.subColorChosen = false;
      }
    },
    handleColorClick() {
      if (this.canEnableSubtitleSizeAndColorSettings) {
        this.subColorChosen = true;
        this.subSizeChosen = false;
        this.subDelayChosen = false;
      }
    },
    handleDelayClick() {
      if (this.canEnableSubtitleDelaySetting) {
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
    handleAudioMouseenter(index: number) {
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
  .subtitleControl, .audioItems, .topContainer, .hoverAudioBack, .audioContainer {
    width: 100%;
    height: 37px;
  }
  .item2, .item3 {
    font-size: 13px;
    width: 100%;
    height: 18px;
    p {
      margin: auto auto auto 17px;
    }
    .arrowRight {
      margin: auto 17px auto auto;
    }
  }
  .backContent {
    height: 12px;
  }
  .subtitleShift {
    width: 30px;
    height: 13px;
    background: rgba(0, 0, 0, 0.09);
    margin: auto auto auto 6px;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    .firstSub, .secondarySub {
      width: 50%;
      height: 100%;
      font-size: 9px;
      display: flex;
      span {
        margin: auto;
      }
    }
  }
  .topContent {
    width: auto;
    height: 13px;
    margin: auto 9px;
    p {
      font-size: 11px;
      line-height: 13px;
      margin-left: 3px;
    }
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
  .subtitleControl, .audioItems, .topContainer, .hoverAudioBack, .audioContainer {
    width: 100%;
    height: 44.4px;
  }
  .item2, .item3 {
    font-size: 15.6px;
    width: 100%;
    height: 22px;
    p {
      margin: auto auto auto 20.4px;
    }
    .arrowRight {
      margin: auto 20.4px auto auto;
    }
  }
  .backContent {
    height: 14.4px;
  }
  .subtitleShift {
    width: 36px;
    height: 16px;
    background: rgba(0, 0, 0, 0.09);
    margin: auto auto auto 7.2px;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    .firstSub, .secondarySub {
      width: 50%;
      height: 100%;
      font-size: 11px;
      display: flex;
      span {
        margin: auto;
      }
    }
  }
  .topContent {
    width: auto;
    height: 16px;
    margin: auto 10.8px;
    p {
      font-size: 13.2px;
      line-height: 15.6px;
      margin-left: 3.6px;
    }
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
  .subtitleControl, .audioItems, .topContainer, .hoverAudioBack, .audioContainer {
    height: 62.16px;
    width: 100%;
  }
  .item2, .item3 {
    font-size: 21.84px;
    width: 100%;
    height: 30px;
    p {
      margin: auto auto auto 28.48px;
    }
    .arrowRight {
      margin: auto 28.48px auto auto;
    }
  }
  .backContent {
    height: 20.16px;
  }
  .subtitleShift {
    width: 50.4px;
    height: 22px;
    background: rgba(0, 0, 0, 0.09);
    margin: auto auto auto 10.08px;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    .firstSub, .secondarySub {
      width: 50%;
      height: 100%;
      font-size: 15px;
      display: flex;
      span {
        margin: auto;
      }
    }
  }
  .topContent {
    width: auto;
    height: 22px;
    margin: auto 15.12px;
    p {
      font-size: 18.48px;
      line-height: 21.84px;
      margin-left: 5.04px;
    }
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

.mainItems {
  display: flex;
  flex-direction: column;
  position: absolute;
  width: 100%;
  .subtitleControl {
    display: flex;
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
  .topContainer {
    display: flex;
    cursor: pointer;
    .topContent {
      display: flex;
      justify-content: flex-start;
    }
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
