<template>
  <div class="content">
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
      </Icon>
    </div>
    <Icon class="win-title-button no-drag"
      v-if="!isDarwin"
      @click.native="handleClose"
      type="titleBarWinClose">
    </Icon>
    <img class="winLogo" src="../assets/win-about-logo.png" draggable="false">
    <div class="name">{{ name }}</div>
    <div class="version">{{ `Version ${version} (${version})` }}</div>
    <div class="copyright">Copyright © 2018 tomasen</div>
  </div>
</template>

<script>
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'About',
  components: {
    Icon,
  },
  data() {
    return {
      state: 'default',
    };
  },
  computed: {
    name() {
      return electron.remote.app.getName();
    },
    version() {
      return electron.remote.app.getVersion();
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  methods: {
    handleClose() {
      electron.remote.BrowserWindow.getFocusedWindow().close();
    },
  },
};
</script>

<style scoped lang="scss">
  .content {
    width: 100%;
    height: 100%;
    background: url("../assets/windows-about.jpg");
    opacity: 0.95;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
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
    .winLogo {
      width: 96px;
      margin: 67px auto 0 auto;
    }
    .name {
      font-size: 20px;
      margin: -15px auto 0 auto;
      color: rgba(255, 255 ,255 , 1);
    }
    .version {
      font-size: 12px;
      letter-spacing: 0.3px;
      margin: 7px auto 0 auto;
      color: rgba(255, 255 ,255 , 0.8);
    }
    .copyright {
      font-size: 11px;
      letter-spacing: 0.5px;
      color: rgba(255, 255 ,255 , 0.3);
      margin: auto auto 14px auto;
    }
  }
</style>
