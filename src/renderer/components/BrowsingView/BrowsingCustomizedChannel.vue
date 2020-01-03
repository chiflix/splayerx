<template>
  <div class="mask">
    <div
      :style="{
        pointerEvents: getChannelInfo ? 'none': 'auto',
        background: isDarkMode ? '#434348' : '#FFFFFF',
        border: isDarkMode ? '1px solid #606066' : '1px solid #F2F2F2'
      }"
      @keydown="handleKeydown"
      class="add-channel"
    >
      <div
        :style="{
          background: isDarkMode ? '#434348' : '#FFFFFF',
        }"
        class="input-box"
      >
        <div class="url-content">
          <div class="title-content">
            <span class="url-title">{{ $t('browsing.siteAddress') }}</span>
            <span
              v-if="getFailed"
              class="add-failed"
            >{{ $t('browsing.enterValidUrl') }}</span>
          </div>
          <div
            :class="isDarkMode ? 'input-content-dark' : 'input-content-light'"
            class="input-content"
          >
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
          <div
            :class="isDarkMode ? 'input-content-dark' : 'input-content-light'"
            class="input-content"
          >
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
            @click="handleUpdateSelectedIndex(initUrl, index)"
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
              opacity: getChannelInfo || isDarkMode ? 1 : url ? '' : '0.5',
              color: !getChannelInfo && isDarkMode && !url ? 'rgba(255, 255, 255, 0.25)' : '',
              background: !getChannelInfo && isDarkMode && !url ? '#4B4B50' : '',
              border: isDarkMode ? !getChannelInfo && !url
                ? '1px solid rgba(255, 255, 255, 0)' : '' : '',
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
      bookmarkStyles: ['#6d6d6d', '#AF6CC3', '#6983F7', '#5CC9DD', '#4F9E76', '#97C15C', '#EDC55C', '#E6853B', '#EA3335'],
      view: null,
      timer: 0,
      nameInvalid: false,
      savedSelectedIndex: 0,
    };
  },
  computed: {
    ...mapGetters(['bookmarkSelectedIndex', 'isDarkMode']),
  },
  mounted() {
    this.savedSelectedIndex = this.bookmarkSelectedIndex;
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
    handleUpdateSelectedIndex(channel: string, index: number) {
      this.updateBookmarkSelectedIndex(index);
      BrowsingChannelManager.updateCustomizedChannelStyle(channel, index);
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
      this.updateBookmarkSelectedIndex(this.savedSelectedIndex);
      BrowsingChannelManager.updateCustomizedChannelStyle(this.url, this.savedSelectedIndex);
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
      const url = /^(\w+):\/\//.test(this.url) ? this.url : `http://${this.url}`;
      this.view.webContents.addListener('did-fail-load', (e: Event, errorCode: number, errorDescription: string, validatedURL: string) => {
        if (errorCode !== -3) {
          log.info('error-page', `code: ${errorCode}, description: ${errorDescription}, url: ${validatedURL}`);
          this.view.webContents.removeAllListeners();
          const title = this.channelName ? this.channelName : this.url;
          this.getChannelInfo = false;
          const parseInfo = urlParseLax(url);
          this.channelInfo = {
            category: 'customized',
            url: parseInfo.href,
            path: this.url,
            channel: parseInfo.href,
            title,
            icon: title.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u)[0].toUpperCase(),
            style: this.savedSelectedIndex,
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
            style: this.savedSelectedIndex,
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
            style: this.savedSelectedIndex,
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
      const loadUrl = urlParseLax(url).href;
      this.view.webContents.loadURL(loadUrl);
      this.view.webContents.setAudioMuted(true);
    },
    handleAddChannel() {
      if (this.url) {
        this.nameInvalid = !this.channelName.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u) && this.channelName;
        this.getFailed = !/(\w+)(\.(\w+)|(:(\d+)))/.test(this.url);
        if (!this.getFailed && !this.nameInvalid) {
          this.savedSelectedIndex = this.bookmarkSelectedIndex;
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
              const url = /^(\w+):\/\//.test(this.url) ? this.url : `http://${this.url}`;
              const parseInfo = urlParseLax(url);
              this.channelInfo = {
                category: 'customized',
                url: parseInfo.href,
                path: this.url,
                channel: parseInfo.href,
                title,
                icon: title.match(/[\p{Unified_Ideograph}]|[a-z]|[A-Z]|[0-9]/u)[0].toUpperCase(),
                style: this.savedSelectedIndex,
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

<style scoped lang="scss" src="@/css/darkmode/BrowsingCustomizedChannel.scss"></style>
