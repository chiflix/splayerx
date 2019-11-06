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
    <div
      v-if="payType === 'wxpay'"
      v-show="status === 'success'"
      class="space"
    />
    <div
      v-show="status === 'success'"
      :class="`webview ${ payType === 'wxpay' ? 'wechat' : ''}`"
    >
      <h1 v-if="payType === 'wxpay'">
        {{ $t('payment.wxpay.title') }}
      </h1>
      <div
        v-if="payType === 'wxpay'"
        class="logo"
      >
        <Icon type="wxpay" />
        <span>{{ $t('payment.wxpay.description') }}</span>
      </div>
      <webview
        id="webview"
        autosize="on"
      />
      <p v-if="payType === 'wxpay'">
        support@splayer.org
      </p>
    </div>
    <div
      v-show="status !== 'success'"
      :class="`webview ${status}`"
    >
      <span
        v-if="status === 'fail'"
        class="text"
      >{{ $t('payment.fail') }}</span>
      <div
        v-else
        class="loader"
      >
        <Icon type="loading" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { remote, ipcRenderer, DidFailLoadEvent } from 'electron';
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
      status: 'loading',
      payType: '',
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
    if (searchs[2]) {
      this.payType = searchs[2].split('=')[1];
    }
    if (searchs[1]) {
      // 轮询
      const orderID = searchs[1].split('=')[1];
      this.startPolling(orderID);
    }
    const webview = document.getElementById('webview');
    const url = window.atob(searchs[0].split('=')[1]);
    if (webview) {
      webview.setAttribute('src', url);
      this.status = 'loading';
      webview.addEventListener('did-start-loading', this.loadStart);
      webview.addEventListener('did-fail-load', this.loadFail);
      webview.addEventListener('did-finish-load', this.loadSuccess);
      webview.addEventListener('will-navigate', this.locationChange);
    }
  },
  destroyed() {
    this.remove();
    const webview = document.getElementById('webview');
    if (webview) {
      webview.removeEventListener('will-navigate', this.locationChange);
    }
  },
  methods: {
    handleClose() {
      const currentWindow = remote.BrowserWindow.getFocusedWindow();
      if (currentWindow) {
        currentWindow.close();
      }
    },
    async startPolling(orderID: string) {
      try {
        const res = await polling(orderID);
        if (res === 0) {
          setTimeout(() => {
            this.startPolling(orderID);
          }, 3 * 1000);
        } else if (res === 1) {
          ipcRenderer.send('payment-success');
        } else {
          ipcRenderer.send('payment-fail');
        }
      } catch (error) {
        if (error && (error.status === 400 || error.status === 401 || error.status === 403)) {
          ipcRenderer.send('payment-fail');
        }
        setTimeout(() => {
          this.startPolling(orderID);
        }, 3 * 1000);
      }
    },
    locationChange(event: EventSource) {
      if (event && event.url && event.url.indexOf('splayer.org') > -1) {
        setTimeout(() => {
          ipcRenderer.send('payment-fail');
        }, 10 * 1000);
      }
    },
    loadStart() {
      this.status = 'loading';
    },
    loadFail(e: DidFailLoadEvent) {
      // electron send aborted error(code: -3) but webview load success
      if (e.errorCode !== -3) {
        this.status = 'fail';
      } else {
        this.status = 'success';
      }
      this.remove();
    },
    loadSuccess() {
      this.status = 'success';
      this.remove();
    },
    remove() {
      const webview = document.getElementById('webview');
      if (webview) {
        webview.removeEventListener('did-start-loading', this.loadStart);
        webview.removeEventListener('did-fail-load', this.loadFail);
        webview.removeEventListener('did-finish-load', this.loadSuccess);
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
  padding-top: 28px;
  box-sizing: border-box;
  .space {
    height: 8px;
    background-color: white;
  }
  &.mac {
    padding-top: 36px;
    .space {
      display: none;
    }
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
  position: relative;
  background: white;
  webview {
    border: none;
    min-width: 100%;
    min-height: 100%;
    -webkit-app-region: no-drag;
  }
  .text {
    width: 100%;
    font-family: $font-normal;
    font-size: 32px;
    color: rgba(255,255,255,0.70);
    text-align: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, calc(-50% - 14px));
  }
  .loader {
    width: 50px;
    height: 50px;
    position: absolute;
    left: calc(50% - 25px);
    top: calc(50% - 39px);
    text-align: center;
    -webkit-animation: load3 1.4s infinite linear;
    animation: load3 1.4s infinite linear;
    svg {
      width: 100%;
      height: 100%;
    }
  }
  &.fail, &.loading {
    background-color: rgba(0,0,0,0.70);
  }
  &.wechat {
    background-image: url(../assets/wxpay-bg.png);
    background-size: cover;
    webview {
      width: 186px;
      height: 186px;
      min-width: 186px;
      min-height: 186px;
      position: absolute;
      left: 42px;
      bottom: 95px;
    }
    h1 {
      padding-top: 41px;
      font-size: 25px;
      color: rgba(0,0,0,0.70);
      letter-spacing: -0.57px;
      text-align: center;
      line-height: 25px;
      margin-bottom: 16px;
    }
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      svg {
        width: 24px;
        height: 24px;
      }
      span {
        font-size: 16px;
        color: rgba(0,0,0,0.70);
        letter-spacing: -0.37px;
        text-align: center;
        line-height: 16px;
        margin-left: 5px;
      }
    }
    p {
      width: 100%;
      position: absolute;
      bottom: 14px;
      font-size: 12.78px;
      color: rgba(0,0,0,0.40);
      letter-spacing: 0;
      text-align: center;
      line-height: 12.78px;
    }
  }
}

@keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
</style>
