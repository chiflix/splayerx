<template>
  <div class="content">
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
    <div class="main">
      <div class="file">
        <div class="title">
          {{ $t('msg.file.airShared.title') }}:
        </div>
        {{ info.filePath }}
      </div>
      <div class="info">
        <div>
          <span class="label">{{ $t('msg.file.airShared.status') }}:</span>
          <span>
            {{ info.enabled ? $t('msg.file.airShared.on') : $t('msg.file.airShared.off') }}
          </span>
        </div>
        <div>
          <span class="label">{{ $t('msg.file.airShared.host') }}:</span>
          <span>{{ info.host }}</span>
        </div>
        <div>
          <span class="label">{{ $t('msg.file.airShared.token') }}:</span>
          <span class="special">
            {{ token }}
          </span>
        </div>
      </div>
      <div class="tip">
        <p>{{ $t('msg.file.airShared.tip') }}</p>
        <p>{{ $t('msg.file.airShared.tipWnB') }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ipcRenderer, remote } from 'electron';
import path from 'path';
import qs from 'querystring';
import Icon from '@/components/BaseIconContainer.vue';

export default Vue.extend({
  name: 'AirSharedInfoModal',
  components: {
    Icon,
  },
  data() {
    const search = window.location.search;
    let info;
    if (!search) info = { enabled: false };
    else info = qs.parse(search.slice(1));
    return {
      info,
      state: 'default',
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    token() {
      if (!this.info.code) return '';
      const code = this.info.code.toString();
      const res = [];
      for (let i = 0; i < code.length; i += 1) {
        res.push(code[i]);
        if ((i + 1) % 4 === 0 && i < code.length - 1) res.push(' ');
      }
      return res.join('');
    },
    fileName() {
      return this.info.filePath ? path.basename(this.info.filePath) : '';
    },
  },
  mounted() {
    document.title = 'Air Shared';
    document.body.classList.add('drag');
    ipcRenderer.on('airShared.subscribeInfo-reply', (evt, info) => {
      this.info = info;
    });
    ipcRenderer.send('airShared.subscribeInfo');
  },
  methods: {
    handleClose() {
      const win = remote.BrowserWindow.getFocusedWindow();
      if (win) win.close();
    },
  },
});
</script>

<style lang="scss" scoped>
  .content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #434348;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    font-family: $font-medium;
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
  }
  .main {
    width: 80%;
    margin: 40px auto 0;
  }
  .info {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.75em;
    &>div {
      display: flex;
    }
    .label {
      flex: 1;
    }
    .special {
      color: white;
    }
  }
  .file {
    .title {
      font-size: 16px;
      margin-bottom: 5px;
      color: rgba(255, 255, 255, 0.7);
    }
    word-break: break-all;
    margin: 10px auto;
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    line-height: 1.5em;
  }
  .tip {
    p {
      margin: 10px auto;
    }
    margin: 20px auto;
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    line-height: 1.5em;
  }
</style>
