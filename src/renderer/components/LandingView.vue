<template>
<div id="wrapper">
  <main>
    <div class="title">
      <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    </div>

    <div class="welcome">
      <div class="title">SPlayerX</div>
      <p>
        {{ version }}
      </p>
      <button @click="open('./')">Open</button>
      <br/><br/>
      <button v-if="showTestButton" @click="openFile(lastPlayedFile)">test {{ lastPlayedFile }}</button>
    </div>
  </main>
</div>
</template>

<script>
import SystemInformation from './LandingView/SystemInformation';

export default {
  name: 'landing-view',
  data() {
    return {
      showingPopupDialog: false,
      lastPlayedFile: '',
    };
  },
  components: {
    SystemInformation,
  },
  computed: {
    showTestButton() {
      return this.lastPlayedFile && this.lastPlayedFile.length > 0;
    },
  },
  mounted() {
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

      this.showingPopupDialog = true;
      dialog.showOpenDialog(focusedWindow, {
        title: 'Open Dialog',
        defaultPath: link,
        filters: [{
          name: 'Video Files',
          extensions: VALID_EXTENSION,
        }],
        properties: ['openFile'],
      }, (item) => {
        this.showingPopupDialog = false;
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

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  color: white;
}

#wrapper {
  background: radial-gradient( ellipse at top left,
  rgba(0, 0, 0, 1) 40%,
  rgba(229, 229, 229, .9) 100%);
  height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}

#logo {
  height: auto;
  margin-bottom: 20px;
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
  font-size: 3em;
  margin-bottom: 6px;
}

.welcome p {
  color: gray;
  margin-bottom: 10px;
}

.welcome button {
  font-size: .8em;
  cursor: pointer;
  outline: none;
  padding: 0.75em 2em;
  border-radius: 2em;
  display: inline-block;
  color: #fff;
  background-color: #4fc08d;
  transition: all 0.15s ease;
  box-sizing: border-box;
  border: 1px solid #4fc08d;
}

.welcome button.alt {
  color: #42b983;
  background-color: transparent;
}
</style>
