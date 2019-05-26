<template>
  <div
    class="itemContainer"
    :style="{
      height: heightSize,
      backgroundImage: !isChosen ? '' :
        'linear-gradient(90deg, rgba(255,255,255,0.03) ' +
        '0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
    }"
  >
    <div
      class="detail"
      :style="{
        height: heightSize,
      }"
    >
      <div
        class="textContainer advanceNormalTitle"
        :style="{
          cursor: isChosen || !isSubDelay || !isSubtitleAvailable ? 'default' : 'pointer',
        }"
      >
        <div
          class="textItem"
          :style="{
            color: isSubtitleAvailable ? color : 'rgba(255, 255, 255, 0.2)',
            transition: 'color 300ms',
          }"
        >
          {{ item }}
        </div>
        <div
          class="rightItem"
          :style="{
            color: isSubtitleAvailable ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'
          }"
        >
          {{ isSubDelay ? screenSubtitleDelay : audioDelay }}
        </div>
      </div>
      <transition name="detail">
        <div
          v-show="isChosen"
          class="listContainer"
        >
          <div class="rowContainer">
            <Icon
              type="minus"
              class="decrease"
              @mousedown.native="handleDeMousedown"
              @mouseup.native="handleDeMouseup"
              @mouseleave.native="handleDeMouseup"
            />
            <div class="card" />
            <div class="delay">
              {{ delayNum }}
            </div>
            <Icon
              type="plus"
              class="increase"
              @mousedown.native="handleInMousedown"
              @mouseup.native="handleInMouseup"
              @mouseleave.native="handleInMouseup"
            />
            <Icon
              v-show="subtitleDelay !== 0"
              type="reset"
              class="resetPos"
              @click.native="handleResetDelay"
            />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { Subtitle as subtitleActions } from '@/store/actionTypes';
import Icon from '../../BaseIconContainer.vue';

export default {
  name: 'AdvanceSelectItems',
  components: {
    Icon,
  },
  props: {
    item: {
      type: String,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    isChosen: {
      type: Boolean,
    },
    size: {
      type: Number,
      required: true,
    },
    isSubDelay: {
      type: Boolean,
    },
    isSubtitleAvailable: {
      type: Boolean,
    },
  },
  data() {
    return {
      timeDeSet: null,
      timeDeInt: null,
      changeSpeed: 120,
      timeInset: null,
      timeInInt: null,
    };
  },
  computed: {
    ...mapGetters(['subtitleDelay', 'AudioDelay']),
    heightSize() {
      if (this.size >= 289 && this.size <= 480) {
        return this.isChosen ? '74px' : '37px';
      } else if (this.size >= 481 && this.size < 1080) {
        return this.isChosen ? `${74 * 1.2}px` : `${37 * 1.2}px`;
      }
      return this.isChosen ? `${74 * 1.2 * 1.4}px` : `${37 * 1.2 * 1.4}px`;
    },
    screenSubtitleDelay() {
      return `${this.subtitleDelay / 1000} s`;
    },
    audioDelay() {
      if (Math.abs(this.AudioDelay) >= 10000) {
        return `${this.AudioDelay / 1000} s`;
      }
      return `${this.AudioDelay} ms`;
    },
    delayNum() {
      if (this.isSubDelay) {
        return `${this.subtitleDelay / 1000}`;
      }
      if (Math.abs(this.AudioDelay) >= 10000) {
        return `${this.AudioDelay / 1000}`;
      }
      return this.AudioDelay;
    },
  },
  methods: {
    handleResetDelay() {
      this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_DELAY, 0);
    },
    handleDeMousedown() {
      if (this.isSubDelay) {
        const myFunction = () => {
          clearInterval(this.timeDeInt);
          if (this.changeSpeed >= 20) {
            this.changeSpeed -= 2;
          }
          this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_DELAY, -0.1);
          this.timeDeInt = setInterval(myFunction, this.changeSpeed);
        };
        this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_DELAY, -0.1);
        this.timeDeSet = setTimeout(() => {
          myFunction(myFunction, this.changeSpeed);
        }, 500);
      }
    },
    handleDeMouseup() {
      if (this.isSubDelay) {
        this.changeSpeed = 120;
        clearTimeout(this.timeDeSet);
        clearInterval(this.timeDeInt);
      }
    },
    handleInMousedown() {
      if (this.isSubDelay) {
        const myFunction = () => {
          clearInterval(this.timeInInt);
          if (this.changeSpeed >= 20) {
            this.changeSpeed -= 2;
          }
          this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_DELAY, 0.1);
          this.timeInInt = setInterval(myFunction, this.changeSpeed);
        };
        this.$store.dispatch(subtitleActions.UPDATE_SUBTITLE_DELAY, 0.1);
        this.timeInSet = setTimeout(() => {
          myFunction(myFunction, this.changeSpeed);
        }, 500);
      }
    },
    handleInMouseup() {
      if (this.isSubDelay) {
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
      .textItem {
        margin: auto auto auto 17px;
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
      .textItem {
        margin: auto auto auto 20.4px;
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
      .textItem {
        margin: auto auto auto 28.56px;
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
  position: absolute;
  display: flex;
  border-radius: 7px;
  z-index: 10;
  clip-path: inset(0 round 7px);
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
