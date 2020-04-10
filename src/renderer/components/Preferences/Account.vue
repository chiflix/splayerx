<template>
  <div class="content">
    <div class="box" />
    <div class="no-drag" />
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { ipcRenderer } from 'electron';

export default Vue.extend({
  name: 'Account',
  computed: {
    ...mapGetters([
      'token',
    ]),
  },
  mounted() {
    ipcRenderer.send('show-premium-view', 'account');
  },
  destroyed() {
    ipcRenderer.send('hide-premium-view', 'account');
  },
});
</script>
<style lang="scss" scoped>
.content {
  -webkit-app-region: no-drag;
  .no-drag {
    width: 100%;
    height: calc(100% - 36px);
    position: absolute;
    left: 0;
    top: 36px;
    -webkit-app-region: no-drag;
  }
  .box {
    height: 372px;
  }
}
</style>
