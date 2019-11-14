<template>
  <div
    :style="{
      pointerEvents: getChannelInfo ? 'none': 'auto',
    }"
    class="add-channel"
  >
    <div class="mask" />
    <div class="input-box">
      <div class="bookmark-content">
        <span>{{ $t('browsing.siteName') }}</span>
        <div class="input-content">
          <input
            ref="focusedName"
            v-model="channelName"
            :placeholder="$t('browsing.namePlaceholder')"
          >
        </div>
      </div>
      <div class="url-content">
        <div class="title-content">
          <span class="url-title">{{ $t('browsing.siteAddress') }}</span>
          <span
            v-if="getFailed"
            class="add-failed"
          >{{ $t('browsing.enterValidUrl') }}</span>
        </div>
        <div class="input-content">
          <input
            v-model="url"
            @focus="handleUrlInput"
            :placeholder="$t('browsing.addressPlaceholder')"
          >
        </div>
      </div>
      <div class="submit-buttons">
        <button
          @click="handleCancel"
          class="cancel"
        >
          {{ $t('browsing.cancel') }}
        </button>
        <button
          :style="{
            opacity: getChannelInfo ? 1 : '',
          }"
          @click="handleAddChannel"
          class="submit"
        >
          {{ getChannelInfo ? $t('browsing.loading') : $t('browsing.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-ignore
import urlParseLax from 'url-parse-lax';
import { log } from '@/libs/Log';
import BrowsingChannelManager from '@/services/browsing/BrowsingChannelManager';

export default {
  name: 'BrowsingCustomizedChannel',
  props: {
    showAddChannel: {
      type: Boolean,
      required: true,
    },
    initChannelName: {
      type: String,
      required: true,
    },
    initUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      channelInfo: {},
      channelName: this.initChannelName,
      url: this.initUrl,
      timer: 0,
      getChannelInfo: false,
      getFailed: false,
    };
  },
  mounted() {
    setTimeout(() => {
      this.$refs.focusedName.focus();
    }, 0);
  },
  methods: {
    handleUrlInput() {
      this.getFailed = false;
    },
    handleCancel() {
      this.$emit('update:showAddChannel', false);
      this.getChannelInfo = false;
      this.getFailed = false;
      clearTimeout(this.timer);
    },
    updateCustomizedChannel(isEditable: boolean) {
      this.getFailed = false;
      log.info('customized channel', isEditable ? 'update' : 'add');
      this.getChannelInfo = true;
      const view = new this.$electron.remote.BrowserView();
      view.webContents.addListener('did-fail-load', (e: Event, errorCode: number, errorDescription: string, validatedURL: string) => {
        log.info('error-page', `code: ${errorCode}, description: ${errorDescription}, url: ${validatedURL}`);
        this.getFailed = true;
        this.getChannelInfo = false;
        clearTimeout(this.timer);
      });
      if (!this.channelName) {
        view.webContents.addListener('page-title-updated', (e: Event, title: string) => {
          this.channelInfo.title = title;
          if (this.channelInfo.icon) {
            view.destroy();
            clearTimeout(this.timer);
            if (isEditable) {
              BrowsingChannelManager.updateCustomizedChannel(this.initUrl, this.channelInfo)
                .then(() => {
                  this.$bus.$emit('update-customized-channel');
                  this.handleCancel();
                });
            } else {
              BrowsingChannelManager.addCustomizedChannel(this.channelInfo).then(() => {
                this.$bus.$emit('update-customized-channel');
                this.handleCancel();
              });
            }
          }
        });
      }
      view.webContents.addListener('page-favicon-updated', async (e: Event, icon: string[]) => {
        const url = view.webContents.getURL();
        const hostname = urlParseLax(url).hostname;
        let favicon = icon[icon.length - 1];
        const availableIcon = (await fetch(favicon)).status === 200;
        if (!availableIcon) {
          favicon = hostname.slice(hostname.indexOf('.') + 1, hostname.indexOf('.') + 2).toUpperCase();
        }
        const currentTitle = this.channelInfo.title;
        this.channelInfo = {
          category: 'customized',
          icon: favicon,
          title: currentTitle || this.channelName,
          url,
          path: hostname,
          channel: url,
        };
        if (this.channelInfo.title) {
          view.destroy();
          clearTimeout(this.timer);
          if (isEditable) {
            BrowsingChannelManager.updateCustomizedChannel(this.initUrl, this.channelInfo)
              .then(() => {
                this.$bus.$emit('update-customized-channel');
                this.handleCancel();
              });
          } else {
            BrowsingChannelManager.addCustomizedChannel(this.channelInfo).then(() => {
              this.$bus.$emit('update-customized-channel');
              this.handleCancel();
            });
          }
          log.info('add-channel-success', this.channelInfo);
        }
      });
      const loadUrl = urlParseLax(this.url).href;
      view.webContents.loadURL(loadUrl);
      view.webContents.setAudioMuted(true);
      // request time out
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        log.info('time-out', 'add customized channel failed');
        this.getFailed = true;
        this.getChannelInfo = false;
        view.destroy();
        this.$emit('update:showAddChannel', false);
      }, 15000);
    },
    handleAddChannel() {
      if (this.url) {
        this.$ga.event('app', 'customized-channel', this.url);
        const isEditable = !!(this.initUrl && this.initChannelName);
        if (isEditable) {
          if (this.initUrl === this.url) {
            // update customized channel title
            BrowsingChannelManager.updateCustomizedChannelTitle(this.url, this.channelName)
              .then(() => {
                this.$bus.$emit('update-customized-channel');
                this.handleCancel();
              });
          } else {
            // update customized channel
            this.updateCustomizedChannel(isEditable);
          }
        } else {
          // add customized channel
          this.updateCustomizedChannel(isEditable);
        }
      } else {
        this.getFailed = true;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.add-channel {
  width: 360px;
  height: 246px;
  background: #FFFFFF;
  border: 1px solid #F2F2F2;
  display: flex;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  border-radius: 5px;
  .mask {
    position: absolute;
    width: 300px;
    height: 196px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 71px;
    filter: blur(50px);
    top: 20px;
    left: 30px;
    z-index: -1;
  }
  .input-box {
    display: flex;
    flex-direction: column;
    width: 312px;
    height: 183px;
    padding: 40px 24px 23px 24px;
    z-index: 0;
    background: #FFFFFF;
    border-radius: 5px;
    .bookmark-content {
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
      span {
        font-size: 12px;
        color: #717382;
        margin-bottom: 6px;
        line-height: 12px;
      }
      .input-content {
        width: 100%;
        height: 37px;
        border: 1px solid #EEEEF0;
        box-sizing: border-box;
        border-radius: 2px;
        &:focus-within {
          border-color: #FA6400;
        }
        input {
          border: none;
          padding: 0 12px 0 12px;
          width: calc(100% - 24px);
          height: 100%;
          outline: none;
          font-size: 12px;
          text-overflow: ellipsis;
          color: #CDD3DE;
          &::placeholder {
            color: #CDD3DE;
          }
          &:focus-within {
            color: #666C77;
          }
        }
      }
    }
    .url-content {
      display: flex;
      flex-direction: column;
      .title-content {
        width: 100%;
        height: auto;
        display: flex;
        .url-title {
          font-size: 12px;
          color: #717382;
          margin-bottom: 6px;
          line-height: 12px;
        }
        .add-failed {
          margin-left: 10px;
          font-size: 10px;
          color: #FA6400;
          margin-top: 2px;
          line-height: 10px;
          height: 10px;
        }
      }
      margin-bottom: 24px;
      .input-content {
        width: 100%;
        height: 37px;
        border: 1px solid #EEEEF0;
        box-sizing: border-box;
        border-radius: 2px;
        &:focus-within {
          border-color: #FA6400;
        }
        input {
          border: none;
          padding: 0 12px 0 12px;
          width: calc(100% - 24px);
          height: 100%;
          outline: none;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #CDD3DE;
          &::placeholder {
            color: #CDD3DE;
          }
          &:focus-within {
            color: #666C77;
          }
        }
      }
    }
    .submit-buttons {
      width: 100%;
      display: flex;
      justify-content: space-between;
      button {
        width: 146px;
        height: 34px;
        border-radius: 2px;
        transition: all 150ms linear;
        font-size: 12px;
        outline: none;
      }
      .submit {
        background: rgb(255, 148, 0);
        border: 1px solid rgb(251, 99, 0);
        color: #FFFFFF;
        opacity: 0.8;
        &:hover {
          opacity: 1;
        }
      }
      .cancel {
        background: rgb(233, 233, 233);
        border: 1px solid rgb(208, 208, 208);
        color: #717382;
        opacity: 0.5;
        &:hover {
          opacity: 1;
        }
      }
    }
  }
}
</style>
