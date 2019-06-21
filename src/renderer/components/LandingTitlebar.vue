<template>
  <div
    :data-component-name="$options.name"
    :class="isDarwin ? 'darwin-titlebar' : 'titlebar'"
  >
    <div
      v-if="!isDarwin"
      v-fade-in="showTitleBar"
      class="win-icons"
    >
      <Icon
        @mouseup.native="handleMinimize"
        class="title-button no-drag"
        type="titleBarWinExitFull"
      />
      <Icon
        @mouseup.native="handleWinFull"
        v-show="middleButtonStatus === 'maximize'"
        class="title-button no-drag"
        type="titleBarWinFull"
      />
      <Icon
        @mouseup.native="handleRestore"
        v-show="middleButtonStatus === 'restore'"
        class="title-button no-drag"
        type="titleBarWinRestore"
      />
      <Icon
        @mouseup.native="handleFullscreenExit"
        v-show="middleButtonStatus === 'exit-fullscreen'"
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
      v-fade-in="showTitleBar"
      @mouseover="handleMouseOver"
      @mouseout="handleMouseOut"
      class="mac-icons"
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
        @mouseup.native="handleMinimize"
        :class="{ disabled: middleButtonStatus === 'exit-fullscreen' }"
        :state="state"
        :isFullScreen="middleButtonStatus"
        class="title-button no-drag"
        type="titleBarExitFull"
      />
      <Icon
        id="maximize"
        :type="itemType"
        @mouseup.native="handleMacFull"
        v-show="middleButtonStatus !== 'exit-fullscreen'"
        :state="state"
        :style="{ transform: itemType === this.itemTypeEnum.MAXSCREEN ? 'rotate(45deg)' : ''}"
        class="title-button no-drag"
      />
      <Icon
        id="restore"
        @mouseup.native="handleFullscreenExit"
        v-show="middleButtonStatus === 'exit-fullscreen'"
        :state="state"
        class="title-button no-drag"
        type="titleBarRecover"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Icon from './BaseIconContainer.vue';

export default {
  name: 'LandingTitlebar',
  components: {
    Icon,
  },
  props: {
    currentView: String,
    showAllWidgets: {
      type: Boolean,
      default: true,
    },
    recentPlaylist: Boolean,
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
      showTitleBar: true,
    };
  },
  watch: {
    recentPlaylist(val) {
      if (!val) this.showTitleBar = this.showAllWidgets;
    },
    showAllWidgets(val) {
      this.showTitleBar = this.recentPlaylist || val;
    },
    keyAlt(val) {
      if (!val || !this.keyOver) {
        this.itemType = this.itemTypeEnum.FULLSCREEN;
      } else if (!this.isFullScreen) {
        this.itemType = this.itemTypeEnum.MAXSCREEN;
      }
    },
    keyOver(val) {
      if (!val || !this.keyAlt) {
        this.itemType = this.itemTypeEnum.FULLSCREEN;
      } else if (!this.isFullScreen) {
        this.itemType = this.itemTypeEnum.MAXSCREEN;
      }
    },
  },
  mounted() {
    window.addEventListener('keydown', (e) => {
      if (e.keyCode === 18) {
        this.keyAlt = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.keyCode === 18) {
        this.keyAlt = false;
      }
    });
  },
  methods: {
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
  computed: {
    ...mapGetters([
      'isMaximized',
      'isFullScreen',
    ]),
    isDarwin() {
      return process.platform === 'darwin';
    },
    middleButtonStatus() {
      return this.isFullScreen ? 'exit-fullscreen' : this.isMaximized ? 'restore' : 'maximize'; // eslint-disable-line no-nested-ternary
    },
  },
};
</script>

<style scoped lang="scss">
  .titlebar {
    top: 0;
    right: 0;
    border-radius: 10px;
    width: 135px;
    height: 36px;
    z-index: 6;
    display: flex;
    position: absolute;
    .win-icons {
      display: flex;
      flex-wrap: nowrap;
      margin: auto;
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
  .darwin-titlebar {
    z-index: 6;
    height: 36px;
    width: 90px;
    display: flex;
    position: absolute;
    .mac-icons {
      margin: auto auto auto 10px;
      display: flex;
      flex-wrap: nowrap;
    }
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
</style>
