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
        backgroundImage: !isChosen && hoveredText && isSubtitleAvailable ?
          'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.045) 20%, ' +
          'rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%)' : '',
        transition: 'opacity 200ms',
      }"
      class="detail"
    >
      <div
        :style="{
          cursor: isChosen || selectedType !== selectedTypeEnum.SUBTITLE || !isSubtitleAvailable ?
            'default' : 'pointer',
        }"
        class="textContainer advanceNormalTitle"
      >
        <p
          :style="{
            color: !isSubtitleAvailable ? 'rgba(255, 255, 255, 0.2)' : !isChosen && hoveredText ?
              'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
            transition: 'color 300ms',
          }"
          class="textItem"
        >
          {{ selectedType === selectedTypeEnum.SUBTITLE ?
            $t('advance.subDelay') : $t('advance.audioDelay') }}
        </p>
        <div
          :style="{
            color: isSubtitleAvailable ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'
          }"
          class="rightItem"
        >
          {{ selectedType === selectedTypeEnum.SUBTITLE ? screenSubtitleDelay : screenAudioDelay }}
        </div>
      </div>
      <transition name="detail">
        <div
          v-show="isChosen"
          class="listContainer"
        >
          <div class="rowContainer">
            <Icon
              @mousedown.native="handleDeMousedown"
              @mouseup.native="handleDeMouseup"
              @mouseleave.native="handleDeMouseup"
              type="minus"
              class="decrease"
            />
            <div class="card" />
            <div class="delay">
              {{ delayNum }}
            </div>
            <Icon
              @mousedown.native="handleInMousedown"
              @mouseup.native="handleInMouseup"
              @mouseleave.native="handleInMouseup"
              type="plus"
              class="increase"
            />
            <Icon
              v-show="subtitleDelay !== 0"
              @click.native="handleResetDelay"
              type="reset"
              class="resetPos"
            />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions } from 'vuex';
import Icon from '../../BaseIconContainer.vue';
import { SubtitleManager } from '@/store/actionTypes';

export default {
  name: 'AdvanceSelectItems',
  components: {
    Icon,
  },
  props: {
    isChosen: {
      type: Boolean,
    },
    size: {
      type: Number,
      required: true,
    },
    selectedType: {
      type: String,
      required: true,
    },
    isSubtitleAvailable: {
      type: Boolean,
    },
    audioDelay: {
      type: Number,
      default: 0,
    },
    primarySubDelay: {
      type: Number,
      default: 0,
    },
    secondarySubDelay: {
      type: Number,
      default: 0,
    },
    isPrimarySub: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      timeDeSet: null,
      timeDeInt: null,
      changeSpeed: 120,
      timeInSet: null,
      timeInInt: null,
      hoveredText: false,
      selectedTypeEnum: {
        SUBTITLE: 'subtitle',
        AUDIO: 'audio',
      },
    };
  },
  computed: {
    subtitleDelay() {
      return this.isPrimarySub ? this.primarySubDelay : this.secondarySubDelay;
    },
    handleSelectClick() {
      return this.isPrimarySub ? this.changePrimarySubDelay : this.changeSecondarySubDelay;
    },
    heightSize() {
      if (this.size >= 289 && this.size <= 480) {
        return this.isChosen ? '74px' : '37px';
      }
      if (this.size >= 481 && this.size < 1080) {
        return this.isChosen ? `${74 * 1.2}px` : `${37 * 1.2}px`;
      }
      return this.isChosen ? `${74 * 1.2 * 1.4}px` : `${37 * 1.2 * 1.4}px`;
    },
    screenSubtitleDelay() {
      return `${this.subtitleDelay} s`;
    },
    screenAudioDelay() {
      if (Math.abs(this.audioDelay) >= 10000) {
        return `${this.audioDelay} s`;
      }
      return `${this.audioDelay} ms`;
    },
    delayNum() {
      if (this.selectedType === this.selectedTypeEnum.SUBTITLE) {
        return `${this.subtitleDelay}`;
      }
      if (Math.abs(this.audioDelay) >= 10000) {
        return `${this.audioDelay}`;
      }
      return this.audioDelay;
    },
  },
  methods: {
    ...mapActions({
      changePrimarySubDelay: SubtitleManager.alterPrimaryDelay,
      changeSecondarySubDelay: SubtitleManager.alterSecondaryDelay,
      resetPrimarySubDelay: SubtitleManager.resetPrimaryDelay,
      resetSecondarySubDelay: SubtitleManager.resetSecondaryDelay,
    }),
    handleSubMouseEnter() {
      this.hoveredText = true;
    },
    handleSubMouseLeave() {
      this.hoveredText = false;
    },
    handleResetDelay() {
      this.isPrimarySub ? this.resetPrimarySubDelay() : this.resetSecondarySubDelay();
    },
    handleDeMousedown() {
      if (this.selectedType === this.selectedTypeEnum.SUBTITLE) {
        const decrease = (): void => {
          clearInterval(this.timeDeInt);
          if (this.changeSpeed >= 20) {
            this.changeSpeed -= 2;
          }
          this.handleSelectClick(-0.1);
          this.timeDeInt = setInterval(decrease, this.changeSpeed);
        };
        this.handleSelectClick(-0.1);
        this.timeDeSet = setTimeout(() => {
          decrease();
        }, 500);
      }
    },
    handleDeMouseup() {
      if (this.selectedType === this.selectedTypeEnum.SUBTITLE) {
        this.changeSpeed = 120;
        clearTimeout(this.timeDeSet);
        clearInterval(this.timeDeInt);
      }
    },
    handleInMousedown() {
      if (this.selectedType === this.selectedTypeEnum.SUBTITLE) {
        const increase = (): void => {
          clearInterval(this.timeInInt);
          if (this.changeSpeed >= 20) {
            this.changeSpeed -= 2;
          }
          this.handleSelectClick(0.1);
          this.timeInInt = setInterval(increase, this.changeSpeed);
        };
        this.handleSelectClick(0.1);
        this.timeInSet = setTimeout(() => {
          increase();
        }, 500);
      }
    },
    handleInMouseup() {
      if (this.selectedType === this.selectedTypeEnum.SUBTITLE) {
        this.changeSpeed = 120;
        clearTimeout(this.timeInSet);
        clearInterval(this.timeInInt);
      }
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
        font-size: 11px;
        margin: auto 17px auto auto;
      }
    }
    .listContainer {
      height: 37px;
      .rowContainer {
        width: 80%;
        height: 27px;
        .increase {
          margin-top: 7.5px;
        }
        .decrease {
          margin-right: 10px;
          margin-top: 7.5px;
        }
        .resetPos {
          position: absolute;
          margin-top: 7.5px;
          margin-left: 57px;
        }
        .card {
          width: 41px;
          height: 27px;
          margin-right: 10px;
        }
        .delay {
          font-size: 11px;
          margin-top: 6.5px;
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
  }}
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
        margin: auto 20.4px auto auto;
        font-size: 13.2px;
      }
    }
    .listContainer {
      height: 44.4px;
      .rowContainer {
        width: 80%;
        height: 32.4px;
        .increase {
          margin-top: 9px;
        }
        .decrease {
          margin-right: 12px;
          margin-top: 9px;
        }
        .resetPos {
          position: absolute;
          margin-top: 9px;
          margin-left: 68.4px;
        }
        .card {
          width: 49.2px;
          height: 32.4px;
          margin-right: 12px;
        }
        .delay {
          font-size: 13.2px;
          margin-top: 7.8px;
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
        margin: auto 28.56px auto auto;
        font-size: 18.48px;
      }
    }
    .listContainer {
      height: 62.16px;
      .rowContainer {
        width: 80%;
        height: 45.36px;
        .increase {
          margin-top: 12.6px;
        }
        .decrease {
          margin-right: 16.8px;
          margin-top: 12.6px;
        }
        .resetPos {
          position: absolute;
          margin-top: 12.6px;
          margin-left: 95.76px;
        }
        .card {
          width: 68.88px;
          height: 45.36px;
          margin-right: 16.8px;
        }
        .delay{
          font-size: 18.48px;
          margin-top: 10.92px;
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
  transition: background-color 100ms linear;
  cursor: default;
  .detail {
    width: 100%;
    /*backdrop-filter: blur(0px);*/
  }
  .textContainer {
    display: flex;
    flex: 1;
    .textItem {
      letter-spacing: 0.2px;
    }
    .rightItem {
      color: rgba(255, 255, 255, 0.6);
    }
  }
  .listContainer {
    flex: 1;
    display: flex;
    cursor: default;
    .rowContainer {
      display: flex;
      justify-content: center;
      margin: -2px auto;
      .card {
        cursor: default;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        background-image: radial-gradient(
            60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
      }
      .delay{
        cursor: default;
        position: absolute;
        color: rgba(255, 255, 255, 0.9);
      }
      .decrease, .increase, .resetPos {
        cursor: pointer;
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
