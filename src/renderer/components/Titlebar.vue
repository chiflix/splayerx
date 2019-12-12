<template>
  <div
    :class="['titlebar', { darwin: isDarwin }]"
    @mousemove.stop="handleMousemove"
    @dblclick="handleDbClick"
  >
    <div
      v-if="!isDarwin"
      @dblclick.stop=""
      :style="{
        transform: `translateX(${showSidebar ? '76' : '0'}px)`,
      }"
      class="sidebar"
    >
      <SidebarIcon
        v-fade-in="!isPlayingView || showTitleBar"
        @mouseover.native="mouseoverSidebar = true"
        @mouseout.native="mouseoverSidebar = false"
        :mouseover="mouseoverSidebar"
        :title="!showSidebar ? $t('tips.openSidebar') : $t('tips.closeSidebar')"
        :fill="isBrowsingView ? '#BBBACC' : ''"
        class="sidebar-icon no-drag"
      />
      <transition name="badge">
        <badge v-if="showBadge">
          {{ $t('preferences.privacy.incognitoMode') }}
        </badge>
      </transition>
    </div>
    <div
      v-if="!isDarwin"
      v-fade-in="!isPlayingView || showTitleBar"
      class="win-icons"
    >
      <Icon
        @click.native="handleMinimize"
        class="title-button no-drag"
        type="titleBarWinExitFull"
      />
      <Icon
        v-show="middleButtonStatus === 'maximize' && enableFullScreenButton"
        @click.native="handleWinFull"
        class="title-button no-drag"
        type="titleBarWinFull"
      />
      <Icon
        v-show="middleButtonStatus === 'restore'"
        @click.native="handleRestore"
        class="title-button no-drag"
        type="titleBarWinRestore"
      />
      <Icon
        v-show="middleButtonStatus === 'exit-fullscreen'"
        @click.native="handleFullscreenExit"
        class="title-button no-drag"
        type="titleBarWinResize"
      />
      <Icon
        @mouseup.native="handleClose"
        class="title-button no-drag"
        type="titleBarWinClose"
      />
    </div>
    <div
      v-if="isDarwin"
      v-fade-in="!isPlayingView || showTitleBar"
      @dblclick.stop=""
      class="mac-icons"
    >
      <div
        @mouseover="handleMouseOver"
        @mouseout="handleMouseOut"
        class="system-icons"
      >
        <Icon
          id="close"
          :state="state"
          @mouseup.native="handleClose"
          class="title-button no-drag"
          type="titleBarClose"
        />
        <Icon
          id="minimize"
          :class="{ disabled: middleButtonStatus === 'exit-fullscreen' }"
          :state="state"
          :is-full-screen="middleButtonStatus"
          @mouseup.native="handleMinimize"
          class="title-button no-drag"
          type="titleBarExitFull"
        />
        <Icon
          id="maximize"
          v-show="middleButtonStatus !== 'exit-fullscreen' && enableFullScreenButton"
          :type="itemType"
          :state="state"
          :style="{ transform: isMaxScreen ? 'rotate(45deg)' : ''}"
          @mouseup.native="handleMacFull"
          class="title-button no-drag"
        />
        <Icon
          id="restore"
          v-show="middleButtonStatus === 'exit-fullscreen'"
          :state="state"
          @mouseup.native="handleFullscreenExit"
          class="title-button no-drag"
          type="titleBarRecover"
        />
      </div>
      <SidebarIcon
        v-if="isLandingView || isPlayingView"
        @mouseover.native="mouseoverSidebar = true"
        @mouseout.native="mouseoverSidebar = false"
        :style="{
          marginLeft: showSidebar ? '19px' : '4px',
        }"
        :mouseover="mouseoverSidebar"
        :title="!showSidebar ? $t('tips.openSidebar') : $t('tips.closeSidebar')"
        :fill="isBrowsingView ? '#BBBACC' : ''"
        :is-playing-view="isPlayingView"
        class="sidebar no-drag"
      />
    </div>
    <transition name="badge">
      <badge v-if="isDarwin && showBadge">
        {{ $t('preferences.privacy.incognitoMode') }}
      </badge>
    </transition>
  </div>
</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import Icon from '@/components/BaseIconContainer.vue';
import SidebarIcon from '@/components/LandingView/SidebarIcon.vue';
import Badge from '@/components/LandingView/Badge.vue';
import { Input as inputActions } from '@/store/actionTypes';

export default {
  name: 'Titlebar',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    Icon,
    SidebarIcon,
    Badge,
  },
  props: {
    showAllWidgets: {
      type: Boolean,
      default: true,
    },
    recentPlaylist: Boolean,
    enableFullScreenButton: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      state: 'default',
      itemTypeEnum: {
        FULLSCREEN: 'titleBarFull',
        MAXSCREEN: 'titleBarClose',
      },
      itemType: 'titleBarFull',
      keyAlt: false,
      keyOver: false,
      isShowingVideoCover: false,
      mouseoverSidebar: false,
    };
  },
  computed: {
    ...mapGetters([
      'isMaximized',
      'isFullScreen',
      'showSidebar',
    ]),
    isLandingView() {
      return this.$route.name === 'landing-view';
    },
    isPlayingView() {
      return this.$route.name === 'playing-view';
    },
    isBrowsingView() {
      return this.$route.name === 'browsing-view';
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
    middleButtonStatus() {
      return this.isFullScreen ? 'exit-fullscreen' : this.isMaximized ? 'restore' : 'maximize'; // eslint-disable-line no-nested-ternary
    },
    isMaxScreen() { return this.itemType === this.itemTypeEnum.MAXSCREEN; },
    showBadge() {
      return this.isLandingView && !this.isShowingVideoCover && this.$store.getters.incognitoMode;
    },
    showTitleBar() {
      return this.recentPlaylist || this.showAllWidgets || this.showSidebar;
    },
  },
  watch: {
    keyAlt(val: boolean) {
      if (!val || !this.keyOver) {
        this.itemType = this.itemTypeEnum.FULLSCREEN;
      } else if (!this.isFullScreen) {
        this.itemType = this.itemTypeEnum.MAXSCREEN;
      }
    },
    keyOver(val: boolean) {
      if (!val || !this.keyAlt) {
        this.itemType = this.itemTypeEnum.FULLSCREEN;
      } else if (!this.isFullScreen) {
        this.itemType = this.itemTypeEnum.MAXSCREEN;
      }
    },
  },
  mounted() {
    this.$bus.$on('showing-video-cover', (showing: boolean) => { this.isShowingVideoCover = !!showing; });
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.keyCode === 18) {
        this.keyAlt = true;
      }
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.keyCode === 18) {
        this.keyAlt = false;
      }
    });
  },
  methods: {
    ...mapActions({
      updateMousemove: inputActions.MOUSEMOVE_UPDATE,
    }),
    handleDbClick() {
      const browserWindow = this.$electron.remote.getCurrentWindow();
      if (!browserWindow.isMaximized()) {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
      } else {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'unmaximize');
      }
    },
    handleMousemove(event: MouseEvent) {
      this.$bus.$emit('titlebar-mousemove', event);
    },
    handleMouseOver() {
      this.keyOver = true;
      this.state = 'hover';
    },
    handleMouseOut() {
      this.keyOver = false;
      this.state = 'default';
    },
    // Methods to handle window behavior
    handleMinimize() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'minimize');
    },
    handleWinFull() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
    },
    handleClose() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'close');
    },
    handleRestore() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'unmaximize');
    },
    handleFullscreenExit() {
      this.$bus.$emit('off-fullscreen');
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [false]);
    },
    // OS-specific methods
    handleMacFull() {
      if (this.itemType === this.itemTypeEnum.FULLSCREEN) {
        this.$bus.$emit('to-fullscreen');
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [true]);
      } else if (this.isMaximized) {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'unmaximize');
      } else {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.titlebar {
  width: 100%;
  top: 0;
  right: 0;
  border-radius: 10px;
  height: 36px;
  z-index: 6;
  display: flex;
  justify-content: space-between;
  position: absolute;
  .sidebar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    transition: transform 100ms linear;
    &-icon {
      margin-left: 16px;
      margin-right: 10px;
    }
  }
  .win-icons {
    display: flex;
    flex-wrap: nowrap;
    position: absolute;
    right: 0;
    .title-button {
      width: 45px;
      height: 36px;
      display: flex;
      background-color: rgba(255,255,255,0);
      transition: background-color 200ms;
    }
    .title-button:hover {
      background-color: rgba(221, 221, 221, 0.2);
    }
    .title-button:active {
      background-color: rgba(221, 221, 221, 0.5);
    }
  }
}
.titlebar.darwin {
  z-index: 6;
  height: 36px;
  display: flex;
  position: absolute;
  justify-content: space-between;
  align-items: center;
  .mac-icons {
    display: flex;
    align-items: center;
    margin-left: 12px;
    .system-icons {
      display: flex;
    }
    .sidebar {
      margin-left: 4px;
      transition: margin-left 100ms linear;
    }
  }
  .badge { margin-right: 14px; }
  .title-button {
    width: 12px;
    height: 12px;
    margin-right: 8px;
    background-repeat: no-repeat;
    -webkit-app-region: no-drag;
    border-radius: 100%;
  }
  #minimize {
    &.disabled {
      pointer-events: none;
      opacity: 0.25;
    }
  }
  #maximize {
    &.disabled {
      pointer-events: none;
      opacity: 0.25;
    }
  }
}
.badge {
  &-leave-active {
    transition: opacity .2s ease-in;
  }
  &-enter-active {
    transition: opacity .3s ease-in;
    transition-delay: .2s;
  }

  &-enter, &-leave-to{
    opacity: 0;
  }
}
</style>
