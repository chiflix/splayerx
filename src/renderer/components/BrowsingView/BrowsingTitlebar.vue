<template>
  <div
    :data-component-name="$options.name"
    :class="isDarwin ? 'darwin-titlebar' : 'titlebar'">
    <div class="win-icons" v-if="!isDarwin">
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
import electron from 'electron';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'BrowsingTitlebar',
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
      isMaximized: false,
      isFullScreen: false,
    };
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
    middleButtonStatus(val) {
      console.log(val);
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
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'minimize');
      this.isMaximized = false;
    },
    handleWinFull() {
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'maximize');
      this.isMaximized = true;
    },
    handleClose() {
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'close');
    },
    handleRestore() {
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'unmaximize');
      this.isMaximized = false;
    },
    handleFullscreenExit() {
      electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setFullScreen', [false]);
      this.isFullScreen = false;
    },
    // OS-specific methods
    handleMacFull() {
      if (this.itemType === this.itemTypeEnum.FULLSCREEN) {
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'setFullScreen', [true]);
        this.isFullScreen = true;
      } else if (this.isMaximized) {
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'unmaximize');
        this.isMaximized = false;
      } else {
        electron.ipcRenderer.send('callBrowsingViewWindowMethod', 'maximize');
        this.isMaximized = true;
      }
    },
  },
  computed: {
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
