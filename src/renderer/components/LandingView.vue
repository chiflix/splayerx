<template>
<div class="wrapper">
  <main>
    <div class="background-image"
      v-if="showShortcutImage">
      <img
        :src="backgroundUrl">
      <div class="item-name">
        {{ itemBasename() }}
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
          v-for="item in lastPlayedFile"
          :style="{ backgroundImage: itemShortcut(item.shortCut), backgroundPosition: 'center center', backgroundSize: '114px'}"
          @click="openFile(item.path)"
          @mouseover="onRecentItemMouseover(item)">
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
    itemBasename() {
      return path.basename(this.item.path, path.extname(this.item.path));
    },
    onRecentItemMouseover(item) {
      this.item = item;
      if (item.shortCut !== '') {
        this.backgroundUrl = item.shortCut;
        this.showShortcutImage = true;
      }
    },
    open(link) {
      if (this.showingPopupDialog) {
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
    top: 20px;
    left: 20px;
    font-size: 30px;
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
    margin-left: 45px;

    .item {
      color: #e4e4c4;
      background: radial-gradient( ellipse at top center,
      rgba(0, 0, 0, .9) 20%,
      rgba(44, 44, 44, .95) 80%);
      height: 65px;
      width: 114px;
      color: gray;
      cursor: pointer;
      margin-right: 15px;
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
