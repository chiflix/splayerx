/* eslint-disable import/first */
// Be sure to call Sentry function as early as possible in the main process
import '../shared/sentry';

import path from 'path';
import fs from 'fs';
import Parse from 'parse';
import electron, { ipcRenderer } from 'electron';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { mapGetters, mapActions, createNamespacedHelpers } from 'vuex';
import osLocale from 'os-locale';
import { throttle } from 'lodash';
// @ts-ignore
import VueAnalytics from 'vue-analytics';
// @ts-ignore
import VueElectron from 'vue-electron';
// @ts-ignore
import AsyncComputed from 'vue-async-computed';
// @ts-ignore
import { EventEmitter } from 'events';
// @ts-ignore
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import messages from '@/locales';
import { windowRectService } from '@/services/window/WindowRectService';
import helpers from '@/helpers';
import { hookVue } from '@/kerning';
import {
  Video as videoActions,
  Subtitle as subtitleActions,
  SubtitleManager as smActions,
  SubtitleManager,
  Browsing as browsingActions,
  AudioTranslate as atActions,
  UIStates as uiActions,
} from '@/store/actionTypes';
import { log } from '@/libs/Log';
import { checkForUpdate } from '@/libs/utils';
import asyncStorage from '@/helpers/asyncStorage';
import { videodata } from '@/store/video';
import { addBubble } from '@/helpers/notificationControl';
import { isAccountEnabled } from '@/helpers/featureSwitch';
import { CHECK_FOR_UPDATES_OFFLINE, REQUEST_TIMEOUT } from '@/helpers/notificationcodes';
import { SNAPSHOT_FAILED, SNAPSHOT_SUCCESS, LOAD_SUBVIDEO_FAILED } from './helpers/notificationcodes';
import InputPlugin, { getterTypes as iGT } from '@/plugins/input';
import { VueDevtools } from './plugins/vueDevtools.dev';
import { ISubtitleControlListItem, Type, NOT_SELECTED_SUBTITLE } from './interfaces/ISubtitle';
import {
  getValidSubtitleRegex, getSystemLocale, getClientUUID, getEnvironmentName,
} from '../shared/utils';
import { isWindowsExE, isMacintoshDMG } from '../shared/common/platform';
import MenuService from './services/menu/MenuService';
import BrowsingChannelMenu from './services/browsing/BrowsingChannelMenu';
import { browsingHistory } from '@/services/browsing/BrowsingHistoryService';
import { channelDetails } from '@/interfaces/IBrowsingChannelManager';


// causing callbacks-registry.js 404 error. disable temporarily
// require('source-map-support').install();

Vue.config.productionTip = false;
Vue.config.warnHandler = (warn) => {
  log.info('render/main', warn);
};
Vue.config.errorHandler = (err) => {
  log.error('render/main', err);
};
Vue.directive('fade-in', {
  bind(el: HTMLElement, binding: unknown) {
    if (!el) return;
    const { value } = binding as { value: unknown };
    if (value) {
      el.classList.add('fade-in');
      el.classList.remove('fade-out');
    } else {
      el.classList.add('fade-out');
      el.classList.remove('fade-in');
    }
  },
  update(el: HTMLElement, binding) {
    const { oldValue, value } = binding;
    if (oldValue !== value) {
      if (value) {
        el.classList.add('fade-in');
        el.classList.remove('fade-out');
      } else {
        el.classList.add('fade-out');
        el.classList.remove('fade-in');
      }
    }
  },
});

Vue.use(VueElectron);
Vue.use(VueI18n);
Vue.use(AsyncComputed);
Vue.use(VueAnalytics, {
  id: (process.env.NODE_ENV === 'production') ? 'UA-2468227-6' : 'UA-2468227-5',
  router,
  set: [
    { field: 'dimension1', value: electron.remote.app.getVersion() },
    { field: 'dimension2', value: getEnvironmentName() },
    { field: 'checkProtocolTask', value: null }, // fix ga not work from file:// url
    { field: 'checkStorageTask', value: null }, // fix ga not work from file:// url
    { field: 'historyImportTask', value: null }, // fix ga not work from file:// url
  ],
});

// Custom plugin area
Vue.use(InputPlugin, {
  namespaced: true,
  mouse: {},
  keyboard: {},
  wheel: {
    phase: true,
    direction: true,
  },
});
// Vue.use(InputPlugin);
// i18n and its plugin
const i18n = new VueI18n({
  locale: getSystemLocale(), // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

// Development-only devtools area
// VueDevtools plugin
if (process.env.NODE_ENV === 'development') {
  Vue.use(VueDevtools);
}

Vue.mixin(helpers);

hookVue(Vue);

Vue.prototype.$bus = new Vue(); // Global event bus
Vue.prototype.$event = new EventEmitter();

store.$i18n = i18n;

const { mapGetters: inputMapGetters } = createNamespacedHelpers('InputPlugin');
/* eslint-disable no-new */
new Vue({
  i18n,
  components: { App },
  router,
  store,
  data() {
    return {
      menu: null,
      menuService: null,
      playlistDisplayState: false,
      topOnWindow: false,
      playingViewTop: false,
      browsingViewTop: false,
      canSendVolumeGa: true,
      openChannelMenu: false,
      currentChannel: '',
      customizedItem: undefined,
      menuAvailable: true,
    };
  },
  computed: {
    ...mapGetters(['volume', 'muted', 'intrinsicWidth', 'intrinsicHeight', 'ratio', 'winAngle', 'winWidth', 'winHeight', 'winPos', 'winSize', 'chosenStyle', 'chosenSize', 'mediaHash', 'list', 'enabledSecondarySub', 'isRefreshing', 'browsingSize', 'pipSize', 'pipPos', 'barrageOpen', 'isPip', 'pipAlwaysOnTop', 'isMaximized', 'pipMode',
      'primarySubtitleId', 'secondarySubtitleId', 'audioTrackList', 'isFullScreen', 'paused', 'singleCycle', 'playlistLoop', 'isHiddenByBossKey', 'isMinimized', 'isFocused', 'originSrc', 'defaultDir', 'ableToPushCurrentSubtitle', 'displayLanguage', 'calculatedNoSub', 'sizePercent', 'snapshotSavedPath', 'duration', 'reverseScrolling', 'pipSize', 'pipPos',
      'showSidebar', 'volumeWheelTriggered',
    ]),
    ...inputMapGetters({
      wheelDirection: iGT.GET_WHEEL_DIRECTION,
      isWheelEnd: iGT.GET_WHEEL_STOPPED,
    }),
    updateSecondarySub() {
      return {
        enabled: true,
        label: this.enabledSecondarySub ? this.$t('msg.subtitle.disabledSecondarySub') : this.$t('msg.subtitle.enabledSecondarySub'),
        id: 'secondarySub',
      };
    },
    currentRouteName() {
      return this.$route.name;
    },
  },
  watch: {
    showSidebar(val: boolean) {
      if (this.currentRouteName === 'playing-view') {
        this.menuService.updateMenuItemLabel(
          'window.sidebar',
          val ? 'msg.window.closeSidebar' : 'msg.window.openSidebar',
        );
      } else if (this.currentRouteName === 'browsing-view') {
        this.menuService.updateMenuItemLabel(
          'browsing.window.sidebar',
          val ? 'msg.window.closeSidebar' : 'msg.window.openSidebar',
        );
      }
    },
    isFullScreen(val) {
      if (this.currentRouteName === 'browsing-view' || this.currentRouteName === 'playing-view') {
        this.menuService.updateMenuItemLabel(
          this.currentRouteName === 'browsing-view' ? 'browsing.window.fullscreen' : 'window.fullscreen',
          val ? 'msg.window.exitFullScreen' : 'msg.window.enterFullScreen',
        );
      }
    },
    topOnWindow(val: boolean) {
      this.$electron.ipcRenderer.send(this.currentRouteName === 'browsing-view' ? 'callBrowsingWindowMethod' : 'callMainWindowMethod', 'setAlwaysOnTop', [val]);
    },
    playingViewTop(val: boolean) {
      if (this.currentRouteName === 'playing-view' && !this.paused) {
        this.topOnWindow = val;
      }
      this.menuService.updateMenuItemChecked('window.keepPlayingWindowFront', val);
    },
    browsingViewTop(val: boolean) {
      if (this.currentRouteName === 'browsing-view' && this.isPip) {
        this.topOnWindow = val;
      }
      this.menuService.updateMenuItemChecked('browsing.window.keepPipFront', val);
    },
    isPip(val: boolean) {
      if (!val && this.topOnWindow) {
        this.topOnWindow = false;
      } else if (val && this.browsingViewTop) {
        this.menuService.updateMenuItemChecked('browsing.window.keepPipFront', this.browsingViewTop);
        this.topOnWindow = true;
      }
    },
    playlistDisplayState(val: boolean) {
      this.menuService.updateMenuItemEnabled('playback.forwardS', !val);
      this.menuService.updateMenuItemEnabled('playback.backwardS', !val);
      this.menuService.updateMenuItemLabel(
        'playback.playlist',
        val ? 'msg.playback.hidePlaylist' : 'msg.playback.showPlaylist',
      );
    },
    displayLanguage(val) {
      if (messages[val]) {
        this.$i18n.locale = val;
      } else {
        console.warn('Invalid displayLanguage', val);
      }
      this.menuService.updateLocale();
    },
    singleCycle(val: boolean) {
      this.menuService.updateMenuItemChecked('playback.singleCycle', val);
    },
    playlistLoop(val: boolean) {
      this.menuService.updateMenuItemChecked('playback.playlistLoop', val);
    },
    enabledSecondarySub() {
      this.menuService.addSecondarySub(this.recentSecondarySubMenu());
    },
    currentRouteName(val) {
      this.menuService.updateRouteName(val);
      if (val === 'browsing-view') this.menuService.addBrowsingHistoryItems();
      if (val === 'landing-view' || val === 'playing-view') this.menuService.addRecentPlayItems();
      if (val === 'landing-view') this.topOnWindow = false;
      if (val === 'playing-view' && this.playingViewTop) {
        this.menuService.updateMenuItemChecked('window.keepPlayingWindowFront', this.playingViewTop);
        this.topOnWindow = true;
      }
    },
    volume(val: number) {
      this.menuService.resolveMute(val <= 0);
    },
    muted(val: boolean) {
      this.menuService.resolveMute(val);
    },
    list() {
      this.menuService.addPrimarySub(this.recentSubMenu());
      this.menuService.addSecondarySub(this.recentSecondarySubMenu());

      this.menuService.updateMenuItemEnabled('subtitle.increasePrimarySubtitleDelay', !!this.primarySubtitleId);
      this.menuService.updateMenuItemEnabled('subtitle.decreasePrimarySubtitleDelay', !!this.primarySubtitleId);
      this.menuService.updateMenuItemEnabled('subtitle.increaseSecondarySubtitleDelay', !!this.secondarySubtitleId);
      this.menuService.updateMenuItemEnabled('subtitle.decreaseSecondarySubtitleDelay', !!this.secondarySubtitleId);
      this.menuService.updateMenuItemEnabled('subtitle.uploadSelectedSubtitle', !!this.ableToPushCurrentSubtitle);
    },
    primarySubtitleId(id: string, oldId: string) {
      if (this.currentRouteName !== 'playing-view') return;
      this.menuService.updateMenuItemEnabled('subtitle.increasePrimarySubtitleDelay', !!id);
      this.menuService.updateMenuItemEnabled('subtitle.decreasePrimarySubtitleDelay', !!id);
      if (id === '') {
        this.menuService.updateMenuItemChecked('subtitle.mainSubtitle.off', true);
        this.menuService.updateMenuItemChecked(`subtitle.mainSubtitle.${oldId}`, false);
      } else if (id === NOT_SELECTED_SUBTITLE) {
        this.menuService.updateMenuItemChecked('subtitle.mainSubtitle.off', false);
        this.menuService.updateMenuItemChecked(`subtitle.mainSubtitle.${oldId}`, false);
      } else if (id) {
        this.menuService.updateMenuItemChecked('subtitle.mainSubtitle.off', false);
        this.menuService.updateMenuItemChecked(`subtitle.mainSubtitle.${id}`, true);
        this.menuService.updateMenuItemChecked(`subtitle.mainSubtitle.${oldId}`, false);
      }
    },
    secondarySubtitleId(id: string, oldId: string) {
      if (this.currentRouteName !== 'playing-view') return;
      this.menuService.updateMenuItemEnabled('subtitle.increaseSecondarySubtitleDelay', !!id);
      this.menuService.updateMenuItemEnabled('subtitle.decreaseSecondarySubtitleDelay', !!id);
      if (id === '') {
        this.menuService.updateMenuItemChecked('subtitle.secondarySubtitle.off', true);
        this.menuService.updateMenuItemChecked(`subtitle.secondarySubtitle.${oldId}`, false);
      } else if (id === NOT_SELECTED_SUBTITLE) {
        this.menuService.updateMenuItemChecked('subtitle.secondarySubtitle.off', false);
        this.menuService.updateMenuItemChecked(`subtitle.secondarySubtitle.${oldId}`, false);
      } else if (id) {
        this.menuService.updateMenuItemChecked('subtitle.secondarySubtitle.off', false);
        this.menuService.updateMenuItemChecked(`subtitle.secondarySubtitle.${id}`, true);
        this.menuService.updateMenuItemChecked(`subtitle.secondarySubtitle.${oldId}`, false);
      }
    },
    audioTrackList(val, oldval) {
      if (this.currentRouteName !== 'playing-view') return;
      if (val.length !== oldval.length) {
        this.menuService.addAudioTrack(this.updateAudioTrack());
      }
      val.forEach((item: Electron.MenuItem, index: number) => {
        if (item.enabled === true) {
          this.menuService.updateMenuItemChecked(`audio.switchAudioTrack.${index}`, true);
        }
      });
    },
    paused(val) {
      if (val && this.topOnWindow) {
        this.topOnWindow = false;
      } else if (!val && this.playingViewTop) {
        this.topOnWindow = true;
      }
      this.menuService.updateMenuItemLabel(
        'playback.playOrPause',
        val ? 'msg.playback.play' : 'msg.playback.pause',
      );
    },
    ableToPushCurrentSubtitle(val) {
      this.menuService.updateMenuItemEnabled('subtitle.uploadSelectedSubtitle', val);
    },
    originSrc(newVal) {
      if (newVal && !this.isWheelEnd) {
        this.$off('wheel-event', this.wheelEventHandler);
        this.isWheelEndWatcher = this.$watch('isWheelEnd', (newVal: boolean) => {
          if (newVal) {
            this.isWheelEndWatcher(); // cancel the isWheelEnd watcher
            this.$on('wheel-event', this.wheelEventHandler); // reset the wheel-event handler
          }
        });
      }
    },
  },
  created() {
    this.$store.commit('getLocalPreference');
    if (this.displayLanguage && messages[this.displayLanguage]) {
      this.$i18n.locale = this.displayLanguage;
    }
    asyncStorage.get('preferences').then((data) => {
      if (data.privacyAgreement === undefined) this.$bus.$emit('privacy-confirm');
      if (!data.primaryLanguage) {
        const { app } = this.$electron.remote;
        let locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
        locale = locale.replace('_', '-');
        if (locale === 'zh-TW' || locale === 'zh-CN') {
          this.$store.dispatch('primaryLanguage', locale);
        } else {
          this.$store.dispatch('primaryLanguage', 'en');
        }
      }
      if (!data.displayLanguage) {
        this.$store.dispatch('displayLanguage', getSystemLocale());
      }
    });
    asyncStorage.get('subtitle-style').then((data) => {
      if (data.chosenStyle !== undefined) {
        this.updateChosenStyle(data.chosenStyle);
      }
      if (data.chosenSize !== undefined) {
        this.updateChosenSize(data.chosenSize);
      }
      this.updateEnabledSecondarySub(!!data.enabledSecondarySub);
    });
    asyncStorage.get('playback-states').then((data) => {
      if (data.volume) {
        this.$store.dispatch(videoActions.VOLUME_UPDATE, data.volume * 100);
      }
      if (data.muted) {
        this.$store.dispatch(videoActions.MUTED_UPDATE, data.muted);
      }
    });
    asyncStorage.get('browsing').then((data) => {
      this.$store.dispatch('updateBrowsingSize', data.browsingSize || this.browsingSize);
      if (data.browsingPos) {
        this.$store.dispatch('updateBrowsingPos', data.browsingPos);
      }
      this.updateBarrageOpen(data.barrageOpen || this.barrageOpen);
      this.updatePipMode(data.pipMode || this.pipMode);
    });
    asyncStorage.get('browsingPip').then((data) => {
      this.$store.dispatch('updatePipSize', data.pipSize || this.pipSize);
      this.$store.dispatch('updatePipPos', data.pipPos || [window.screen.availLeft + 70,
        window.screen.availTop + window.screen.availHeight - 236 - 70]);
    });
    this.$bus.$on('delete-file', () => {
      this.menuService.addRecentPlayItems();
    });
    this.$event.on('playlist-display-state', (e: boolean) => {
      this.playlistDisplayState = e;
    });
  },
  mounted() {
    // https://github.com/electron/electron/issues/3609
    // Disable Zooming
    this.$electron.webFrame.setVisualZoomLevelLimits(1, 1);
    this.menuService = new MenuService();
    this.menuService.updateRouteName(this.currentRouteName);
    this.registeMenuActions();
    this.initializeMenuSettings();
    this.$bus.$on('new-file-open', () => {
      this.menuService.addRecentPlayItems();
    });
    this.$electron.ipcRenderer.on('pip-float-on-top', () => {
      this.browsingViewTop = !this.browsingViewTop;
    });
    this.$bus.$on('disable-windows-menu', () => {
      this.menuAvailable = false;
    });
    this.$bus.$on('open-channel-menu', (info: { channel: string, item?: channelDetails }) => {
      this.openChannelMenu = true;
      if (info.item) this.customizedItem = info.item;
      this.currentChannel = info.channel;
    });
    getClientUUID().then((clientId: string) => {
      this.$ga && this.$ga.set('userId', clientId);
      // get config cat is account enabled
      isAccountEnabled().then((enabled: boolean) => {
        log.debug('account', enabled);
        if (enabled) {
          this.$electron.ipcRenderer.send('account-enabled');
        }
      }).catch(() => {
        // empty
      });
    });
    this.$on('wheel-event', this.wheelEventHandler);

    window.addEventListener('resize', throttle(() => {
      this.$store.commit('windowSize', this.$electron.remote.getCurrentWindow().getSize());
    }, 100));

    window.addEventListener('DOMContentLoaded', () => {
      this.$store.commit('windowSize', this.$electron.remote.getCurrentWindow().getSize());
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 && process.platform === 'win32' && this.menuAvailable) {
        if (this.openChannelMenu) {
          if (this.customizedItem) {
            BrowsingChannelMenu.createCustomizedMenu(this.currentChannel, this.customizedItem);
          } else {
            BrowsingChannelMenu.createChannelMenu(this.currentChannel);
          }
          this.openChannelMenu = false;
          this.customizedItem = undefined;
        } else {
          this.menuService.popupWinMenu();
        }
      } else {
        this.menuAvailable = true;
      }
    });
    window.addEventListener('keydown', (e) => { // eslint-disable-line complexity
      if (e.code === 'BracketLeft') {
        e.preventDefault();
        this.$store.dispatch(videoActions.DECREASE_RATE);
      } else if (e.code === 'BracketRight') {
        e.preventDefault();
        this.$store.dispatch(videoActions.INCREASE_RATE);
      } else if (e.code === 'Backslash') {
        e.preventDefault();
        this.$store.dispatch(videoActions.CHANGE_RATE, 1);
      }
      switch (e.keyCode) {
        case 27:
          if (this.isFullScreen && !this.playlistDisplayState) {
            e.preventDefault();
            this.$bus.$emit('off-fullscreen');
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [false]);
          }
          break;
        case 219:
          e.preventDefault();
          if (this.currentRouteName === 'browsing-view' && e.metaKey) {
            this.$bus.$emit('toggle-back');
          }
          break;
        case 221:
          e.preventDefault();
          if (this.currentRouteName === 'browsing-view' && e.metaKey) {
            this.$bus.$emit('toggle-forward');
          }
          break;
        case 187:
          if (process.platform === 'win32') {
            this.$ga.event('app', 'volume', 'keyboard');
            this.$store.dispatch(videoActions.INCREASE_VOLUME);
            this.$bus.$emit('change-volume-menu');
          }
          break;
        case 189:
          if (process.platform === 'win32') {
            this.$ga.event('app', 'volume', 'keyboard');
            this.$store.dispatch(videoActions.DECREASE_VOLUME);
            this.$bus.$emit('change-volume-menu');
          }
          break;
        case 85:
          if (e.metaKey && e.shiftKey) {
            this.$bus.$emit('open-url-show', true);
          }
          break;
        case 13:
          if (this.currentRouteName === 'playing-view') {
            if (this.isFullScreen) {
              this.$bus.$emit('off-fullscreen');
            } else {
              this.$bus.$emit('to-fullscreen');
            }
          }
          break;
        default:
          break;
      }
    });
    /* eslint-disable */
    window.addEventListener('wheel', (e) => {
      // ctrlKey is the official way of detecting pinch zoom on mac for chrome
      if (!e.ctrlKey) {
        let isAdvanceColumeItem;
        let isSubtitleScrollItem;
        let isAudioTranslateItem;
        const advance = document.querySelector('.mainMenu');
        const audioTranslate = document.querySelector('.audio-translate');
        const subtitle = document.querySelector('.subtitle-scroll-items');
        if (advance) {
          const nodeList = advance.childNodes;
          for (let i = 0; i < nodeList.length; i += 1) {
            isAdvanceColumeItem = nodeList[i].contains(e.target as Node);
            if (isAdvanceColumeItem) break;
          }
        }
        if (audioTranslate) {
          isAudioTranslateItem = audioTranslate.contains(e.target as Node);
          if (!isAudioTranslateItem) {
            const nodeList = audioTranslate.childNodes;
            for (let i = 0; i < nodeList.length; i += 1) {
              isAudioTranslateItem = nodeList[i].contains(e.target as Node);
              if (isAudioTranslateItem) break;
            }
          }
        }
        if (subtitle) {
          const subList = subtitle.childNodes;
          for (let i = 0; i < subList.length; i += 1) {
            isSubtitleScrollItem = subList[i].contains(e.target as Node);
            if (isSubtitleScrollItem) break;
          }
        }
        if (this.volumeWheelTriggered) {
          if (e.deltaY) {
            if (this.canSendVolumeGa) {
              this.$ga.event('app', 'volume', 'wheel');
              this.canSendVolumeGa = false;
              setTimeout(() => {
                this.canSendVolumeGa = true;
              }, 1000);
            }
            if (this.wheelDirection === 'vertical' || this.playlistDisplayState) {
              let step = Math.abs(e.deltaY) * 0.06;
              // in windows if wheel setting more lines per step, make it limited.
              if (process.platform !== 'darwin' && step > 6) {
                step = 6;
              }
              if (
                (process.platform !== 'darwin' && !this.reverseScrolling) ||
                (process.platform === 'darwin' && this.reverseScrolling)
              ) {
                this.$store.dispatch(
                  e.deltaY < 0 ? videoActions.INCREASE_VOLUME : videoActions.DECREASE_VOLUME,
                  step,
                );
              } else if (
                (process.platform === 'darwin' && !this.reverseScrolling) ||
                (process.platform !== 'darwin' && this.reverseScrolling)
              ) {
                this.$store.dispatch(
                  e.deltaY > 0 ? videoActions.INCREASE_VOLUME : videoActions.DECREASE_VOLUME,
                  step,
                );
              }
            }
          }
        }
      }
    });
    window.addEventListener('wheel', (event) => {
      const { deltaX: x, ctrlKey, target } = event;
      let isAdvanceColumeItem;
      let isSubtitleScrollItem;
      let isAudioTranslateItem;
      const advance = document.querySelector('.mainMenu');
      const audioTranslate = document.querySelector('.audio-translate');
      const subtitle = document.querySelector('.subtitle-scroll-items');
      if (advance) {
        const nodeList = advance.childNodes;
        for (let i = 0; i < nodeList.length; i += 1) {
          isAdvanceColumeItem = nodeList[i].contains(target as Node);
          if (isAdvanceColumeItem) break;
        }
      }
      if (audioTranslate) {
        isAudioTranslateItem = audioTranslate.contains(target as Node);
        if (!isAudioTranslateItem) {
          const nodeList = audioTranslate.childNodes;
          for (let i = 0; i < nodeList.length; i += 1) {
            isAudioTranslateItem = nodeList[i].contains(target as Node);
            if (isAudioTranslateItem) break;
          }
        }
      }
      if (subtitle) {
        const subList = subtitle.childNodes;
        for (let i = 0; i < subList.length; i += 1) {
          isSubtitleScrollItem = subList[i].contains(target as Node);
          if (isSubtitleScrollItem) break;
        }
      }
      if (!ctrlKey && !isAdvanceColumeItem && !isSubtitleScrollItem && !isAudioTranslateItem) {
        this.$emit('wheel-event', { x });
      }
    });
    /* eslint-disable */

    window.addEventListener('drop', (e) => {
      if (this.currentRouteName !== 'landing-view' && this.currentRouteName !== 'playing-view') return;
      e.preventDefault();
      this.$bus.$emit('drop');
      this.$store.commit('source', 'drop');
      const files = Array.prototype.map.call(e.dataTransfer!.files, (f: File) => f.path)
      const onlyFolders = files.every((file: fs.PathLike) => fs.statSync(file).isDirectory());
      if (this.currentRouteName === 'landing-view' && !onlyFolders && files.every((file: fs.PathLike) => getValidSubtitleRegex().test(file))) {
        this.$electron.ipcRenderer.send('drop-subtitle', files);
      } else {
        files.forEach((file: fs.PathLike) => this.$electron.remote.app.addRecentDocument(file));
        if (onlyFolders) {
          this.openFolder(...files);
        } else {
          this.openFile(...files);
        }
      }
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.currentRouteName !== 'landing-view' && this.currentRouteName !== 'playing-view') return;
      e.dataTransfer!.dropEffect = process.platform === 'darwin' ? 'copy' : '';
      this.$bus.$emit('drag-over');
    });
    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.$bus.$emit('drag-leave');
    });

    this.$electron.ipcRenderer.on('open-dialog', (e: Event, playlistId?: number) => {
      if (!playlistId) this.openFilesByDialog();
      else this.openPlayList(playlistId);
    });

    this.$electron.ipcRenderer.on('open-file', (event: Event, args: { onlySubtitle: boolean, files: string[] }) => {
      if (!['landing-view', 'playing-view', 'browsing-view'].includes(this.currentRouteName)) return;
      if (!args.files.length && args.onlySubtitle) {
        log.info('helpers/index.js', `Cannot find any related video in the folder: ${args.files}`);
        addBubble(LOAD_SUBVIDEO_FAILED);
      } else {
        const onlyFolders = args.files.every((file: any) => fs.statSync(file).isDirectory());
        if (onlyFolders) {
          this.openFolder(...args.files);
        } else {
          this.openFile(...args.files);
        }
      }
    });
    this.$electron.ipcRenderer.on('open-subtitle-in-mas', (event: Event, file: string) => {
      this.openFilesByDialog({ defaultPath: file });
    });
    this.$electron.ipcRenderer.on('add-local-subtitles', (event: Event, file: string[]) => {
      this.addLocalSubtitlesWithSelect(file);
    });
    // win32 exe || mac dmg
    const canUseCheckForUpdates = isWindowsExE || isMacintoshDMG;
    if (navigator.onLine && canUseCheckForUpdates) {
      // auto check for updates
      checkForUpdate(true).then((
        json: { version: string, isLastest: boolean, landingPage: string, url: string }
      ) => {
        if (!json.isLastest && this.currentRouteName !== 'browsing-view') {
          this.$bus.$emit('new-version', json);
        }
      }).catch((err: Error) => {
        // empty
      });
    }
    // manual check for updates
    this.$electron.ipcRenderer.on('check-for-updates', (event: Event) => {
      // if not (win32 exe || mac beta) return
      if (!canUseCheckForUpdates) return;
      // check online
      if (!navigator.onLine) return addBubble(CHECK_FOR_UPDATES_OFFLINE);
      checkForUpdate(false).then((
        json: { version: string, isLastest: boolean, landingPage: string, url: string }
      ) => {
        if (!json.isLastest) {
          this.$bus.$emit('new-version', json);
        } else {
          this.$bus.$emit('lastest-version', json);
        }
      }).catch((err: Error) => {
        addBubble(REQUEST_TIMEOUT);
      });
    });
  },
  methods: {
    ...mapActions({
      updateSubDelay: subtitleActions.UPDATE_SUBTITLE_DELAY,
      updateChosenStyle: subtitleActions.UPDATE_SUBTITLE_STYLE,
      updateChosenSize: subtitleActions.UPDATE_SUBTITLE_SIZE,
      updateEnabledSecondarySub: subtitleActions.UPDATE_ENABLED_SECONDARY_SUBTITLE,
      changeFirstSubtitle: smActions.manualChangePrimarySubtitle,
      changeSecondarySubtitle: smActions.manualChangeSecondarySubtitle,
      refreshSubtitles: smActions.refreshSubtitles,
      addLocalSubtitlesWithSelect: smActions.addLocalSubtitlesWithSelect,
      updateSubtitleType: subtitleActions.UPDATE_SUBTITLE_TYPE,
      updateSubSettingsType: subtitleActions.UPDATE_SUBTITLE_SETTINGS_TYPE,
      changePrimarySubDelay: SubtitleManager.alterPrimaryDelay,
      changeSecondarySubDelay: SubtitleManager.alterSecondaryDelay,
      updateBarrageOpen: browsingActions.UPDATE_BARRAGE_OPEN,
      showAudioTranslateModal: atActions.AUDIO_TRANSLATE_SHOW_MODAL,
      updatePipMode: browsingActions.UPDATE_PIP_MODE,
      updateCurrentChannel: browsingActions.UPDATE_CURRENT_CHANNEL,
      updateShowSidebar: uiActions.UPDATE_SHOW_SIDEBAR,
    }),
    async initializeMenuSettings() {
      if (this.currentRouteName !== 'welcome-privacy' && this.currentRouteName !== 'language-setting') {
        await this.menuService.addRecentPlayItems();
      }

      if (this.currentRouteName === 'playing-view') {
        this.menuService.addPrimarySub(this.recentSubMenu());
        this.menuService.addSecondarySub(this.recentSecondarySubMenu());
        this.menuService.addAudioTrack(this.updateAudioTrack());

        this.menuService.updateMenuItemEnabled('subtitle.increasePrimarySubtitleDelay', !!this.primarySubtitleId);
        this.menuService.updateMenuItemEnabled('subtitle.decreasePrimarySubtitleDelay', !!this.primarySubtitleId);
        this.menuService.updateMenuItemEnabled('subtitle.increaseSecondarySubtitleDelay', !!this.secondarySubtitleId);
        this.menuService.updateMenuItemEnabled('subtitle.decreaseSecondarySubtitleDelay', !!this.secondarySubtitleId);
        this.menuService.updateMenuItemEnabled('subtitle.uploadSelectedSubtitle', !!this.ableToPushCurrentSubtitle);

        this.audioTrackList.forEach((item: Electron.MenuItem, index: number) => {
          if (item.enabled === true) {
            this.menuService.updateMenuItemChecked(`audio.switchAudioTrack.${index}`, true);
          }
        });

        this.list.forEach((item: ISubtitleControlListItem) => {
          if (item.id === this.primarySubtitleId) {
            this.menuService.updateMenuItemChecked(`subtitle.mainSubtitle.${item.id}`, true);
          }
          if (item.id === this.secondarySubtitleId) {
            this.menuService.updateMenuItemChecked(`subtitle.secondarySubtitle.${item.id}`, true);
          }
          this.menuService.updateMenuItemEnabled(`subtitle.secondarySubtitle.${item.id}`, this.enabledSecondarySub);
        });
        this.menuService.updateMenuItemEnabled('subtitle.secondarySubtitle.off', this.enabledSecondarySub);
      }
    },
    registeMenuActions() {
      const { app, dialog } = this.$electron.remote;
      this.menuService.on('file.open', () => {
        if (this.defaultDir) {
          this.openFilesByDialog();
        } else {
          const defaultPath = process.platform === 'darwin' ? app.getPath('home') : app.getPath('desktop');
          this.$store.dispatch('UPDATE_DEFAULT_DIR', defaultPath);
          this.openFilesByDialog({ defaultPath });
        }
      });
      this.menuService.on('file.openRecent', (e: Event, id: number) => {
        this.openPlayList(id);
      });
      this.menuService.on('file.clearHistory', () => {
        this.infoDB.clearAll();
        app.clearRecentDocuments();
        this.$bus.$emit('clean-landingViewItems');
        if (this.currentRouteName === 'playing-view') {
          this.openVideoFile(this.originSrc);
        }
        this.menuService.addRecentPlayItems();
      });
      this.menuService.on('history.reload', () => {
        this.$bus.$emit('toggle-reload');
      });
      this.menuService.on('history.back', () => {
        this.$bus.$emit('toggle-back');
      });
      this.menuService.on('history.forward', () => {
        this.$bus.$emit('toggle-forward');
      });
      this.menuService.on('history.clearHistory', () => {
        browsingHistory.clearAllHistorys();
      });
      this.menuService.on('playback.playOrPause', () => {
        this.$bus.$emit('toggle-playback');
      });
      this.menuService.on('playback.forwardS', () => {
        this.$bus.$emit('seek', videodata.time + 5);
      });
      this.menuService.on('playback.backwardS', () => {
        this.$bus.$emit('seek', videodata.time - 5);
      });
      this.menuService.on('playback.forwardL', () => {
        this.$bus.$emit('seek', videodata.time + 60);
      });
      this.menuService.on('playback.backwardL', () => {
        this.$bus.$emit('seek', videodata.time - 60);
      });
      this.menuService.on('playback.increasePlaybackSpeed', () => {
        this.$store.dispatch(videoActions.INCREASE_RATE);
      });
      this.menuService.on('playback.decreasePlaybackSpeed', () => {
        this.$store.dispatch(videoActions.DECREASE_RATE);
      });
      this.menuService.on('playback.resetSpeed', () => {
        this.$store.dispatch(videoActions.CHANGE_RATE, 1);
      });
      this.menuService.on('playback.playlist', () => {
        this.$bus.$emit('switch-playlist');
      });
      this.menuService.on('playback.previousVideo', () => {
        this.$bus.$emit('previous-video');
      });
      this.menuService.on('playback.nextVideo', () => {
        this.$bus.$emit('next-video');
      });
      this.menuService.on('playback.singleCycle', () => {
        if (this.playlistLoop) this.$store.dispatch('playlistLoop', false);
        if (this.singleCycle) {
          this.$store.dispatch('notSingleCycle');
        } else {
          this.$store.dispatch('singleCycle');
        }
      });
      this.menuService.on('playback.playlistLoop', () => {
        if (this.singleCycle) this.$store.dispatch('notSingleCycle');
        this.$store.dispatch('playlistLoop', !this.playlistLoop);
      });
      this.menuService.on('playback.snapShot', () => {
        if (!this.paused) {
          this.$bus.$emit('toggle-playback');
        }
        const options = { types: ['window'], thumbnailSize: { width: this.winWidth, height: this.winHeight } };
        electron.desktopCapturer.getSources(options, (error, sources) => {
          if (error) {
            log.info('render/main', 'Snapshot failed .');
            addBubble(SNAPSHOT_FAILED);
          }
          sources.forEach((source) => {
            if (source.name === 'SPlayer') {
              const date = new Date();
              const imgName = `SPlayer-${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}-${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}.png`;
              const screenshotPath = path.join(
                this.snapshotSavedPath ? this.snapshotSavedPath : app.getPath('desktop'),
                imgName,
              );
              fs.writeFile(screenshotPath, source.thumbnail.toPNG(), (error) => {
                if (error) {
                  if (error.message.includes('operation not permitted')) {
                    this.chooseSnapshotFolder(
                      imgName,
                      {
                        name: imgName,
                        buffer: source.thumbnail.toPNG(),
                        defaultFolder: this.snapshotSavedPath,
                      },
                    );
                  } else {
                    log.info('render/main', 'Snapshot failed .');
                    addBubble(SNAPSHOT_FAILED);
                  }
                } else {
                  log.info('render/main', 'Snapshot success .');
                  addBubble(SNAPSHOT_SUCCESS);
                }
              });
            }
          });
        });
      });
      this.menuService.on('playback.generate3', () => {
        this.$bus.$emit('generate-post', 3);
      });
      this.menuService.on('playback.generate4', () => {
        this.$bus.$emit('generate-post', 4);
      });
      this.menuService.on('audio.increaseVolume', () => {
        this.$ga.event('app', 'volume', 'keyboard');
        this.$store.dispatch(videoActions.INCREASE_VOLUME);
        this.$bus.$emit('change-volume-menu');
      });
      this.menuService.on('audio.decreaseVolume', () => {
        this.$ga.event('app', 'volume', 'keyboard');
        this.$store.dispatch(videoActions.DECREASE_VOLUME);
        this.$bus.$emit('change-volume-menu');
      });
      this.menuService.on('audio.mute', () => {
        this.$bus.$emit('toggle-muted');
      });
      this.menuService.on('audio.switchAudioTrack', (e: Event, id: number) => {
        this.$bus.$emit('switch-audio-track', id);
      })
      this.menuService.on('subtitle.AITranslation', () => {
        if (!this.isRefreshing) {
          this.refreshSubtitles();
        }
      });
      this.menuService.on('subtitle.loadSubtitleFile', () => {
        const { remote } = this.$electron;
        const browserWindow = remote.BrowserWindow;
        const focusWindow = browserWindow.getFocusedWindow();
        const VALID_EXTENSION = ['ass', 'srt', 'vtt'];

        dialog.showOpenDialog(focusWindow, {
          title: 'Open Dialog',
          defaultPath: path.dirname(this.originSrc),
          filters: [{
            name: 'Subtitle Files',
            extensions: VALID_EXTENSION,
          }],
          properties: ['openFile'],
        }, (item: string[]) => {
          if (item) {
            this.$bus.$emit('add-subtitles', [{ src: item[0], type: 'local' }]);
          }
        });
      });
      this.menuService.on('subtitle.mainSubtitle', (e: Event, id: string, item: ISubtitleControlListItem) => {
        if (id === 'off') this.changeFirstSubtitle('');
        else if (item.type === Type.PreTranslated && item.source.source === '') {
          this.showAudioTranslateModal(item);
        } else {
          this.updateSubtitleType(true);
          this.changeFirstSubtitle(item.id);
        }
      });
      this.menuService.on('subtitle.secondarySubtitle', (e: Event, id: string, item: ISubtitleControlListItem) => {
        if (id === 'off') this.changeSecondarySubtitle('');
        else if (id === 'secondarySub') {
          this.updateEnabledSecondarySub(!this.enabledSecondarySub)
        } else if (item.type === Type.PreTranslated && item.source.source === '') {
          this.showAudioTranslateModal(item);
        } else {
          this.updateSubtitleType(false);
          this.changeSecondarySubtitle(id);
        }
      });
      this.menuService.on('subtitle.subtitleSetting', () => {
        this.$bus.$emit('show-subtitle-settings');
      });
      this.menuService.on('subtitle.increasePrimarySubtitleDelay', () => {
        this.updateSubSettingsType(true);
        this.changePrimarySubDelay(0.1);
      });
      this.menuService.on('subtitle.decreasePrimarySubtitleDelay', () => {
        this.updateSubSettingsType(false);
        this.changeSecondarySubDelay(-0.1);
      });
      this.menuService.on('subtitle.increaseSecondarySubtitleDelay', () => {
        this.updateSubSettingsType(false);
        this.changeSecondarySubDelay(0.1);
      });
      this.menuService.on('subtitle.decreaseSecondarySubtitleDelay', () => {
        this.updateSubSettingsType(false);
        this.changeSecondarySubDelay(-0.1);
      });
      this.menuService.on('subtitle.uploadSelectedSubtitle', () => {
        this.$store.dispatch(SubtitleManager.manualUploadAllSubtitles);
      });
      this.menuService.on('window.keepPlayingWindowFront', () => {
        this.playingViewTop = !this.playingViewTop;
        this.$bus.$emit('invoke-all-widgets');
      });
      this.menuService.on('window.fullscreen', () => {
        if (this.isFullScreen) {
          this.$bus.$emit('off-fullscreen');
        } else {
          this.$bus.$emit('to-fullscreen');
        }
      });
      this.menuService.on('browsing.window.fullscreen', () => {
        if (this.$electron.remote.getCurrentWindow().isFocused()) {
          if (this.isFullScreen) {
            this.$bus.$emit('off-fullscreen');
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [false]);
          } else {
            this.$bus.$emit('to-fullscreen');
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [true]);
          }
        } else {
          this.$electron.ipcRenderer.send('pip-window-fullscreen');
        }
      });
      this.menuService.on('window.halfSize', () => {
        this.changeWindowSize(0.5);
      });
      this.menuService.on('window.originSize', () => {
        this.changeWindowSize(1);
      });
      this.menuService.on('window.doubleSize', () => {
        this.changeWindowSize(2);
      });
      this.menuService.on('window.maxmize', () => {
        const browserWindow = this.$electron.remote.getCurrentWindow();
        if (!browserWindow.isMaximized()) {
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'maximize');
        } else {
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'unmaximize');
        }
      });
      this.menuService.on('window.windowRotate', throttle(() => {
        this.windowRotate();
      }, 150));
      this.menuService.on('window.backToLandingView', () => {
        this.$router.push({ name: 'landing-view' });
      });
      this.menuService.on('window.sidebar', () => {
        this.$event.emit('side-bar-mouseup');
      });
      this.menuService.on('browsing.window.keepPipFront', () => {
        this.browsingViewTop = !this.browsingViewTop;
        ipcRenderer.send('browser-window-mask');
      });
      this.menuService.on('browsing.window.pip', () => {
        this.$bus.$emit('toggle-pip', true);
      });
      this.menuService.on('browsing.window.playInNewWindow', () => {
        this.$bus.$emit('toggle-pip', false);
      });
      this.menuService.on('browsing.window.minimize', () => {
        this.$electron.ipcRenderer.send('set-window-minimize');
      });
      this.menuService.on('browsing.window.maxmize', () => {
        this.$electron.ipcRenderer.send('set-window-maximize');
      });
      this.menuService.on('browsing.window.sidebar', () => {
        this.$bus.$emit('toggle-side-bar');
      });
      this.menuService.on('browsing.window.backToLandingView', () => {
        this.$router.push({ name: 'landing-view' });
      });
      this.menuService.on('help.uploadInfo', () => {
        Parse.serverURL = 'https://support.splayer.work/parse';
        Parse.initialize('chiron_support');
        const Report = Parse.Object.extend('SPlayerBugReport');
        const report = new Report();
        console.log('version', this.$electron.remote.app.getVersion());
        report.set('appInfo', {
          version: this.$electron.remote.app.getVersion(),
        });
        report.set('userInfo', {

        });
        report.set('crashReport', {

        });
        report.set('logs', {

        });
        if (this.currentRouteName === 'playing-view') {
          report.set('videoInfo', {

          });
        }
        console.log('report', report);
      });
    },
    getSubName(item: ISubtitleControlListItem) {
      if (item.type === Type.Embedded) {
        return `${this.$t('subtitle.embedded')} ${item.name}`;
      }
      return item.name;
    },
    recentSubTmp(item: ISubtitleControlListItem, isFirstSubtitleType: boolean) {
      return {
        id: `${item.id}`,
        enabled: isFirstSubtitleType ? true : this.enabledSecondarySub,
        label: this.getSubName(item, this.list),
        checked: isFirstSubtitleType ? item.id === this.primarySubtitleId : item.id === this.secondarySubtitleId,
        subtitleItem: item,
      };
    },
    recentSubMenu() {
      const submenu: Electron.MenuItemConstructorOptions[] = [];
      const offItem = {
        id: 'off',
        label: this.calculatedNoSub ? this.$t('msg.subtitle.noSubtitle') : this.$t('msg.subtitle.notToShowSubtitle'),
        checked: false,
      }
      submenu.push(offItem);

      this.list.forEach((item: ISubtitleControlListItem, index: number) => {
        submenu.push(this.recentSubTmp(item, true));
      });

      if (this.primarySubtitleId === '') offItem.checked = true;

      return submenu;
    },
    recentSecondarySubMenu() {
      const submenu: Electron.MenuItemConstructorOptions[] = [];
      submenu.push(this.updateSecondarySub);
      submenu.push({
        id: 'menubar.separator',
      });
      const offItem = {
        id: 'off',
        label: this.calculatedNoSub ? this.$t('msg.subtitle.noSubtitle') : this.$t('msg.subtitle.notToShowSubtitle'),
        enabled: this.enabledSecondarySub,
        checked: false,
      }
      submenu.push(offItem);

      this.list.forEach((item: ISubtitleControlListItem, index: number) => {
        submenu.push(this.recentSubTmp(item, false));
      });

      if (this.secondarySubtitleId === '') offItem.checked = true;

      return submenu;
    },
    updateAudioTrackItem(key: number, value: string) {
      return {
        id: `${key}`,
        visible: true,
        type: 'radio',
        label: value,
      };
    },
    updateAudioTrack() {
      const submenu: Electron.MenuItemConstructorOptions[] = [];
      if (this.audioTrackList.length === 1 && this.audioTrackList[0].language === 'und') {
        submenu.splice(0, 1, this.updateAudioTrackItem(0, this.$t('advance.chosenTrack')));
      } else {
        this.audioTrackList.forEach((item: { language: string, name: string }, index: number) => {
          let detail;
          if (item.language === 'und' || item.language === '') {
            detail = `${this.$t('advance.track')} ${index + 1}`;
          } else if (this.audioTrackList.length === 1) {
            detail = `${this.$t('advance.track')} ${index + 1} : ${item.language}`;
          } else {
            detail = `${this.$t('advance.track')} ${index + 1}: ${item.name}`;
          }
          submenu.splice(index, 1, this.updateAudioTrackItem(index, detail));
        });
      }
      return submenu;
    },
    pathProcess(path: string) {
      if (process.platform === 'win32') {
        return path.toString().replace(/^file:\/\/\//, '');
      }
      return path.toString().replace(/^file\/\//, '');
    },
    windowRotate() {
      this.$store.dispatch('windowRotate90Deg');
      if (this.isFullScreen) return;
      const videoSize = [this.winSize[0], this.winSize[1]].reverse();
      const oldRect = this.winPos.concat(this.winSize);
      windowRectService.calculateWindowRect(videoSize, false, oldRect);
    },
    changeWindowSize(key: number) {
      if (!this.originSrc || key === this.sizePercent) {
        return;
      }
      this.$store.dispatch('updateSizePercent', key);
      const availWidth = window.screen.availWidth;
      const availHeight = window.screen.availHeight;
      let videoSize = [this.intrinsicWidth * key, this.intrinsicHeight * key];
      if (key === 0.5) {
        videoSize = [this.intrinsicWidth, this.intrinsicHeight];
        if (this.ratio > 1 && videoSize[0] > availWidth * 0.7) {
          videoSize[0] = availWidth * 0.7;
          videoSize[1] = videoSize[0] / this.ratio;
        } else if (this.ratio <= 1 && videoSize[1] > availHeight * 0.7) {
          videoSize[1] = availHeight * 0.7;
          videoSize[0] = videoSize[1] * this.ratio;
        }
      } else if (key === 3) {
        if (videoSize[0] < availWidth && videoSize[1] < availHeight) {
          videoSize[1] = availHeight;
          videoSize[0] = videoSize[1] * this.ratio;
        }
      }
      const oldRect = this.winPos.concat(this.winSize);
      windowRectService.calculateWindowRect(videoSize, false, oldRect);
    },
    // eslint-disable-next-line complexity
    wheelEventHandler({ x }: { x: number }) {
      if (this.duration && this.wheelDirection === 'horizontal' && !this.playlistDisplayState) {
        const eventName = x < 0 ? 'seek-forward' : 'seek-backward';
        const absX = Math.abs(x);

        let finalSeekSpeed = 0;
        if (absX >= 285) finalSeekSpeed = this.duration;
        else if (absX <= 3) {
          finalSeekSpeed = 0.08;
        } else {
          const maximiumSpeed = this.duration / 50;
          const minimiumSpeed = 1;
          const speed = (this.duration / 5000) * absX;
          if (speed < minimiumSpeed) finalSeekSpeed = 0;
          else if (speed > maximiumSpeed) finalSeekSpeed = maximiumSpeed;
          else finalSeekSpeed = speed;
        }
        this.$bus.$emit(eventName, finalSeekSpeed);
      }
    },
  },
  template: '<App/>',
}).$mount('#app');
