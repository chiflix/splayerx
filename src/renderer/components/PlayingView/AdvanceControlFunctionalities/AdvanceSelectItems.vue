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
    <div class="textContainer">
      <div class="textItem"
        :style="{
          color: color,
          transition: 'color 300ms',
        }">{{ item }}</div>
      <div class="rightItem" v-show="!isChosen">{{ item === '字幕延迟' ? subtitleDelay : audioDelay }}</div>
    </div>
      <transition name="detail">
        <div class="listContainer" v-show="isChosen">
         <div class="rowContainer">
           <Icon type="minus" class="decrease" @click.left.native="handleDecrease"></Icon>
           <div class="card"></div>
           <div class="delay">{{ delayNum }}</div>
           <Icon type="plus" class="increase" @click.left.native="handleIncrease"></Icon>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { Video as videoActions } from '@/store/actionTypes';
import Icon from '../../BaseIconContainer.vue';
export default {
  name: 'AdvanceSelectItems',
  data() {
    return {
      delayNum: 0,
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
    heightSize() {
      if (this.winWidth > 514 && this.winWidth <= 854) {
        return this.isChosen ? '74px' : '37px';
      } else if (this.winWidth > 854 && this.winWidth <= 1920) {
        return this.isChosen ? `${74 * 1.2}px` : `${37 * 1.2}px`;
      }
      return this.isChosen ? `${74 * 1.2 * 1.4}px` : `${37 * 1.2 * 1.4}px`;
    },
    subtitleDelay() {
      return `${this.$store.getters.SubtitleDelay} ms`;
    },
    audioDelay() {
      return `${this.$store.getters.AudioDelay} ms`;
    },
  },
  components: {
    Icon,
  },
  methods: {
    handleDecrease() {
      this.delayNum -= 50;
      if (this.item === '字幕延迟') {
        this.$store.dispatch('updateSubDelay', -50);
      } else {
        this.$store.dispatch(videoActions.UPDATE_DELAY, -50);
      }
    },
    handleIncrease() {
      this.delayNum += 50;
      if (this.item === '字幕延迟') {
        this.$store.dispatch('updateSubDelay', 50);
      } else {
        this.$store.dispatch(videoActions.UPDATE_DELAY, 50);
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
    .rowContainer {
      display: flex;
      justify-content: center;
      margin: -2px auto;
      .card {
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        background-image: radial-gradient(60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
      }
      .delay{
        position: absolute;
        color: rgba(255, 255, 255, 0.9);
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
