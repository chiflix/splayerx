<template>
  <div :class="{ 'darwin-titlebar': isDarwin, titlebar: !isDarwin }" 
    v-show="showTitlebar"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave">
    <div class="win-icons" v-if="!isDarwin">
      <div id="minimize" class="title-button"
        @click="handleMinimize">
        <img src="~@/assets/windows-titlebar-icons.png" />
      </div>
      <div id="maximize" class="title-button"
        @click="handleMaximize"
        v-show="middleButtonStatus === 'maximize'">
        <img :class="{ disabled: currentView === 'LandingView' }" src="~@/assets/windows-titlebar-icons.png" />
      </div>
      <div id="restore" class="title-button"
        @click="handleRestore"
        v-show="middleButtonStatus === 'restore'">
        <img src="~@/assets/windows-titlebar-icons.png" />
      </div>
      <div id="exit-fullscreen" class="title-button"
        @click="handleFullscreenExit"
        v-show="middleButtonStatus === 'exit-fullscreen'">
        <img src="~@/assets/windows-titlebar-icons.png" />
      </div>
      <div id="close" class="title-button"
        @click="handleClose">
        <img src="~@/assets/windows-titlebar-icons.png" />
      </div>
    </div>
    <div class="mac-icons" v-if="isDarwin">
      <div id="close" class="title-button"
        @click="handleClose">
        <img src="~@/assets/mac-titlebar-icons.png" />
      </div>
      <div id="minimize" class="title-button"
        @click="handleMinimize">
        <img :class="{ disabled: middleButtonStatus === 'exit-fullscreen' }" src="~@/assets/mac-titlebar-icons.png" />
      </div>
      <div id="maximize" class="title-button"
        @click="handleMacMaximize"
        v-show="middleButtonStatus !== 'exit-fullscreen'">
        <img :class="{ disabled: currentView === 'LandingView' }" src="~@/assets/mac-titlebar-icons.png" />
      </div>
      <div id="restore" class="title-button"
        @click="handleFullscreenExit"
        v-show="middleButtonStatus === 'exit-fullscreen'">
        <img src="~@/assets/mac-titlebar-icons.png" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'titlebar',
  data() {
    return {
      showTitlebar: true,
      middleButtonStatus: 'maximize',
      windowInfo: {
        screenWidth: null,
        windowWidth: null,
        windowPosition: null,
      },
      maximize: false,
      isDarwin: process.platform === 'darwin',
      titlebarDelay: 0,
    };
  },
  props: {
    currentView: String,
  },
  methods: {
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
      if (this.currentView !== 'LandingView') {
        this.$electron.remote.getCurrentWindow().setFullScreen(true);
      }
    },
    handleMouseOver() {
      this.macShowup = true;
    },
    handleMouseLeave() {
      this.macShowup = false;
    },
    statusChange() {
      const window = this.$electron.remote.getCurrentWindow();
      if (window.isFullScreen()) {
        this.middleButtonStatus = 'exit-fullscreen';
      } else if (this.maximize) {
        this.middleButtonStatus = 'restore';
      } else {
        this.middleButtonStatus = 'maximize';
      }
    },
    setWindowInfo() {
      [this.windowInfo.screenWidth, this.windowInfo.windowWidth] = [
        this.$electron.screen.getPrimaryDisplay().workAreaSize.width,
        this.$electron.remote.getCurrentWindow().getSize()[0],
      ];
      this.windowInfo.windowPosition = this.$electron.remote.getCurrentWindow().getPosition();
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
    this.$electron.remote.getCurrentWindow().on('resize', () => {
      this.setWindowInfo();
      this.statusChange();
      console.log(this.windowInfo);
      this.titlebarWidth = this.$electron.remote.getCurrentWindow().getSize();
      this.originalSize = this.$electron.remote.getCurrentWindow().getSize();
    });
    this.$electron.remote.getCurrentWindow().on('move', () => {
      this.setWindowInfo();
    });
    this.$bus.$on('titlebar-appear', () => {
      this.appearTitlebar();
      if (this.showTitlebar !== 0) {
        clearTimeout(this.titlebarDelay);
        this.titlebarDelay = setTimeout(this.hideTitlebar, 3000);
      } else {
        this.titlebarDelay = setTimeout(this.hideTitlebar, 3000);
      }
    });
    this.$bus.$on('titlebar-hide', () => {
      this.hideTitlebar();
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
  },
};
</script>

<style lang="scss">
.titlebar {
  position: absolute;
  top: 0;
  right: 5px;
  border-radius: 4px 4px 0px 0px;
  z-index: 6;
  .win-icons {
    display: flex;
    flex-wrap: nowrap;
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
  img {
    object-fit: none;
    width: 45px;
    height: 28px;
    -webkit-user-drag: none;
    -webkit-app-region: no-drag;
  }
  #minimize img {
    object-position: 0 0
  }
  #maximize img {
    object-position: 0 -28px;
    &.disabled {
      object-position: 0 -140px;
      -webkit-app-region: drag;
    }
  }
  #restore img {
    object-position: 0 -56px;
  }
  #exit-fullscreen img {
    object-position: 0 -84px;
  }
  #close img {
    object-position: 0 -112px;
  }
}
.darwin-titlebar {
  position: absolute;
  top: 6px;
  left: 10px;
  z-index: 6;
  height: 20px;
  box-sizing: content-box;
  &:hover {
    img {
      opacity: 1;
    }
    #close img {
      object-position: 0 0;
    }
    #minimize img {
      object-position: 0 -24px;
    }
    #maximize img {
      object-position: 0 -48px;
    }
    #restore img {
      object-position: 0 -72px;
    }
  }
  .mac-icons {
    display: flex;
    flex-wrap: nowrap;
  }
  .title-button {
    width: 12px;
    height: 12px;
    margin-right: 8px;
  }
  img {
    object-fit: none;
    width: 12px;
    height: 12px;
    -webkit-user-drag: none;
    -webkit-app-region: no-drag;
    object-position: 0 -96px;
    opacity: 0.5;
  }
  #close img {
    &:active {
      object-position: 0 -12px;
    }
  }
  #minimize img {
    &.disabled {
      object-position: 0 -108px;
      pointer-events: none;
    }
    &:active {
      object-position: 0 -36px;
    }
  }
  #maximize img {
    &.disabled {
      object-position: 0 -108px;
      pointer-events: none;
    }
    &:active {
      object-position: 0 -60px;
    }
  }
  #restore img {
    &:active {
      object-position: 0 -84px;
    }
  }
}
</style>