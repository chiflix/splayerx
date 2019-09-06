<template>
  <div
    class="browsing-title-bar"
  >
    <div
      @mouseup="handleMinimize"
      class="control-button minimize-icon no-drag button-hover"
    >
      <Icon
        type="browsingminimize"
      />
    </div>
    <div
      @mouseup="handleFullScreen"
      class="control-button fullscreen-icon button-hover"
    >
      <Icon
        ref="back"
        type="browsingfullscreen"
      />
    </div>
    <div
      @mouseup="handleClose"
      class="control-button close-icon button-hover"
    >
      <Icon
        ref="forward"
        type="browsingclose"
      />
    </div>
  </div>  
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';
export default {
  components: {
    Icon,
  },
  methods: {
    handleMinimize() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'minimize');
    },
    handleFullScreen() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
    },
    handleClose() {
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'close');
    },
  },
};
</script>
<style lang="scss" scoped>
.browsing-title-bar {
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 6;
  width: 114px;
  border-left: 1px solid #F2F1F4;
  .control-button {
    width: 30px;
    height: 30px;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 100ms ease-in;
  }
  .button-hover:hover {
    background-color: #ECEEF0;
  }
  .minimize-icon {
    margin-left: 8px;
  }
  .fullscreen-icon {
    margin-left: 4px;
    margin-right: 4px;
  }
  .close-icon {
    margin-right: 8px;
  }
}
</style>
