<template>
  <div class="titlebar">
    <div class="title-button close"
         @click="handleClose">
      <span>关闭</span>
    </div>
    <div class="title-button maximize"
         v-if="show.Maximize"
         @click="handleMaximize">
      <span>最大化</span>
    </div>
    <div class="title-button restore"
         v-if="show.Restore"
         @click="handleRestore">
      <span>恢复</span>
    </div>
    <div class="title-button exit-fullscreen"
         v-if="show.FullscreenExit"
         @click="handleFullscreenExit">
      <span>退出全屏</span>
    </div>
    <div class="title-button minimize"
         @click="handleMinimize">
      <span>最小化</span>
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
      buttonStyle: null,
      windowInfo: {
        screenWidth: null,
        windowWidth: null,
        windowPosition: null,
      },
      maximize: false,
    };
  },
  methods: {
    handleMinimize() {
      this.$electron.remote.getCurrentWindow().minimize();
    },
    handleMaximize() {
      this.$electron.remote.getCurrentWindow().maximize();
      console.log(this.maximize);
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
      console.log(sizeOffset, positionOffset);
      if (sizeOffset <= 5 && positionOffset <= 5) {
        this.maximize = true;
      } else {
        this.maximize = false;
      }
      console.log(this.maximize);
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
      console.log('Window resized!', this.$electron.remote.getCurrentWindow().getSize());
      console.log('Current maximize status: ', this.middleButtonStatus);
    });
    this.$electron.remote.getCurrentWindow().on('move', () => {
      this.setWindowInfo();
    });
    this.$bus.$on('titlebar-appear', () => {
      this.showTitlebar = true;
    });
    this.$bus.$on('titlebar-hide', () => {
      this.showTitlebar = false;
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

<style>
.titlebar {
  position: fixed;
  height: 32px;
  right: 0px;
  transition: 0.5s;
  z-index: 2000;
  -webkit-app-region: drag;
  border-radius: 4px 4px 0px 0px;
}

.title-button {
  float: right;
  margin: 0px 2px 2px 0px;
  width: 64px;
  text-align: center;
  cursor: pointer;
  height: auto;
  line-height: 29px;
  -webkit-app-region: no-drag;
}
.minimize:hover, .maximize:hover, .restore:hover, .exit-fullscreen:hover {
  background-color: rgba(255, 255, 255, 0.8);
  transition: 0.5s;
}
.close:hover {
  background-color: red;
  transition: 0.5s;
}
</style>
