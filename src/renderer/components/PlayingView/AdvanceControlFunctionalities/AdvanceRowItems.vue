<template>
  <div class="itemContainer">
    <div class="textContainer">
      <div class="textItem">{{ item }}</div>
    </div>
    <div class="listContainer">
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
              width: index === difIndex[0] || index === difIndex[1] ? `${difWidth[0]}px` : `${difWidth[1]}px`}"></base-info-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Video as videoActions } from '@/store/action-types';
import BaseInfoCard from '../BaseInfoCard';
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
  },
  computed: {
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
        switch (index) {
          case 0:
            this.$store.dispatch(videoActions.CHANGE_RATE, 0.5);
            break;
          case 1:
            this.$store.dispatch(videoActions.CHANGE_RATE, 1);
            break;
          case 2:
            this.$store.dispatch(videoActions.CHANGE_RATE, 1.2);
            break;
          case 3:
            this.$store.dispatch(videoActions.CHANGE_RATE, 1.5);
            break;
          case 4:
            this.$store.dispatch(videoActions.CHANGE_RATE, 2);
            break;
          default:
            break;
        }
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
  height: 74px;
  display: flex;
  flex-direction: column;
  border-radius: 7px;
  z-index: 10;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.12);
  clip-path: inset(0 round 8px);
  .textContainer {
    display: flex;
    flex: 1;
    font-size: 13px;
    margin: auto auto auto 17px;
    color: rgba(255, 255, 255, 0.6);
    .textItem {
      letter-spacing: 0.2px;
      margin: auto;
    }
  }
  .listContainer {
    flex: 1;
    display: flex;
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
</style>
