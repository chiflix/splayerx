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
          transition: 'color 300ms',
        }">
        <div class="textItem">{{ item }}</div>
        <div class="rightItem" v-show="height === 37"><img :src="ChosenColor"></div>
      </div>
      <transition name="detail">
        <div class="listContainer" v-show="height === 74">
          <div class="rowContainer">
            <div class="imgContainer" v-for="(img, index) in imgs">
              <img :src="img.selected ? imgsSelected[index] : img" class="imgType"
                @mouseover="handleOver(index)"
                @mouseout="handleOut"
                @click.left="handleClick($event, index)">
                  <div class="hoverShadow" v-show="index === hoverIndex"></div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import style0 from '../../../assets/subtitle-style1-normal.png';
import style1 from '../../../assets/subtitle-style2-normal.png';
import style2 from '../../../assets/subtitle-style3-normal.png';
import style3 from '../../../assets/subtitle-style4-normal.png';
import style4 from '../../../assets/subtitle-style5-normal.png';
import styleSelected0 from '../../../assets/subtitle-style1-selected.png';
import styleSelected1 from '../../../assets/subtitle-style2-selected.png';
import styleSelected2 from '../../../assets/subtitle-style3-selected.png';
import styleSelected3 from '../../../assets/subtitle-style4-selected.png';
import styleSelected4 from '../../../assets/subtitle-style5-selected.png';
export default {
  name: 'AdvanceColorItems',
  data() {
    return {
      hoverIndex: -1,
      imgs: [[style0], [style1], [style2], [style3], [style4]],
      imgsSelected: [styleSelected0, styleSelected1, styleSelected2,
        styleSelected3, styleSelected4],
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
    subStyle() {
      return this.$store.getters.curStyle;
    },
    ChosenColor() {
      switch (this.subStyle.color) {
        case 'white':
          return style0;
        case 'gray':
          return style1;
        case 'yellow':
          return style2;
        case 'blue':
          return style3;
        case 'black':
          return style4;
        default:
          return style0;
      }
    },
  },
  mounted() {
    this.$set(this.imgs[0], 'selected', true);
  },
  methods: {
    handleOver(index) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(e, index) {
      this.imgs.forEach((i, ind) => {
        if (ind !== index) {
          this.$set(this.imgs[ind], 'selected', false);
        } else {
          this.$set(this.imgs[ind], 'selected', true);
        }
      });
      switch (index) {
        case 0:
          this.$store.dispatch('updateColor', 'white');
          this.$bus.$emit('sub-style-change', { color: 'white' });
          break;
        case 1:
          this.$store.dispatch('updateColor', 'gray');
          this.$bus.$emit('sub-style-change', { color: 'gray' });
          break;
        case 2:
          this.$store.dispatch('updateColor', 'yellow');
          this.$bus.$emit('sub-style-change', { color: 'yellow' });
          break;
        case 3:
          this.$store.dispatch('updateColor', 'blue');
          this.$bus.$emit('sub-style-change', { color: 'blue' });
          break;
        case 4:
          this.$store.dispatch('updateColor', 'black');
          this.$bus.$emit('sub-style-change', { color: 'black' });
          break;
        default:
          break;
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
    display: flex;
    flex: 1;
    height: 37px;
    width: 136px;
    font-size: 13px;
    margin: auto auto auto 17px;
    color: rgba(255, 255, 255, 0.6);
    .textItem {
      letter-spacing: 0.2px;
      margin: auto auto auto 0;
    }
    .rightItem {
      height: 17px;
      width: 17px;
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
      .imgContainer {
        width: 17px;
        height: 17px;
        margin-top: 5.5px;
      }
      .imgType {
        width: 100%;
        height: 100%;
        margin-right: 7px;
      }
      .hoverShadow {
        position: relative;
        width: 7px;
        height: 7px;
        left: 30%;
        bottom: 9px;
        background-color: rgba(0, 0, 0, 1);
        border-radius: 3.5px;
        filter: blur(5px);
        z-index: -1;
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

