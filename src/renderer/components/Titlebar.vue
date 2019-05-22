<template>
  <div
    :class="isDarwin ? 'darwin-titlebar' : 'titlebar'"
    @dblclick.stop="handleDbClick"
  >
    <div
      v-if="!isDarwin"
      v-fade-in="showTitleBar"
      class="win-icons"
    >
      <Icon
        class="title-button no-drag"
        type="titleBarWinExitFull"
        @mouseup.native="handleMinimize"
      />
      <Icon
        v-show="middleButtonStatus === 'maximize'"
        class="title-button no-drag"
        type="titleBarWinFull"
        @mouseup.native="handleWinFull"
      />
      <Icon
        v-show="middleButtonStatus === 'restore'"
        class="title-button no-drag"
        type="titleBarWinRestore"
        @mouseup.native="handleRestore"
      />
      <Icon
        v-show="middleButtonStatus === 'exit-fullscreen'"
        class="title-button no-drag"
        type="titleBarWinResize"
        @mouseup.native="handleFullscreenExit"
      />
      <Icon
        class="title-button no-drag"
        type="titleBarWinClose"
        @mouseup.native="handleClose"
      />
    </div>
    <div
      v-if="isDarwin"
      v-fade-in="showTitleBar"
      class="mac-icons"
      @mouseover="handleMouseOver"
      @mouseout="handleMouseOut"
    >
      <Icon
        id="close"
        class="title-button no-drag"
        type="titleBarClose"
        :state="state"
        @mouseup.native="handleClose"
      />
      <Icon
        id="minimize"
        class="title-button no-drag"
        type="titleBarExitFull"
        :class="{ disabled: middleButtonStatus === 'exit-fullscreen' }"
        :state="state"
        :is-full-screen="middleButtonStatus"
        @mouseup.native="handleMinimize"
      />
      <Icon
        v-show="middleButtonStatus !== 'exit-fullscreen'"
        id="maximize"
        class="title-button no-drag"
        :type="itemType"
        :state="state"
        :style="{ transform: isMaxScreen ? 'rotate(45deg)' : ''}"
        @mouseup.native="handleMacFull"
      />
      <Icon
        v-show="middleButtonStatus === 'exit-fullscreen'"
        id="restore"
        class="title-button no-drag"
        type="titleBarRecover"
        :state="state"
        @mouseup.native="handleFullscreenExit"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import Icon from './BaseIconContainer.vue';

export default {
  name: 'Titlebar',
  type: INPUT_COMPONENT_TYPE,
  components: {
    Icon,
  },
  props: {
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
    isMaxScreen() { return this.itemType === this.itemTypeEnum.MAXSCREEN; },
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
    handleDbClick() {
      if (!this.isMaximized) {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
      } else {
        this.$electron.ipcRenderer.send('callMainWindowMethod', 'unmaximize');
      }
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

<style lang="scss">
.titlebar {
  position: absolute;
  top: 0;
  border-radius: 10px;
  width: 100%;
  height: 28px;
  z-index: 6;
  .win-icons {
    display: flex;
    flex-wrap: nowrap;
    position: absolute;
    right: 5px;
    .title-button {
      margin: 0px 2px 2px 0px;
      width: 45px;
      height: 28px;
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
  position: absolute;
  z-index: 6;
  box-sizing: content-box;
  height: 36px;
  width: 100%;
  .mac-icons {
    position: absolute;
    top: 12px;
    left: 12px;
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
