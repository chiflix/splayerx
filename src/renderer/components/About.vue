<template>
  <div class="content">
    <Icon class="title-button no-drag"
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
import drag from '@/helpers/drag';
export default {
  name: 'About',
  components: {
    Icon,
  },
  computed: {
    name() {
      return electron.remote.app.getName();
    },
    version() {
      return electron.remote.app.getVersion();
    },
  },
  methods: {
    handleClose() {
      electron.remote.BrowserWindow.getFocusedWindow().close();
    },
  },
  mounted() {
    drag(this.$el, 'About');
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
    .title-button {
      position: absolute;
      right: 5px;
      top: 8px;
      margin: 0px 2px 2px 0px;
      width: 45px;
      height: 28px;
      background-color: rgba(255,255,255,0);
      transition: background-color 200ms;
    }
    .title-button:hover {
      background-color: rgba(221, 221, 221, 0.2);
    }
    .title-button:active {
      background-color: rgba(221, 221, 221, 0.5);
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
