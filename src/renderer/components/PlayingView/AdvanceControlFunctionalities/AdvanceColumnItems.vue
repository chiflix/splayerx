<template>
  <div class="itemContainer">
    <div class="textContainer">
      <div class="textItem">{{ item }}</div>
    </div>
    <div class="listContainer"
      :style="{
        overflowY: tracks.length > 2 ? 'scroll' : '',
        height: tracks.length <= 3 ? `${tracks.length * 37}px` : '111px',
      }">
      <div class="columnContainer">
        <div v-for="(track, index) in tracks"
          class="columnNumDetail"
          @mouseover="handleOver(index)"
          @mouseout="handleOut(index)"
          @click="handleClick(index)">
          <div class="text"
            :style="{
              color: index === hoverIndex || track.chosen  ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)',
              transition: 'color 300ms',
            }">{{ `音轨 ${index+1} : ${track[0]}` }}
          </div>
          <div class="card" v-show="track.chosen"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
::-webkit-scrollbar {
  width: 3px;
  height: 42+px;
}
::-webkit-scrollbar-thumb {
  border-radius: 1.2px;
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.15);
}
  .itemContainer {
    position: absolute;
    width: 170px;
    display: flex;
    flex-direction: column;
    border-radius: 7px;
    z-index: 10;
    background-image: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%);
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
      width: 165px;
      .columnContainer {
        display: flex;
        flex-direction: column;
        .columnNumDetail {
          position: relative;
          display: flex;
          width: 136px;
          height: 27px;
          margin: 0 auto 7px 17px;
          .text {
            line-height: 12px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 7.5px;
            margin-left: 10px;
          }
        }
        .card {
          position: absolute;
          z-index: -1;
          width: 136px;
          height: 27px;
          border-radius: 7px;
          opacity: 0.4;
          border: 0.5px solid rgba(255, 255, 255, 0.20);
          background-image: radial-gradient(60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
        }
      }
    }
  }

</style>
