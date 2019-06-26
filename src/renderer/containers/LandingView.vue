<template>
  <div class="wrapper">
    <titlebar
      key="playing-view"
      current-view="LandingView"
    />
    <transition name="background-container-transition">
      <div
        v-if="item.backgroundUrl"
        class="background"
      >
        <transition
          name="background-transition"
          mode="in-out"
        >
          <div
            :key="item.path"
            :style="{
              backgroundImage: item.backgroundUrl,
            }"
            class="background-image"
          >
            <div class="background-mask" />
          </div>
        </transition>
        <div class="item-info">
          <div class="item-name">
            {{ item.basename }}
          </div>
          <div class="item-description" />
          <div class="item-timing">
            <span class="timing-played">
              {{ timeInvalidForm(timecodeFromSeconds(item.lastPlayedTime)) }}
              / {{ timeInvalidForm(timecodeFromSeconds(item.duration)) }}
              <span v-if="item.playlistLength > 1">
                ·&nbsp;{{
                  $t('recentPlaylist.playlistSource')
                }}&nbsp;&nbsp;{{ item.playedIndex + 1 }} / {{ item.playlistLength }}
              </span>
            </span>
          </div>
          <div class="item-progress">
            <div
              :style="{ width: item.percentage + '%' }"
              class="progress-played"
            />
          </div>
        </div>
      </div>
    </transition>
    <transition name="welcome-container-transition">
      <div
        v-if="!item.backgroundUrl"
        class="welcome-container"
      >
        <div class="logo-container">
          <Icon type="logo" />
        </div>
      </div>
    </transition>
    <div
      ref="mask"
      class="mask"
    />
    <div
      :style="{
        transform: isFullScreen ? '' : `translateX(${move}px)`,
        bottom: winWidth > 1355 ? `${40 / 1355 * winWidth}px` : '40px',
        transition: tranFlag ? 'transform 400ms cubic-bezier(0.42, 0, 0.58, 1)' : '',
      }"
      class="controller"
    >
      <div
        :style="{marginLeft: winWidth > 1355 ? `${50 / 1355 * winWidth}px` : '50px'}"
        class="playlist no-drag"
      >
        <div
          :style="{
            height:`${thumbnailHeight}px`,
            width:`${thumbnailWidth}px`,
            marginRight: `${marginRight}px`,
          }"
          @click="openOrMove"
          class="button"
        >
          <div class="btnMask">
            <Icon
              class="addUi"
              type="add"
            />
          </div>
        </div>
        <!-- eslint-disable-next-line vue/require-component-is -->
        <component
          :is="playlistLength > 1 ? 'PlaylistItem' : 'VideoItem'"
          v-for="({ backgroundUrl, path, playlistLength }, index) in landingViewItems"
          :key="path"
          :backgroundUrl="backgroundUrl"
          :index="index"
          :is-in-range="index + 1 >= firstIndex && index + 1 <= lastIndex"
          :thumbnail-width="thumbnailWidth"
          :thumbnail-height="thumbnailHeight"
          :shifting="shifting"
          :style="{
            marginRight: `${marginRight}px`,
          }"
          :on-item-mouseover="onItemMouseover"
          :on-item-click="onItemClick"
          :on-item-delete="onItemDelete"
        />
      </div>
    </div>
    <NotificationBubble />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { HealthCheckResponse } from 'sagi-api/health/v1/health_pb';
import { playInfoStorageService } from '@/services/storage/PlayInfoStorageService';
import { recentPlayService } from '@/services/media/RecentPlayService';
import Icon from '@/components/BaseIconContainer.vue';
import Titlebar from '@/components/Titlebar.vue';
import NotificationBubble from '@/components/NotificationBubble.vue';
import PlaylistItem from '@/components/LandingView/PlaylistItem.vue';
import VideoItem from '@/components/LandingView/VideoItem.vue';
import { log } from '@/libs/Log';
import { getValidVideoRegex } from '../../shared/utils';

Vue.component('PlaylistItem', PlaylistItem);
Vue.component('VideoItem', VideoItem);

export default {
  name: 'LandingView',
  components: {
    Icon,
    Titlebar,
    NotificationBubble,
  },
  data() {
    return {
      landingViewItems: [],
      sagiHealthStatus: 'UNSET',
      invalidTimeRepresentation: '--',
      item: {},
      tranFlag: true,
      shifting: false,
      firstIndex: 0,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'defaultDir', 'isFullScreen']),
    lastIndex: {
      get() {
        return (this.firstIndex + this.showItemNum) - 1;
      },
      set(val: number) {
        if (val < this.showItemNum - 1) {
          this.firstIndex = 0;
        } else {
          this.firstIndex = (val - this.showItemNum) + 1;
        }
      },
    },
    move() {
      return -(this.firstIndex * (this.thumbnailWidth + this.marginRight));
    },
    marginRight() {
      return this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
    },
    thumbnailWidth() {
      let width = 0;
      const A = 50; // playlist left margin
      const B = 15; // space between each playlist item
      const C = 50; // the space between last playlist item and right edge of the screen
      if (this.winWidth > 512 && this.winWidth <= 1355) {
        width = ((((this.winWidth - A) - C) + B) / this.showItemNum) - B;
      } else if (this.winWidth > 1355) {
        width = this.winWidth * (112 / 1355);
      }
      return Math.round(width);
    },
    thumbnailHeight() {
      return Math.round((this.thumbnailWidth * 63) / 112);
    },
    showItemNum() {
      let number;
      if (this.winWidth < 720) {
        number = 5;
      } else if (this.winWidth >= 720 && this.winWidth <= 1355) {
        number = Math.floor(((this.winWidth - 720) / (112 + 15)) + 5);
      } else if (this.winWidth > 1355) {
        number = 10;
      }
      return number;
    },
  },
  watch: {
    firstIndex() {
      this.shifting = true;
    },
    lastIndex() {
      this.shifting = true;
    },
    shifting(val: boolean) {
      if (val) {
        setTimeout(() => {
          this.shifting = false;
        }, 400);
      }
    },
  },
  created() {
    // Get all data and show
    if (!this.$store.getters.deleteVideoHistoryOnExit) {
      recentPlayService.getRecords().then((results) => {
        this.landingViewItems = results;
      });
    } else {
      this.infoDB.clearAll();
    }
    this.$bus.$on('clean-landingViewItems', () => {
      // just for delete thumbnail display
      this.firstIndex = 0;
      this.item = {};
      this.landingViewItems = [];
    });
    // responsible for delete the thumbnail on display which had already deleted in DB
    this.$bus.$on('delete-file', (id: number) => {
      const deleteIndex = this.landingViewItems
        .findIndex((file: { id: number }) => file.id === id);
      if (deleteIndex >= 0) {
        this.item = {};
        this.landingViewItems.splice(deleteIndex, 1);
      }
    });
    this.$bus.$on('drag-over', () => {
      if (this.$refs.mask) this.$refs.mask.style.setProperty('background-color', 'rgba(255, 255, 255, 0.18)');
    });
    this.$bus.$on('drag-leave', () => {
      if (this.$refs.mask) this.$refs.mask.style.setProperty('background-color', 'rgba(255, 255, 255, 0)');
    });
    this.$bus.$on('drop', () => {
      if (this.$refs.mask) this.$refs.mask.style.setProperty('background-color', 'rgba(255, 255, 255, 0)');
    });
  },
  mounted() {
    console.log(getValidVideoRegex().test('/Users/tanyang/Desktop/movies'));
    this.$store.dispatch('refreshVersion');

    const { app } = this.$electron.remote;
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setResizable', [true]);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [720, 405]);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [720 / 405]);

    // TODO: error handling
    this.sagi.healthCheck().then(({ status }: HealthCheckResponse.AsObject) => {
      if (process.env.NODE_ENV !== 'production') {
        this.sagiHealthStatus = status;
        log.info('LandingView.vue', `launching: ${app.getName()} ${app.getVersion()}`);
        log.info('LandingView.vue', `sagi API Status: ${this.sagiHealthStatus}`);
      }
    });
    window.onkeyup = (e) => {
      if (e.keyCode === 39) {
        this.shifting = true;
        this.tranFlag = true;
        this.lastIndex = this.landingViewItems.length;
      } else if (e.keyCode === 37) {
        this.shifting = true;
        this.tranFlag = true;
        this.firstIndex = 0;
      }
    };
  },
  methods: {
    open() {
      const { app } = this.$electron.remote;
      if (this.defaultDir) {
        this.openFilesByDialog();
      } else {
        const defaultPath = process.platform === 'darwin' ? app.getPath('home') : app.getPath('desktop');
        this.$store.dispatch('UPDATE_DEFAULT_DIR', defaultPath);
        this.openFilesByDialog({ defaultPath });
      }
    },
    openOrMove() {
      if (this.firstIndex === 1) {
        this.tranFlag = true;
        this.firstIndex = 0;
      } else if (this.winWidth > 1355) {
        this.open();
      } else {
        this.open();
      }
    },
    timeInvalidForm(time: number) {
      return (Number.isNaN(time) ? this.invalidTimeRepresentation : time);
    },
    onItemMouseover(index: number) {
      this.item = this.landingViewItems[index];
    },
    onItemClick(index: number) {
      if (index === this.lastIndex && !this.isFullScreen) {
        this.lastIndex = this.landingViewItems.length;
      } else if (index + 1 < this.firstIndex && !this.isFullScreen) {
        this.firstIndex = 0;
      } else if (!this.filePathNeedToDelete) {
        this.openPlayList(this.landingViewItems[index].id);
      }
    },
    onItemDelete(index: number) {
      this.item = {};
      this.landingViewItems.splice(index, 1);
      if (this.firstIndex !== 0) this.lastIndex = this.landingViewItems.length;
      playInfoStorageService.deleteRecentPlayedBy(this.landingViewItems[index].id);
    },
  },
};
</script>

<style lang="scss" scoped>

$themeColor-Light: white;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.wrapper {
  background-image: linear-gradient(-28deg, #414141 0%, #545454 47%, #7B7B7B 100%);
  height: 100vh;
  width: 100vw;
  z-index: -1;
  .mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url(../assets/noise-bg.png);
    background-repeat: repeat;
    transition: background-color 120ms linear;
  }
}
.controller {
  position: absolute;
  z-index: 6;
  left: 0;
  width: auto;

  .playlist {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-end;

    .button {
      background-color: rgba(0, 0, 0, 0.12);
      transition: background-color 150ms ease-out;
      backdrop-filter: blur(9.8px);
      cursor: pointer;
    }

    .button:hover {
      background-color: rgba(123, 123, 123, 0.12);
      transition: background-color 150ms ease-out;
    }

    .btnMask {
      border-radius: 2px;
      width: 100%;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
    }

    .btnMask:hover {
      border: 1px solid rgba(255, 255, 255, 0.6);
    }

    .addUi {
      margin: auto;
    }
  }
}
.background {
  position: absolute;
  width: 100%;
  height: 100%;

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    -webkit-user-drag: none;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;

    .background-mask {
      width: 100%;
      height: 100%;
      background-image: radial-gradient(
        circle 80.5vw at 27.8vw 32.1vh,
        rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.41) 45%, rgba(0,0,0,0.7) 100%
      );
    }
  }
  .item-info {
    position: relative;
    top: 100px;
    left: 45px;
    z-index: 4;
    @media screen and (min-width: 1355px) {
      top: 7.38vw;
      left: 3.32vw;
    }
  }
  .item-name {
    color: $themeColor-Light;
    width: 70%;
    word-break: break-all;
    font-size: 30px;
    line-height: 36px;
    font-weight: bold;
    z-index: 4;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: 600;
    letter-spacing: 1px;
    @media screen and (min-width: 1355px) {
      font-size: 2.21vw;
      line-height: 2.66vw;
    }
  }
  .item-description {
    opacity: 0.4;
    font-size: 14px;
    font-weight: lighter;
    @media screen and (min-width: 1355px) {
      font-size: 1.03vw;
    }
  }
  .item-timing {
    color: rgba(255, 255, 255, .4);
    font-size: 15px;
    font-family: $font-heavy;
    letter-spacing: .5px;
    line-height: 20px;
    margin-top: 10px;
    span.timing-played {
      color: rgba(255, 255, 255, .9);
    }
    @media screen and (min-width: 1355px) {
      font-size: 1.10vw;
    }
  }
  .item-progress {
    width: 100px;
    height: 4px;
    margin-top: 9px;
    border-radius: 1px;
    background-color: rgba(255, 255, 255, 0.2);
    overflow: hidden;
    .progress-played {
      height: 100%;
      background-color: #fff;
      opacity: 0.7;
    }
    @media screen and (min-width: 1355px) {
      width: 7.38vw;
      height: 0.3vw;
      margin-top: 0.66vw;
    }
  }
}
.welcome-container {
  --client-height: 100vh;
  --pos-y: calc(var(--client-height) * 0.37 - 46px);
  transform: translateY(var(--pos-y));
}
.logo-container {
  -webkit-user-select: none;
  text-align: center;
}

main {
  justify-content: space-between;
}


.background-transition-enter-active, .background-transition-leave-active {
  transition: opacity 300ms linear;
}
.background-transition-enter, .background-transition-leave-to {
  opacity: 0;
}
.background-transition-enter-to, .background-transition-leave {
  opacity: 1;
}

.welcome-container-transition-enter-active, .welcome-container-transition-leave-active{
  transition: opacity .3s ease-in;
  transition-delay: .2s;
}

.welcome-container-transition-enter, .welcome-container-transition-leave-to {
  opacity: 0;
}

.background-container-transition-enter-active, .background-container-transition-leave-active{
  transition: opacity .3s ease-in;
  transition-delay: .2s;
}

.background-container-transition-enter, .background-container-transition-leave-to{
  opacity: 0;
}

</style>
