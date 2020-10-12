<template>
  <div
    :style="{
      backgroundImage: !isChosen ? '' :
        'linear-gradient(90deg, rgba(255,255,255,0.03) ' +
        '0%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.03) 100%)',
    }"
    @mouseenter="handleAudioMouseenter"
    @mouseleave="handleAudioMouseleave"
    class="itemContainer advance-column-items"
  >
    <div
      :style="{
        backgroundImage: !isChosen && hoveredText ?
          'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.045) 20%, ' +
          'rgba(255,255,255,0.00) 78%, rgba(255,255,255,0.00) 100%)' : '',
        transition: 'opacity 200ms',
      }"
      class="detail"
    >
      <div
        :style="{
          cursor: isChosen ? 'default' : 'pointer',
          color: !isChosen && hoveredText ?
            'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          transition: 'color 300ms',
        }"
        class="textContainer"
      >
        <p>{{ $t('advance.changeTrack') }}</p>
        <div
          v-show="!isChosen"
          class="rightTrackItem"
        >
          {{ currentTrackName }}
        </div>
      </div>
      <div
        v-show="isChosen"
        :style="{
          height: heightSize,
        }"
        class="listContainer"
      >
        <div
          :style="{
            overflowY: tracks.length > 2 ? 'scroll' : '',
            height: scopeHeight,
          }"
          class="scrollScope"
        >
          <div class="columnContainer">
            <div
              v-for="(track, index) in tracks"
              :key="track.id"
              :style="{ cursor: track.enabled ? 'default' : 'pointer' }"
              @mouseover="handleOver(index)"
              @mouseout="handleOut(index)"
              @click="handleClick(index)"
              class="columnNumDetail"
            >
              <p
                :style="{
                  color: index === hoverIndex || track.enabled ?
                    'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                  transition: 'color 300ms',
                }"
              >
                {{ track.language === 'und' || track.language === '' ?
                  `${$t('advance.track')} ${index + 1}`
                  : tracks.length === 1 ? `${$t('advance.track')} ${index + 1} : ${track.language}`
                    : `${$t('advance.track')} ${index + 1} : ${track.name}` }}
              </p>
            </div>
            <div
              :style="{
                marginTop: cardPos,
                transition: 'all 200ms cubic-bezier(0.17, 0.67, 0.17, 0.98)'
              }"
              class="card"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">

export default {
  name: 'AdvanceColumnItems',
  props: {
    size: {
      type: Number,
      required: true,
    },
    isChosen: Boolean,
    currentTrackName: {
      type: String,
      required: true,
    },
    currentTrackId: {
      type: Number,
      required: true,
    },
    tracks: {
      type: Array,
      required: true,
    },
    switchAudioTrack: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      hoverIndex: -1,
      moveLength: 0,
      hoveredText: false,
    };
  },
  computed: {
    cardPos() {
      return `${this.initialSize(this.moveLength - (this.tracks.length * 32))}px`;
    },
    heightSize() {
      return this.tracks.length <= 2
        ? `${this.initialSize(41 + (32 * (this.tracks.length - 1)))}px`
        : `${this.initialSize(105)}px`;
    },
    scopeHeight() {
      return this.tracks.length <= 2
        ? `${this.initialSize(32 * this.tracks.length)}px` : `${this.initialSize(96)}px`;
    },
  },
  watch: {
    tracks(val: {id: string, kind: string, label: string,
      language: string, name: string, enabled: boolean, }[]) {
      val.forEach((item: { id: string, kind: string, label: string,
        language: string, name: string, enabled: boolean, }, index: number) => {
        if (Number(item.id) === this.currentTrackId) {
          this.moveLength = index * 32;
        }
      });
    },
  },
  methods: {
    handleAudioMouseenter() {
      this.hoveredText = true;
    },
    handleAudioMouseleave() {
      this.hoveredText = false;
    },
    initialSize(size: number) {
      if (this.size >= 289 && this.size <= 480) {
        return size;
      }
      if (this.size >= 481 && this.size < 1080) {
        return size * 1.2;
      }
      return size * 1.2 * 1.4;
    },
    handleOver(index: number) {
      this.hoverIndex = index;
    },
    handleOut() {
      this.hoverIndex = -1;
    },
    handleClick(index: number) {
      this.moveLength = index * 32;
      this.switchAudioTrack(this.tracks[index]);
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
      p {
        margin: auto auto auto 17px;
        font-size: 13px;
      }
      .rightTrackItem {
        margin: auto 17px auto auto;
        font-size: 11px;
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
          p {
            margin: auto auto auto 27px;
            font-size: 11px;
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
      p {
        margin: auto auto auto 20.4px;
        font-size: 15.6px;
      }
      .rightTrackItem {
        margin: auto 20.4px auto auto;
        font-size: 13.2px;
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
          p {
            margin: auto auto auto 32.4px;
            font-size: 13.2px;
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
      p {
        margin: auto auto auto 28.56px;
        font-size: 21.84px;
      }
      .rightTrackItem {
        margin: auto 28.48px auto auto;
        font-size: 18.48px;
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
          p {
            margin: auto auto auto 45.36px;
            font-size: 18.48px;
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
  display: flex;
  flex-direction: column;
  border-radius: 7px;
  z-index: 10;
  .textContainer {
    display: flex;
    color: rgba(255, 255, 255, 0.6);
    p {
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
        p {
          text-shadow: 0 1px 1px rgba(0, 0, 0, .1);
        }
      }
      .card {
        z-index: -1;
        border-radius: 7px;
        opacity: 0.4;
        border: 0.5px solid rgba(255, 255, 255, 0.20);
        box-shadow: 0 1px 2px rgba(0, 0, 0, .2);
        background-image: radial-gradient(60% 134%,
          rgba(255, 255, 255, 0.09) 44%, rgba(255, 255, 255, 0.05) 100%);
      }
    }
  }
}
</style>
