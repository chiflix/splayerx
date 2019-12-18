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
          @click="handleConfirm"
          class="confirm"
        >
          {{ $t("openUrl.open") }}
        </button>
      </div>
      <div class="authentication">
        <div class="title">
          {{ $t('openUrl.httpAuthentication') }}
        </div>
        <div class="username">
          <input
            v-model="username"
            @focus="$event.target.select()"
            @keydown="handleKeydown"
            :placeholder="$t('openUrl.username.placeholder')"
            type="url"
          >
        </div>
        <div class="password">
          <input
            v-model="password"
            @focus="$event.target.select()"
            @keydown="handleKeydown"
            :placeholder="$t('openUrl.password.placeholder')"
            type="password"
          >
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { ipcRenderer, clipboard } from 'electron';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  data() {
    return {
      url: '',
      username: '',
      password: '',
    };
  },
  computed: {
    isDarwin() {
      // @ts-ignore
      return process.platform === 'darwin'; // eslint-disable-line
    },
  },
  methods: {
    handleClose() {
      window.close();
    },
    handleConfirm() {
      if (this.url) {
        ipcRenderer.send('send-url', {
          url: this.url,
          username: this.username,
          password: this.password,
        });
        window.close();
      }
    },
    handleKeydown(e: KeyboardEvent) {
      const CmdOrCtrl = (this.isDarwin && e.metaKey) || (this.isDarwin && e.ctrlKey);
      if (e.key === 'v' && CmdOrCtrl) {
        this.url = this.url.concat(clipboard.readText());
      } else if (e.key === 'c' && CmdOrCtrl) {
        clipboard.writeText(this.url);
      } else if (e.key === 'a' && CmdOrCtrl) {
        (e.target as HTMLInputElement).select();
      } else if (e.key === 'Enter') {
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
  background-color: #44444b;

}

.container {
  display: flex;
  flex-direction: column;
  padding-top: 45px;
  padding-left: 30px;
  padding-right: 30px;
  .confirm {
    font-family: $font-semibold;
    font-size: 11px;
    color: #FFFFFF;
    letter-spacing: 0;
    text-align: center;
    line-height: 26px;
  }
  .url {
    display: flex;
  }
  .authentication {
    margin-top: 15px;
    padding-left: 28px;
    padding-top: 14px;
    background-color: rgba($color: #37373c, $alpha: 1);
    border-radius: 2px;
    .username, .password {
      display: inline-block;
      margin-top: 10px;
      margin-right: 12px;
      margin-bottom: 20px;
      width: 159px;
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
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    width: 100%;
    height: 28px;
    line-height: 28px;
    font-size: 14px;
    color: rgba(255,255,255,0.80);
    letter-spacing: 0;
    padding: 0 10px;
    background-color: rgba(94,93,102,0.25);
    transition: all 200ms;
    &:hover {
      background-color: rgba(94,93,102,0.6);
    }
  }
  input {
    &:focus {
      border-color: #ffffff;
      background-color: rgba(94,93,102,0.25);
    }
  }
  button {
    cursor: pointer;
    width: fit-content;
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
