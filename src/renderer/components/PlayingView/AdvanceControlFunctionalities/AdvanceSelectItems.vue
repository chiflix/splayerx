<template>
  <div class="itemContainer"
    :style="{
      height: heightSize,
      backgroundImage: !isChosen ? '' : 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
    }">
    <div class="detail"
      :style="{
        height: heightSize,
      }">
    <div class="textContainer" :style="{
      cursor: isChosen || item === this.$t('advance.audioDelay') ? 'default' : 'pointer',
    }">
      <div class="textItem"
        :style="{
          color: color,
          transition: 'color 300ms',
        }">{{ item }}</div>
      <div class="rightItem" :style="{ color: color }">{{ item === this.$t('advance.subDelay') ? screenSubtitleDelay : audioDelay }}</div>
    </div>
      <transition name="detail">
        <div class="listContainer" v-show="isChosen">
         <div class="rowContainer">
           <Icon type="minus" class="decrease"
             @mousedown.native="handleDeMousedown"
             @mouseup.native="handleDeMouseup"
             @mouseleave.native="handleDeMouseup"></Icon>
           <input class="card" id='delayValue' :value="delayNum" @blur="losePoint" @keypress="handleKeypress">
           <Icon type="plus" class="increase"
             @mousedown.native="handleInMousedown"
             @mouseup.native="handleInMouseup"
             @mouseleave.native="handleInMouseup"></Icon>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Icon from '../../BaseIconContainer.vue';

export default {
  name: 'AdvanceSelectItems',
  data() {
    return {
      timeDeSet: null,
      timeDeInt: null,
      changeSpeed: 120,
      timeInset: null,
      timeInInt: null,
    };
  },
  props: {
    item: {
      type: String,
    },
    height: {
      type: Number,
    },
    color: {
      type: String,
    },
    isChosen: {
      type: Boolean,
    },
    size: {
      type: Number,
    },
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
      if (this.item === this.$t('advance.subDelay')) {
        return `${this.subtitleDelay / 1000}`;
      }
      if (Math.abs(this.AudioDelay) >= 10000) {
        return `${this.AudioDelay / 1000}`;
      }
      return this.AudioDelay;
    },
  },
  components: {
    Icon,
  },
  methods: {
    handleKeypress(e) {
      const nowInput = document.querySelector('#delayValue').value;
      if (e.key >= 0 && e.key <= 9) {
        const IntegerReg = new RegExp(/^[-]?[\d]{5}$/);
        const DecimalReg = new RegExp(/^[-]?[\d]+([.][\d])/);
        if (IntegerReg.test(nowInput) || DecimalReg.test(nowInput)) {
          e.returnValue = false;
        }
      } else if (e.key === '-' && nowInput) {
        e.returnValue = false;
      } else if (e.key === '.' && !nowInput) {
        e.returnValue = false;
      } else {
        e.returnValue = false;
      }
    },
    losePoint() {
      const formater = new RegExp(/^[-]?[\d]+([.][\d])?$/);
      const inputDelayNum = document.querySelector('#delayValue').value;
      if ((formater.test(inputDelayNum) || inputDelayNum === '') && inputDelayNum !== this.delayNum) {
        this.$store.dispatch('updateSubDelay', { num: inputDelayNum || 0, manual: true });
      }
    },
    handleDeMousedown() {
      if (this.item === this.$t('advance.subDelay')) {
        const myFunction = () => {
          clearInterval(this.timeDeInt);
          if (this.changeSpeed >= 20) {
            this.changeSpeed -= 2;
          }
          this.$store.dispatch('updateSubDelay', { num: -0.5, manual: false });
          this.timeDeInt = setInterval(myFunction, this.changeSpeed);
        };
        this.$store.dispatch('updateSubDelay', { num: -0.5, manual: false });
        this.timeDeSet = setTimeout(() => {
          myFunction(myFunction, this.changeSpeed);
        }, 500);
      }
    },
    handleDeMouseup() {
      if (this.item === this.$t('advance.subDelay')) {
        this.changeSpeed = 120;
        clearTimeout(this.timeDeSet);
        clearInterval(this.timeDeInt);
      }
    },
    handleInMousedown() {
      if (this.item === this.$t('advance.subDelay')) {
        const myFunction = () => {
          clearInterval(this.timeInInt);
          if (this.changeSpeed >= 20) {
            this.changeSpeed -= 2;
          }
          this.$store.dispatch('updateSubDelay', { num: 0.5, manual: false });
          this.timeInInt = setInterval(myFunction, this.changeSpeed);
        };
        this.$store.dispatch('updateSubDelay', { num: 0.5, manual: false });
        this.timeInSet = setTimeout(() => {
          myFunction(myFunction, this.changeSpeed);
        }, 500);
      }
    },
    handleInMouseup() {
      if (this.item === this.$t('advance.subDelay')) {
        this.changeSpeed = 120;
        clearTimeout(this.timeInSet);
        clearInterval(this.timeInInt);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px), screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .itemContainer {
    width: 170px;
    .textContainer {
      width: 136px;
      height: 37px;
      font-size: 13px;
      margin: auto auto auto 17px;
      .rightItem {
        font-size: 11px;
      }
    }
    .listContainer {
      height: 37px;
      .rowContainer {
        width: 137px;
        height: 27px;
        .increase {
          height: 11px;
          width: 11px;
          margin-top: 7.5px;
        }
        .decrease {
          height: 11px;
          width: 11px;
          margin-right: 10px;
          margin-top: 7.5px;
        }
        .card {
          width: 41px;
          height: 27px;
          margin-right: 10px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
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
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .itemContainer {
    width: 204px;
    .textContainer {
      width: 163.2px;
      height: 44.4px;
      font-size: 15.6px;
      margin: auto auto auto 20.4px;
      .rightItem {
        font-size: 13.2px;
      }
    }
    .listContainer {
      height: 44.4px;
      .rowContainer {
        width: 164.4px;
        height: 32.4px;
        .increase {
          height: 13.2px;
          width: 13.2px;
          margin-top: 9px;
        }
        .decrease {
          height: 13.2px;
          width: 13.2px;
          margin-right: 12px;
          margin-top: 9px;
        }
        .card {
          width: 49.2px;
          height: 32.4px;
          margin-right: 12px;
          font-size: 13.2px;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
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
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px), screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .itemContainer {
    width: 285.6px;
    .textContainer {
      width: 228.48px;
      height: 62.16px;
      font-size: 21.84px;
      margin: auto auto auto 28.56px;
      .rightItem {
        font-size: 18.48px;
      }
    }
    .listContainer {
      height: 62.16px;
      .rowContainer {
        width: 230.16px;
        height: 45.36px;
        .increase {
          height: 18.48px;
          width: 18.48px;
          margin-top: 12.6px;
        }
        .decrease {
          height: 18.48px;
          width: 18.48px;
          margin-right: 16.8px;
          margin-top: 12.6px;
        }
        .card {
          width: 68.88px;
          height: 45.36px;
          margin-right: 16.8px;
          font-size: 18.48px;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
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
      margin: auto auto auto 0;
    }
    .rightItem {
      color: rgba(255, 255, 255, 0.6);
      margin: auto 0 auto auto;
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
        border: 0.5px solid rgba(255, 255, 255, 0.08);
        background-image: radial-gradient(60% 134%, rgba(255, 255, 255, 0.036) 44%, rgba(255, 255, 255, 0.02) 100%);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
      }
      .decrease {
        cursor: pointer;
      }
      .increase {
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
