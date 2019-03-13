<template>
  <div
    :data-component-name="$options.name"
    :class="isDarwin ? 'darwin-titlebar' : 'titlebar'"
    @dblclick.stop="handleDbClick">
    <div class="win-icons" v-if="!isDarwin" v-fade-in="showTitleBar">
      <Icon class="title-button no-drag"
        @mouseup.native="handleMinimize"
        type="titleBarWinExitFull">
      </Icon>
      <Icon class="title-button no-drag"
        @mouseup.native="handleWinFull"
        v-show="middleButtonStatus === 'maximize'"
        type="titleBarWinFull">
      </Icon>
      <Icon class="title-button no-drag"
        @mouseup.native="handleRestore"
        type="titleBarWinRestore"
        v-show="middleButtonStatus === 'restore'">
      </Icon>
      <Icon class="title-button no-drag"
        @mouseup.native="handleFullscreenExit"
        v-show="middleButtonStatus === 'exit-fullscreen'"
        type="titleBarWinResize">
      </Icon>
      <Icon class="title-button no-drag"
        @mouseup.native="handleClose"
        type="titleBarWinClose">
      </Icon>
    </div>
    <div class="mac-icons"
      v-if="isDarwin"
      v-fade-in="showTitleBar"
      @mouseover="handleMouseOver"
      @mouseout="handleMouseOut">
      <Icon id="close" class="title-button no-drag"
            type="titleBarClose"
            :state="state"
            @mouseup.native="handleClose">
      </Icon>
      <Icon id="minimize" class="title-button no-drag"
            type="titleBarExitFull"
            @mouseup.native="handleMinimize"
            :class="{ disabled: middleButtonStatus === 'exit-fullscreen' }"
            :state="state"
            :isFullScreen="middleButtonStatus">
      </Icon>
      <Icon id="maximize" class="title-button no-drag"
            :type="itemType"
            @mouseup.native="handleMacFull"
            v-show="middleButtonStatus !== 'exit-fullscreen'"
            :state="state"
            :style="{ transform: itemType === this.itemTypeEnum.MAXSCREEN ? 'rotate(45deg)' : ''}">
      </Icon>
      <Icon id="restore" class="title-button no-drag"
            @mouseup.native="handleFullscreenExit"
            v-show="middleButtonStatus === 'exit-fullscreen'"
            type="titleBarRecover"
            :state="state">
      </Icon>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Icon from './BaseIconContainer.vue';

export default {
  name: 'titlebar',
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
  props: {
    currentView: String,
    showAllWidgets: {
      type: Boolean,
      default: true,
    },
    recentPlaylist: Boolean,
  },
  components: {
    Icon,
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
