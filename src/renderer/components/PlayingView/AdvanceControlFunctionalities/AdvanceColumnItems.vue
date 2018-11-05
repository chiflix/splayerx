<template>
  <div class="itemContainer">
    <div class="textContainer">
      <div class="textItem">{{ item }}</div>
    </div>
    <div class="listContainer">
      <div class="columnContainer">
        <div v-for="(track, index) in tracks"
             class="columnNumDetail"
             @mouseover="handleOver(index)"
             @mouseout="handleOut(index)"
             @click="handleClick(index)">
          <div class="text"
               :style="{
              color: index === hoverIndex || track.chosen === true ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)',
          }">{{ `音轨 ${index+1} : ${track[0]}` }}</div>
          <base-info-card class="card" v-show="index === hoverIndex"></base-info-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BaseInfoCard from '../BaseInfoCard';
export default {
  name: 'AdvanceColumnItems',
  data() {
    return {
      hoverIndex: -1,
    };
  },
  props: {
    item: {
      type: String,
    },
  },
  computed: {
    tracks() {
      return this.$store.getters.track;
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
      this.tracks.forEach((i, ind) => {
        if (ind !== index) {
          this.$set(this.tracks[ind], 'chosen', false);
        } else {
          this.$set(this.tracks[ind], 'chosen', true);
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
    height: 148px;
    display: flex;
    flex-direction: column;
    border-radius: 7px;
    z-index: 10;
    backdrop-filter: blur(8px);
    background-color: rgba(255, 255, 255, 0.12);
    clip-path: inset(0 round 8px);
    .textContainer {
      display: flex;
      height: 37px;
      font-size: 13px;
      margin: auto auto auto 17px;
      color: rgba(255, 255, 255, 0.6);
      .textItem {
        letter-spacing: 0.2px;
        margin: auto;
      }
    }
    .listContainer {
      width: 170px;
      height: 111px;
      overflow-y: scroll;
      .columnContainer {
        display: flex;
        flex-direction: column;
        .columnNumDetail {
          position: relative;
          display: flex;
          width: 136px;
          height: 27px;
          margin: 0 auto 7px auto;
          .text {
            line-height: 12px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 7.5px;
            margin-left: 10px;
          }
        }
        .card {
          z-index: -1;
          width: 136px;
          height: 27px;
        }
      }
    }
  }

</style>
