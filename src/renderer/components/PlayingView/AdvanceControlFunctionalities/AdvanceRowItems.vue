<template>
  <div class="itemContainer"
       :style="{
       height: heightSize,
       backgroundImage: height === 37 ? '' : 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
     }">
    <div class="detail"
         :style="{
      height: heightSize,
    }">
    <div class="textContainer"
      :style="{
        color: color,
      }">
      <div class="textItem">{{ item }}</div>
      <div class="rightItem" v-show="height === 37">{{ showDetail }}</div>
    </div>

      <transition name="detail">
    <div class="listContainer" v-show="height === 74">
      <div class="rowContainer">
        <div v-for="(list, index) in lists"
          :id="'list'+index"
          :class="rowNumDetail"
          @mouseover="handleOver(index)"
          @mouseout="handleOut(index)"
          @click="handleClick(index)"
             :style="{
              width: index === difIndex[0] || index === difIndex[1] ? `${difWidth[0]}px` : `${difWidth[1]}px`}">
          <div class="text"
            :style="{
              color: list.chosen || index === hoverIndex ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)',
              margin: 'auto',
          }">{{ list[0] }}</div>
          <base-info-card :class="cardType" v-show="index === hoverIndex"
            :style="{
              width: index === difIndex[0] || index === difIndex[1] ? `${difWidth[0]}px` : `${difWidth[1]}px`,
            }"></base-info-card>
        </div>
      </div>
    </div>
      </transition>
  </div>

  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { Video as videoActions } from '@/store/actionTypes';
import BaseInfoCard from '../InfoCard';
export default {
  name: 'AdvanceRowItems',
  data() {
    return {
      hoverIndex: -1,
    };
  },
  props: {
    lists: {
      type: Object.Array,
      require: true,
      default: [],
    },
    item: {
      type: String,
    },
    height: {
      type: Number,
    },
    color: {
      type: String,
    },
  },
  computed: {
    ...mapGetters(['rate']),
    showDetail() {
      if (this.item === '播放速度') {
        return `${this.rate} x`;
      } else if (this.item === '字体大小') {
        return `${this.ChosenSize}`;
      }
      return null;
    },
    heightSize() {
      return `${this.height}px`;
    },
    rowNumDetail() {
      return this.item === '字体大小' ? 'fontRowNumDetail' : 'speedRowNumDetail';
    },
    cardType() {
      return this.item === '字体大小' ? 'fontCard' : 'speedCard';
    },
    difIndex() {
      return this.item === '字体大小' ? [0, 2] : [1, 4];
    },
    difWidth() {
      return this.item === '字体大小' ? [29, 35] : [25, 29];
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
  },
  components: {
    'base-info-card': BaseInfoCard,
  },
  methods: {
    handleOver(index) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(index) {
      this.lists.forEach((i, ind) => {
        if (ind !== index) {
          this.$set(this.lists[ind], 'chosen', false);
        } else {
          this.$set(this.lists[ind], 'chosen', true);
        }
      });
      if (this.item === '播放速度') {
        this.$store.dispatch(videoActions.CHANGE_RATE, this.lists[index][0]);
      } else if (this.item === '字体大小') {
        switch (index) {
          case 0:
            this.$store.dispatch('updateFontSize', 3);
            this.$bus.$emit('sub-style-change', { fontSize: 3 });
            break;
          case 1:
            this.$store.dispatch('updateFontSize', 5);
            this.$bus.$emit('sub-style-change', { fontSize: 5 });
            break;
          case 2:
            this.$store.dispatch('updateFontSize', 8);
            this.$bus.$emit('sub-style-change', { fontSize: 8 });
            break;
          case 3:
            this.$store.dispatch('updateFontSize', 10);
            this.$bus.$emit('sub-style-change', { fontSize: 10 });
            break;
          default:
            break;
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.itemContainer {
  position: absolute;
  width: 170px;
  display: flex;
  border-radius: 7px;
  z-index: 10;
  clip-path: inset(0 round 8px);
  transition: height 100ms linear, background-color 100ms linear;
  .detail {
    width: 100%;
  }
  .textContainer {
    width: 136px;
    height: 37px;
    display: flex;
    flex: 1;
    font-size: 13px;
    margin: auto auto auto 17px;
    color: rgba(255, 255, 255, 0.6);
    .textItem {
      letter-spacing: 0.2px;
      margin: auto auto auto 0;
    }
    .rightItem {
      font-size: 11px;
      margin: auto 0 auto auto;
    }

  }
  .listContainer {
    flex: 1;
    display: flex;
    height: 37px;
    .rowContainer {
      display: flex;
      justify-content: space-around;
      width: 137px;
      height: 27px;
      margin: -2px auto;
      .speedRowNumDetail {
        position: relative;
        display: flex;
      }
      .fontRowNumDetail {
        position: relative;
        display: flex;
      }
      .text {
        line-height: 12px;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 7.5px;
      }
      .speedCard {
        z-index: -1;
        height: 27px;
      }
      .fontCard {
        z-index: -1;
        height: 27px;
      }
    }
  }
}


  .detail-enter-active {
    animation: show 100ms;
  }
  .detail-enter, .detail-leave-to {
    opacity: 0;
  }
  .detail-leave-active {
    animation: hide 100ms;
  }

  @keyframes show {
    0% {
      opacity: 0;
      height: 0px;
    }
    100% {
      opacity: 1;
      height: 37px;
    }
  }
  @keyframes hide {
    0% {
      opacity: 1;
      height: 37px;
    }
    100% {
      opacity: 0;
      height: 0px;
    }
  }
</style>
