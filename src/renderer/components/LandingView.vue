<template>
<div id="wrapper">
  <main>
    <div>
      <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    </div>

    <div class="welcome">
      <div class="title">SPlayerX</div>
      <p> {{ version }} </p>
    </div>

    <div class="controller">
      <div class="playlist">
        <a class="item" v-if="hasRecentPlaylist" href="#" @click="openFile(lastPlayedFile)">
        </a>
      </div>
      <button @click="open('./')">
        <img src="~@/assets/icon-open.svg" type="image/svg+xml">
      </button>
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
      lastPlayedFile: '',
      version: '',
    };
  },
  components: {
  },
  computed: {
    hasRecentPlaylist() {
      return this.lastPlayedFile && this.lastPlayedFile.length > 0;
    },
  },
  mounted() {
    const { app } = this.$electron.remote;
    this.version = app.getVersion();
    console.log(app.getVersion(), app.getName());

    this.$storage.get('recent-played', (err, data) => {
      if (err) {
        // TODO: proper error handle
        console.error(err);
      } else {
        this.lastPlayedFile = data;
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
    openFile(path) {
      this.$storage.set('recent-played', path);
      this.$router.push({
        name: 'playing-view',
        params: {
          uri: path,
        },
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

#wrapper {
  background: radial-gradient( ellipse at top center,
  rgba(0, 0, 0, .9) 20%,
  rgba(44, 44, 44, .95) 80%);
  height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}

#logo {
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

.welcome .title {
  font-size: 7vw;
  margin-bottom: 6px;
}

.welcome p {
  font-size: 2vw;
  color: gray;
  margin-bottom: 10px;
}

.controller a {
  color: #e4e4c4;
}

.controller {
  position: absolute;
  right: 0;
  bottom: 1em;
  width: 100vw;
}

.controller .playlist {
  display: block;
  margin-left: 1em;
  float: left;
}

.controller .playlist .item {
  display: block;
  background: radial-gradient( ellipse at top center,
  rgba(0, 0, 0, .9) 20%,
  rgba(44, 44, 44, .95) 80%);
  height: 4.5em;
  width: 8em;
  color: gray;
  cursor: pointer;
}

.controller button {
  position: absolute;
  bottom: 1em;
  right: 1em;
  font-size: .8em;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  border: 0px;
}

.controller button.alt {
  background-color: transparent;
}

</style>
