<template>
  <div class="landing-view">
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
    <div class="welcome-container">
      <transition :name="logoTransition">
        <div
          v-if="pageMounted && (!item.backgroundUrl)"
          class="logo-container"
        >
          <Icon type="logo" />
        </div>
      </transition>
    </div>
    <div
      ref="mask"
      class="mask"
    />
    <div
      :style="{
        left: playlistLeft,
        right: playlistRight,
        bottom: winWidth > 1355 ? `${40 / 1355 * winWidth}px` : '40px',
        transition: tranFlag ?
          'left 400ms cubic-bezier(0.42, 0, 0.58, 1)'
          : 'right 400ms cubic-bezier(0.42, 0, 0.58, 1)',
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
            cursor: firstIndex === 0 ? 'pointer' : `${cursorUrl}, pointer`,
            backgroundColor:
              item.backgroundUrl
                ? 'rgba(255,255,255,0.12) ': 'rgba(255,255,255,0.05)',
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
          v-for="({ backgroundUrl, id, playlistLength }, index) in landingViewItems"
          :key="id"
          :cursor-url="cursorUrl"
          :can-hover="canHover"
          :backgroundUrl="backgroundUrl"
          :index="index"
          :is-in-range="
              firstIndex === 0
              ? index + 1 <= lastIndex - (showSidebar ? 1 : 0)
              : index + 1 >= firstIndex + (showSidebar ? 1 : 0)
            "
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
import { mapGetters, mapActions } from 'vuex';
import { join } from 'path';
import { Route } from 'vue-router';
import { filePathToUrl } from '@/helpers/path';
import { playInfoStorageService } from '@/services/storage/PlayInfoStorageService';
import { recentPlayService } from '@/services/media/RecentPlayService';
import Icon from '@/components/BaseIconContainer.vue';
import NotificationBubble from '@/components/NotificationBubble.vue';
import PlaylistItem from '@/components/LandingView/PlaylistItem.vue';
import VideoItem from '@/components/LandingView/VideoItem.vue';
import { log } from '@/libs/Log';
import Sagi from '@/libs/sagi';
import { Browsing as browsingActions } from '@/store/actionTypes';
import { windowRectService } from '../services/window/WindowRectService';

Vue.component('PlaylistItem', PlaylistItem);
Vue.component('VideoItem', VideoItem);

export default {
  name: 'LandingView',
  components: {
    Icon,
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
      pageMounted: false,
      logoTransition: '',
      canHover: false,
      playlistLeft: '0',
      playlistRight: '',
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'winSize', 'winPos', 'defaultDir', 'isFullScreen', 'incognitoMode', 'nsfwProcessDone', 'pipSize', 'pipPos', 'showSidebar']),
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
    cursorUrl() {
      if (this.firstIndex === 0) return `url("${filePathToUrl(join(__static, 'cursor/cursorRight.svg') as string)}")`;
      return `url("${filePathToUrl(join(__static, 'cursor/cursorLeft.svg') as string)}")`;
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
    firstIndex(val: number, oldVal: number) {
      this.shifting = true;
      if (val === 0) {
        this.playlistRight = `-${(this.move(oldVal) - 35) + (this.showSidebar ? 76 : 0)}px`;
        setTimeout(() => {
          this.tranFlag = true;
          this.playlistLeft = '0';
          this.playlistRight = '';
        }, 400);
      } else {
        this.playlistLeft = `-${this.move((this.landingViewItems.length - ((oldVal + this.showItemNum) - 1))) + (this.showSidebar ? 76 : 0)}px`;
        setTimeout(() => {
          this.tranFlag = false;
          this.playlistRight = '35px';
          this.playlistLeft = '';
        }, 400);
      }
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
    showItemNum() {
      if (this.firstIndex !== 0) {
        this.lastIndex = this.landingViewItems.length;
      }
    },
    item: {
      // eslint-disable-next-line
      handler: function (val: { id: string }) {
        this.$bus.$emit('showing-video-cover', val && !!val.id);
      },
      immediate: true,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeRouteEnter(to: Route, { name: from }: Route, next: (vm: any) => void) {
    next((vm: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      vm.logoTransition = from === 'language-setting' ? 'scale' : '';
      vm.pageMounted = true;
      windowRectService.uploadWindowBy(false, 'landing-view', undefined, undefined, vm.winSize, vm.winPos, vm.isFullScreen);
    });
  },
  /* eslint-disable @typescript-eslint/no-explicit-any */
  created() {
    this.createTouchBar();
    window.addEventListener('mousemove', this.globalMoveHandler);
    // Get all data and show
    recentPlayService.getRecords().then((results) => {
      this.landingViewItems = results.filter((result) => {
        if (result.playlistLength) return result.playlistLength > 1;
        return false;
      });
    });
    this.$bus.$on('clean-landingViewItems', () => {
      // just for delete thumbnail display
      this.firstIndex = 0;
      this.item = {};
      this.$bus.$emit('highlight-sidebar', false);
      this.landingViewItems = [];
    });
    // responsible for delete the thumbnail on display which had already deleted in DB
    this.$bus.$on('delete-file', (id: number) => {
      const deleteIndex = this.landingViewItems
        .findIndex((file: { id: number }) => file.id === id);
      if (deleteIndex >= 0) {
        this.item = {};
        this.$bus.$emit('highlight-sidebar', false);
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
  async mounted() {
    this.$store.dispatch('refreshVersion');

    const { app } = this.$electron.remote;
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setResizable', [true]);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [720, 405]);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [720 / 405]);

    Sagi.healthCheck().then((res) => {
      if (process.env.NODE_ENV !== 'production') {
        this.sagiHealthStatus = res.status;
        log.info('LandingView.vue', `launching: ${app.getName()} ${app.getVersion()}`);
      }
    });
    window.addEventListener('keyup', this.keyboardHandler);
    this.$electron.ipcRenderer.on('quit', () => {
      this.quit = true;
    });
  },
  destroyed() {
    window.removeEventListener('mousemove', this.globalMoveHandler);
    window.removeEventListener('keyup', this.keyboardHandler);
  },
  methods: {
    ...mapActions({
      updateInitialUrl: browsingActions.UPDATE_INITIAL_URL,
    }),
    createTouchBar() {
      const { TouchBar } = this.$electron.remote;
      const { TouchBarButton, TouchBarSpacer } = TouchBar;

      this.sidebarButton = new TouchBarButton({
        icon: this.createIcon('touchBar/sidebar.png'),
        click: () => {
          this.$event.emit('side-bar-mouseup');
        },
      });
      this.openFileButton = new TouchBarButton({
        icon: this.createIcon('touchBar/addVideo.png'),
        click: () => {
          this.open();
        },
      });
      this.touchBar = new TouchBar({
        items: [
          this.sidebarButton,
          new TouchBarSpacer({ size: 'large' }),
          this.openFileButton,
        ],
      });
      this.$electron.remote.getCurrentWindow().setTouchBar(this.touchBar);
    },
    move(steps: number) {
      return steps * (this.thumbnailWidth + this.marginRight);
    },
    handleBrowsingOpen(url: string) {
      this.updateInitialUrl(url);
      this.$router.push({
        name: 'browsing-view',
      });
    },
    globalMoveHandler() {
      this.logoTransition = 'welcome-container-transition';
      this.canHover = true;
    },
    keyboardHandler(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        this.shifting = true;
        this.lastIndex = this.landingViewItems.length;
      } else if (e.key === 'ArrowLeft') {
        this.shifting = true;
        this.firstIndex = 0;
      }
    },
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
      this.$bus.$emit('highlight-sidebar', true);
    },
    onItemClick(index: number) {
      if (index === (this.lastIndex - (this.showSidebar ? 1 : 0)) && !this.isFullScreen) {
        this.shifting = true;
        this.lastIndex = this.landingViewItems.length;
      } else if (index + 1 < (this.firstIndex + (this.showSidebar ? 1 : 0)) && !this.isFullScreen) {
        this.shifting = true;
        this.firstIndex = 0;
      } else if (!this.filePathNeedToDelete) {
        this.$store.dispatch('UPDATE_SHOW_SIDEBAR', false);
        this.openPlayList(this.landingViewItems[index].id);
      }
    },
    onItemDelete(index: number) {
      this.item = {};
      this.$bus.$emit('highlight-sidebar', false);
      const [deletedItem] = this.landingViewItems.splice(index, 1);
      if (this.firstIndex !== 0) {
        this.shifting = true;
        this.lastIndex = this.landingViewItems.length;
      }
      playInfoStorageService.deleteRecentPlayedBy(deletedItem.id);
    },
  },
};
</script>

<style lang="scss" scoped>
$themeColor-Light: white;

.landing-view {
  overflow: hidden;
  will-change: width;
  transition-property: width;
  transition-duration: 100ms;
  transition-timing-function: ease-out;
  background-color: #434348;
  position: absolute;
  right: 0;
  height: 100%;
  z-index: 1;
  .mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transition: background-color 120ms linear;
  }
}
.controller {
  position: absolute;
  z-index: 6;
  width: auto;

  .playlist {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-end;

    .button {
      transition: background-color 300ms ease-in;
      transition-delay: 200ms;
      cursor: pointer;
    }

    .button:hover {
      background-color: rgba(123, 123, 123, 0.12);
      transition: background-color 300ms ease-in;
    }

    .btnMask {
      box-sizing: border-box;
      border-radius: 2px;
      width: 100%;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      transition: border 50ms linear;

      &:hover {
        border: 1px solid rgba(255, 255, 255, 0.6);
      }
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
  -webkit-user-select: none;
  text-align: center;
}

main {
  justify-content: space-between;
}


.background-transition {
  &-enter-active, &-leave-active {
    transition: opacity 300ms linear;
  }
  &-enter, &-leave-to {
    opacity: 0;
  }
}

.welcome-container-transition {
  &-enter-active {
    transition: opacity .3s ease-in;
    transition-delay: 50ms;
  }
  &-leave-active {
    transition: opacity 300ms ease-in;
    transition-delay: 100ms;
  }

  &-enter, &-leave-to {
    opacity: 0;
  }
}

.background-container-transition {
  &-enter-active, &-leave-active {
    transition: opacity .3s ease-in;
    transition-delay: .2s;
  }

  &-enter, &-leave-to{
    opacity: 0;
  }
}

.scale {
  &-enter-active {
    transition: all 300ms ease-out;
  }
  &-enter {
    transform: scale(0.9, 0.9);
    opacity: 0;
  }
}

</style>
