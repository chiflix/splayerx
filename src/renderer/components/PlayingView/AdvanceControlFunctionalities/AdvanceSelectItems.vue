<template>
  <div class="itemContainer"
       :style="{
       height: heightSize,
       backgroundImage: height === 37 ? '' : 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
       }">

    <div class="detail" :style="{
      height: heightSize,
    }">
    <div class="textContainer"
      :style="{
        color: color,
      }">
      <div class="textItem">{{ item }}</div>
      <div class="rightItem"></div>
    </div>
      <transition name="detail">
        <div class="listContainer" v-show="height === 74">
         <div class="rowContainer">
           <Icon type="minus" class="decrease" @click.left.native="handleDecrease"></Icon>
           <base-info-card class="card"><div class="delay">{{ delayNum }}</div></base-info-card>
           <Icon type="plus" class="increase" @click.left.native="handleIncrease"></Icon>
          </div>
        </div>
      </transition>
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
    height: {
      type: Number,
    },
    color: {
      type: String,
    },
  },
  computed: {
    heightSize() {
      return `${this.height}px`;
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
  .leftItem {
    letter-spacing: 0.2px;
    margin-top: 1px;
    font-size: 13px;
  }
  .rightItem {
    font-size: 11px;
  }
.itemContainer {
  position: absolute;
  width: 170px;
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
    font-size: 13px;
    height: 37px;
    margin: auto auto auto 17px;
    .textItem {
      letter-spacing: 0.2px;
      margin: auto auto auto 0;
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
