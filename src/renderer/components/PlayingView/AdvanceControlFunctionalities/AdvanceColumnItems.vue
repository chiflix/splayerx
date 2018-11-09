<template>
  <div class="itemContainer">
    <div class="textContainer">
      <div class="textItem">{{ item }}</div>
    </div>
    <div class="listContainer"
      :style="{
        height: tracks.length <= 3 ? `${tracks.length * 27 + (tracks.length - 1) * 5 + 14}px` : '105px',
      }">
      <div class="scrollScope"
        :style="{
          width: '165px',
          overflowY: tracks.length > 2 ? 'scroll' : '',
          height: tracks.length <= 3 ? `${tracks.length * 27 + (tracks.length - 1) * 5 + 5}px` : '96px',
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
          </div>
          <div class="card"
            :style="{
              marginTop: `${moveLength-tracks.length * 32}px`,
              transition: 'all 200ms cubic-bezier(0.17, 0.67, 0.17, 0.98'
            }"></div>
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
      moveLength: 0,
    };
  },
  props: {
    item: {
      type: String,
    },
  },
  computed: {
    tracks() {
      return this.$store.getters.AudioTrackList;
    },
  },
  mounted() {
    this.$set(this.tracks[0], 'chosen', true);
  },
  methods: {
    handleOver(index) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(index) {
      this.moveLength = index * 32;
      this.tracks.forEach((i, ind) => {
        if (ind !== index) {
          this.$set(this.tracks[ind], 'chosen', false);
        } else {
          this.$set(this.tracks[ind], 'chosen', true);
          // this.$emit('updateAudioTrack', index);
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
::-webkit-scrollbar {
  width: 2px;
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
    width: 170px;
    .columnContainer {
      display: flex;
      flex-direction: column;
      .columnNumDetail {
        position: relative;
        display: flex;
        width: 136px;
        height: 27px;
        margin: 0 auto 5px 17px;
        .text {
          line-height: 11px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin: auto auto auto 10px;
        }
      }
      .card {
        z-index: -1;
        width: 135px;
        height: 26px;
        margin-left: 17px;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        background-image: radial-gradient(60% 134%, rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
      }
    }
  }
}
</style>
