<template>
  <div class="itemContainer">
    <div class="textContainer">
      <div class="textItem">{{ item }}</div>
    </div>
    <div class="listContainer">
      <div class="rowContainer">
        <div class="imgContainer" v-for="(img, index) in imgs">
          <img :src="img.selected ? imgsSelected[index] : img" class="imgType" @mouseover="handleOver(index)" @mouseout="handleOut()"
          @click.left="handleClick($event, index)">
          <div class="hoverShadow" v-show="index === hoverIndex"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BaseInfoCard from '../BaseInfoCard';
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
    handleClick(e, index) {
      this.imgs.forEach((i, ind) => {
        if (ind !== index) {
          this.$set(this.imgs[ind], 'selected', false);
        } else {
          this.$set(this.imgs[ind], 'selected', true);
        }
      });
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
</style>

