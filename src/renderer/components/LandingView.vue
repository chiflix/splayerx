<template>
<div
  :data-component-name="$options.name"
  class="wrapper">
  <main
    @mousedown.left.stop="handleLeftClick"
    @mouseup.left.stop="handleMouseUp"
    @mousemove="handleMouseMove">
    <titlebar currentView="LandingView"></titlebar>
    <notification-bubble/>
    <transition name="background-container-transition" mode="">
      <div class="background"
        v-if="showShortcutImage">
        <div class="background background-image">
          <transition name="background-transition" mode="in-out">
            <div
            class="img"
            :key="imageTurn"
            :style="{
              backgroundImage: backgroundImage(backgroundUrl, cover),
            }"></div>
          </transition>
        </div>
       <div class="background background-mask"/>
         <div class="iteminfo item-name">
          {{ item.baseName }}
        </div>
        <div class="iteminfo item-description">
        </div>
        <div class="iteminfo item-timing">
          <span class="timing-played">
            {{ timeInValidForm(timecodeFromSeconds(item.lastTime)) }}</span>
          / {{ timeInValidForm(timecodeFromSeconds(item.duration)) }}
        </div>
        <div class="iteminfo item-progress">
          <div class="progress-played" v-bind:style="{ width: item.percentage + '%' }"></div>
        </div>
      </div>
    </transition>
    <transition name="welcome-container-transition" mode="">
      <div class="welcome-container" v-if="langdingLogoAppear">
          <div class="logo-container">
              <img class="logo" src="~@/assets/logo.png" alt="electron-vue">
          </div>
          <div class="welcome">
          <div class="title" :style="$t('css.titleFontSize')">{{ $t("msg.titleName") }}</div>
        </div>
      </div>
  </transition>
      <playlist 
        :lastPlayedFile="lastPlayedFile"
        :isFullScreen="isFullScreen"
        :winWidth="winWidth"
        :filePathNeedToDelete="filePathNeedToDelete"/>
  </main>
</div>
</template>

<script>
import fs from 'fs';
import { mapState, mapGetters } from 'vuex';
import asyncStorage from '@/helpers/asyncStorage';
import Titlebar from './Titlebar.vue';
import Playlist from './LandingView/Playlist.vue';
import NotificationBubble from './NotificationBubble.vue';
export default {
  name: 'landing-view',
  data() {
    return {
      lastPlayedFile: [],
      sagiHealthStatus: 'UNSET',
      imageTurn: '',
      showShortcutImage: false,
      mouseDown: false,
      invalidTimeRepresentation: '--',
      langdingLogoAppear: true,
      backgroundUrl: '',
      cover: '',
      item: [],
      isDragging: false,
      filePathNeedToDelete: '',
    };
  },
  watch: {
  },
  components: {
    Titlebar,
    Playlist,
    'notification-bubble': NotificationBubble,
  },
  computed: {
    ...mapState({
      version: state => state.App.version,
      isFullScreen: state => state.Window.isFullScreen,
    }),
    ...mapGetters(['winWidth']),
  },
  created() {
    /*
    * Currently use electron-json-storage as buffer for saving the last screenshot
    * and any info needed to be saved before window closed.
    * Following code is to merge the buffer into DataBase.
    */
    asyncStorage.get('recent-played')
      .then(async (data) => {
        const val = await this.infoDB().lastPlayed();
        if (val && data) {
          const mergedData = Object.assign(val, data);
          asyncStorage.set('recent-played', {});
          await this.infoDB().add('recent-played', mergedData);
          if (this.$store.getters.deleteVideoHistoryOnExit) {
            await this.infoDB().cleanData();
          }
        }
      })

    // Get all data and show
      .then(() => this.infoDB().sortedResult('recent-played', 'lastOpened', 'prev'))
      .then((data) => {
        const waitArray = [];
        for (let i = 0; i < data.length; i += 1) {
          const accessPromise = new Promise((resolve) => {
            fs.access(data[i].path, fs.constants.F_OK, (err) => {
              if (err) {
                this.infoDB().delete('recent-played', data[i].quickHash);
                resolve();
              } else {
                resolve(data[i]);
              }
            });
          });
          waitArray.push(accessPromise);
        }
        return Promise.all(waitArray);
      })
      .then((data) => {
        for (let i = 0; i < data.length; i += 1) {
          if (data[i] === undefined) {
            data.splice(i, 1);
          }
        }
        this.lastPlayedFile = data.slice(0, 9);
      });
    this.$bus.$on('clean-lastPlayedFile', () => {
      this.lastPlayedFile = [];
      this.langdingLogoAppear = true;
      this.showShortcutImage = false;
      this.infoDB().cleanData();
    });
    // trigger by openFile function when opened file not existed
    this.$bus.$on('file-not-existed', (filePath) => {
      this.filePathNeedToDelete = filePath;
      this.lastPlayedFile.forEach((file) => {
        if (file.path === filePath) {
          this.infoDB().delete('recent-played', file.quickHash);
        }
      });
    });
    // responsible for delete the thumbnail on display which had already deleted in DB
    this.$bus.$on('delete-file', () => {
      if (this.filePathNeedToDelete) {
        for (let i = 0; i < this.lastPlayedFile.length; i += 1) {
          if (this.lastPlayedFile[i].path === this.filePathNeedToDelete) {
            this.lastPlayedFile.splice(i, 1);
            this.langdingLogoAppear = true;
            this.showShortcutImage = false;
            this.filePathNeedToDelete = '';
            break;
          }
        }
      }
    });
  },
  beforeDestroy() {
    window.onresize = null;
  },
  mounted() {
    this.$store.dispatch('refreshVersion');

    const { app } = this.$electron.remote;
    this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setResizable', [true]);
    this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setAspectRatio', [720 / 405]);

    this.sagi().healthCheck().then((status) => {
      if (process.env.NODE_ENV !== 'production') {
        this.sagiHealthStatus = status;
        this.addLog('info', `launching: ${app.getName()} ${app.getVersion()}`);
        this.addLog('info', `sagi API Status: ${this.sagiHealthStatus}`);
      }
    });
    this.$bus.$on('displayInfo', (displayInfo) => {
      this.imageTurn = displayInfo.imageTurn;
      this.backgroundUrl = displayInfo.backgroundUrl;
      this.cover = displayInfo.cover;
      this.langdingLogoAppear = displayInfo.langdingLogoAppear;
      this.showShortcutImage = displayInfo.showShortcutImage;
      this.item.baseName = displayInfo.baseName;
      this.item.lastTime = displayInfo.lastTime;
      this.item.duration = displayInfo.duration;
      this.item.percentage = displayInfo.percentage;
    });
  },
  methods: {
    backgroundImage(shortCut, cover) {
      return this.item.duration - this.item.lastTime < 5 ? `url("${cover}")` : `url("${shortCut}")`;
    },
    timeInValidForm(time) {
      return (Number.isNaN(time) ? this.invalidTimeRepresentation : time);
    },
    handleLeftClick() {
      // Handle dragging-related variables
      this.mouseDown = true;
      this.isDragging = false;
    },
    handleMouseMove() {
      // Handle dragging-related variables and methods
      if (this.mouseDown) {
        this.isDragging = true;
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
  background-size: cover;
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
  .img {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    -webkit-user-drag: none;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
  }
  .iteminfo {
    position: relative;
    top: 100px;
    left: 45px;
    z-index: 4;
    @media screen and (min-width: 1355px) {
      top: 7.38vw;
      left: 3.32vw;
    }
  }
  .item-name {
    width: 70%;
    word-break: break-all;
    font-size: 30px;
    line-height: 30px;
    font-weight: bold;
    z-index: 4;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: 600;
    letter-spacing: 1px;
    @media screen and (min-width: 1355px) {
      font-size: 2.21vw;
      line-height: 2.21vw;
    }
  }
  .item-description {
    opacity: 0.4;
    font-size: 14px;
    font-weight: lighter;
    @media screen and (min-width: 1355px) {
      font-size: 1.03vw;
    }
  }
  .item-timing {
    color: rgba(255, 255, 255, .4);
    font-size: 15px;
    font-weight: 400;
    letter-spacing: .5px;
    margin-top: 10px;
    span.timing-played {
      color: rgba(255, 255, 255, .9);
    }
    @media screen and (min-width: 1355px) {
      font-size: 1.10vw;
    }
  }
  .item-progress {
    width: 100px;
    height: 4px;
    margin-top: 9px;
    border-radius: 1px;
    background-color: rgba(255, 255, 255, 0.2);
    overflow: hidden;
    .progress-played {
      height: 100%;
      background-color: #fff;
      opacity: 0.7;
    }
    @media screen and (min-width: 1355px) {
      width: 7.38vw;
      height: 0.3vw;
      margin-top: 0.66vw;
    }
  }
}
.welcome-container {
  --client-height: 100vh;
  --pos-y: calc(var(--client-height) * 0.37 - 82px);
  transform: translateY(var(--pos-y));
}
.logo-container {
  -webkit-user-select: none;
  text-align: center;
  .logo {
    height: 120px;
    width: 120px;
  }
}

main {
  justify-content: space-between;
}

.welcome {
  margin-top: 7px;
  text-align: center;
  z-index: 1;

  .title {
    font-weight: 700;
    color: rgba(0,0,0,0.13);
    letter-spacing: 1.5px;
  }
  .version {
    margin-top: 3px;
    color: rgba(0,0,0,0.2);
    font-weight: 100;
    letter-spacing: 1px;
  }
}

.background-transition-enter-active, .background-transition-leave-active {
  transition: opacity .3s ease-in;
  transition-delay: .2s;
}
.background-transition-enter, .background-transition-leave-to {
  opacity: 0;
}

.welcome-container-transition-enter-active, .welcome-container-transition-leave-active{
  transition: opacity .3s ease-in;
  transition-delay: .2s;
}

.welcome-container-transition-enter, .welcome-container-transition-leave-to {
  opacity: 0;
}

.background-container-transition-enter-active, .background-container-transition-leave-active{
  transition: opacity .3s ease-in;
  transition-delay: .2s;
}

.background-container-transition-enter, .background-container-transition-leave-to{
  opacity: 0;
}

</style>
