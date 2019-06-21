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
        @mouseup.native="handleMinimize"
        class="title-button no-drag"
        type="titleBarWinExitFull"
      />
      <Icon
        v-show="middleButtonStatus === 'maximize'"
        @mouseup.native="handleWinFull"
        class="title-button no-drag"
        type="titleBarWinFull"
      />
      <Icon
        v-show="middleButtonStatus === 'restore'"
        @mouseup.native="handleRestore"
        class="title-button no-drag"
        type="titleBarWinRestore"
      />
      <Icon
        v-show="middleButtonStatus === 'exit-fullscreen'"
        @mouseup.native="handleFullscreenExit"
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
        :class="{ disabled: middleButtonStatus === 'exit-fullscreen' }"
        :state="state"
        :is-full-screen="middleButtonStatus"
        @mouseup.native="handleMinimize"
        class="title-button no-drag"
        type="titleBarExitFull"
      />
      <Icon
        id="maximize"
        v-show="middleButtonStatus !== 'exit-fullscreen'"
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
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import Icon from './BaseIconContainer.vue';

export default {
  name: 'Titlebar',
  // @ts-ignore
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
    recentPlaylist(val: boolean) {
      if (!val) this.showTitleBar = this.showAllWidgets;
    },
    showAllWidgets(val: boolean) {
      this.showTitleBar = this.recentPlaylist || val;
    },
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

<style lang="scss" scoped>
.titlebar {
  position: absolute;
  top: 0;
  border-radius: 10px;
  width: 100%;
  height: 36px;
  z-index: 6;
  .win-icons {
    display: flex;
    flex-wrap: nowrap;
    position: absolute;
    right: 0;
    .title-button {
      width: 45px;
      height: 36px;
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
