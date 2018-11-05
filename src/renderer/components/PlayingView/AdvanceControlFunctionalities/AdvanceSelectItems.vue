<template>
  <div class="itemContainer">
    <div class="textContainer">
      <div class="textItem">{{ item }}</div>
    </div>
    <div class="listContainer">
      <div class="rowContainer">
        <Icon type="minus" class="decrease" @click.left.native="handleDecrease"></Icon>
        <base-info-card class="card"><div class="delay">{{ delayNum }}</div></base-info-card>
        <Icon type="plus" class="increase" @click.left.native="handleIncrease"></Icon>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from '../../BaseIconContainer.vue';
import BaseInfoCard from '../BaseInfoCard';
export default {
  name: 'AdvanceSelectItems',
  data() {
    return {
      delayNum: 200,
    };
  },
  props: {
    item: {
      type: String,
    },
  },
  components: {
    Icon,
    'base-info-card': BaseInfoCard,
  },
  methods: {
    handleDecrease() {
      this.delayNum -= 50;
    },
    handleIncrease() {
      this.delayNum += 50;
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
      .card {
        width: 41px;
        height: 27px;
        margin-right: 10px;
        .delay{
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          margin: auto;
        }
      }
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
    }
  }
}
</style>
