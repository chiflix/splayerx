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
      <div class="rightItem" :style="{ color: color }">{{ isChosen ? timeUnits : item === this.$t('advance.subDelay') ? screenSubtitleDelay : audioDelay }}</div>
    </div>
      <transition name="detail">
        <div class="listContainer" v-show="isChosen">
         <div class="rowContainer">
           <Icon type="minus" class="decrease"
             @mousedown.native="handleDeMousedown"
             @mouseup.native="handleDeMouseup"
             @mouseleave.native="handleDeMouseup"></Icon>
           <div class="card"></div>
           <div class="delay">{{ delayNum }}</div>
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
    winWidth: {
      type: Number,
    },
  },
  computed: {
    ...mapGetters(['subtitleDelay', 'AudioDelay']),
    heightSize() {
      if (this.winWidth > 514 && this.winWidth <= 854) {
        return this.isChosen ? '74px' : '37px';
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return this.isChosen ? `${74 * 1.2}px` : `${37 * 1.2}px`;
      }
      return this.isChosen ? `${74 * 1.2 * 1.4}px` : `${37 * 1.2 * 1.4}px`;
    },
    timeUnits() {
      if (this.item === this.$t('advance.subDelay')) {
        if (Math.abs(this.subtitleDelay) >= 10000) {
          return 's';
        }
      } else if (Math.abs(this.AudioDelay) >= 10000) {
        return 's';
      }
      return 'ms';
    },
    screenSubtitleDelay() {
      if (Math.abs(this.subtitleDelay) >= 10000) {
        return `${this.subtitleDelay / 1000} s`;
      }
      return `${this.subtitleDelay} ms`;
    },
    audioDelay() {
      if (Math.abs(this.AudioDelay) >= 10000) {
        return `${this.AudioDelay / 1000} s`;
      }
      return `${this.AudioDelay} ms`;
    },
    delayNum() {
      if (this.item === this.$t('advance.subDelay')) {
        if (Math.abs(this.subtitleDelay) >= 10000) {
          return `${this.subtitleDelay / 1000}`;
        }
        return this.subtitleDelay;
      }
      if (Math.abs(this.AudioDelay) >= 10000) {
        return `${this.AudioDelay / 1000}`;
      }
      return this.AudioDelay;
    },
    changeDelay() {
      if (Math.abs(this.subtitleDelay) >= 10000 || Math.abs(this.AudioDelay) >= 10000) {
        return 100;
      }
      return 50;
    },
  },
  components: {
    Icon,
  },
  methods: {
    handleDeMousedown() {
      if (this.item === this.$t('advance.subDelay')) {
        const myFunction = () => {
          clearInterval(this.timeDeInt);
          if (this.changeSpeed >= 20) {
            this.changeSpeed -= 2;
          }
          this.$store.dispatch('updateSubDelay', -this.changeDelay);
          this.timeDeInt = setInterval(myFunction, this.changeSpeed);
        };
        this.$store.dispatch('updateSubDelay', -this.changeDelay);
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
          this.$store.dispatch('updateSubDelay', this.changeDelay);
          this.timeInInt = setInterval(myFunction, this.changeSpeed);
        };
        this.$store.dispatch('updateSubDelay', this.changeDelay);
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
@media screen and (min-width: 513px) and (max-width: 854px) {
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
@media screen and (min-width: 855px) and (max-width: 1920px) {
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
@media screen and (min-width: 1921px) {
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
        }
        .delay {
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
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        background-image: radial-gradient(60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
      }
      .delay{
        cursor: default;
        position: absolute;
        color: rgba(255, 255, 255, 0.9);
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
