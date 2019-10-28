<template>
  <div
    :class="`content ${isDarwin ? 'mac' : ''}`"
  >
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
    <div class="webview">
      <webview
        :src="url"
        autosize="on"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { remote, ipcRenderer } from 'electron';
import Icon from '@/components/BaseIconContainer.vue';
import { polling } from '@/libs/apis';

export default {
  name: 'About',
  components: {
    Icon,
  },
  data() {
    return {
      state: 'default',
      url: '',
    };
  },
  computed: {
    name() {
      return remote.app.getName();
    },
    version() {
      return remote.app.getVersion();
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  mounted() {
    document.title = 'About SPlayer';
    document.body.classList.add('drag');
    const searchs = document.location.search.split('&');
    this.url = window.atob(searchs[0].split('=')[1]);
    // 轮询
    const orderID = searchs[1].split('=')[1];
    this.startPolling(orderID);
  },
  methods: {
    handleClose() {
      if (remote.BrowserWindow.getFocusedWindow()) {
        remote.BrowserWindow.getFocusedWindow().close();
      }
    },
    async startPolling(orderID: string) {
      try {
        const res = await polling(orderID);
        if (res.status === 0) {
          setTimeout(() => {
            this.startPolling(orderID);
          }, 10 * 1000);
        } else if (res.status === 1) {
          ipcRenderer.send('payment-success');
        } else {
          ipcRenderer.send('payment-fail');
        }
      } catch (error) {
        if (error && (error.status === 400 || error.status === 403)) {
          ipcRenderer.send('payment-fail');
        }
        setTimeout(() => {
          this.startPolling(orderID);
        }, 10 * 1000);
      }
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
    padding-top: 24px;
    box-sizing: border-box;
    &.mac {
      padding-top: 36px;
    }
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
  .webview {
    display: block;
    width: 100%;
    height: 100%;
    webview {
      border: none;
      min-width: 100%;
      min-height: 100%;
    }
  }
</style>
