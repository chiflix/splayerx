<template>
  <div class="box">
    <div class="no-drag" />
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { ipcRenderer } from 'electron';

export default Vue.extend({
  name: 'General',
  mounted() {
    ipcRenderer.send('show-premium-view');
  },
  destroyed() {
    ipcRenderer.send('hide-premium-view');
  },
});
</script>
<style lang="scss" scoped>
.box {
  width: 100%;
  height: 362px;
  position: relative;
  overflow: hidden;
  .no-drag {
    position: absolute;
    right: 0;
    top: 160px;
    width: 100%;
    height: 202px;
    -webkit-app-region: no-drag;
  }
}
</style>
