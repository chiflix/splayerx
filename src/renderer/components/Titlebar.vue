<template>
  <div :class="{ 'darwin-titlebar': isDarwin, titlebar: !isDarwin }" v-show="showTitlebar">
    <div class="win-icons" v-if="!isDarwin">
      <div class="title-button minimize"
          @click="handleMinimize">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="minimize" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <rect fill="#000000" x="90" y="70" width="50" height="5"></rect>
          </g>
        </svg>
      </div>
      <div class="title-button maximize middle" :class="{ disabled: currentView === 'LandingView' }"
          v-if="show.Maximize"
          @click.prevent="handleMaximize">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="fullscreen" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M90,45 L140,45 L140,95 L90,95 L90,45 Z M95,50 L95,90 L135,90 L135,50 L95,50 Z" fill="#000000"></path>
          </g>
        </svg>
      </div>
      <div class="title-button restore middle"
          v-if="show.Restore"
          @click="handleRestore">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="maximize" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M128,87 L128,82.0504173 L139,82.0504173 L139,46.0504173 L103,46.0504173 L103,57 L98,57 L98,41 L144,41 L144,87 L128,87 Z" fill="#000000"></path>
              <path d="M87,52 L133,52 L133,98 L87,98 L87,52 Z M92,57.0504173 L92,93.0504173 L128,93.0504173 L128,57.0504173 L92,57.0504173 Z" fill="#000000"></path>
          </g>
        </svg>
      </div>
      <div class="title-button exit-fullscreen middle"
          v-if="show.FullscreenExit"
          @click="handleFullscreenExit">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="resize" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M128.537757,60 L136,60 L136,65 L125,65 L120,65 L120,49 L125,49 L125,56.4661613 L137.724334,43.7418268 L141.260132,47.2776245 L128.537757,60 Z M104,84.5377566 L92.2795834,96.2581732 L88.7437858,92.7223755 L100.466161,81 L93,81 L93,76 L109,76 L109,81 L109,92 L104,92 L104,84.5377566 Z" fill="#000000"></path>
          </g>
        </svg>
      </div>
      <div class="title-button close"
          @click="handleClose">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="close" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M118.537757,70 L141.260132,92.7223755 L137.724334,96.2581732 L115.001959,73.5357977 L92.2795834,96.2581732 L88.7437858,92.7223755 L111.466161,70 L88.7437858,47.2776245 L92.2795834,43.7418268 L115.001959,66.4642023 L137.724334,43.7418268 L141.260132,47.2776245 L118.537757,70 Z" fill="#000000"></path>
          </g>
        </svg>
      </div>
    </div>
    <div class="mac-icons" v-if="isDarwin">
      <div class="title-button minimize"
          @click="handleMinimize">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="minimize" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <rect fill="#000000" x="90" y="70" width="50" height="5"></rect>
          </g>
        </svg>
      </div>
      <div class="title-button maximize middle" :class="{ disabled: currentView === 'LandingView' }"
          v-if="show.Maximize"
          @click.prevent="handleMaximize">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="fullscreen" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M90,45 L140,45 L140,95 L90,95 L90,45 Z M95,50 L95,90 L135,90 L135,50 L95,50 Z" fill="#000000"></path>
          </g>
        </svg>
      </div>
      <div class="title-button restore middle"
          v-if="show.Restore"
          @click="handleRestore">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="maximize" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M128,87 L128,82.0504173 L139,82.0504173 L139,46.0504173 L103,46.0504173 L103,57 L98,57 L98,41 L144,41 L144,87 L128,87 Z" fill="#000000"></path>
              <path d="M87,52 L133,52 L133,98 L87,98 L87,52 Z M92,57.0504173 L92,93.0504173 L128,93.0504173 L128,57.0504173 L92,57.0504173 Z" fill="#000000"></path>
          </g>
        </svg>
      </div>
      <div class="title-button exit-fullscreen middle"
          v-if="show.FullscreenExit"
          @click="handleFullscreenExit">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="resize" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M128.537757,60 L136,60 L136,65 L125,65 L120,65 L120,49 L125,49 L125,56.4661613 L137.724334,43.7418268 L141.260132,47.2776245 L128.537757,60 Z M104,84.5377566 L92.2795834,96.2581732 L88.7437858,92.7223755 L100.466161,81 L93,81 L93,76 L109,76 L109,81 L109,92 L104,92 L104,84.5377566 Z" fill="#000000"></path>
          </g>
        </svg>
      </div>
      <div class="title-button close"
          @click="handleClose">
        <svg viewBox="0 0 230 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs></defs>
          <g id="close" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <path d="M118.537757,70 L141.260132,92.7223755 L137.724334,96.2581732 L115.001959,73.5357977 L92.2795834,96.2581732 L88.7437858,92.7223755 L111.466161,70 L88.7437858,47.2776245 L92.2795834,43.7418268 L115.001959,66.4642023 L137.724334,43.7418268 L141.260132,47.2776245 L118.537757,70 Z" fill="#000000"></path>
          </g>
        </svg>
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
    };
  },
  props: {
    currentView: String,
  },
  methods: {
    handleMinimize() {
      this.$electron.remote.getCurrentWindow().minimize();
    },
    handleMaximize() {
      if (this.isDarwin) {
        this.$electron.remote.getCurrentWindow().setFullScreen(true);
      }
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

<style lang="scss">
.titlebar {
  position: absolute;
  top: 0;
  right: 5px;
  border-radius: 4px 4px 0px 0px;
  z-index: 6;
}
.darwin-titlebar {
  position: absolute;
  top: 0;
  left: 5px;
  border-radius: 4px 4px 0px 0px;
  z-index: 6;
}

.win-icons {
  display: flex;
  flex-wrap: nowrap;
  rect, path {
    fill: #FFFFFF;
  }
  .title-button {
    margin: 0px 2px 2px 0px;
    width: 45px;
    height: 28px;
    text-align: center;
    cursor: pointer;
    -webkit-app-region: no-drag;
    background-color: rgba(255,255,255,0);
    transition: background-color 200ms;
  }
  .title-button:hover {
    background-color: rgba(221, 221, 221, 0.2);
  }
  .disabled {
    pointer-events: none;
    fill: #CCCCCC;
    opacity: 0.3;
    -webkit-app-region: drag;
  }
}

.mac-icons .title-button {
  float: right;
  margin: 0px 2px 2px 0px;
  width: 45px;
  height: 28px;
  text-align: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
}
</style>