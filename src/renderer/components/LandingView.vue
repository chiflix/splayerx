<template>
<div class="wrapper">
  <main
    @mousedown.left.stop.prevent="handleLeftClick"
    @mouseup.left.stop.prevent="handleMouseUp"
    @mousemove="handleMouseMove">
    <div class="background-image"
      v-if="showShortcutImage">
      <img
        :src="backgroundUrl">
      <div class="item-name">
        {{ itemInfo().baseName }}
      </div>
      <div class="item-description">
        {{ itemInfo().baseName }}
      </div>
      <div class="item-timing">
        {{ timecodeFromSeconds(itemInfo().lastTime) }}
      </div>
    </div>
    <div>
      <img class="logo" src="~@/assets/logo.png" alt="electron-vue">
    </div>

    <div class="welcome">
      <div class="title" v-bind:style="$t('css.titleFontSize')">{{ $t("msg.titleName") }}</div>
    </div>

    <div class="controller">
      <div class="playlist"
        v-if="hasRecentPlaylist">
        <div class="item"
          v-for="(item, index) in lastPlayedFile"
          :key="item.path"
          :style="{
              backgroundImage: itemShortcut(item.shortCut),
              width: item.chosen ? '140px' : '114px',
              height: item.chosen ? '80px' : '65px',
            }"
          @click="openFile(item.path)"
          @mouseover="onRecentItemMouseover(item, index)"
          @mouseout="onRecentItemMouseout(index)">
        </div>
      </div>
    </div>
    <div
      @click="open('./')">
      <img class="button" src="~@/assets/icon-open.svg" type="image/svg+xml">
    </div>
  </main>
</div>
</template>

<script>
import path from 'path';
export default {
  name: 'landing-view',
  data() {
    return {
      showingPopupDialog: false,
      lastPlayedFile: [],
      backgroundUrl: '',
      showShortcutImage: false,
      isDragging: false,
      mouseDown: false,
      windowStartPosition: null,
      mousedownPosition: null,
    };
  },
  components: {
  },
  computed: {
    hasRecentPlaylist() {
      return this.lastPlayedFile.length > 0;
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
      };
    },
    onRecentItemMouseover(item, index) {
      this.item = item;
      this.$set(this.lastPlayedFile[index], 'chosen', true);
      if (item.shortCut !== '') {
        this.isChanging = true;
        this.backgroundUrl = item.shortCut;
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
  background: radial-gradient( ellipse at top center,
  rgba(0, 0, 0, .9) 20%,
  rgba(44, 44, 44, .95) 80%);
  height: 100vh;
  width: 100vw;
  z-index: -1;
}
.background-image {
  position: absolute;
  width: 100%;
  height: 100%;

  .item-name {
    position: absolute;
    top: 100px;
    left: 45px;
    font-size: 30px;
    font-weight: bold;
  }
  .item-description {
    position: absolute;
    opacity: 0.4;
    top: 140px;
    left: 45px;
    font-size: 20px;
    font-weight: lighter;
  }
  .item-timing {
    position: absolute;
    opacity: 0.4;
    top: 160px;
    left: 45px;
    font-size: 20px;
    font-weight: lighter;
  }
  img {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
.logo {
  height: 136px;
  width: 136px;
  margin-top: 80px;
}

main {
  text-align: center;
  justify-content: space-between;
}

.welcome {
  margin-top: 15px;
  .title {
    font-size: 7vw;
    margin-bottom: 6px;
  }
  p {
    font-size: 2vw;
    color: gray;
    margin-bottom: 10px;
  }
}

.controller {
  position: absolute;
  left: 0;
  bottom: 40px;
  width: 100%;

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
      box-shadow: 0px 0px 30px 1px black;
      color: gray;
      cursor: pointer;
      margin-right: 15px;
      background-size: contain;
      background-color: black;
      background-repeat: no-repeat;
      background-position: center center;
      transition: width 150ms ease-out, height 150ms ease-out;
    }
  }
}
.button {
  position: absolute;
  bottom: 57px;
  right: 45px;
  width: 35px;
  height: 30px;
  font-size: .8em;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  border: 0px;
}

</style>
