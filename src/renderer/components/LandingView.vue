<template>
<div id="wrapper">
 
  <img id='bg1' v-if='n==1' src="../assets/bg1.jpg">
  <img id='bg2' v-if='n==2' src="../assets/bg2.jpg">
  <img id='bg3' v-if='n==3' src="../assets/bg3.jpg">
  <img id='bg4' v-if='n==4' src="../assets/bg4.jpg">
  <main>
    <div>
      <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    </div>

    <div class="welcome">
      <div class="title" v-bind:style="$t('css.titleFontSize')">{{ $t("msg.titleName") }}</div>
      <p> {{ version }} </p>
    </div>

    <div class="controller"> 
      <div class="playlist" >
        <div class="recentplayed" v-if="hasRecentPlaylist">Recent played</div>
        <a class="item" v-if="hasRecentPlaylist" href="#" @click="openFile(lastPlayedFile)"><img src="~@/assets/bg1.jpg" @mouseenter='fillImg(1)'></a>
        <a class="item" v-if="hasRecentPlaylist" href="#" @click="openFile(lastPlayedFile)"><img src="~@/assets/bg2.jpg" @mouseenter='fillImg(2)'></a>
        <a class="item" v-if="hasRecentPlaylist" href="#" @click="openFile(lastPlayedFile)"><img src="~@/assets/bg3.jpg" @mouseenter='fillImg(3)'></a>
        <a class="item" v-if="hasRecentPlaylist" href="#" @click="openFile(lastPlayedFile)"><img src="~@/assets/bg4.jpg" @mouseenter='fillImg(4)'></a>
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
      n: '0',
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
      this.$store.commit('SrcOfVideo', path);
      this.$router.push({
        name: 'playing-view',
      });
    },
    fillImg(arg) {
      this.n = arg;
      console.log('鼠标放入');
      console.log(this.n);
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
  padding: 0 80px;
  width: 100vw;
}
#wrapper #bg1, #wrapper #bg2, #wrapper #bg3, #wrapper #bg4 {
  position: fixed;
  top: 1px;
  left: -1px;
  z-index: 55;
  // opacity:0.9;
  width: 100%; 
  height: 100%;  
}
// #wrapper .bgc{
//   height: 100vh;
//   width: 100vw;
// }
#logo {
  position: relative;
  height: auto;
  margin-bottom: 20px;
  margin-top: 5vh;
  width: 20vw;
  // z-index: 30;
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
  // display: inline-block;
  color: #e4e4c4;
  float: left;
  width: 40vw;
  height: 20vh;
  margin: 40px 15px 40px 0px;
}
.controller a:first-child {
  // display: inline-block;
  margin-left: 180px;
  // margin-left: -2000vh;
}

.controller a img{ 
    width: 100%; 
    height: 100%;  
    max-width: 100%;  
    max-height: 100%;
    transition: all 0.15s;
    // white-space: nowrap;
    // display: flex;
    // flex-wrap: nowrap;
}
.controller a img:hover{
  transform: scale(1.4);
  }

.controller {
  // position: absoulte;
  // left: 0px;
  // bottom: 1em;
  margin-top: 30px;
  margin-left: -45px;
  width: 100vw;
  overflow: hidden;
  // display: flex;
  // flex-wrap: nowrap;
}

.controller .playlist {
  position: relative;
  display: block;
  // margin-left: 1em;
  // margin-top: 30px;
  // padding-left: 45px;
  float: left;
  z-index: 100;
}
.controller .playlist .recentplayed{
   position: absolute;
  //  bottom: 3em;
  //  left: 1em;
  //  margin-left: -80vh;
   color: white;
   font-size: 2vw;
   z-index: 100;
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
  z-index: 100;
}

.controller button.alt {
  background-color: transparent;
}

</style>
