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
        <div class="logo-container">
          <img class="logo" src="~@/assets/logo.png" alt="electron-vue">
        </div>

        <div class="welcome">
          <div class="title" v-bind:style="$t('css.titleFontSize')">{{ $t("msg.titleName") }}</div>
          <div class="version">v {{ this.$electron.remote.app.getVersion() }}</div>
        </div>
      </div>
  </transition>
      <playlist :lastPlayedFile="lastPlayedFile"></playlist>
  <Openbutton :isDragging="isDragging"></Openbutton>
  </main>
</div>
</template>

<script>
import asyncStorage from '@/helpers/asyncStorage';
import Titlebar from './Titlebar.vue';
import Playlist from './LandingView/Playlist.vue';
import Openbutton from './LandingView/Openbutton.vue';

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
    };
  },
  components: {
    Titlebar,
    Playlist,
    Openbutton,
  },
  computed: {
  },
  mounted() {
    const { app } = this.$electron.remote;
    if (this.$electron.remote.getCurrentWindow().isResizable()) {
      this.$electron.remote.getCurrentWindow().setResizable(false);
    }

    this.sagi().healthCheck().then((status) => {
      if (process.env.NODE_ENV !== 'production') {
        this.sagiHealthStatus = status;
        console.log(app.getName(), app.getVersion());
        console.log(`sagi API Status: ${this.sagiHealthStatus}`);
      }
    });
    asyncStorage.get('recent-played').then((data) => {
      this.lastPlayedFile = data;
    }).catch((err) => {
      // TODO: proper error handle
      console.error(err);
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
