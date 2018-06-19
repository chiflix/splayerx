<template>
<div class="wrapper">
  <main>
    <div>
      <img class="logo" src="~@/assets/logo.png" alt="electron-vue">
    </div>

    <div class="welcome">
      <div class="title" v-bind:style="$t('css.titleFontSize')">{{ $t("msg.titleName") }}</div>
      <p> {{ version }} </p>
    </div>

    <div class="controller">
        <div class="playlist"
          v-if="hasRecentPlaylist">
          <div class="item"
            v-for="item in lastPlayedFile"
            @click="openFile(item.path)">
          </div>
        </div>
      <div class="button"
        @click="open('./')">
        <img src="~@/assets/icon-open.svg" type="image/svg+xml">
      </div>
    </div>
  </main>
</div>
</template>

<script>
export default {
  name: 'landing-view',
  data() {
    return {
      showingPopupDialog: false,
      lastPlayedFile: [],
      version: '',
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

    this.version = app.getVersion();
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
  padding: 60px 80px;
  width: 100vw;
}

.logo {
  height: auto;
  margin-bottom: 20px;
  margin-top: 5vh;
  width: 20vw;
}

main {
  text-align: center;
  justify-content: space-between;
}

main>div {
  flex-basis: 50%;
}

.welcome {
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
  right: 0;
  bottom: 40px;
  width: 100vw;

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

  .button {
    position: absolute;
    bottom: 1em;
    right: 1em;
    font-size: .8em;
    cursor: pointer;
    outline: none;
    transition: all 0.15s ease;
    border: 0px;

    .alt {
      background-color: transparent;
    }
  }
}

</style>
