<template>
  <div
    :data-component-name="$options.name"
    :class="{ 'darwin-titlebar': isDarwin, titlebar: !isDarwin }">
    <div class="win-icons" v-if="!isDarwin">
      <Icon class="title-button"
        @click.native="handleMinimize"
        type="titleBarWinMin">
      </Icon>
      <Icon class="title-button"
        @click.native="handleMaximize"
        v-show="middleButtonStatus === 'maximize'"
        type="titleBarWinMax">
      </Icon>
      <Icon class="title-button"
        @click.native="handleRestore"
        type="titleBarWinRestore"
        v-show="middleButtonStatus === 'restore'">
      </Icon>
      <Icon class="title-button"
        @click.native="handleFullscreenExit"
        v-show="middleButtonStatus === 'exit-fullscreen'"
        type="titleBarWinResize">
      </Icon>
      <Icon class="title-button"
        @click.native="handleClose"
        type="titleBarWinClose">
      </Icon>
    </div>
    <div class="mac-icons" v-if="isDarwin"
         @mouseover="handleMouseOver"
         @mouseout="handleMouseOut">
      <Icon id="close" class="title-button"
            type="titleBarClose"
            :state="state"
            @click.native="handleClose">
      </Icon>
      <Icon id="minimize" class="title-button"
            type="titleBarMin"
            @click.native="handleClose"
            :class="{ disabled: middleButtonStatus === 'exit-fullscreen' }"
            :state="state"
            :isFullScreen="middleButtonStatus">
      </Icon>
      <Icon id="maximize" class="title-button"
            type="titleBarMax"
            @click.native="handleMacMaximize"
            v-show="middleButtonStatus !== 'exit-fullscreen'"
            :state="state">
      </Icon>
      <Icon id="restore" class="title-button"
            @click.native="handleFullscreenExit"
            v-show="middleButtonStatus === 'exit-fullscreen'"
            type="titleBarRecover"
            :state="state">
      </Icon>
    </div>
  </div>
</template>

<script>
import Icon from './IconContainer';
export default {
  name: 'titlebar',
  data() {
    return {
      middleButtonStatus: 'maximize',
      windowInfo: {
        screenWidth: null,
        windowWidth: null,
        windowPosition: null,
      },
      maximize: false,
      isDarwin: process.platform === 'darwin',
      titlebarDelay: 0,
      screenWidth: this.$electron.screen.getPrimaryDisplay().workAreaSize.width,
      state: 'default',
    };
  },
  props: {
    currentView: String,
  },
  components: {
    Icon,
  },
  methods: {
    handleMouseOver() {
      this.state = 'hover';
    },
    handleMouseOut() {
      this.state = 'default';
    },
    // Methods to handle window behavior
    handleMinimize() {
      this.$electron.remote.getCurrentWindow().minimize();
    },
    handleMaximize() {
      this.$electron.remote.getCurrentWindow().maximize();
    },
    handleClose() {
      this.$electron.remote.getCurrentWindow().close();
    },
    handleRestore() {
      this.$electron.remote.getCurrentWindow().unmaximize();
    },
    handleFullscreenExit() {
      this.$electron.remote.getCurrentWindow().setFullScreen(false);
    },
    // OS-specific methods
    handleMacMaximize() {
      this.$electron.remote.getCurrentWindow().setFullScreen(true);
    },
    handleResize() {
      this.setWindowInfo();
      this.statusChange();
      this.titlebarWidth = this.winWidth;
      this.originalSize = this.winSize;
    },
    statusChange() {
      if (this.$store.getters.isFullScreen) {
        this.middleButtonStatus = 'exit-fullscreen';
      } else if (this.maximize) {
        this.middleButtonStatus = 'restore';
      } else {
        this.middleButtonStatus = 'maximize';
      }
    },
    setWindowInfo() {
      [this.windowInfo.screenWidth, this.windowInfo.windowWidth] = [
        this.screenWidth,
        this.winWidth,
      ];
      this.windowInfo.windowPosition = this.winPos;
      this.updateMaximize(this.windowInfo);
    },
    updateMaximize(val) {
      const sizeOffset = Math.abs(val.screenWidth - val.windowWidth);
      const positionOffset = Math.sqrt((this.windowInfo.windowPosition[0] ** 2) +
        (this.windowInfo.windowPosition[1] ** 2));
      if (sizeOffset <= 5 && positionOffset <= 5) {
        this.maximize = true;
      } else {
        this.maximize = false;
      }
    },
    appearTitlebar() {
      if (this.titlebarDelay !== 0) {
        clearTimeout(this.titlebarDelay);
      }
      this.showTitlebar = true;
    },
    hideTitlebar() {
      this.showTitlebar = false;
    },
  },
  beforeMount() {
    this.setWindowInfo();
    this.statusChange();
  },
  mounted() {
    this.$electron.ipcRenderer.on('main-resize', this.handleResize);
    this.$electron.ipcRenderer.on('main-move', this.setWindowInfo);
    this.$bus.$on('titlebar-appear-delay', () => {
      this.appearTitlebar();
      if (this.showTitlebar !== 0) {
        clearTimeout(this.titlebarDelay);
        this.titlebarDelay = setTimeout(this.hideTitlebar, 3000);
      } else {
        this.titlebarDelay = setTimeout(this.hideTitlebar, 3000);
      }
    });
  },
  computed: {
    show() {
      if (this.showTitlebar === false) {
        return {
          Maximize: false,
          Restore: false,
          FullscreenExit: false,
        };
      }
      return {
        Maximize: this.middleButtonStatus === 'maximize',
        Restore: this.middleButtonStatus === 'restore',
        FullscreenExit: this.middleButtonStatus === 'exit-fullscreen',
      };
    },
    winSize() {
      return this.$store.getters.winSize;
    },
    winWidth() {
      return this.$store.getters.winWidth;
    },
    winPos() {
      return this.$store.getters.winPos;
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
  -webkit-app-region: drag;
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
      -webkit-app-region: no-drag;
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
  top: 12px;
  left: 12px;
  height: 20px;
  .mac-icons {
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
  .title-button {
    background-position-y: -96px;
  }
  #minimize {
    &.disabled {
      background-position-y: -108px;
      pointer-events: none;
      opacity: 0.25;
    }
  }
  #maximize {
    &.disabled {
      background-position-y: -108px;
      pointer-events: none;
      opacity: 0.25;
    }
  }
  @media screen and (-webkit-min-device-pixel-ratio: 1) and (-webkit-max-device-pixel-ratio: 2) {
    .title-button {
      background-size: 36px 240px;
      background-position-x: 0;
    }
  }
  @media screen and (-webkit-min-device-pixel-ratio: 2) {
    .title-button {
      background-size: 18px 120px;
      background-position-x: -6px;
    }
  }
}
</style>
