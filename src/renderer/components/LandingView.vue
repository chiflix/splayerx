<template>
  <div class="wrapper"
    :data-component-name="$options.name"
    @mousedown.left="handleLeftClick"
    @mouseup.left.stop="handleMouseUp"
    @mousemove="handleMouseMove">
    <titlebar currentView="LandingView"></titlebar>
    <transition name="background-container-transition">
      <div class="background" v-if="showShortcutImage">
        <transition name="background-transition" mode="in-out">
          <div class="background-image"
          :key="item.path"
          :style="{
            backgroundImage: backgroundUrl,
          }">
            <div class="background-mask"/>
          </div>
        </transition>
        <div class="item-info">
          <div class="item-name">
            {{ item.baseName }}
          </div>
          <div class="item-description"/>
          <div class="item-timing">
            <span class="timing-played">
              {{ timeInValidForm(timecodeFromSeconds(item.lastTime)) }}</span>
            / {{ timeInValidForm(timecodeFromSeconds(item.duration)) }}
          </div>
          <div class="item-progress">
            <div class="progress-played" :style="{ width: item.percentage + '%' }"/>
          </div>
        </div>
      </div>
    </transition>
    <transition name="welcome-container-transition">
      <div class="welcome-container" v-if="landingLogoAppear">
        <div class="logo-container">
          <Icon type="logo"/>
        </div>
        <div class="welcome">
          <div class="title" :style="$t('css.titleFontSize')">{{ $t("msg.titleName") }}</div>
        </div>
      </div>
    </transition>
    <div class="mask"
      :style="{
        backgroundColor: maskBackground
      }"/>
    <playlist
      :lastPlayedFile="lastPlayedFile"
      :isFullScreen="isFullScreen"
      :winWidth="winWidth"
      :filePathNeedToDelete="filePathNeedToDelete"
      @displayInfo="displayInfoUpdate"/>
    <NotificationBubble/>

  </div>
</template>

<script>
import fs from 'fs';
import { mapState, mapGetters } from 'vuex';
import Icon from '@/components/BaseIconContainer.vue';
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
      showShortcutImage: false,
      mouseDown: false,
      invalidTimeRepresentation: '--',
      landingLogoAppear: true,
      backgroundUrl: '',
      cover: '',
      item: [],
      isDragging: false,
      filePathNeedToDelete: '',
      maskBackground: 'rgba(255, 255, 255, 0)', // drag and drop related var
    };
  },
  watch: {
  },
  components: {
    Icon,
    Titlebar,
    Playlist,
    NotificationBubble,
  },
  computed: {
    ...mapState({
      version: state => state.App.version,
      isFullScreen: state => state.Window.isFullScreen,
    }),
    ...mapGetters(['winWidth']),
  },
  created() {
    // Get all data and show
    asyncStorage.get('preferences').then((data) => {
      if (!data.deleteVideoHistoryOnExit) {
        this.infoDB.sortedResult('recent-played', 'lastOpened', 'prev')
          .then((data) => {
            const waitArray = [];
            for (let i = 0; i < data.length; i += 1) {
              const accessPromise = new Promise((resolve) => {
                fs.access(data[i].path, fs.constants.F_OK, (err) => {
                  if (err) {
                    this.infoDB.delete('recent-played', data[i].quickHash);
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
      } else {
        this.infoDB.cleanData();
      }
    });
    this.$bus.$on('clean-lastPlayedFile', () => {
      // just for delete thumbnail display
      this.lastPlayedFile = [];
      this.landingLogoAppear = true;
      this.showShortcutImage = false;
    });
    // trigger by playFile function when opened file not existed
    this.$bus.$on('file-not-existed', (filePath) => {
      this.filePathNeedToDelete = filePath;
      this.lastPlayedFile.forEach((file) => {
        if (file.path === filePath) {
          this.infoDB.delete('recent-played', file.quickHash);
        }
      });
    });
    // responsible for delete the thumbnail on display which had already deleted in DB
    this.$bus.$on('delete-file', () => {
      if (this.filePathNeedToDelete) {
        for (let i = 0; i < this.lastPlayedFile.length; i += 1) {
          if (this.lastPlayedFile[i].path === this.filePathNeedToDelete) {
            this.lastPlayedFile.splice(i, 1);
            this.landingLogoAppear = true;
            this.showShortcutImage = false;
            this.filePathNeedToDelete = '';
            break;
          }
        }
      }
    });
    this.$bus.$on('drag-over', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0.18)';
    });
    this.$bus.$on('drag-leave', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0)';
    });
    this.$bus.$on('drop', () => {
      this.maskBackground = 'rgba(255, 255, 255, 0)';
    });
  },
  mounted() {
    this.$store.dispatch('refreshVersion');

    const { app } = this.$electron.remote;
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setResizable', [true]);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [720, 405]);
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [720 / 405]);

    this.sagi.healthCheck().then((status) => {
      if (process.env.NODE_ENV !== 'production') {
        this.sagiHealthStatus = status;
        this.addLog('info', `launching: ${app.getName()} ${app.getVersion()}`);
        this.addLog('info', `sagi API Status: ${this.sagiHealthStatus}`);
      }
    });
  },
  methods: {
    displayInfoUpdate(displayInfo) {
      this.backgroundUrl = displayInfo.backgroundUrl;
      this.cover = displayInfo.cover;
      this.landingLogoAppear = displayInfo.landingLogoAppear;
      this.showShortcutImage = displayInfo.showShortcutImage;
      this.item.baseName = displayInfo.baseName;
      this.item.lastTime = displayInfo.lastTime;
      this.item.duration = displayInfo.duration;
      this.item.percentage = displayInfo.percentage;
      this.item.path = displayInfo.path;
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
  .mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transition: background-color 120ms linear;
  }
}
.background {
  position: absolute;
  width: 100%;
  height: 100%;

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    -webkit-user-drag: none;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;

    .background-mask {
      width: 100%;
      height: 100%;
      background-image: radial-gradient(circle at 37% 35%, rgba(0,0,0,0.00) 13%, rgba(0,0,0,0.43) 47%, rgba(0,0,0,0.80) 100%);
    }
  }
  .item-info {
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
    line-height: 36px;
    font-weight: bold;
    z-index: 4;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: 600;
    letter-spacing: 1px;
    @media screen and (min-width: 1355px) {
      font-size: 2.21vw;
      line-height: 2.66vw;
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
  transition: opacity 300ms linear;
}
.background-transition-enter, .background-transition-leave-to {
  opacity: 0;
}
.background-transition-enter-to, .background-transition-leave {
  opacity: 1;
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
