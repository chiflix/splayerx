/* eslint-disable import/first */
// Be sure to call Sentry function as early as possible in the main process
import '../shared/sentry';

import path from 'path';
import fs from 'fs';
import electron from 'electron';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import axios from 'axios';
import { mapGetters, mapActions, createNamespacedHelpers } from 'vuex';
import uuidv4 from 'uuid/v4';
import osLocale from 'os-locale';
import VueAxios from 'vue-axios';
// @ts-ignore
import VueElectronJSONStorage from 'vue-electron-json-storage';
// @ts-ignore
import VueAnalytics from 'vue-analytics';
// @ts-ignore
import VueElectron from 'vue-electron';
// @ts-ignore
import AsyncComputed from 'vue-async-computed';
// @ts-ignore
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import messages from '@/locales';
import { windowRectService } from '@/services/window/WindowRectService';
import helpers from '@/helpers';
import { hookVue } from '@/kerning';
import { Video as videoActions, Subtitle as subtitleActions, SubtitleManager as smActions, SubtitleManager } from '@/store/actionTypes';
import { log } from '@/libs/Log';
import asyncStorage from '@/helpers/asyncStorage';
import { videodata } from '@/store/video';
import { addBubble } from './helpers/notificationControl';
import { SNAPSHOT_FAILED, SNAPSHOT_SUCCESS, LOAD_SUBVIDEO_FAILED } from './helpers/notificationcodes';
import InputPlugin, { getterTypes as iGT } from '@/plugins/input';
import { VueDevtools } from './plugins/vueDevtools.dev';
import { SubtitleControlListItem, Type } from './interfaces/ISubtitle';
import { getValidVideoRegex, getValidSubtitleRegex } from '../shared/utils';
import { EventEmitter } from 'events';
import MenuService, { menuService } from '../main/services/menu/MenuService';

// causing callbacks-registry.js 404 error. disable temporarily
// require('source-map-support').install();

function getSystemLocale() {
  const { app } = electron.remote;
  let locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
  locale = locale.replace('_', '-');
  if (locale === 'zh-TW' || locale === 'zh-HK' || locale === 'zh-Hant') {
    return 'zh-Hant';
  } else if (locale.startsWith('zh')) {
    return 'zh-Hans';
  }
  return 'en';
}

function getEnvironmentName() {
  if (process.platform === 'darwin') {
    return process.mas ? 'MAS' : 'DMG';
  } else if (process.platform === 'win32') {
    return process.windowsStore ? 'APPX' : 'EXE';
  }
  return 'Unknown';
}

Vue.config.productionTip = false;
Vue.config.warnHandler = (warn) => {
  log.info('render/main', warn);
};
Vue.config.errorHandler = (err) => {
  log.error('render/main', err);
};
Vue.directive('fade-in', {
  bind(el: HTMLElement, binding: any) {
    if (!el) return;
    const { value } = binding;
    if (value) {
      el.classList.add('fade-in');
      el.classList.remove('fade-out');
    } else {
      el.classList.add('fade-out');
      el.classList.remove('fade-in');
    }
  },
  update(el: HTMLElement, binding: any) {
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
Vue.use(VueElectronJSONStorage);
Vue.use(VueAxios, axios);
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
  template: '<App/>',
  data() {
    return {
      menu: null,
      playlistDisplayState: false,
      topOnWindow: false,
      canSendVolumeGa: true,
      menuOperationLock: false, // 如果正在创建目录，就锁住所以操作目录的动作，防止野指针
    };
  },
  computed: {
    ...mapGetters(['volume', 'muted', 'intrinsicWidth', 'intrinsicHeight', 'ratio', 'winAngle', 'winWidth', 'winHeight', 'winPos', 'winSize', 'chosenStyle', 'chosenSize', 'mediaHash', 'list', 'enabledSecondarySub', 'isRefreshing',
      'primarySubtitleId', 'secondarySubtitleId', 'audioTrackList', 'isFullScreen', 'paused', 'singleCycle', 'isHiddenByBossKey', 'isMinimized', 'isFocused', 'originSrc', 'defaultDir', 'ableToPushCurrentSubtitle', 'displayLanguage', 'calculatedNoSub', 'sizePercent', 'snapshotSavedPath', 'duration', 'reverseScrolling',
    ]),
    ...inputMapGetters({
      wheelDirection: iGT.GET_WHEEL_DIRECTION,
      isWheelEnd: iGT.GET_WHEEL_STOPPED,
    }),
    // menu
    darwinPlayback() {
      return [
        {
          label: this.$t('msg.playback.forwardL'),
          accelerator: 'Up',
          click: () => {
            this.$bus.$emit('seek', videodata.time + 60);
          },
        },
        {
          label: this.$t('msg.playback.backwardL'),
          accelerator: 'Down',
          click: () => {
            this.$bus.$emit('seek', videodata.time - 60);
          },
        },
      ];
    },
    winPlayback() {
      return [
        {
          label: this.$t('msg.playback.forwardL'),
          accelerator: 'Alt+Right',
          click: () => {
            this.$bus.$emit('seek', videodata.time + 60);
          },
        },
        {
          label: this.$t('msg.playback.backwardL'),
          accelerator: 'Alt+Left',
          click: () => {
            this.$bus.$emit('seek', videodata.time - 60);
          },
        },
      ];
    },
    winVolume() {
      return [
        {
          label: this.$t('msg.audio.increaseVolume'),
          accelerator: 'Up',
          id: 'inVolume',
          click: () => {
            this.$ga.event('app', 'volume', 'keyboard');
            this.$store.dispatch(videoActions.INCREASE_VOLUME);
            this.$bus.$emit('change-volume-menu');
          },
        },
        {
          label: this.$t('msg.audio.decreaseVolume'),
          accelerator: 'Down',
          id: 'deVolume',
          click: () => {
            this.$ga.event('app', 'volume', 'keyboard');
            this.$store.dispatch(videoActions.DECREASE_VOLUME);
            this.$bus.$emit('change-volume-menu');
          },
        },
      ];
    },
    darwinVolume() {
      return [
        {
          label: this.$t('msg.audio.increaseVolume'),
          accelerator: '=',
          id: 'inVolume',
          click: () => {
            this.$ga.event('app', 'volume', 'keyboard');
            this.$store.dispatch(videoActions.INCREASE_VOLUME);
            this.$bus.$emit('change-volume-menu');
          },
        },
        {
          label: this.$t('msg.audio.decreaseVolume'),
          accelerator: '-',
          id: 'deVolume',
          click: () => {
            this.$ga.event('app', 'volume', 'keyboard');
            this.$store.dispatch(videoActions.DECREASE_VOLUME);
            this.$bus.$emit('change-volume-menu');
          },
        },
      ];
    },
    updateFullScreen() {
      if (this.isFullScreen) {
        return {
          label: this.$t('msg.window.exitFullScreen'),
          accelerator: 'F',
          click: () => {
            this.$bus.$emit('off-fullscreen');
            this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [false]);
          },
        };
      }
      return {
        label: this.$t('msg.window.enterFullScreen'),
        accelerator: 'F',
        click: () => {
          this.$bus.$emit('to-fullscreen');
          this.$electron.ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [true]);
        },
      };
    },
    updateSecondarySub() {
      if (this.enabledSecondarySub) {
        return {
          label: this.$t('msg.subtitle.disabledSecondarySub'),
          id: 'secondarySub',
          click: () => {
            this.updateEnabledSecondarySub(false);
          },
        };
      }
      return {
        label: this.$t('msg.subtitle.enabledSecondarySub'),
        id: 'secondarySub',
        click: () => {
          this.updateEnabledSecondarySub(true);
        },
      };
    },
    updatePlayOrPause() {
      if (!this.paused) {
        return {
          label: `${this.$t('msg.playback.pause')}`,
          accelerator: 'Space',
          click: () => {
            this.$bus.$emit('toggle-playback');
          },
        };
      }
      return {
        label: `${this.$t('msg.playback.play')}`,
        accelerator: 'Space',
        click: () => {
          this.$bus.$emit('toggle-playback');
        },
      };
    },
    currentRouteName() {
      return this.$route.name;
    },
  },
  created() {
    console.log(messages);
    this.$store.commit('getLocalPreference');
    if (this.displayLanguage && messages[this.displayLanguage]) this.$i18n.locale = this.displayLanguage;
    asyncStorage.get('preferences').then((data) => {
      if (data.privacyAgreement === undefined) this.$bus.$emit('privacy-confirm');
      if (!data.primaryLanguage) {
        const { app } = this.$electron.remote;
        const locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
        if (locale === 'zh_TW' || locale === 'zh_CN') {
          this.$store.dispatch('primaryLanguage', locale.replace('_', '-'));
        } else {
          this.$store.dispatch('primaryLanguage', 'en');
        }
      }
      if (!data.displayLanguage) {
        this.$store.dispatch('displayLanguage', getSystemLocale());
      }
    });
    asyncStorage.get('subtitle-style').then((data) => {
      if (data.chosenStyle) {
        this.updateChosenStyle(data.chosenStyle);
      }
      if (data.chosenSize) {
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
    this.$bus.$on('delete-file', () => {
      this.refreshMenu();
    });
    this.$event.on('playlist-display-state', (e: boolean) => {
      this.playlistDisplayState = e;
    });
  },
  watch: {
    playlistDisplayState(val: boolean) {
      menuService.playlistDisplayStateUpdate();
      if (this.menu) {
        this.menu.getMenuItemById('KeyboardLeft').enabled = !val;
        this.menu.getMenuItemById('KeyboardRight').enabled = !val;
      }
    },
    displayLanguage(val) {
      if (messages[val]) {
        this.$i18n.locale = val;
      } else {
        console.warn('Invalid displayLanguage', val);
      }
      this.refreshMenu();
    },
    singleCycle(val) {
      if (this.menu) {
        this.menu.getMenuItemById('singleCycle').checked = val;
      }
    },
    enabledSecondarySub(val) {
      if (this.menu) {
        this.list.forEach((item: SubtitleControlListItem) => {
          this.menu.getMenuItemById(`secondSub${item.id}`).enabled = val;
        });
        this.menu.getMenuItemById('secondSub-1').enabled = val;
      }
      this.refreshMenu();
    },
    currentRouteName(val) {
      this.menuStateControl(val);
    },
    volume(val) {
      if (this.menu) {
        this.menu.getMenuItemById('mute').checked = val <= 0;
      }
    },
    muted(val) {
      if (this.menu && val) {
        this.menu.getMenuItemById('mute').checked = val;
      }
    },
    list(val: SubtitleControlListItem[], oldval: SubtitleControlListItem[]) {
      if (val.length !== oldval.length) {
        this.refreshMenu();
      }
    },
    primarySubtitleId(id: string) {
      if (this.menu) {
        this.menu.getMenuItemById('increasePrimarySubDelay').enabled = !!id;
        this.menu.getMenuItemById('decreasePrimarySubDelay').enabled = !!id;
        if (id && this.menu.getMenuItemById(`sub${id}`)) {
          this.menu.getMenuItemById(`sub${id}`).checked = true;
        } else if (!id) {
          this.menu.getMenuItemById('sub-1').checked = true;
        }
      }
    },
    secondarySubtitleId(id: string) {
      if (this.menu) {
        this.menu.getMenuItemById('increaseSecondarySubDelay').enabled = !!id;
        this.menu.getMenuItemById('decreaseSecondarySubDelay').enabled = !!id;
        if (id && this.menu.getMenuItemById(`secondSub${id}`)) {
          this.menu.getMenuItemById(`secondSub${id}`).checked = true;
        } else if (!id) {
          this.menu.getMenuItemById('secondSub-1').checked = true;
        }
      }
    },
    audioTrackList(val, oldval) {
      if (val.length !== oldval.length) {
        this.refreshMenu();
      }
      if (this.menu) {
        this.audioTrackList.forEach((item: Electron.MenuItem, index: number) => {
          if (item.enabled === true && this.menu && this.menu.getMenuItemById(`track${index}`)) {
            this.menu.getMenuItemById(`track${index}`).checked = true;
          }
        });
      }
    },
    isFullScreen() {
      this.refreshMenu();
    },
    paused(val) {
      const browserWindow = this.$electron.remote.getCurrentWindow();
      if (val && browserWindow.isAlwaysOnTop()) {
        browserWindow.setAlwaysOnTop(false);
      } else if (!val && this.menu && this.menu.getMenuItemById('windowFront').checked) {
        browserWindow.setAlwaysOnTop(true);
      }
      // 因为老板键，pause 比 isHiddenByBossKey慢，所以在paused watcher里面
      // 需要判断是否需要禁用menu
      this.refreshMenu().then(() => {
        if (this.isHiddenByBossKey) {
          this.menu && this.menu.items.forEach((e: Electron.MenuItem, i: number) => {
            if (i === 0) return;
            this.disableMenus(e);
          });
        }
      }).catch(() => {
      });
    },
    isMinimized(val) {
      // 如果window最小化，那么就禁用menu，除了第一选项
      // 如果window恢复，就重新创建menu
      if (!val) {
        this.refreshMenu();
      } else {
        this.menu && this.menu.items.forEach((e: Electron.MenuItem, i: number) => {
          if (i === 0) return;
          this.disableMenus(e);
        });
      }
    },
    isHiddenByBossKey(val) {
      // 如果window按了老板键，那么就禁用menu，除了第一选项
      // 如果window获取焦点，就重新创建menu
      if (!val) {
        this.refreshMenu();
      } else {
        this.menu && this.menu.items.forEach((e: Electron.MenuItem, i: number) => {
          if (i === 0) return;
          this.disableMenus(e);
        });
      }
    },
    ableToPushCurrentSubtitle(val) {
      if (this.menu) {
        this.menu.getMenuItemById('uploadSelectedSubtitle').enabled = val;
      }
    },
    originSrc(newVal) {
      if (newVal && !this.isWheelEnd) {
        this.$off('wheel-event', this.wheelEventHandler);
        this.isWheelEndWatcher = this.$watch('isWheelEnd', (newVal: Boolean) => {
          if (newVal) {
            this.isWheelEndWatcher(); // cancel the isWheelEnd watcher
            this.$on('wheel-event', this.wheelEventHandler); // reset the wheel-event handler
          }
        });
      }
    },
  },
  methods: {
    ...mapActions({
      updateSubDelay: subtitleActions.UPDATE_SUBTITLE_DELAY,
      updateChosenStyle: subtitleActions.UPDATE_SUBTITLE_STYLE,
      updateChosenSize: subtitleActions.UPDATE_SUBTITLE_SIZE,
      updateEnabledSecondarySub: subtitleActions.UPDATE_ENABLED_SECONDARY_SUBTITLE,
      changeFirstSubtitle: smActions.changePrimarySubtitle,
      changeSecondarySubtitle: smActions.changeSecondarySubtitle,
      refreshSubtitles: smActions.refreshSubtitles,
      addLocalSubtitlesWithSelect: smActions.addLocalSubtitlesWithSelect,
      updateSubtitleType: subtitleActions.UPDATE_SUBTITLE_TYPE,
      updateSubSettingsType: subtitleActions.UPDATE_SUBTITLE_SETTINGS_TYPE,
      changePrimarySubDelay: SubtitleManager.alterPrimaryDelay,
      changeSecondarySubDelay: SubtitleManager.alterSecondaryDelay,
    }),
    /**
     * @description 找到所有menu,禁用调.目前就两层循环，如果出现孙子menu，需要再嵌套一层循环
     * @author tanghaixiang@xindong.com
     * @date 2019-02-13
     * @param {Electron.MenuItemConstructorOptions} item
     */
    disableMenus(item: Electron.MenuItemConstructorOptions) {
      if (!this.menuOperationLock && item && item.label) {
        item.enabled = false;
        item.submenu && (item.submenu as Electron.Menu).items.forEach((e: any) => {
          // this.disableMenus(e);
          if (!this.menuOperationLock && e && e.label) {
            e.enabled = false;
            e.submenu && e.submenu.items.forEach((e: any) => {
              if (!this.menuOperationLock && e && e.label) {
                e.enabled = false;
              }
            });
          }
        });
      }
    },
    createMenu() {
      const { Menu, app, dialog } = this.$electron.remote;
      const template: Electron.MenuItemConstructorOptions[] = [
        // menu.file
        {
          label: this.$t('msg.file.name'),
          id: 'file',
          submenu: [
            {
              label: this.$t('msg.file.open'),
              accelerator: 'CmdOrCtrl+O',
              click: () => {
                if (this.defaultDir) {
                  this.openFilesByDialog();
                } else {
                  const defaultPath = process.platform === 'darwin' ? app.getPath('home') : app.getPath('desktop');
                  this.$store.dispatch('UPDATE_DEFAULT_DIR', defaultPath);
                  this.openFilesByDialog({ defaultPath });
                }
              },
            },
            // {
            //   label: this.$t('msg.file.openURL'),
            //   accelerator: 'CmdOrCtrl+U',
            //   click: () => {
            //     // TODO: openURL.click
            //   },
            //   enabled: false,
            // },
            { type: 'separator' },
            {
              label: this.$t('msg.file.clearHistory'),
              click: () => {
                this.infoDB.clearAll();
                app.clearRecentDocuments();
                this.$bus.$emit('clean-landingViewItems');
                this.refreshMenu();
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.file.closeWindow'),
              role: 'close',
            },
          ],
        },
        // menu.playback
        {
          label: this.$t('msg.playback.name'),
          id: 'playback',
          submenu: [
            {
              id: 'KeyboardRight',
              label: this.$t('msg.playback.forwardS'),
              accelerator: 'Right',
              enabled: !this.playlistDisplayState,
              click: () => {
                this.$bus.$emit('seek', videodata.time + 5);
              },
            },
            {
              id: 'KeyboardLeft',
              label: this.$t('msg.playback.backwardS'),
              accelerator: 'Left',
              enabled: !this.playlistDisplayState,
              click: () => {
                this.$bus.$emit('seek', videodata.time - 5);
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.playback.increasePlaybackSpeed'),
              accelerator: ']',
              click: () => {
                this.$store.dispatch(videoActions.INCREASE_RATE);
              },
            },
            {
              label: this.$t('msg.playback.decreasePlaybackSpeed'),
              accelerator: '[',
              click: () => {
                this.$store.dispatch(videoActions.DECREASE_RATE);
              },
            },
            {
              label: this.$t('msg.playback.resetSpeed'),
              accelerator: '\\',
              click: () => {
                this.$store.dispatch(videoActions.CHANGE_RATE, 1);
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.playback.previousVideo'),
              accelerator: 'CmdOrCtrl+Left',
              click: () => {
                this.$bus.$emit('previous-video');
              },
            },
            {
              label: this.$t('msg.playback.nextVideo'),
              accelerator: 'CmdOrCtrl+Right',
              click: () => {
                this.$bus.$emit('next-video');
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.playback.singleCycle'),
              type: 'checkbox',
              id: 'singleCycle',
              checked: this.singleCycle,
              click: () => {
                if (this.singleCycle) {
                  this.$store.dispatch('notSingleCycle');
                } else {
                  this.$store.dispatch('singleCycle');
                }
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.playback.snapShot'),
              accelerator: 'CmdOrCtrl+Shift+S',
              click: () => {
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
              },
            },
            // { type: 'separator' },
            // { label: this.$t('msg.playback.captureScreen'), enabled: false },
            // { label: this.$t('msg.playback.captureVideoClip'), enabled: false },
          ],
        },
        // menu.audio
        {
          label: this.$t('msg.audio.name'),
          id: 'audio',
          submenu: [
            {
              label: this.$t('msg.audio.mute'),
              type: 'checkbox',
              accelerator: 'M',
              id: 'mute',
              click: () => {
                this.$bus.$emit('toggle-muted');
              },
            },
            { type: 'separator' },
            // { label: this.$t('msg.audio.increaseAudioDelay'), enabled: false },
            // { label: this.$t('msg.audio.decreaseAudioDelay'), enabled: false },
            // { type: 'separator' },
          ],
        },
        // menu.subtitle
        {
          label: this.$t('msg.subtitle.name'),
          id: 'subtitle',
          submenu: [
            {
              label: this.$t('msg.subtitle.AITranslation'),
              click: () => {
                if (!this.isRefreshing) {
                  this.refreshSubtitles();
                }
              },
            },
            {
              label: this.$t('msg.subtitle.loadSubtitleFile'),
              click: () => {
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
                }, (item: Array<string>) => {
                  if (item) {
                    this.$bus.$emit('add-subtitles', [{ src: item[0], type: 'local' }]);
                  }
                });
              },
            },
            { type: 'separator' },
            // {
            //   label: this.$t('msg.subtitle.secondarySubtitle'),
            //   enabled: false,
            // },
            { type: 'separator' },
            {
              label: this.$t('advance.subMenu'),
              click: () => {
                this.$bus.$emit('show-subtitle-settings');
              },
            },
            {
              label: this.$t('advance.subDelay'),
              submenu: [
                {
                  label: this.$t('msg.subtitle.increasePrimarySubtitleDelay'),
                  id: 'increasePrimarySubDelay',
                  accelerator: 'CmdOrCtrl+\'',
                  click: () => {
                    this.updateSubSettingsType(true);
                    this.changePrimarySubDelay(0.1);
                  },
                },
                {
                  label: this.$t('msg.subtitle.decreasePrimarySubtitleDelay'),
                  id: 'decreasePrimarySubDelay',
                  accelerator: 'CmdOrCtrl+;',
                  click: () => {
                    this.updateSubSettingsType(true);
                    this.changePrimarySubDelay(-0.1);
                  },
                },
                { type: 'separator' },
                {
                  label: this.$t('msg.subtitle.increaseSecondarySubtitleDelay'),
                  id: 'increaseSecondarySubDelay',
                  click: () => {
                    this.updateSubSettingsType(false);
                    this.changeSecondarySubDelay(0.1);
                  },
                },
                {
                  label: this.$t('msg.subtitle.decreaseSecondarySubtitleDelay'),
                  id: 'decreaseSecondarySubDelay',
                  click: () => {
                    this.updateSubSettingsType(false);
                    this.changeSecondarySubDelay(-0.1);
                  },
                },
              ],
            },
            { type: 'separator' },
            {
              label: this.$t('msg.subtitle.uploadSelectedSubtitle'),
              id: 'uploadSelectedSubtitle',
              click: () => this.$store.dispatch(SubtitleManager.manualUploadAllSubtitles),
            },
          ],
        },
        // menu.window
        {
          label: this.$t('msg.window.name'),
          id: 'window',
          submenu: [
            {
              label: this.$t('msg.playback.keepPlayingWindowFront'),
              type: 'checkbox',
              id: 'windowFront',
              click: (menuItem, browserWindow) => {
                if (browserWindow.isAlwaysOnTop()) {
                  browserWindow.setAlwaysOnTop(false);
                  menuItem.checked = false;
                  this.topOnWindow = false;
                } else {
                  browserWindow.setAlwaysOnTop(true);
                  menuItem.checked = true;
                  this.topOnWindow = true;
                }
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.window.minimize'),
              role: 'minimize',
            },
            { type: 'separator' },
            {
              label: this.$t('msg.window.halfSize'),
              id: 'windowResize1',
              checked: false,
              accelerator: 'CmdOrCtrl+0',
              click: () => {
                this.changeWindowSize(0.5);
              },
            },
            {
              label: this.$t('msg.window.originSize'),
              id: 'windowResize2',
              checked: true,
              accelerator: 'CmdOrCtrl+1',
              click: () => {
                this.changeWindowSize(1);
              },
            },
            {
              label: this.$t('msg.window.doubleSize'),
              id: 'windowResize3',
              checked: false,
              accelerator: 'CmdOrCtrl+2',
              click: () => {
                this.changeWindowSize(2);
              },
            },
            {
              label: this.$t('msg.window.maxmize'),
              id: 'windowResize4',
              checked: false,
              accelerator: 'CmdOrCtrl+3',
              click: () => {
                this.changeWindowSize(3);
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.playback.windowRotate'),
              id: 'windowRotate',
              accelerator: 'CmdOrCtrl+L',
              click: () => {
                this.windowRotate();
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.window.bossKey'),
              accelerator: 'CmdOrCtrl+`',
              click: () => {
                this.$electron.ipcRenderer.send('bossKey');
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.window.backToLandingView'),
              id: 'backToLandingView',
              accelerator: 'CmdOrCtrl+E',
              click: () => {
                this.$bus.$emit('back-to-landingview');
              },
            },
          ],
        },
        // menu.help
        {
          label: this.$t('msg.help.name'),
          role: 'help',
          submenu: [
            {
              label: this.$t('msg.splayerx.feedback'),
              click: () => {
                this.$electron.shell.openExternal('https://feedback.splayer.org');
              },
            },
            {
              label: this.$t('msg.splayerx.homepage'),
              click: () => {
                this.$electron.shell.openExternal('https://beta.splayer.org');
              },
            },
            {
              label: this.$t('msg.help.shortCuts'),
              click: () => {
                this.$electron.shell.openExternal('https://github.com/chiflix/splayerx/wiki/SPlayer-Shortcuts-List');
              },
            },
          ],
        },
      ];

      if (!process.mas) {
        const helpMenu = template[template.length - 1].submenu as electron.MenuItemConstructorOptions[];
        helpMenu.push({
          label: this.$t('msg.help.crashReportLocation'),
          click: () => {
            const { remote } = this.$electron;
            let location = remote.crashReporter.getCrashesDirectory();
            if (!location) location = path.join(remote.app.getPath('temp'), remote.app.getName() + ' Crashes');
            if (fs.existsSync(location)) {
              remote.shell.openItem(location);
            } else {
              remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                message: this.$t('msg.help.crashReportNotAvailable'),
              });
            }
          }
        });
      }

      return this.updateRecentPlay().then((result: any) => {
        // menu.file add "open recent"
        (template[3].submenu as Electron.MenuItemConstructorOptions[]).splice(3, 0, this.recentSubMenu());
        (template[3].submenu as Electron.MenuItemConstructorOptions[]).splice(4, 0, this.recentSecondarySubMenu());
        (template[1].submenu as Electron.MenuItemConstructorOptions[]).splice(0, 0, this.updatePlayOrPause);
        (template[4].submenu as Electron.MenuItemConstructorOptions[]).splice(2, 0, this.updateFullScreen);
        (template[2].submenu as Electron.MenuItemConstructorOptions[]).splice(7, 0, this.updateAudioTrack());
        (template[0].submenu as Electron.MenuItemConstructorOptions[]).splice(1, 0, result);
        // menu.about
        if (process.platform === 'darwin') {
          (template[2].submenu as Electron.MenuItemConstructorOptions[]).splice(0, 0, ...this.darwinVolume);
          (template[1].submenu as Electron.MenuItemConstructorOptions[]).splice(3, 0, ...this.darwinPlayback);
          template.unshift({
            label: app.getName(),
            submenu: [
              {
                label: this.$t('msg.splayerx.about'),
                click: () => {
                  this.$electron.ipcRenderer.send('add-windows-about');
                },
              },
              { type: 'separator' },
              {
                label: this.$t('msg.splayerx.preferences'),
                id: 'preference',
                enabled: true,
                accelerator: 'Cmd+,',
                click: () => {
                  this.$electron.ipcRenderer.send('add-preference');
                },
              },
              { type: 'separator' },
              {
                label: this.$t('msg.splayerx.hide'),
                role: 'hide',
              },
              {
                label: this.$t('msg.splayerx.hideOthers'),
                role: 'hideothers',
              },
              {
                label: this.$t('msg.splayerx.showAll'),
                role: 'unhide'
              },
              { type: 'separator' },
              {
                label: this.$t('msg.splayerx.quit'),
                role: 'quit',
              },
            ],
          });
        }
        if (process.platform === 'win32') {
          (template[2].submenu as Electron.MenuItemConstructorOptions[]).splice(0, 0, ...this.winVolume);
          (template[1].submenu as Electron.MenuItemConstructorOptions[]).splice(3, 0, ...this.winPlayback);
          const file = template.shift();
          const winFile = (file!.submenu as Electron.MenuItemConstructorOptions[]).slice(0, 2);
          (winFile[1].submenu as Electron.MenuItemConstructorOptions[]).unshift((file!.submenu as Electron.MenuItemConstructorOptions[])[3], (file!.submenu as Electron.MenuItemConstructorOptions[])[2]);
          winFile.push((file!.submenu as Electron.MenuItemConstructorOptions[])[5], (file!.submenu as Electron.MenuItemConstructorOptions[])[4]);
          winFile.reverse().forEach((menuItem) => {
            template.unshift(menuItem);
          });
          template.splice(4, 0, {
            label: this.$t('msg.splayerx.preferences'),
            enabled: true,
            accelerator: 'Ctrl+,',
            click: () => {
              this.$electron.ipcRenderer.send('add-preference');
            },
          });
          (template[9].submenu as Electron.MenuItemConstructorOptions[]).unshift(
            {
              label: this.$t('msg.splayerx.about'),
              role: 'about',
              click: () => {
                this.$electron.ipcRenderer.send('add-windows-about');
              },
            },
            { type: 'separator' },
          );
          template.push({
            label: this.$t('msg.splayerx.quit'),
            accelerator: 'Ctrl+q',
            click: () => {
              this.$electron.remote.app.quit();
            },
          });
        }
        return template;
      }).then((result: any) => {
        this.menu = Menu.buildFromTemplate(result);
        Menu.setApplicationMenu(this.menu);
      }).then(() => {
        if (!this.menu) return;
        this.menuStateControl(this.currentRouteName);

        this.menu.getMenuItemById('increasePrimarySubDelay').enabled = !!this.primarySubtitleId;
        this.menu.getMenuItemById('decreasePrimarySubDelay').enabled = !!this.primarySubtitleId;
        this.menu.getMenuItemById('increaseSecondarySubDelay').enabled = !!this.secondarySubtitleId;
        this.menu.getMenuItemById('decreaseSecondarySubDelay').enabled = !!this.secondarySubtitleId;
        this.menu.getMenuItemById('uploadSelectedSubtitle').enabled = this.ableToPushCurrentSubtitle;

        this.audioTrackList.forEach((item: any, index: number) => {
          if (item.enabled === true) {
            this.menu.getMenuItemById(`track${index}`).checked = true;
          }
        });
        this.menu.getMenuItemById('windowFront').checked = this.topOnWindow;
        this.list.forEach((item: SubtitleControlListItem, index: number) => {
          if (item.id === this.primarySubtitleId && this.menu.getMenuItemById(`sub${item.id}`)) {
            this.menu.getMenuItemById(`sub${item.id}`).checked = true;
          }
          if (item.id === this.secondarySubtitleId && this.menu.getMenuItemById(`secondSub${item.id}`)) {
            this.menu.getMenuItemById(`secondSub${item.id}`).checked = true;
          }
          this.menu.getMenuItemById(`secondSub${item.id}`).enabled = this.enabledSecondarySub;
        });
        this.menu.getMenuItemById('secondSub-1').enabled = this.enabledSecondarySub;
        this.menuOperationLock = false;
      })
        .catch((err: Error) => {
          this.menuOperationLock = false;
          log.error('render/main', err);
        });
    },
    updateRecentItem(key: any, value: any) {
      return {
        id: key,
        visible: true,
        type: 'radio',
        label: value.label,
        click: () => {
          this.openVideoFile(value.path);
        },
      };
    },
    getSubName(item: SubtitleControlListItem) {
      if (item.type === Type.Embedded) {
        return `${this.$t('subtitle.embedded')} ${item.name}`;
      }
      return item.name;
    },
    recentSubTmp(item: SubtitleControlListItem, isFirstSubtitleType: any) {
      return {
        id: isFirstSubtitleType ? `sub${item.id}` : `secondSub${item.id}`,
        visible: true,
        type: 'radio',
        label: this.getSubName(item, this.list),
        click: () => {
          this.updateSubtitleType(isFirstSubtitleType);
          if (isFirstSubtitleType) {
            this.changeFirstSubtitle(item.id);
            if (this.menu && this.menu.getMenuItemById(`secondSub${item.id}`)) {
              this.menu.getMenuItemById(`secondSub${item.id}`).checked = false;
              this.menu.getMenuItemById('secondSub-1').checked = true;
            }
          } else {
            this.changeSecondarySubtitle(item.id);
            if (this.menu && this.menu.getMenuItemById(`sub${item.id}`)) {
              this.menu.getMenuItemById(`sub${item.id}`).checked = false;
              this.menu.getMenuItemById('sub-1').checked = true;
            }
          }
        },
      };
    },
    recentSubMenu() {
      const tmp: Electron.MenuItemConstructorOptions = {
        label: this.$t('msg.subtitle.mainSubtitle'),
        id: 'main-subtitle',
        submenu: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => ({
          id: `sub${index - 2}`,
          visible: false,
          label: '',
        })),
      };
      (tmp.submenu as Electron.MenuItemConstructorOptions[]).splice(0, 1, {
        id: 'sub-1',
        visible: true,
        type: 'radio',
        label: this.calculatedNoSub ? this.$t('msg.subtitle.noSubtitle') : this.$t('msg.subtitle.notToShowSubtitle'),
        click: () => {
          this.changeFirstSubtitle('');
        },
      });
      this.list.forEach((item: SubtitleControlListItem, index: number) => {
        (tmp.submenu as Electron.MenuItemConstructorOptions[]).splice(index + 1, 1, this.recentSubTmp(item, true));
      });
      return tmp;
    },
    recentSecondarySubMenu() {
      const tmp: Electron.MenuItemConstructorOptions = {
        label: this.$t('msg.subtitle.secondarySubtitle'),
        id: 'secondary-subtitle',
        submenu: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => ({
          id: `secondSub${index - 2}`,
          visible: false,
          label: '',
        })),
      };
      const submenu = tmp.submenu as Electron.MenuItemConstructorOptions[];
      submenu.splice(0, 1, this.updateSecondarySub);
      submenu.splice(1, 1, {
        type: 'separator',
      });
      submenu.splice(2, 1, {
        id: 'secondSub-1',
        visible: true,
        type: 'radio',
        label: this.calculatedNoSub ? this.$t('msg.subtitle.noSubtitle') : this.$t('msg.subtitle.notToShowSubtitle'),
        click: () => {
          this.changeSecondarySubtitle('');
        },
      });
      this.list.forEach((item: SubtitleControlListItem, index: number) => {
        submenu.splice(index + 3, 1, this.recentSubTmp(item, false));
      });
      return tmp;
    },
    updateAudioTrackItem(key: number, value: string) {
      return {
        id: `track${key}`,
        visible: true,
        type: 'radio',
        label: value,
        click: () => {
          this.$bus.$emit('switch-audio-track', key);
        },
      };
    },
    updateAudioTrack() {
      const tmp = {
        label: this.$t('msg.audio.switchAudioTrack'),
        id: 'audio-track',
        submenu: [] as Electron.MenuItemConstructorOptions[],
      };
      if (this.audioTrackList.length === 1 && this.audioTrackList[0].language === 'und') {
        tmp.submenu.splice(0, 1, this.updateAudioTrackItem(0, this.$t('advance.chosenTrack')));
      } else {
        this.audioTrackList.forEach((item: any, index: number) => {
          let detail;
          if (item.language === 'und' || item.language === '') {
            detail = `${this.$t('advance.track')} ${index + 1}`;
          } else if (this.audioTrackList.length === 1) {
            detail = `${this.$t('advance.track')} ${index + 1} : ${item.language}`;
          } else {
            detail = `${this.$t('advance.track')} ${index + 1}: ${item.name}`;
          }
          tmp.submenu.splice(index, 1, this.updateAudioTrackItem(index, detail));
        });
      }
      return tmp;
    },
    pathProcess(path: string) {
      if (process.platform === 'win32') {
        return path.toString().replace(/^file:\/\/\//, '');
      }
      return path.toString().replace(/^file\/\//, '');
    },
    updateRecentPlay() {
      const recentMenuTemplate = {
        label: this.$t('msg.file.openRecent'),
        id: 'recent-play',
        submenu: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => ({
          id: `recent-${index}`,
          visible: false,
          label: '',
        })),
      };
      return this.infoDB.sortedResult('recent-played', 'lastOpened', 'prev').then(async (playlists: any) => {
        const data = [];
        /* eslint-disable */
        for (const playlist of playlists) {
          const mediaItem = await this.infoDB.get('media-item', playlist.items[playlist.playedIndex]);
          data.push(mediaItem);
        }
        // let menuRecentData: Map<string, any> = new Map();
        const menuRecentData: Map<string, any> = this.processRecentPlay(data) || new Map();
        recentMenuTemplate.submenu.forEach((element, index) => {
          const value = menuRecentData.get(element.id);
          if (value.label !== '') {
            recentMenuTemplate.submenu
              .splice(index, 1, this.updateRecentItem(element.id, value));
          }
        });
        return recentMenuTemplate;
      }).catch(() => recentMenuTemplate);
    },
    menuStateControl(routeName: string) {
      const inPlayingView = routeName === 'playing-view';
      const inWelcomeView = routeName === 'welcome-view' || routeName === 'language-setting';
      if (!this.menu) return;
      let menuItem;
      menuItem = this.menu.getMenuItemById('playback');
      if (menuItem) {
        menuItem.submenu.items.forEach((item: any) => {
          item.enabled = inPlayingView;
        });
      }
      menuItem = this.menu.getMenuItemById('audio');
      if (menuItem) {
        menuItem.submenu.items.forEach((item: any) => {
          item.enabled = inPlayingView;
        });
      }
      menuItem = this.menu.getMenuItemById('subtitle');
      if (menuItem) {
        menuItem.submenu.items.forEach((item: any) => {
          item.submenu && item.submenu.items.forEach((item: any) => {
            item.enabled = inPlayingView;
          });
          item.enabled = inPlayingView;
        });
      }
      menuItem = this.menu.getMenuItemById('window');
      if (menuItem) {
        menuItem.submenu.items.forEach((item: any) => {
          item.enabled = !inWelcomeView;
        });
      }
      menuItem = this.menu.getMenuItemById('file');
      if (menuItem) {
        menuItem.submenu.items.forEach((item: any) => {
          item.enabled = !inWelcomeView;
        });
      }
      this.menu.getMenuItemById('preference').enabled = !inWelcomeView;
      this.menu.getMenuItemById('windowResize1').enabled = inPlayingView;
      this.menu.getMenuItemById('windowResize2').enabled = inPlayingView;
      this.menu.getMenuItemById('windowResize3').enabled = inPlayingView;
      this.menu.getMenuItemById('windowResize4').enabled = inPlayingView;
      this.menu.getMenuItemById('backToLandingView').enabled = inPlayingView;
      // windowRotate 菜单状态随着路由状态一起变
      this.menu.getMenuItemById('windowRotate').enabled = inPlayingView;
    },
    processRecentPlay(recentPlayData: Array<any>) {
      const menuRecentData = new Map([
        ['recent-1', {
          label: '',
          path: '',
          visible: false,
        }],
        ['recent-2', {
          label: '',
          path: '',
          visible: false,
        }],
        ['recent-3', {
          label: '',
          path: '',
          visible: false,
        }],
        ['recent-4', {
          label: '',
          path: '',
          visible: false,
        }],
        ['recent-5', {
          label: '',
          path: '',
          visible: false,
        }],
        ['recent-6', {
          label: '',
          path: '',
          visible: false,
        }],
        ['recent-7', {
          label: '',
          path: '',
          visible: false,
        }],
        ['recent-8', {
          label: '',
          path: '',
          visible: false,
        }],
        ['recent-9', {
          label: '',
          path: '',
          visible: false,
        }],
      ]);
      for (let i = 1; i <= recentPlayData.length; i += 1) {
        menuRecentData.set(`recent-${i}`, {
          label: this.pathProcess(recentPlayData[i - 1].path.split('/').reverse()[0]),
          path: recentPlayData[i - 1].path,
          visible: true,
        });
      }
      return menuRecentData;
    },
    async refreshMenu() {
      this.menuOperationLock = true;
      const menu = this.$electron.remote.Menu.getApplicationMenu();
      if (menu) menu.clear();
      await this.createMenu();
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
      const videoSize = [this.intrinsicWidth * key, this.intrinsicHeight * key];
      if (key === 3) {
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
  mounted() {
    // https://github.com/electron/electron/issues/3609
    // Disable Zooming
    this.$electron.webFrame.setVisualZoomLevelLimits(1, 1);
    this.createMenu();
    this.$bus.$on('new-file-open', this.refreshMenu);
    // TODO: Setup user identity
    this.$storage.get('user-uuid', (err: Error, userUUID: string) => {
      if (err || Object.keys(userUUID).length === 0) {
        err && log.error('render/main', err);
        userUUID = uuidv4();
        this.$storage.set('user-uuid', userUUID);
      }

      Vue.axios.defaults.headers.common['X-Application-Token'] = userUUID;

      // set userUUID to google analytics uid
      this.$ga && this.$ga.set('userId', userUUID);
    });
    this.$on('wheel-event', this.wheelEventHandler);

    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 && process.platform === 'win32') {
        this.menu.popup(this.$electron.remote.getCurrentWindow());
      }
    });
    window.addEventListener('keydown', (e) => {
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
          this.$store.dispatch(videoActions.DECREASE_RATE);
          break;
        case 220:
          e.preventDefault();
          this.$store.dispatch(videoActions.CHANGE_RATE, 1);
          break;
        case 221:
          e.preventDefault();
          this.$store.dispatch(videoActions.INCREASE_RATE);
          break;
        case 32:
          e.preventDefault();
          this.$bus.$emit('toggle-playback');
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
        const advance = document.querySelector('.mainMenu');
        const subtitle = document.querySelector('.subtitle-scroll-items');
        if (advance) {
          const nodeList = advance.childNodes;
          for (let i = 0; i < nodeList.length; i += 1) {
            isAdvanceColumeItem = nodeList[i].contains(e.target as Node);
          }
        }
        if (subtitle) {
          const subList = subtitle.childNodes;
          for (let i = 0; i < subList.length; i += 1) {
            isSubtitleScrollItem = subList[i].contains(e.target as Node);
          }
        }
        if (!isAdvanceColumeItem && !isSubtitleScrollItem) {
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
      const advance = document.querySelector('.mainMenu');
      const subtitle = document.querySelector('.subtitle-scroll-items');
      if (advance) {
        const nodeList = advance.childNodes;
        for (let i = 0; i < nodeList.length; i += 1) {
          isAdvanceColumeItem = nodeList[i].contains(target as Node);
        }
      }
      if (subtitle) {
        const subList = subtitle.childNodes;
        for (let i = 0; i < subList.length; i += 1) {
          isSubtitleScrollItem = subList[i].contains(target as Node);
        }
      }
      if (!ctrlKey && !isAdvanceColumeItem && !isSubtitleScrollItem) {
        this.$emit('wheel-event', { x });
      }
    });
    /* eslint-disable */

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      this.$bus.$emit('drop');
      this.$store.commit('source', 'drop');
      const files = Array.prototype.map.call(e.dataTransfer!.files, (f: File) => f.path)
      const onlyFolders = files.every((file: fs.PathLike) => fs.statSync(file).isDirectory());
      if (this.currentRouteName === 'playing-view' || onlyFolders
        || files.every((file: fs.PathLike) => getValidVideoRegex().test(file) && !getValidSubtitleRegex().test(file))) {
        files.forEach((file: fs.PathLike) => this.$electron.remote.app.addRecentDocument(file));
        if (onlyFolders) {
          this.openFolder(...files);
        } else {
          this.openFile(...files);
        }
      } else {
        this.$electron.ipcRenderer.send('drop-subtitle', files);
      }
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = process.platform === 'darwin' ? 'copy' : '';
      this.$bus.$emit('drag-over');
    });
    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.$bus.$emit('drag-leave');
    });

    this.$electron.ipcRenderer.on('menu', (event: Event, arg: MenuService) => {
      console.log(arg, menuService, arg === menuService);
    });
    this.$electron.ipcRenderer.on('open-file', (event: Event, args: { onlySubtitle: boolean, files: Array<string> }) => {
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
  },
}).$mount('#app');
