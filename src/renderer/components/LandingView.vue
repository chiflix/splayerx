<template>
<div class="wrapper">
  <main>
    <titlebar currentView="LandingView"></titlebar>
    <div class="mask"
      @mousedown.left.stop="handleLeftClick"
      @mouseup.left.stop="handleMouseUp"
      @mousemove="handleMouseMove"></div>
    <div class="background"
      v-if="showShortcutImage">
      <div class="background background-image">
        <transition name="background-transition" mode="in-out">
          <img
          :key="imageTurn"
          :src="backgroundUrl">
        </transition>
      </div>
      <div class="background background-mask"></div>
      <div class="iteminfo item-name">
        {{ itemInfo().baseName }}
      </div>
      <div class="iteminfo item-description">
      </div>
      <div class="iteminfo item-timing">
        {{ timecodeFromSeconds(itemInfo().lastTime) }} / {{ timecodeFromSeconds(itemInfo().duration) }}
      </div>
      <div class="iteminfo item-progress">
        <div class="progress-played" v-bind:style="{ width: itemInfo().percentage + '%' }"></div>
      </div>
    </div>
    <div class="logo-container">
      <img class="logo" src="~@/assets/logo.png" alt="electron-vue">
    </div>

    <div class="welcome">
      <div class="title" v-bind:style="$t('css.titleFontSize')">{{ $t("msg.titleName") }}</div>
    </div>
    <div class="controller">
      <div class="playlist"
        v-if="hasRecentPlaylist">
        <div class="item shadow"
          v-for="(item, index) in lastPlayedFile"
          :key="item.path"
          :style="{
              backgroundImage: itemShortcut(item.shortCut),
              width: item.chosen ? '140px' : '114px',
              height: item.chosen ? '80px' : '65px',
            }"
          @click.stop="openFile(item.path)"
          @mouseover="onRecentItemMouseover(item, index)"
          @mouseout="onRecentItemMouseout(index)">
        </div>
      </div>
    </div>
    <div
      @click="open('./')">
      <img class="button" src="~@/assets/icon-open.svg" type="image/svg+xml" style="-webkit-user-drag: none;">
    </div>
  </main>
</div>
</template>

<script>
import path from 'path';
import Titlebar from './Titlebar.vue';
export default {
  name: 'landing-view',
  data() {
    return {
      showingPopupDialog: false,
      lastPlayedFile: [],
      imageTurn: '',
      isTurnToOdd: false,
      backgroundUrlOdd: '',
      backgroundUrlEven: '',
      showShortcutImage: false,
      isDragging: false,
      mouseDown: false,
      windowStartPosition: null,
      mousedownPosition: null,
    };
  },
  components: {
    Titlebar,
  },
  computed: {
    hasRecentPlaylist() {
      return this.lastPlayedFile.length > 0;
    },
    backgroundUrl() {
      switch (this.imageTurn) {
        case 'odd': return this.backgroundUrlOdd;
        case 'even': return this.backgroundUrlEven;
        default: return '';
      }
    },
  },
  mounted() {
    const { app } = this.$electron.remote;
    if (this.$electron.remote.getCurrentWindow().isResizable()) {
      this.$electron.remote.getCurrentWindow().setResizable(false);
    }

    console.log(app.getVersion(), app.getName());

    this.$storage.get('recent-played', (err, data) => {
      if (err) {
        // TODO: proper error handle
        console.error(err);
      } else {
        this.lastPlayedFile = data;
        console.log(data);
      }
    });
  },
  methods: {
    itemShortcut(shortCut) {
      return `url("${shortCut}")`;
    },
    itemInfo() {
      return {
        baseName: path.basename(this.item.path, path.extname(this.item.path)),
        lastTime: this.item.lastPlayedTime,
        duration: this.item.duration,
        percentage: (this.item.lastPlayedTime / this.item.duration) * 100,
      };
    },
    onRecentItemMouseover(item, index) {
      this.item = item;
      this.$set(this.lastPlayedFile[index], 'chosen', true);
      if (item.shortCut !== '') {
        this.isChanging = true;
        this.isTurnToOdd = !this.isTurnToOdd;
        if (this.isTurnToOdd) {
          this.imageTurn = 'odd';
          this.backgroundUrlOdd = item.shortCut;
        } else {
          this.imageTurn = 'even';
          this.backgroundUrlEven = item.shortCut;
        }
        this.showShortcutImage = true;
      }
    },
    onRecentItemMouseout(index) {
      this.$set(this.lastPlayedFile[index], 'chosen', false);
    },
    open(link) {
      if (this.showingPopupDialog || this.isDragging) {
        // skip if there is already a popup dialog
        return;
      }

      const self = this;
      const { remote } = this.$electron;
      const { dialog } = remote;
      const browserWindow = remote.BrowserWindow;
      const focusedWindow = browserWindow.getFocusedWindow();
      const VALID_EXTENSION = ['mp4', 'mkv', 'mov'];

      self.showingPopupDialog = true;
      dialog.showOpenDialog(focusedWindow, {
        title: 'Open Dialog',
        defaultPath: link,
        filters: [{
          name: 'Video Files',
          extensions: VALID_EXTENSION,
        }],
        properties: ['openFile'],
      }, (item) => {
        self.showingPopupDialog = false;
        if (item) {
          self.openFile(`file:///${item[0]}`);
        }
      });
    },
    handleLeftClick(event) {
      // Handle dragging-related variables
      this.mouseDown = true;
      this.isDragging = false;
      this.windowStartPosition = this.$electron.remote.getCurrentWindow().getPosition();
      this.mousedownPosition = [event.screenX, event.screenY];
    },
    handleMouseMove(event) {
      // Handle dragging-related variables and methods
      if (this.mouseDown) {
        if (this.windowStartPosition !== null) {
          this.isDragging = true;
          const startPos = this.mousedownPosition;
          const offset = [event.screenX - startPos[0], event.screenY - startPos[1]];
          const winStartPos = this.windowStartPosition;
          this.$electron.remote.getCurrentWindow().setPosition(
            winStartPos[0] + offset[0],
            winStartPos[1] + offset[1],
          );
        }
      }
    },
    handleMouseUp() {
      this.mouseDown = false;
    },
  },
};
</script>

<style lang="scss">

$themeColor-Light: white;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  color: $themeColor-Light;
}

.wrapper {
  background-image: url(../assets/gradient-bg.png);
  background-size: 768px 432px;
  height: 100vh;
  width: 100vw;
  z-index: -1;
}
.background {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;

  .background-mask {
    z-index: 3;
    background-image: radial-gradient(circle at 37% 35%, 
                    rgba(0,0,0,0.00) 13%, 
                    rgba(0,0,0,0.43) 47%, 
                    rgba(0,0,0,0.80) 100%);
  }
  .iteminfo {
    position: relative;
    top: 100px;
    left: 45px;
    z-index: 4;
  }
  .item-name {
    width: 500px;
    word-break: break-all;
    font-size: 30px;
    font-weight: bold;
  }
  .item-description {
    opacity: 0.4;
    font-size: 14px;
    font-weight: lighter;
  }
  .item-timing {
    opacity: 0.4;
    font-size: 15px;
    font-weight: 400;
  }
  .item-progress {
    width: 130px;
    height: 4px;
    margin-top: 9px;
    border-radius: 1px;
    background-color: rgba(255, 255, 255, 0.2);
    overflow: hidden;
    .progress-played {
      height: 100%;
      width: 70px;
      background-color: #fff;
    }
  }
  img {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    -webkit-user-drag: none;
  }
}
.logo-container {
  text-align: center;
  padding-top: 80px;
  .logo {
    height: 136px;
    width: 136px;
  }
}

main {
  justify-content: space-between;
}

.welcome {
  margin-top: 15px;
  text-align: center;
  z-index: 1;
  .title {
    margin-bottom: 6px;
  }
  p {
    font-size: 2vw;
    color: gray;
    margin-bottom: 10px;
  }
}

.mask {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.controller {
  position: absolute;
  left: 0;
  bottom: 40px;
  width: 100%;
  z-index: 4;

  .playlist {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-end;
    margin-left: 45px;

    .item {
      color: #e4e4c4;
      border-radius: 2px;
      width: 114px;
      height: 65px;
      color: gray;
      cursor: pointer;
      margin-right: 15px;
      background-size: cover;
      background-color: black;
      background-repeat: no-repeat;
      background-position: center center;
      transition: width 150ms ease-out, height 150ms ease-out;
    }

    .shadow {
      position: relative;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.1) inset;
    }
    .shadow:before, .shadow:after {
      content: "";
      position: absolute;
      z-index: -1;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      top: 50%;
      bottom: 0;
      left: 10px;
      right: 10px;
      border-radius: 50px;
    }
    .shadow:after {
      right: 10px;
      left: auto;
      transform: skew(8deg) rotate(3deg);
    }
  }
}
.button {
  position: absolute;
  bottom: 50px;
  right: 45px;
  width: 49px;
  height: 42px;
  font-size: .8em;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  border: 0px;
  z-index: 5;
}

.background-transition-enter-active, .background-transition-leave-active {
  transition: opacity .3s;
  transition-delay: .15s;
}
.background-transition-enter, .background-transition-leave-to {
  opacity: 0;
}

</style>
