<template>
  <div
    id="app"
    :class="$route.name !== 'playing-view' ? 'landing-view' : ''"
    class="application"
  >
    <Titlebar
      v-if="!($route.name === 'playing-view' || ($route.name === 'browsing-view' && !isDarwin))"
      :is-landing-view="$route.name === 'landing-view'"
      :is-browsing-view="$route.name === 'browsing-view'"
      :show-sidebar="showSidebar"
      :enable-full-screen-button="['landing-view', 'playing-view', 'browsing-view']
        .includes($route.name)"
    />
    <transition name="sidebar">
      <Sidebar
        v-if="showSidebar"
        :show-sidebar="showSidebar"
        :current-url="currentUrl"
      />
    </transition>
    <transition
      :name="transitionMode"
      mode="out-in"
    >
      <router-view
        :style="{
          width: showSidebar ? 'calc(100% - 76px)' : '100%',
        }"
        :open-file-args="openFileArgs"
        :show-sidebar="showSidebar"
        @update-current-url="currentUrl = $event"
      />
    </transition>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer, Event } from 'electron';
import { mapActions } from 'vuex';
import { SubtitleManager as smActions, UserInfo as uActions } from '@/store/actionTypes';
import Titlebar from '@/components/Titlebar.vue';
import Sidebar from '@/components/Sidebar.vue';
import '@/css/style.scss';
import drag from '@/helpers/drag';
import { setToken } from '@/libs/apis';
import { isAccountEnabled } from '@/helpers/featureSwitch';
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
      showSidebar: false,
      currentUrl: '',
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  watch: {
    $route(to: any, from: any) {
      if (to.name === 'landing-view' && from.name === 'language-setting') this.transitionMode = 'fade';
      if (from.name === 'playing-view' && to.name !== 'playing-view') this.resetManager();
      else this.transitionMode = '';
      if (to.name !== 'browsing-view' && !(to.name === 'landing-view' && from.name === 'browsing-view')) this.showSidebar = false;
      if (from.name === 'browsing-view' && to.name === 'landing-view') this.currentUrl = '';
      if (from.name === 'browsing-view' && to.name === 'playing-view') {
        if (!this.$electron.remote.getCurrentWindow().isVisible()) {
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'setMinimumSize', [1, 1]);
          this.$electron.remote.getCurrentWindow().setSize(1, 1);
          this.$electron.remote.getCurrentWindow().show();
        }
        this.currentUrl = '';
      }
    },
    showSidebar(val: boolean) {
      ipcRenderer.send('update-sidebar', val);
    },
  },
  mounted() {
    this.$event.on('side-bar-mouseup', () => {
      this.showSidebar = !this.showSidebar;
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

    // sign in success
    ipcRenderer.on('sign-in', async (e: Event, account?: {
      token: string, id: string,
    }) => {
      this.updateUserInfo(account);
      const sagi = await require('@/libs/sagi');
      if (account) {
        setToken(account.token);
        sagi.setToken(account.token);
      } else {
        setToken('');
        sagi.setToken('');
      }
    });
    // get config cat is account enabled
    isAccountEnabled().then((enabled) => {
      log.debug('account', enabled);
      if (enabled) {
        ipcRenderer.send('account-enabled');
      }
    }).catch(() => {
      // empty
    });
    // load global data when sign in is opend
    // const account = remote.getGlobal('account');
    // this.updateUserInfo(account);
    // if (account && account.token) {
    //   setToken(account.token);
    //   sagi.setToken(account.token);
    //   // resfrsh
    //   checkToken();
    // }
  },
  methods: {
    ...mapActions({
      resetManager: smActions.resetManager,
      updateUserInfo: uActions.UPDATE_USER_INFO,
    }),
    mainCommitProxy(commitType: string, commitPayload: any) {
      this.$store.commit(commitType, commitPayload);
    },
    mainDispatchProxy(actionType: string, actionPayload: any) {
      this.$store.dispatch(actionType, actionPayload);
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
  background-color: #434349;
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
