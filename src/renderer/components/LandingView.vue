<template>
<div class="wrapper">
  <main
    @mousedown.left.stop="handleLeftClick"
    @mouseup.left.stop="handleMouseUp"
    @mousemove="handleMouseMove">
    <titlebar currentView="LandingView"></titlebar>
    <transition name="background-container-transition" mode="">
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
          <div class="logo-container" :style="{
             paddingTop: `${logoPos}px`
        }">
              <img class="logo" src="~@/assets/logo.png" alt="electron-vue">
          </div>

        <div class="welcome">
          <div class="title" v-bind:style="$t('css.titleFontSize')">{{ $t("msg.titleName") }}</div>
          <div class="version">v {{ this.$electron.remote.app.getVersion() }}</div>
        </div>
      </div>
  </transition>
      <playlist :lastPlayedFile="lastPlayedFile" :changeSize="changeSize" :showItemNum="showItemNum"
                :isFull="isFull"
                :style="{marginLeft: this.windowFlag ? `${this.playlistMl}px` : '0px',
                         paddingLeft: this.isFull ? '0px' : this.moveItem ? `${this.exitFullScreen}px` : '0px'}"/>
  </main>
</div>
</template>

<script>
import asyncStorage from '@/helpers/asyncStorage';
import Titlebar from './Titlebar.vue';
import Playlist from './LandingView/Playlist.vue';

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
      item: [],
      isDragging: false,
      logoPos: (405 * 0.37) - 92,
      showItemNum: 5,
      changeSize: (112 / 720) * 100,
      lastSize: 847,
      playlistMl: 0,
      ifMargin: false,
      windowFlag: false,
      moveItem: 0,
      move: 0,
      isFull: false,
      exitFullScreen: '',
    };
  },
  components: {
    Titlebar,
    Playlist,
  },
  computed: {
  },
  created() {
    /*
    * Currently use electron-json-storage as buffer for saving the last screenshot
    * and any info needed to be saved before window closed.
    * Following code is to merge the buffer into DataBase.
    */
    this.infoDB().init()
      .then(() => asyncStorage.get('recent-played'))
      .then(async (data) => {
        const val = await this.infoDB().lastPlayed();
        if (val && data) {
          const mergedData = Object.assign(val, data);
          this.infoDB().add('recent-played', mergedData);
        }
      })

    // Get all data and show
      .then(() => {
        this.infoDB().sortedResult('recent-played', 'lastOpened', 'prev').then((data) => {
          console.log(data);
          this.lastPlayedFile = data.slice(0, 9);
        });
      });
  },
  mounted() {
    this.$bus.$on('moveItem', (moveItem) => {
      this.moveItem = moveItem;
      if (this.moveItem === 0) {
        this.windowFlag = false;
      }
    });
    this.windowFlag = false;
    this.$bus.$on('ifMargin', (ifMargin) => {
      this.ifMargin = ifMargin;
    });
    this.$bus.$on('move', (move) => {
      this.move = move;
    });
    window.onresize = () => {
      if (this.ifMargin) {
        this.windowFlag = true;
      }
      if (this.$electron.remote.getCurrentWindow().isFullScreen()) {
        this.windowFlag = false;
        this.isFull = true;
      } else {
        this.exitFullScreen = this.move;
        this.windowFlag = true;
        this.isFull = false;
      }
      this.logoPos = (document.body.clientHeight * 0.37) - 100;
      const changingWidth = document.body.clientWidth;
      const add = ((this.showItemNum + 1) * 112) + (this.showItemNum * 15);
      const sup = ((this.showItemNum * 112) + ((this.showItemNum - 1) * 15));
      let averageWidth = (changingWidth - 100 - ((this.showItemNum - 1) * 15)) / this.showItemNum;
      if (this.moveItem === 0) {
        this.playlistMl = 0;
      } else {
        this.playlistMl = ((this.moveItem * 127) - this.move) -
          ((averageWidth - 112) * -this.moveItem);
      }
      this.changeSize = (averageWidth / changingWidth) * 100;
      if (changingWidth - (100 + add) >= 0 && this.showItemNum <= 9) {
        if (((changingWidth - this.lastSize) + 127) / 127 <= 5) {
          this.showItemNum += Math.floor(((changingWidth - this.lastSize) + 127) / 127);
          if (this.showItemNum > 10) {
            this.showItemNum = 10;
          }
          averageWidth = (changingWidth - 100 - ((this.showItemNum - 1) * 15)) /
            this.showItemNum;
          this.lastSize += 127 * Math.floor(((changingWidth - this.lastSize) + 127) / 127);
          this.changeSize = (averageWidth / changingWidth) * 100;
          if (this.moveItem === 0) {
            this.playlistMl = 0;
          } else {
            this.playlistMl = ((this.moveItem * 127) - this.move) -
              ((averageWidth - 112) * -this.moveItem);
          }
        } else {
          this.showItemNum = 10;
          this.lastSize = 1482;
          averageWidth = (changingWidth - 100 - ((this.showItemNum - 1) * 15)) /
            this.showItemNum;
          this.changeSize = ((changingWidth - 235) / (10 * changingWidth)) * 100;
          if (this.moveItem === 0) {
            this.playlistMl = 0;
          } else {
            this.playlistMl = ((this.moveItem * 127) - this.move) -
              ((averageWidth - 112) * -this.moveItem);
          }
        }
      } else if (changingWidth - (100 + sup) <= 0 && this.showItemNum >= 6) {
        if ((this.lastSize - changingWidth) / 127 <= 5) {
          if (changingWidth === 720) {
            this.showItemNum -= Math.floor((this.lastSize - changingWidth) / 127) - 1;
          } else {
            this.showItemNum -= Math.floor((this.lastSize - changingWidth) / 127);
          }
          averageWidth = (changingWidth - 100 - ((this.showItemNum - 1) * 15)) /
            this.showItemNum;
          this.lastSize -= 127 * Math.floor((this.lastSize - changingWidth) / 127);
          if (this.lastSize < 847) {
            this.lastSize = 847;
          }
          this.changeSize = (averageWidth / changingWidth) * 100;
          if (this.moveItem === 0) {
            this.playlistMl = 0;
          } else {
            this.playlistMl = ((this.moveItem * 127) - this.move) -
              ((averageWidth - 112) * -this.moveItem);
          }
        } else {
          this.showItemNum = 5;
          averageWidth = (changingWidth - 100 - ((this.showItemNum - 1) * 15)) /
            this.showItemNum;
          this.lastSize = 847;
          this.changeSize = (averageWidth / changingWidth) * 100;
          if (this.moveItem === 0) {
            this.playlistMl = 0;
          } else {
            this.playlistMl = ((this.moveItem * 127) - this.move) -
              ((averageWidth - 112) * -this.moveItem);
          }
        }
      } else if (changingWidth > 1355) {
        this.showItemNum = 10;
        this.changeSize = ((changingWidth - 235) / (10 * changingWidth)) * 100;
        if (this.moveItem === 0) {
          this.playlistMl = 0;
        } else {
          this.playlistMl = ((this.moveItem * 127) - this.move) -
            ((averageWidth - 112) * -this.moveItem);
        }
      }
    };
    const { app } = this.$electron.remote;
    this.$electron.remote.getCurrentWindow().setResizable(true);
    this.$electron.remote.getCurrentWindow().setAspectRatio(720 / 405);
    this.sagi().healthCheck().then((status) => {
      if (process.env.NODE_ENV !== 'production') {
        this.sagiHealthStatus = status;
        console.log(app.getName(), app.getVersion());
        console.log(`sagi API Status: ${this.sagiHealthStatus}`);
      }
    });
    if (process.platform === 'win32') {
      document.querySelector('.application').style.webkitAppRegion = 'no-drag';
      document.querySelector('.application').style.borderRadius = 0;
    }
    this.$bus.$on('displayInfo', (displayInfo) => {
      this.imageTurn = displayInfo.imageTurn;
      this.backgroundUrl = displayInfo.backgroundUrl;
      this.langdingLogoAppear = displayInfo.langdingLogoAppear;
      this.showShortcutImage = displayInfo.showShortcutImage;
      this.item.baseName = displayInfo.baseName;
      this.item.lastTime = displayInfo.lastTime;
      this.item.duration = displayInfo.duration;
      this.item.percentage = displayInfo.percentage;
    });
  },
  methods: {
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
    z-index: 4;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: 600;
    letter-spacing: 1px;
  }
  .item-description {
    opacity: 0.4;
    font-size: 14px;
    font-weight: lighter;
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
      width: 70px;
      background-color: #fff;
      opacity: 0.7;
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
  .logo {
    height: 136px;
    width: 136px;
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
    font-weight: 500;
    letter-spacing: 1.5px;
  }
  .version {
    margin-top: 5px;
    font-size: 2vw;
    color: #AAA;
    font-weight: 100;
    letter-spacing: 1px;
  }
  p {
    font-size: 2vw;
    color: gray;
    margin-bottom: 10px;
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
