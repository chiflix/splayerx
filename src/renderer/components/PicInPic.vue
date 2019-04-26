<template>
  <div class="pip-container">
    <div class="mac-icons no-drag"
         v-if="isDarwin"
         @mouseover="state = 'hover'"
         @mouseout="state = 'default'">
      <Icon class="title-button"
            type="titleBarClose"
            :state="state"
            @click.native="handleClose"/>
      <Icon class="title-button-disable" type="titleBarExitFull"/>
      <Icon class="title-button-disable" type="titleBarFull"/>
    </div>
    <Icon class="win-title-button no-drag"
          v-if="!isDarwin"
          @click.native="handleClose"
          type="titleBarWinClose">
    </Icon>
    <div class="pip-buttons">
      <Icon type="pipRecord" :style="{ marginRight: '12px' }"></Icon>
      <Icon type="pipBack" @mouseup.native="handleExitPip"></Icon>
    </div>
    <div id="pip-video"></div>
  </div>
</template>

<script>
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'PictureInPicture',
  components: {
    Icon,
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  mounted() {
    electron.ipcRenderer.on('picInPicDispatch', (event, id) => {
      const player = new YT.Player('pip-video', {  // eslint-disable-line
        height: '100%',
        width: '100%',
        videoId: id,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onReady: this.onPlayerReady,
        },
      });
    });
  },
  methods: {
    handleExitPip() {
      electron.ipcRenderer.send('exit-picInPic');
      electron.remote.BrowserWindow.getFocusedWindow().close();
    },
    handleClose() {
      electron.remote.BrowserWindow.getFocusedWindow().close();
    },
    onPlayerReady(e) {
      document.querySelector('iframe').contentWindow.document.querySelector('.ytp-title-text').style.display = 'none';
      document.querySelector('iframe').contentWindow.document.querySelector('.ytp-title-channel').style.display = 'none';
      document.querySelector('iframe').contentWindow.document.querySelector('.ytp-chrome-top-buttons').style.display = 'none';
      document.querySelector('iframe').contentWindow.document.querySelector('.ytp-pause-overlay').remove();
      e.target.playVideo();
    },
  },
};
</script>

<style scoped lang="scss">
.pip-container {
  width: 100%;
  height: 100%;
  .mac-icons {
    position: absolute;
    top: 12px;
    left: 12px;
    width: fit-content;
    display: flex;
    flex-wrap: nowrap;
    .title-button {
      width: 12px;
      height: 12px;
      margin-right: 8px;
      background-repeat: no-repeat;
      -webkit-app-region: no-drag;
      border-radius: 100%;
    }
    .title-button-disable {
      pointer-events: none;
      opacity: 0.25;
    }
  }
  .win-title-button {
    position: absolute;
    top: 0;
    right: 0;
    width: 45px;
    height: 28px;
    background-color: rgba(255,255,255,0);
    transition: background-color 200ms;
    &:hover {
      background-color: rgba(221, 221, 221, 0.2);
    }
    &:active {
      background-color: rgba(221, 221, 221, 0.5);
    }
  }
  .pip-buttons {
    width: auto;
    height: 20px;
    display: flex;
    position: absolute;
    right: 10px;
    top: 10px;
  }
}
</style>
