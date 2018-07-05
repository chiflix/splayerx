<template>
  <div :class="{ 'darwin-titlebar': isDarwin, titlebar: !isDarwin }" 
    v-show="showTitlebar"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave">
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
    <div class="mac-icons" v-if="isDarwin" >
      <div class="title-button close"
          @click="handleClose">
        <svg viewBox="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="macos-close" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <circle id="normal" stroke="#808086" stroke-width="0.5" fill="#ACACAC" cx="6" cy="6" r="5.75"></circle>
              <path v-show="macShowup" d="M7.20208156,6 L8.81711343,7.61503187 C9.0576764,7.85559484 9.0576764,8.24562446 8.81711343,8.48618743 L8.48618743,8.81711343 C8.24562446,9.0576764 7.85559484,9.0576764 7.61503187,8.81711343 L6,7.20208156 L4.38496813,8.81711343 C4.14440516,9.0576764 3.75437554,9.0576764 3.51381257,8.81711343 L3.18288657,8.48618743 C2.9423236,8.24562446 2.9423236,7.85559484 3.18288657,7.61503187 L4.79791844,6 L3.18288657,4.38496813 C2.9423236,4.14440516 2.9423236,3.75437554 3.18288657,3.51381257 L3.51381257,3.18288657 C3.75437554,2.9423236 4.14440516,2.9423236 4.38496813,3.18288657 L6,4.79791844 L7.61503187,3.18288657 C7.85559484,2.9423236 8.24562446,2.9423236 8.48618743,3.18288657 L8.81711343,3.51381257 C9.0576764,3.75437554 9.0576764,4.14440516 8.81711343,4.38496813 L7.20208156,6 Z" id="close" fill="#3B3B40"></path>
          </g>
        </svg>
      </div>
      <div class="title-button minimize"
          @click="handleMinimize">
        <svg viewBox="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="macos-minimize" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <circle id="normal" stroke="#808086" stroke-width="0.5" fill="#ACACAC" cx="6" cy="6" r="5.75"></circle>
              <rect id="minimize" v-show="macShowup && middleButtonStatus !== 'exit-fullscreen'" fill="#3B3B40" x="2.25" y="5.14999998" width="7.5" height="1.70000005" rx="0.1232"></rect>
              <circle id="disabled" v-show="middleButtonStatus === 'exit-fullscreen'" stroke="#808086" stroke-width="0.5" fill="#DDDDDD" cx="6" cy="6" r="5.75"></circle>
          </g>
        </svg>
      </div>
      <div class="title-button maximize"
          @click="handleMaximize">
        <svg viewBox="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="macos-maximize" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <circle id="normal" stroke="#808086" stroke-width="0.5" fill="#ACACAC" cx="6" cy="6" r="5.75"></circle>
              <circle id="disabled" v-show="currentView === 'LandingView'" stroke="#808086" stroke-width="0.5" fill="#DDDDDD" cx="6" cy="6" r="5.75"></circle>
              <path id="fullscreen" v-show="macShowup && currentView !== 'LandingView' && middleButtonStatus === 'maximize'" d="M3.22720992,4.58865097 L7.49916992,8.80209097 L3.81240992,8.80209097 C3.48921288,8.80209097 3.22720992,8.54008801 3.22720992,8.21689097 L3.22720992,4.58865097 Z M8.77279008,7.41134903 L4.50083008,3.19790903 L8.18759008,3.19790903 C8.51078712,3.19790903 8.77279008,3.45991199 8.77279008,3.78310903 L8.77279008,7.41134903 Z" fill="#3B3B40"></path>
              <path id="restore" v-show="macShowup && middleButtonStatus === 'exit-fullscreen'" d="M6,1.78656 L10.27196,6 L6.5852,6 C6.26200296,6 6,5.73799704 6,5.4148 L6,1.78656 Z M6,10.21344 L1.72804,6 L5.4148,6 C5.73799704,6 6,6.26200296 6,6.5852 L6,10.21344 Z" fill="#3B3B40"></path>
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
      macShowup: false,
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
      if (this.isDarwin && this.currentView !== 'LandingView') {
        if (this.middleButtonStatus === 'maximize') {
          this.$electron.remote.getCurrentWindow().setFullScreen(true);
        } else if (this.middleButtonStatus === 'restore') {
          this.handleClose();
        } else {
          this.handleFullscreenExit();
        }
      } else if (!this.isDarwin) {
        this.$electron.remote.getCurrentWindow().maximize();
      }
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
}
.darwin-titlebar {
  position: absolute;
  top: 6px;
  left: 8px;
  border-radius: 4px 4px 0px 0px;
  z-index: 6;
  height: 20px;
  box-sizing: content-box;
  .mac-icons {
    display: flex;
    flex-wrap: nowrap;
  }
  .title-button {
    width: 12px;
    height: 12px;
    margin-right: 8px;
  }
}
</style>