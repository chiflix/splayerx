<template>
  <div class="titleBarDoubleClickHandle"
       @dblclick="handleDoubleClick">
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
            @click.native="handleMinimize"
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
      <Icon id="maxScreenSize" class="title-button"
            type="titleBarClose"
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
      windowInfoArray: [],
    };
  },
  props: {
    currentView: String,
  },
  components: {
    Icon,
  },
  methods: {
    handleDoubleClick() {
      const currentWindow = this.$electron.remote.getCurrentWindow();
      const windowSize = currentWindow.getSize();
      const windowMaxSize = this.$electron.screen.getPrimaryDisplay().workAreaSize;// eslint-disable-line
      this.windowInfoArray.push({ width: windowSize[0], height: windowSize[1] });
      currentWindow.isMaximized() ? currentWindow.unmaximize() : currentWindow.maximize();// eslint-disable-line
      if (this.windowInfoArray.length >= 3) this.windowInfoArray.shift();
      if (this.windowInfoArray.length>=2 && currentWindow.isMaximized() && (this.windowInfoArray[1].width === windowMaxSize.width || this.windowInfoArray[1].height === windowMaxSize.height)) { // eslint-disable-line
        console.log('resize');
        currentWindow.setSize(this.windowInfoArray[0].width, this.windowInfoArray[0].height);
        this.windowInfoArray.pop();
      }
      currentWindow.center();
    },
    handleEnterAlt(e) {
      if (e.key === 'Alt') {
        const maximizeButton = document.querySelector('#maximize');
        const maxScreenSizeButton = document.querySelector('#maxScreenSize');
        if (this.middleButtonStatus === 'maximize') {
          maximizeButton.style.display = 'none';
          maxScreenSizeButton.style.display = 'inline';
        }
        maxScreenSizeButton.addEventListener('click', this.handleDoubleClick);// eslint-disable-line
      }
    },
    handleLeaveAlt() {
      const maximizeButton = document.querySelector('#maximize');
      const maxScreenSizeButton = document.querySelector('#maxScreenSize');
      maxScreenSizeButton.style.display = 'none';
      maximizeButton.style.display = 'inline';
    },
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
    window.addEventListener('keydown', this.handleEnterAlt);
    window.addEventListener('keyup', this.handleLeaveAlt);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleEnterAlt);
    window.removeEventListener('keyup', this.handleLeaveAlt);
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
  width: 80%;
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
.titleBarDoubleClickHandle{
  z-index: 3;
  position: absolute;
  height:32px;
  width:100%;
  background: transparent;
}
.darwin-titlebar {
  position: absolute;
  z-index: 6;
  box-sizing: content-box;
  left:12px;
  top:12px;
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
  #maxScreenSize {
    transform: rotate(45deg);
    display: none;
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
