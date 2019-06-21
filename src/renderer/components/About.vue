<template>
  <div class="content">
    <div
      v-if="isDarwin"
      @mouseover="state = 'hover'"
      @mouseout="state = 'default'"
      class="mac-icons no-drag"
    >
      <Icon
        :state="state"
        @click.native="handleClose"
        class="title-button"
        type="titleBarClose"
      />
      <Icon
        class="title-button-disable"
        type="titleBarExitFull"
      />
      <Icon
        class="title-button-disable"
        type="titleBarFull"
      />
    </div>
    <Icon
      v-if="!isDarwin"
      @click.native="handleClose"
      class="win-title-button no-drag"
      type="titleBarWinClose"
    />
    <img
      class="winLogo"
      src="../assets/win-about-logo.png"
      draggable="false"
    >
    <div class="name">
      {{ name }}
    </div>
    <div class="version">
      {{ `Version ${version}` }}
    </div>
    <div class="copyright">
      <p>© 2009-2019</p><p>Sagittarius Technology Co.,Ltd</p>
    </div>
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
    background-image: linear-gradient(
      -28deg,
      rgba(65,65,65,0.97) 0%,
      rgba(84,84,84,0.97) 47%,
      rgba(123,123,123,0.97) 100%
    );
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
      width: 90px;
      margin: 50px auto 0 auto;
    }
    .name {
      font-size: 17px;
      margin: -8px auto 0 auto;
      color: rgba(255, 255 ,255 , 1);
    }
    .version {
      font-size: 11px;
      letter-spacing: 0.28px;
      margin: 3px auto 0 auto;
      color: rgba(255, 255 ,255 , 0.7);
    }
    .copyright {
      font-size: 10px;
      letter-spacing: 0.5px;
      color: rgba(255, 255 ,255 , 0.3);
      margin: auto auto 14px auto;
      text-align: center;
    }
  }
</style>
