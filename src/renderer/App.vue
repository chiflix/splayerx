<template>
  <div
    id="app"
    :class="$route.name !== 'playing-view' ? 'landing-view' : ''"
    class="application"
  >
    <Titlebar
      :style="{
        width: $route.name === 'browsing-view' ? '76px' : '',
        left: $route.name === 'browsing-view' ? '0' : ''
      }"
      v-if="!($route.name === 'browsing-view' && !isDarwin) && !isProfessional"
      :show-all-widgets="showAllWidgets"
      :recent-playlist="playlistState"
      :enable-full-screen-button="['landing-view', 'playing-view', 'browsing-view']
        .includes($route.name)"
    />
    <Sidebar
      v-show="showSidebar"
      :style="{
        width: showSidebar ? '76px' : '0',
      }"
      :current-url="currentUrl"
    />
    <transition
      :name="transitionMode"
      mode="out-in"
    >
      <router-view
        :style="{
          width: showSidebar ? 'calc(100% - 76px)' : '100%',
        }"
        :open-file-args="openFileArgs"
        @update-current-url="currentUrl = $event"
      />
    </transition>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer, Event, remote } from 'electron';
import { mapActions, mapGetters } from 'vuex';
import {
  SubtitleManager as smActions,
  UserInfo as uActions,
  AudioTranslate as atActions,
  UIStates as uiActions,
} from '@/store/actionTypes';
import Titlebar from '@/components/Titlebar.vue';
import Sidebar from '@/components/Sidebar.vue';
import '@/css/style.scss';
import drag from '@/helpers/drag';
import { setToken, getUserInfo, checkToken } from '@/libs/apis';
import sagi from '@/libs/sagi';
import { apiOfAccountService, siteOfAccountService, forceRefresh } from './helpers/featureSwitch';
import { AudioTranslateBubbleOrigin, AudioTranslateStatus } from '@/store/modules/AudioTranslate';
import { log } from './libs/Log';

export default {
  name: 'Splayer',
  components: {
    Titlebar,
    Sidebar,
  },
  data() {
    return {
      transitionMode: '',
      openFileArgs: null,
      currentUrl: '',
      checkedToken: false,
      didGetUserInfo: false,
    };
  },
  computed: {
    ...mapGetters([
      'signInCallback', 'isTranslating', 'translateStatus',
      // UIStates
      'showSidebar', 'showAllWidgets', 'playlistState',
      'isProfessional',
    ]),
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  watch: {
    $route(to: any, from: any) {
      if (to.name === 'landing-view' && from.name === 'language-setting') this.transitionMode = 'fade';
      if (from.name === 'playing-view' && to.name !== 'playing-view') this.resetManager();
      else this.transitionMode = '';
      if (to.name !== 'browsing-view' && !(to.name === 'landing-view' && from.name === 'browsing-view')) this.updateShowSidebar(false);
      if (from.name === 'browsing-view' && to.name === 'landing-view') this.currentUrl = '';
      if (from.name === 'browsing-view' && to.name === 'playing-view') {
        if (!this.$electron.remote.getCurrentWindow().isVisible()) {
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [1, 1]);
          this.$electron.remote.getCurrentWindow().setSize(1, 1);
          this.$electron.remote.getCurrentWindow().show();
        }
        this.currentUrl = '';
      }
      if (from.name === 'landing-view' && to.name === 'playing-view') this.updateShowSidebar(false);
    },
    showSidebar(val: boolean) {
      ipcRenderer.send('update-sidebar', val);
    },
  },
  async mounted() {
    this.$event.on('side-bar-mouseup', () => {
      if (this.playlistState && !this.showSidebar) {
        this.$bus.$emit('close-playlist');
        setTimeout(() => {
          this.updateShowSidebar(true);
        }, 200);
      } else {
        this.updateShowSidebar(!this.showSidebar);
      }
    });
    ipcRenderer.on('open-file', (event: Event, args: { onlySubtitle: boolean, files: string[] }) => {
      this.openFileArgs = args;
    });
    // to-do: specify commitType and commitPayload with vuex typescriptened
    ipcRenderer.on('mainCommit', (event: Event, commitType: string, commitPayload: any) => {
      this.mainCommitProxy(commitType, commitPayload);
    });
    ipcRenderer.on('mainDispatch', (event: Event, actionType: string, actionPayload: any) => {
      this.mainDispatchProxy(actionType, actionPayload);
    });
    ipcRenderer.send('windowInit');
    ipcRenderer.on('thumbnail-saved', (event: Event, src: string) => {
      this.$bus.$emit('set-thumbnail-src', src);
    });
    drag(this.$el);
    this.$ga.event('app', 'mounted');
    setInterval(() => {
      this.$ga.event('app', 'heartbeat');
    }, 1500000); // keep alive every 25 min.

    // main window get sign in api send to main process
    // for sign in window use
    apiOfAccountService().then((api: string) => {
      ipcRenderer.send('sign-in-end-point', api);
    }).catch(() => {});
    // site
    siteOfAccountService().then((url: string) => {
      ipcRenderer.send('sign-in-site', url);
    }).catch(() => {});
    ipcRenderer.on('clear-signIn-callback', () => {
      this.removeCallback(() => { });
    });
    // sign in success
    ipcRenderer.on('sign-in', async (e: Event, account?: {
      token: string, id: string,
    }) => {
      this.updateUserInfo(account);
      if (account) {
        setToken(account.token);
        sagi.setToken(account.token);
        this.updateToken(account.token);
        try {
          await this.getUserInfo();
        } catch (error) {
          // empty
        }
        // sign in success, callback
        if (this.signInCallback) {
          this.signInCallback();
          this.removeCallback(() => { });
        }
      } else {
        setToken('');
        this.updateToken('');
        sagi.setToken('');
        this.didGetUserInfo = false;
      }
    });

    ipcRenderer.on('payment-success', async () => {
      forceRefresh();
      try {
        await checkToken();
        const res = await getUserInfo();
        this.updateUserInfo(res.me);
      } catch (error) {
        // empty
      }
    });

    ipcRenderer.on('sign-out-confirm', () => {
      // is translating stop
      if (this.isTranslating || this.translateStatus === AudioTranslateStatus.Back) {
        this.showTranslateBubble(AudioTranslateBubbleOrigin.OtherAIButtonClick);
        this.addTranslateBubbleCallBack(() => {
          remote.app.emit('sign-out');
        });
      } else {
        remote.app.emit('sign-out');
      }
    });
    // load global data when sign in is opend
    const account = remote.getGlobal('account');
    this.updateUserInfo(account);
    if (account && account.token) {
      setToken(account.token);
      await checkToken();
      this.updateToken(account.token);
      sagi.setToken(account.token);
      // resfrsh
      this.checkedToken = true;
      this.getUserInfo();
    }
  },
  methods: {
    ...mapActions({
      resetManager: smActions.resetManager,
      updateUserInfo: uActions.UPDATE_USER_INFO,
      updateToken: uActions.UPDATE_USER_TOKEN,
      removeCallback: uActions.UPDATE_SIGN_IN_CALLBACK,
      showTranslateBubble: atActions.AUDIO_TRANSLATE_SHOW_BUBBLE,
      addTranslateBubbleCallBack: atActions.AUDIO_TRANSLATE_BUBBLE_CALLBACK,
      updateShowSidebar: uiActions.UPDATE_SHOW_SIDEBAR,
    }),
    mainCommitProxy(commitType: string, commitPayload: any) {
      this.$store.commit(commitType, commitPayload);
    },
    mainDispatchProxy(actionType: string, actionPayload: any) {
      log.debug('mainDispatchProxy', actionPayload);
      this.$store.dispatch(actionType, actionPayload);
    },
    async getUserInfo() {
      if (this.didGetUserInfo) return;
      this.didGetUserInfo = true;
      try {
        const res = await getUserInfo();
        this.updateUserInfo(res.me);
      } catch (error) {
        // empty
        this.didGetUserInfo = false;
      }
    },
  },
};
</script>

<style lang="scss">
// global scss
// @import "@/css/style.scss";
.sidebar {
  &-enter-active {
    transition: width 500ms ease-out;
  }
  &-leave-active {
    transition: width 250ms ease-in;
  }
  &-enter, &-leave-to {
    width: 0;
  }
}
.landing-view {
  background-color: #434348;
}
.fade {
  &-enter-active {
    transition: opacity 500ms ease-out;
  }
  &-leave-active {
    transition: opacity 250ms ease-in;
  }
  &-enter, &-leave-to {
    opacity: 0;
  }
}
</style>
