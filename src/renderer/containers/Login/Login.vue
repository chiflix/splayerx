<template>
  <div style="-webkit-app-region: drag">
    <div
      :class="isDarwin ? 'darwin-titlebar' : 'titlebar'"
      :style="{
        width: '100%'
      }"
    >
      <div
        v-if="isWin"
        class="win-icons"
      >
        <Icon
          class="title-button disable no-drag"
          type="titleBarWinExitFull"
        />
        <Icon
          class="title-button disable no-drag"
          type="titleBarWinFull"
        />
        <Icon
          @mouseup.native="handleClose"
          class="title-button no-drag"
          type="titleBarWinClose"
        />
      </div>

      <div
        v-if="isDarwin"
        class="mac-icons"
      >
        <Icon
          id="close"
          @mouseup.native="handleClose"
          class="title-button no-drag"
          type="titleBarClose"
        />
        <Icon
          id="minimize"
          :class="{ disabled: true }"
          class="title-button no-drag"
          type="titleBarExitFull"
        />
        <Icon
          id="minimize"
          :class="{ disabled: true }"
          class="title-button no-drag"
          type="titleBarExitFull"
        />
      </div>

      <div
        v-if="isBrowser"
        class="win-icons"
      >
        <Icon
          @mouseup.native="handleClose"
          class="title-button no-drag"
          type="titleBarWinClose"
        />
      </div>
    </div>
    <router-view />
  </div>
</template>
<script lang="ts">
import Vue from 'vue';

import Icon from '@/components/BaseIconContainer.vue';
import { postMessage } from '@/../shared/utils';

export default Vue.extend({
  name: 'Login',
  components: {
    Icon,
  },
  computed: {
    isBrowser() {
      // @ts-ignore
      return !window.remote;
    },
    isDarwin() {
      // @ts-ignore
      return !this.isBrowser && window.isDarwin; // eslint-disable-line
    },
    isWin() {
      // @ts-ignore
      return !this.isBrowser && !window.isDarwin; // eslint-disable-line
    },
  },
  methods: {
    handleClose() {
      window.close();
      postMessage('close-window');
    },
  },
});
</script>
<style lang="scss" scoped>
.titlebar {
  top: 0;
  right: 0;
  border-radius: 10px;
  height: 36px;
  z-index: 6;
  display: flex;
  justify-content: space-between;
  position: absolute;
  .win-icons {
    display: flex;
    flex-wrap: nowrap;
    position: absolute;
    right: 0;
    .title-button {
      width: 45px;
      height: 36px;
      display: flex;
      background-color: rgba(255,255,255,0);
      transition: background-color 200ms;
      &.disable {
        pointer-events: none;
        opacity: 0.25;
      }
    }
    .title-button:hover {
      background-color: rgba(221, 221, 221, 0.2);
    }
    .title-button:active {
      background-color: rgba(221, 221, 221, 0.5);
    }
  }
}

.darwin-titlebar {
  z-index: 6;
  height: 36px;
  display: flex;
  position: absolute;
  .mac-icons {
    width: 92px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-left: 10px;
    flex-wrap: nowrap;
  }
  .title-button {
    width: 12px;
    height: 12px;
    margin-right: 8px;
    background-repeat: no-repeat;
    -webkit-app-region: no-drag;
    border-radius: 100%;
  }
  #minimize {
    &.disabled {
      pointer-events: none;
      opacity: 0.25;
    }
  }
  #maximize {
    &.disabled {
      pointer-events: none;
      opacity: 0.25;
    }
  }
}
</style>
<style lang="scss">
  body {
    -webkit-app-region: drag;
    background-color: #44444b;
  }
  input {
    -webkit-app-region: no-drag;
  }
</style>
