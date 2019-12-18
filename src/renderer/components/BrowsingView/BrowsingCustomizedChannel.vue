<template>
  <div class="mask">
    <div
      :style="{
        pointerEvents: getChannelInfo ? 'none': 'auto',
      }"
      @keydown="handleKeydown"
      class="add-channel"
    >
      <div class="input-box">
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
              ref="inputUrl"
              v-model="url"
              @focus="handleUrlInput"
              :placeholder="$t('browsing.addressPlaceholder')"
            >
          </div>
        </div>
        <div class="bookmark-content">
          <div class="name-content">
            <span>{{ $t('browsing.siteName') }}</span>
            <span
              v-if="nameInvalid"
              class="name-invalid"
            >{{ $t('browsing.nameInvalid') }}</span>
          </div>
          <div class="input-content">
            <input
              ref="focusedName"
              v-model="channelName"
              @focus="handleNameInput"
              :placeholder="$t('browsing.namePlaceholder')"
            >
          </div>
        </div>
        <div class="icon-style">
          <div
            :style="{
              width: '20px',
              height: '20px',
              borderRadius: '100%',
              background: `${style}`,
              marginLeft: index === 0 ? '17px' : '12px',
            }"
            v-for="(style, index) in bookmarkStyles"
            @click="handleUpdateSelectedIndex(index)"
            class="bookmark-style"
          >
            <Icon
              v-show="index === bookmarkSelectedIndex"
              :style="{ margin: 'auto' }"
              type="bookmarkStyleSelected"
            />
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
              opacity: getChannelInfo ? 1 : url ? '' : '0.5',
            }"
            @click="handleAddChannel"
            :class="url ? 'submit-hover' : ''"
            class="submit"
          >
            {{ getChannelInfo ? $t('browsing.loading') : $t('browsing.submit') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex';
// @ts-ignore
import urlParseLax from 'url-parse-lax';
import { log } from '@/libs/Log';
import { Browsing as browsingActions } from '@/store/actionTypes';
import BrowsingChannelManager from '@/services/browsing/BrowsingChannelManager';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingCustomizedChannel',
  components: {
    Icon,
  },
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
      getChannelInfo: false,
      getFailed: false,
      bookmarkStyles: ['#6D6D6D', '#F5C344', '#00CCE0', '#6284FF', '#26a073', '#E4D811', '#F57F20', '#FF0027', '#1B1B1B'],
      view: null,
      timer: 0,
      nameInvalid: false,
    };
  },
  computed: {
    ...mapGetters(['bookmarkSelectedIndex']),
  },
  mounted() {
    setTimeout(() => {
      this.$refs.inputUrl.focus();
    }, 0);
    this.$refs.inputUrl.addEventListener('wheel', (e: WheelEvent) => {
      if ((e.target as HTMLElement) !== (document.activeElement as HTMLElement)) e.preventDefault();
    });
    this.$refs.focusedName.addEventListener('wheel', (e: WheelEvent) => {
      if ((e.target as HTMLElement) !== (document.activeElement as HTMLElement)) e.preventDefault();
    });
  },
  methods: {
    ...mapActions({
      updateBookmarkSelectedIndex: browsingActions.UPDATE_BOOKMARK_SELECTED_INDEX,
    }),
    handleUpdateSelectedIndex(index: number) {
      this.updateBookmarkSelectedIndex(index);
    },
    handleKeydown(e: KeyboardEvent) {
      if (e.code === 'Enter') {
        this.handleAddChannel();
      }
    },
    handleUrlInput() {
      this.getFailed = false;
    },
    handleNameInput() {
      this.nameInvalid = false;
    },
    handleCancel() {
      this.$emit('update:showAddChannel', false);
      this.getChannelInfo = false;
      this.getFailed = false;
      this.nameInvalid = false;
      if (this.view) {
        this.view.destroy();
        this.view = null;
      }
    },
    updateCustomizedChannel(isEditable: boolean) {
      log.info('customized channel', isEditable ? 'update' : 'add');
      this.getFailed = false;
      this.nameInvalid = false;
      this.getChannelInfo = true;
      this.view = new this.$electron.remote.BrowserView();
      this.view.webContents.addListener('did-fail-load', (e: Event, errorCode: number, errorDescription: string, validatedURL: string) => {
        if (errorCode !== -3) {
          log.info('error-page', `code: ${errorCode}, description: ${errorDescription}, url: ${validatedURL}`);
          this.view.webContents.removeAllListeners();
          const title = this.channelName ? this.channelName : this.url;
          this.getChannelInfo = false;
          this.channelInfo = {
            category: 'customized',
            url: urlParseLax(this.url).href,
            path: this.url,
            channel: urlParseLax(this.url).href,
            title,
            icon: title.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u)[0].toUpperCase(),
            style: this.bookmarkSelectedIndex,
          };
          this.view.destroy();
          this.view = null;
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
          log.info('add-channel-success: load failed', this.channelInfo);
        }
      });

      if (!this.channelName) {
        this.view.webContents.addListener('page-title-updated', (e: Event, title: string) => {
          const url = this.view.webContents.getURL();
          const hostname = urlParseLax(url).hostname;
          this.channelInfo = Object.assign(this.channelInfo, {
            category: 'customized',
            url,
            path: hostname,
            channel: url,
            style: this.bookmarkSelectedIndex,
          });
          title = title || 'C';
          this.channelInfo.title = title;
          const name = title.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u);
          this.channelInfo.icon = name ? name[0].toUpperCase() : 'C';
          this.view.destroy();
          this.view = null;
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
          log.info('add-channel-success: normal', this.channelInfo);
        });
      } else {
        this.channelInfo.title = this.channelName;
        this.channelInfo.icon = this.channelName.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u)[0].toUpperCase();
        this.view.webContents.addListener('page-favicon-updated', async () => {
          // Use first word as icon temporarily
          const url = this.view.webContents.getURL();
          const hostname = urlParseLax(url).hostname;
          // let favicon = icon[icon.length - 1];
          // const availableIcon = (await fetch(favicon)).status === 200;
          // if (!availableIcon) {
          //   favicon = hostname.split('.').length - 1 >= 2 ? hostname.slice(hostname
          //   .indexOf('.') + 1, hostname.indexOf('.') + 2) : hostname.slice(0, 1);
          // }
          this.channelInfo = Object.assign(this.channelInfo, {
            category: 'customized',
            url,
            path: hostname,
            channel: url,
            style: this.bookmarkSelectedIndex,
          });
          this.view.destroy();
          this.view = null;
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
          log.info('add-channel-success: normal', this.channelInfo);
        });
      }
      const loadUrl = urlParseLax(this.url).href;
      this.view.webContents.loadURL(loadUrl);
      this.view.webContents.setAudioMuted(true);
    },
    handleAddChannel() {
      if (this.url) {
        this.nameInvalid = !this.channelName.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u) && this.channelName;
        this.getFailed = !/(\w+)\.(\w+)/.test(this.url);
        if (!this.getFailed && !this.nameInvalid) {
          this.$refs.inputUrl.blur();
          this.$refs.focusedName.blur();
          this.$ga.event('app', 'customized-channel', this.url);
          const isEditable = !!(this.initUrl && this.initChannelName);
          if (isEditable) {
            if (this.initUrl === this.url) {
              // update customized channel title
              BrowsingChannelManager.updateCustomizedChannelTitle(this.url,
                this.channelName, this.bookmarkSelectedIndex)
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
          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            if (this.view) {
              this.view.webContents.removeAllListeners();
              const title = this.channelName ? this.channelName : this.url.slice(0, 1);
              this.getChannelInfo = false;
              this.channelInfo = {
                category: 'customized',
                url: urlParseLax(this.url).href,
                path: this.url,
                channel: urlParseLax(this.url).href,
                title,
                icon: title.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u)[0].toUpperCase(),
                style: this.bookmarkSelectedIndex,
              };
              this.view.destroy();
              this.view = null;
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
              log.info('add-channel-success: time out', this.channelInfo);
            }
          }, 5000);
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.mask {
  width: 100%;
  height: 100%;
  position: absolute;
  background: rgba(0, 0, 0, 0.4);
}
.add-channel {
  width: 360px;
  height: auto;
  background: #FFFFFF;
  border: 1px solid #F2F2F2;
  display: flex;
  position: absolute;
  left: 50%;
  top: 40%;
  transform: translate(-50%, -44%);
  z-index: 9999;
  border-radius: 5px;
  .input-box {
    display: flex;
    flex-direction: column;
    width: 312px;
    height: auto;
    padding: 40px 24px 23px 24px;
    z-index: 0;
    background: #FFFFFF;
    border-radius: 5px;
    .bookmark-content {
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
      .name-content {
        width: 100%;
        height: auto;
        display: flex;
      }
      .name-invalid {
        margin-left: 10px;
        font-size: 11px;
        color: #FA6400;
        margin-top: 2px;
        line-height: 10px;
        height: 10px;
      }
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
        transition: all 100ms linear;
        background: #FCFCFD;
        &:hover {
          border: 1px solid #CECED4;
          background: #F7F7F7;
        }
        &:focus-within {
          border-color: #FA6400;
          background: #F7F7F7;
        }
        input {
          border: none;
          padding: 0 12px 0 12px;
          width: calc(100% - 24px);
          height: 100%;
          outline: none;
          font-size: 12px;
          text-overflow: ellipsis;
          color: #666C77;
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
          font-size: 11px;
          color: #FA6400;
          margin-top: 2px;
          line-height: 10px;
          height: 10px;
        }
      }
      margin-bottom: 26px;
      .input-content {
        width: 100%;
        height: 37px;
        border: 1px solid #EEEEF0;
        box-sizing: border-box;
        border-radius: 2px;
        transition: all 100ms linear;
        background: #FCFCFD;
        &:hover {
          border: 1px solid #CECED4;
          background: #F7F7F7;
        }
        &:focus-within {
          border-color: #FA6400;
          background: #F7F7F7;
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
          color: #666C77;
          &::placeholder {
            color: #CDD3DE;
          }
          &:focus-within {
            color: #666C77;
          }
        }
      }
    }
    .icon-style {
      width: 100%;
      height: 20px;
      margin-bottom: 26px;
      display: flex;
      .bookmark-style {
        display: flex;
        &:hover {
          box-shadow: 0 2px 5px 0 rgba(0,0,0,0.2);
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
      }
      .submit-hover:hover {
        opacity: 1;
      }
      .cancel {
        background: rgb(233, 233, 233);
        border: 1px solid rgb(208, 208, 208);
        color: #717382;
        opacity: 0.8;
        pointer-events: auto;
        &:hover {
          opacity: 1;
        }
      }
    }
  }
}
</style>
