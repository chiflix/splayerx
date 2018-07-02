<template>
  <div class="titlebar" :style="{ width: titlebarWidth + 'px' }">
    <div class="title-button close"
         @click="handleClose">
      <span>关闭</span>
    </div>
    <div class="title-button maximize"
         :style="{ display: showMax }"
         @click="handleMaximize">
      <span>最大化</span>
    </div>
    <div class="title-button restore"
         :style="{ display: showRestore }"
         @click="handleRestore">
      <span>恢复</span>
    </div>
    <div class="title-button minimize"
         @click="handleMinimize">
      <span>最小化</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'titlebar',
  data() {
    return {
      showTitlebar: false,
      showMax: 'block',
      showResize: 'none',
      titlebarWidth: 'auto',
      maximize: false,
    };
  },
  methods: {
    handleMinimize() {
      this.$electron.remote.getCurrentWindow().minimize();
    },
    handleMaximize() {
      this.$electron.remote.getCurrentWindow().maximize();
      this.maximize = true;
      this.switchStatus();
    },
    handleClose() {
      this.$electron.remote.getCurrentWindow().close();
    },
    handleRestore() {
      this.$electron.remote.getCurrentWindow().unmaximize();
      this.maximize = false;
      this.switchStatus();
    },
    switchStatus() {
      this.showMax = this.maximize ? 'none' : 'block';
      this.showRestore = this.maximize ? 'block' : 'none';
    },
  },
  mounted() {
    this.$electron.remote.getCurrentWindow().on('resize', () => {
      this.titlebarWidth = this.$electron.remote.getCurrentWindow().getSize();
      this.originalSize = this.$electron.remote.getCurrentWindow().getSize();
      console.log('Window resized!', this.$electron.remote.getCurrentWindow().getSize());
      console.log('Current maximize status: ', this.maximize);
    });
  },
};
</script>

<style>
.titlebar {
  position: fixed;
  height: 32px;
  right: 0px;
  transition: 0.5s;
  z-index: 2000;
  -webkit-app-region: drag;
  border-radius: 4px 4px 0px 0px;
}

.title-button {
  float: right;
  margin: 0px 2px 2px 0px;
  width: 64px;
  text-align: center;
  cursor: pointer;
  height: auto;
  line-height: 29px;
  -webkit-app-region: no-drag;
}
.minimize:hover, .maximize:hover, .restore:hover {
  background-color: rgba(255, 255, 255, 0.8);
  transition: 0.5s;
}
.close:hover {
  background-color: red;
  transition: 0.5s;
}
</style>
