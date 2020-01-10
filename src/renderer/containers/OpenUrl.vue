<template>
  <div class="open-url">
    <div
      :class="isDarwin ? 'darwin-titlebar' : 'titlebar'"
      :style="{
        width: '100%'
      }"
    >
      <div
        v-if="!isDarwin"
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
          :class="{ disabled: true }"
          class="title-button no-drag"
          type="titleBarExitFull"
        />
        <Icon
          :class="{ disabled: true }"
          class="title-button no-drag"
          type="titleBarExitFull"
        />
      </div>
    </div>
    <div class="container">
      <div class="url">
        <input
          v-model="url"
          @focus="$event.target.select()"
          @keydown="handleKeydown"
          :placeholder="$t('openUrl.url.placeholder')"
          type="url"
          autofocus
        >
        <button
          :style="{
            pointerEvents: url && stateCode !== 'loading' ? 'auto' : 'none',
            opacity: url && stateCode !== 'loading' ? '' : '0.5',
          }"
          @click="handleConfirm"
          class="confirm"
        >
          {{ $t("openUrl.open") }}
        </button>
      </div>
      <div class="authentication">
        <BaseCheckBox
          :style="{
            margin: 0,
          }"
          v-model="authenticationAvailable"
          label-size="13"
        >
          {{ $t('openUrl.httpAuthentication') }}
        </BaseCheckBox>
        <div
          :style="{
            opacity: authenticationAvailable ? '1' : '0.3',
            pointerEvents: authenticationAvailable ? 'auto' : 'none',
          }"
          class="user-content"
        >
          <div class="username">
            <input
              v-model="username"
              @focus="$event.target.select()"
              @keydown="handleKeydown"
              :placeholder="$t('openUrl.username.placeholder')"
              :disabled="!authenticationAvailable"
              type="url"
            >
          </div>
          <div class="password">
            <input
              v-model="password"
              @focus="$event.target.select()"
              @keydown="handleKeydown"
              :placeholder="$t('openUrl.password.placeholder')"
              :disabled="!authenticationAvailable"
              type="password"
            >
          </div>
        </div>
      </div>
      <div
        v-show="stateCode"
        class="state-line"
      >
        <span>{{ stateText }}</span>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';
import BaseCheckBox from '@/components/Preferences/BaseCheckBox.vue';

export default {
  components: {
    Icon,
    BaseCheckBox,
  },
  data() {
    return {
      url: '',
      username: '',
      password: '',
      authenticationAvailable: false,
      stateCode: '',
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    stateText() {
      switch (this.stateCode) {
        case 'loading':
          return this.$t('browsing.download.loading');
        case 'unsupported url format':
          return this.$t('browsing.enterValidUrl');
        case 'network error':
          return this.$t('browsing.download.downloadingError');
        default:
          return '';
      }
    },
  },
  methods: {
    handleClose() {
      window.close();
    },
    handleConfirm() {
      if (!navigator.onLine) {
        this.stateCode = 'network error';
      } else if (this.url) {
        if (!/(\w+)(\.(\w+)|(:(\d+)))/.test(this.url)) {
          this.stateCode = 'unsupported url format';
        } else {
          this.stateCode = 'loading';
          electron.ipcRenderer.send('send-url', {
            url: this.url,
            username: this.username,
            password: this.password,
          });
          window.close();
        }
      }
    },
    // eslint-disable-next-line complexity
    handleKeydown(e: KeyboardEvent) {
      const { remote } = electron;
      const browserWindow = remote.BrowserWindow;
      const focusWindow = (browserWindow.getFocusedWindow() as Electron.BrowserWindow);
      const CmdOrCtrl = (this.isDarwin && e.metaKey) || (this.isDarwin && e.ctrlKey);
      if (e && e.keyCode === 65 && CmdOrCtrl) { // c+a
        focusWindow.webContents.selectAll();
        e.preventDefault();
      } else if (e && e.keyCode === 67 && CmdOrCtrl) { // c+c
        focusWindow.webContents.copy();
        e.preventDefault();
      } else if (e && e.keyCode === 86 && CmdOrCtrl) { // c+v
        focusWindow.webContents.paste();
        e.preventDefault();
      } else if (e && e.keyCode === 88 && CmdOrCtrl) { // c+x
        focusWindow.webContents.cut();
        e.preventDefault();
      } else if (e && e.keyCode === 90 && CmdOrCtrl) { // c+z
        focusWindow.webContents.undo();
        e.preventDefault();
      } else if (e && e.keyCode === 90 && CmdOrCtrl && e.shiftKey) { // c+s+z
        focusWindow.webContents.redo();
        e.preventDefault();
      } else if (e && e.keyCode === 13) {
        this.handleConfirm();
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.open-url {
  -webkit-app-region: drag;
  width: 100%;
  height: 100%;
  background-color: #3b3b41;
}

.container {
  display: flex;
  flex-direction: column;
  padding-top: 50px;
  padding-left: 30px;
  padding-right: 30px;
  .confirm {
    font-family: $font-semibold;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0;
    text-align: center;
    line-height: 26px;
  }
  .url {
    display: flex;
  }
  .state-line {
    text-align: center;
    margin-top: 16px;
    line-height: 11px;
    span {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
  .authentication {
    margin-top: 24px;
    border-radius: 2px;
    .top-content {
      width: auto;
      height: auto;
      display: flex;
    }
    .check-authentication {
      width: 17px;
      height: 17px;
      margin-right: 11px;
      input {
        display: none;
        cursor: pointer;
        position: absolute;
      }
      span {
        position: absolute;
        width: 17px;
        height: 17px;
        border-radius: 2px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background-color: rgba(255, 255, 255, 0.03);
        transition: border 200ms, background-color 200ms;
      }
    }
    .user-content {
      width: 390px;
      height: 29px;
      margin: 12px auto auto auto;
      border-radius: 2px;
      display: flex;
      .username {
        width: 188px;
        margin-right: 14px;
      }
      .password {
        width: 188px;
      }
    }
  }
  .title {
    font-family: $font-semibold;
    font-size: 13px;
    color: rgba(255,255,255,0.50);
    letter-spacing: 0;
    line-height: 18px;
  }

  input, button {
    -webkit-app-region: no-drag;
    outline: none;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    width: 100%;
    height: 28px;
    line-height: 28px;
    font-size: 14px;
    color: rgba(255,255,255,0.80);
    letter-spacing: 0;
    padding: 0 10px;
    background-color: rgba(255, 255, 255, 0.03);
    transition: all 200ms;
    &:hover {
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(255, 255, 255, 0.08);
    }
  }
  input {
    &:focus {
      border-color: rgba(255, 255, 255, 0.3);
      background-color: #49484E;
    }
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  }
  button {
    cursor: pointer;
    width: 59px;
    margin-left: 10px;
    &:active {
      opacity: 0.5;
    }
  }
}

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
  .disabled {
    pointer-events: none;
    opacity: 0.25;
  }
}
</style>
