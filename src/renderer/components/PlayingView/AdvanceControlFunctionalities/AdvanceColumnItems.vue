<template>
  <div class="itemContainer advance-column-items">
    <div
      class="textContainer advanceNormalTitle"
      :style="{
        cursor: 'default',
      }"
    >
      <div class="textItem">
        {{ item }}
      </div>
    </div>
    <div
      class="listContainer"
      :style="{
        height: heightSize,
      }"
    >
      <div
        class="scrollScope"
        :style="{
          overflowY: tracks.length > 2 ? 'scroll' : '',
          height: scopeHeight,
        }"
      >
        <div class="columnContainer">
          <div
            v-for="(track, index) in tracks"
            :key="track.id"
            class="columnNumDetail"
            :style="{ cursor: track.enabled ? 'default' : 'pointer' }"
            @mouseover="handleOver(index)"
            @mouseout="handleOut(index)"
            @click="handleClick(index)"
          >
            <div
              class="text advanceNormalItem"
              :style="{
                color: index === hoverIndex || track.enabled ?
                  'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                transition: 'color 300ms',
              }"
            >
              {{ track.language === 'und' || track.language === '' ?
                `${$t('advance.track')} ${index + 1}`
                : tracks.length === 1 ? `${$t('advance.track')} ${index + 1} : ${track.language}` :
                  `${$t('advance.track')} ${index + 1} : ${track.name}` }}
            </div>
          </div>
          <div
            class="card"
            :style="{
              marginTop: cardPos,
              transition: 'all 200ms cubic-bezier(0.17, 0.67, 0.17, 0.98)'
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { Video as videoActions } from '@/store/actionTypes';

export default {
  name: 'AdvanceColumnItems',
  props: {
    item: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    isChosen: Boolean,
  },
  data() {
    return {
      hoverIndex: -1,
      moveLength: 0,
    };
  },
  computed: {
    ...mapGetters(['audioTrackList', 'currentAudioTrackId']),
    cardPos() {
      return `${this.initialSize(this.moveLength - (this.tracks.length * 32))}px`;
    },
    heightSize() {
      return this.tracks.length <= 2 ?
        `${this.initialSize(41 + (32 * (this.tracks.length - 1)))}px` :
        `${this.initialSize(105)}px`;
    },
    scopeHeight() {
      return this.tracks.length <= 2 ?
        `${this.initialSize(32 * this.tracks.length)}px` : `${this.initialSize(96)}px`;
    },
    tracks() {
      return this.$store.getters.audioTrackList;
    },
  },
  watch: {
    audioTrackList(val) {
      val.forEach((item, index) => {
        if (item.id === this.currentAudioTrackId) {
          this.moveLength = index * 32;
        }
      });
    },
  },
  mounted() {
    this.$bus.$on('switch-audio-track', (index) => {
      this.handleClick(index);
    });
  },
  methods: {
    initialSize(size) {
      if (this.size >= 289 && this.size <= 480) {
        return size;
      } else if (this.size >= 481 && this.size < 1080) {
        return size * 1.2;
      }
      return size * 1.2 * 1.4;
    },
    handleOver(index) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(index) {
      this.moveLength = index * 32;
      this.$store.dispatch(videoActions.SWITCH_AUDIO_TRACK, this.tracks[index]);
    },
  },
};
</script>

<style lang="scss" scoped>
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .itemContainer {
    width: 100%;
    .textContainer {
      width: 100%;
      height: 37px;
      .textItem {
        margin: auto auto auto 17px;
      }
    }
    .listContainer {
      height: 37px;
      .scrollScope {
        width: 97%;
        .columnNumDetail {
          width: 100%;
          height: 27px;
          margin: 0 auto 5px auto;
          .text {
            margin: auto auto auto 27px;
          }
        }
        .card {
          width: 82%;
          height: 27px;
          margin-left: 17px;
        }
      }
    }
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .itemContainer {
    width: 100%;
    .textContainer {
      width: 100%;
      height: 44.4px;
      .textItem {
        margin: auto auto auto 20.4px;
      }
    }
    .listContainer {
      height: 44.4px;
      .scrollScope {
        width: 97%;
        .columnNumDetail {
          width: 100%;
          height: 32.4px;
          margin: 0 auto 6px auto;
          .text {
            margin: auto auto auto 32.4px;
          }
        }
        .card {
          width: 82%;
          height: 32.4px;
          margin-left: 20.4px;
        }
      }
    }
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .itemContainer {
    width: 100%;
    .textContainer {
      width: 100%;
      height: 62.16px;
      .textItem {
        margin: auto auto auto 28.56px;
      }
    }
    .listContainer {
      height: 62.16px;
      .scrollScope {
        width: 97%;
        .columnNumDetail {
          width: 100%;
          height: 45.36px;
          margin: 0 auto 8.4px auto;
          .text {
            margin: auto auto auto 45.36px;
          }
        }
        .card {
          width: 82%;
          height: 45.36px;
          margin-left: 28.56px;
        }
      }
    }
  }
}
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
  display: flex;
  flex-direction: column;
  border-radius: 7px;
  z-index: 10;
  background-image: linear-gradient(90deg, rgba(255,255,255,0.03) 0%,
    rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%);
  clip-path: inset(0 round 8px);
  .textContainer {
    display: flex;
    color: rgba(255, 255, 255, 0.6);
    .textItem {
      letter-spacing: 0.2px;
    }
  }
  .listContainer {
    cursor: default;
    .columnContainer {
      display: flex;
      flex-direction: column;
      .columnNumDetail {
        position: relative;
        display: flex;
        .text {
          text-shadow: 0px 1px 1px rgba(0, 0, 0, .1);
        }
      }
      .card {
        z-index: -1;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        box-shadow: 0px 1px 2px rgba(0, 0, 0, .2);
        background-image: radial-gradient(60% 134%,
          rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
      }
    }
  }
}
</style>
