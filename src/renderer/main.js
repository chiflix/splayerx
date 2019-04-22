/* eslint-disable import/first */
// Be sure to call Sentry function as early as possible in the main process
import '../shared/sentry';

import Vue from 'vue';
import VueI18n from 'vue-i18n';
import os from 'os';
import axios from 'axios';
import uuidv4 from 'uuid/v4';
import electron from 'electron';
import VueElectronJSONStorage from 'vue-electron-json-storage';
import VueResource from 'vue-resource';
import VueAnalytics from 'vue-analytics';
import VueElectron from 'vue-electron';
import Path from 'path';
import fs from 'fs';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import osLocale from 'os-locale';
import AsyncComputed from 'vue-async-computed';

import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import messages from '@/locales';
import helpers from '@/helpers';
import { hookVue } from '@/kerning';
import { Video as videoActions, Subtitle as subtitleActions } from '@/store/actionTypes';
import { Editor as editorMutations } from '@/store/mutationTypes';
import addLog from '@/helpers/index';
import asyncStorage from '@/helpers/asyncStorage';
import { videodata } from '@/store/video';
import { EVENT_BUS_COLLECTIONS as bus } from '@/constants';
import NotificationBubble, { addBubble } from '../shared/notificationControl';
import { SNAPSHOT_FAILED, SNAPSHOT_SUCCESS } from '../shared/notificationcodes';

// causing callbacks-registry.js 404 error. disable temporarily
// require('source-map-support').install();

function getSystemLocale() {
  const { app } = electron.remote;
  const locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
  if (locale === 'zh-TW') {
    return 'zhTW';
  } else if (locale.startsWith('zh')) {
    return 'zhCN';
  }
  return 'en';
}

Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;
Vue.config.warnHandler = (warn) => {
  addLog.methods.addLog('warn', warn);
};
Vue.config.errorHandler = (err) => {
  addLog.methods.addLog('error', err);
};
Vue.directive('fade-in', {
  bind(el, binding) {
    const { value } = binding;
    if (value) {
      el.classList.add('fade-in');
      el.classList.remove('fade-out');
    } else {
      el.classList.add('fade-out');
      el.classList.remove('fade-in');
    }
  },
  update(el, binding) {
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
Vue.use(VueResource);
Vue.use(AsyncComputed);

Vue.use(VueAnalytics, {
  id: (process.env.NODE_ENV === 'production') ? 'UA-2468227-6' : 'UA-2468227-5',
  router,
  set: [
    { field: 'dimension1', value: electron.remote.app.getVersion() },
    { field: 'checkProtocolTask', value: null }, // fix ga not work from file:// url
    { field: 'checkStorageTask', value: null }, // fix ga not work from file:// url
    { field: 'historyImportTask', value: null }, // fix ga not work from file:// url
  ],
});

Vue.mixin(helpers);

hookVue(Vue);

Vue.prototype.$bus = new Vue(); // Global event bus

const i18n = new VueI18n({
  locale: getSystemLocale(), // set locale
  messages, // set locale messages
});
Vue.use(NotificationBubble, i18n);

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
      topOnWindow: false,
      canSendVolumeGa: true,
    };
  },
  computed: {
    ...mapGetters(['volume', 'muted', 'intrinsicWidth', 'intrinsicHeight', 'ratio', 'winAngle', 'winWidth', 'winHeight', 'winPos', 'winSize', 'chosenStyle', 'chosenSize', 'mediaHash', 'subtitleList', 'enabledSecondarySub',
      'isEditable', 'isProfessional', 'referenceSubtitleId', 'editHistoryLen', 'currentEditHistoryIndex', 'currentEditedSubtitleId', 'subtitleEditMenuPrevEnable', 'subtitleEditMenuNextEnable', 'subtitleEditMenuEnterEnable',
      'currentFirstSubtitleId', 'currentSecondSubtitleId', 'audioTrackList', 'isFullScreen', 'paused', 'singleCycle', 'isFocused', 'originSrc', 'defaultDir', 'ableToPushCurrentSubtitle', 'displayLanguage', 'calculatedNoSub', 'sizePercent', 'snapshotSavedPath']),
    updateFullScreen() {
      if (this.isFullScreen) {
        return {
          label: this.$t('msg.window.exitFullScreen'),
          accelerator: 'Esc',
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
          enabled: !this.isProfessional,
          click: () => {
            this.$bus.$emit('toggle-playback');
          },
        };
      }
      return {
        label: `${this.$t('msg.playback.play')}`,
        accelerator: 'Space',
        enabled: !this.isProfessional,
        click: () => {
          this.$bus.$emit('toggle-playback');
        },
      };
    },
    currentRouteName() {
      return this.$route.name;
    },
    isSubtitleAvailable() {
      return this.currentFirstSubtitleId !== '' || (this.currentSecondSubtitleId !== '' && this.enabledSecondarySub);
    },
  },
  created() {
    this.$store.commit('getLocalPreference');
    if (this.displayLanguage) this.$i18n.locale = this.displayLanguage;
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
      if (!data.secondaryLanguage) {
        this.$store.dispatch('secondaryLanguage', '');
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
      this.updateEnabledSecondarySub(data.enabledSecondarySub);
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
  },
  watch: {
    isSubtitleAvailable(val) {
      if (this.menu) {
        const increaseSubDelayMenu = this.menu.getMenuItemById('increaseSubDelay');
        const decreaseSubDelayMenu = this.menu.getMenuItemById('decreaseSubDelay');
        if (increaseSubDelayMenu) {
          increaseSubDelayMenu.enabled = val;
        }
        if (decreaseSubDelayMenu) {
          decreaseSubDelayMenu.enabled = val;
        }
      }
    },
    displayLanguage(val) {
      this.$i18n.locale = val;
      this.refreshMenu();
    },
    singleCycle(val) {
      if (this.menu) {
        this.menu.getMenuItemById('singleCycle').checked = val;
      }
    },
    enabledSecondarySub(val) {
      if (this.menu) {
        this.subtitleList.forEach((item, index) => {
          this.menu.getMenuItemById(`secondSub${index}`).enabled = val;
        });
        this.menu.getMenuItemById('secondSub-1').enabled = val;
      }
      this.refreshMenu();
    },
    currentRouteName(val) {
      if (val === 'landing-view') {
        this.menuStateControl(false);
      } else {
        this.menuStateControl(true);
      }
    },
    chosenStyle(val) {
      if (this.menu) {
        this.menu.getMenuItemById(`style${val}`).checked = true;
      }
    },
    chosenSize(val) {
      if (this.menu) {
        this.menu.getMenuItemById(`size${val}`).checked = true;
      }
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
    subtitleList(val, oldval) {
      if (val.length !== oldval.length) {
        this.refreshMenu();
      }
    },
    audioTrackList(val, oldval) {
      if (val.length !== oldval.length) {
        this.refreshMenu();
      }
      if (this.menu) {
        this.audioTrackList.forEach((item, index) => {
          if (item.enabled === true && this.menu.getMenuItemById(`track${index}`)) {
            this.menu.getMenuItemById(`track${index}`).checked = true;
          }
        });
      }
    },
    referenceSubtitleId(val, oldValue) {
      const old = this.menu.getMenuItemById(`reference-${oldValue}`);
      const current = this.menu.getMenuItemById(`reference-${val}`);
      if (old) old.checked = false;
      if (current) current.checked = true;
    },
    isProfessional() {
      // 进入高级模式，重新加载目录
      this.refreshMenu();
    },
    editHistoryLen(v) {
      // 当操作历史记录更新，重新计算undo、redo是否可以使用
      const menuRedo = this.menu.getMenuItemById('advancedRedo');
      const menuUndo = this.menu.getMenuItemById('advancedUndo');
      if (menuRedo) {
        menuRedo.enabled = this.currentEditHistoryIndex < (v - 1);
      }
      if (menuUndo) {
        menuUndo.enabled = this.currentEditHistoryIndex >= 0;
      }
    },
    currentEditHistoryIndex(v) {
      // 当操作历史记录更新，重新计算undo、redo是否可以使用
      const menuRedo = this.menu.getMenuItemById('advancedRedo');
      const menuUndo = this.menu.getMenuItemById('advancedUndo');
      if (menuRedo) {
        menuRedo.enabled = (v + 1) < this.editHistoryLen;
      }
      if (menuUndo) {
        menuUndo.enabled = v >= 0;
      }
    },
    subtitleEditMenuEnterEnable(v) {
      // 菜单中是否可以使用enter快捷键的依赖vuex
      const menu = this.menu.getMenuItemById('advanced-enter');
      if (menu) {
        menu.enabled = v;
      }
    },
    subtitleEditMenuPrevEnable(v) {
      const menu = this.menu.getMenuItemById('advanced-prev');
      if (menu) {
        menu.enabled = v;
      }
    },
    subtitleEditMenuNextEnable(v) {
      const menu = this.menu.getMenuItemById('advanced-next');
      if (menu) {
        menu.enabled = v;
      }
    },
    isFullScreen() {
      this.refreshMenu();
    },
    paused(val) {
      const browserWindow = this.$electron.remote.getCurrentWindow();
      if (val && browserWindow.isAlwaysOnTop()) {
        browserWindow.setAlwaysOnTop(false);
      } else if (!val && this.menu.getMenuItemById('windowFront').checked) {
        browserWindow.setAlwaysOnTop(true);
      }
      // 因为老板键，pause 比 isFocused慢，所以在paused watcher里面
      // 需要判断是否需要禁用menu
      this.refreshMenu().then(() => {
        if (!this.isFocused) {
          this.menu && this.menu.items.forEach((e, i) => {
            if (i === 0) return;
            this.disableMenus(e);
          });
        }
      }).catch(() => {
      });
    },
    isFocused(val) {
      // 如果window失去焦点，那么就禁用menu，除了第一选项
      // 如果window获得焦点，就重新创建menu
      // 这里使用焦点作为条件，主要考虑老板键和最小化
      if (val) {
        this.refreshMenu();
      } else {
        this.menu && this.menu.items.forEach((e, i) => {
          if (i === 0) return;
          this.disableMenus(e);
        });
      }
    },
    isEditable(val) {
      // 编辑状态下，禁止播放器快捷键
      if (!val) {
        this.refreshMenu();
      } else {
        this.menu && this.menu.items.forEach((e, i) => {
          if (i === 0) return;
          this.disableMenus(e);
        });
      }
    },
    ableToPushCurrentSubtitle(val) {
      const uploadSelectedSubtitleMenu = this.menu.getMenuItemById('uploadSelectedSubtitle');
      if (uploadSelectedSubtitleMenu) {
        uploadSelectedSubtitleMenu.enabled = val;
      }
    },
  },
  methods: {
    ...mapMutations({
      toggleProfessional: editorMutations.TOGGLE_PROFESSIONAL,
      swicthReferenceSubtitle: editorMutations.SWITCH_REFERENCE_SUBTITLE,
      updateCurrentEditedSubtitle: editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE,
    }),
    ...mapActions({
      updateSubDelay: subtitleActions.UPDATE_SUBTITLE_DELAY,
      updateChosenStyle: subtitleActions.UPDATE_SUBTITLE_STYLE,
      updateChosenSize: subtitleActions.UPDATE_SUBTITLE_SIZE,
      addMessages: 'addMessages',
      updateEnabledSecondarySub: subtitleActions.UPDATE_ENABLED_SECONDARY_SUBTITLE,
      changeFirstSubtitle: subtitleActions.CHANGE_CURRENT_FIRST_SUBTITLE,
      changeSecondarySubtitle: subtitleActions.CHANGE_CURRENT_SECOND_SUBTITLE,
      updateSubtitleType: subtitleActions.UPDATE_SUBTITLE_TYPE,
    }),
    /**
     * @description 递归禁用menu子项
     * @author tanghaixiang@xindong.com
     * @date 2019-02-13
     * @param {Menu.item} item
     */
    disableMenus(item) {
      if (item && item.label) {
        item.enabled = false;
        item.submenu && item.submenu.items.forEach((e) => {
          this.disableMenus(e);
        });
      }
    },
    createMenu() {
      const { Menu, app, dialog } = this.$electron.remote;
      const template = [
        // menu.file
        {
          label: this.$t('msg.file.name'),
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
                this.infoDB.cleanData();
                app.clearRecentDocuments();
                this.$bus.$emit('clean-lastPlayedFile');
                this.refreshMenu();
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.file.closeWindow'),
              role: 'Close',
            },
          ],
        },
        // menu.playback
        {
          label: this.$t('msg.playback.name'),
          id: 'playback',
          submenu: [
            {
              label: this.$t('msg.playback.forwardS'),
              accelerator: 'Right',
              click: () => {
                this.$bus.$emit('seek', videodata.time + 5);
              },
            },
            {
              label: this.$t('msg.playback.backwardS'),
              accelerator: 'Left',
              click: () => {
                this.$bus.$emit('seek', videodata.time - 5);
              },
            },
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
                    this.addLog('info', {
                      message: 'Snapshot failed .',
                      code: SNAPSHOT_FAILED,
                    });
                    addBubble(SNAPSHOT_FAILED, this.$i18n);
                  }
                  sources.forEach((source) => {
                    if (source.name === 'SPlayer') {
                      const date = new Date();
                      const imgName = `SPlayer-${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}-${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}.png`;
                      const screenshotPath = Path.join(
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
                            this.addLog('info', {
                              message: 'Snapshot failed .',
                              code: SNAPSHOT_FAILED,
                            });
                            addBubble(SNAPSHOT_FAILED, this.$i18n);
                          }
                        } else {
                          this.addLog('info', {
                            message: 'Snapshot success .',
                            code: SNAPSHOT_SUCCESS,
                          });
                          addBubble(SNAPSHOT_SUCCESS, this.$i18n);
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
                this.$bus.$emit('subtitle-refresh-from-menu');
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
                  defaultPath: Path.dirname(this.originSrc),
                  filters: [{
                    name: 'Subtitle Files',
                    extensions: VALID_EXTENSION,
                  }],
                  properties: ['openFile'],
                }, (item) => {
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
              label: this.$t('msg.subtitle.subtitleSize'),
              submenu: [
                {
                  label: this.$t('msg.subtitle.size1'),
                  type: 'radio',
                  id: 'size0',
                  click: () => {
                    this.$bus.$emit('change-size-by-menu', 0);
                  },
                },
                {
                  label: this.$t('msg.subtitle.size2'),
                  type: 'radio',
                  id: 'size1',
                  checked: true,
                  click: () => {
                    this.$bus.$emit('change-size-by-menu', 1);
                  },
                },
                {
                  label: this.$t('msg.subtitle.size3'),
                  type: 'radio',
                  id: 'size2',
                  click: () => {
                    this.$bus.$emit('change-size-by-menu', 2);
                  },
                },
                {
                  label: this.$t('msg.subtitle.size4'),
                  type: 'radio',
                  id: 'size3',
                  click: () => {
                    this.$bus.$emit('change-size-by-menu', 3);
                  },
                },
              ],
            },
            {
              label: this.$t('msg.subtitle.subtitleStyle'),
              id: 'subStyle',
              submenu: [
                {
                  label: this.$t('msg.subtitle.style1'),
                  type: 'radio',
                  id: 'style0',
                  click: () => {
                    this.updateChosenStyle(0);
                  },
                },
                {
                  label: this.$t('msg.subtitle.style2'),
                  type: 'radio',
                  id: 'style1',
                  click: () => {
                    this.updateChosenStyle(1);
                  },
                },
                {
                  label: this.$t('msg.subtitle.style3'),
                  type: 'radio',
                  id: 'style2',
                  click: () => {
                    this.updateChosenStyle(2);
                  },
                },
                {
                  label: this.$t('msg.subtitle.style4'),
                  type: 'radio',
                  id: 'style3',
                  click: () => {
                    this.updateChosenStyle(3);
                  },
                },
                {
                  label: this.$t('msg.subtitle.style5'),
                  type: 'radio',
                  id: 'style4',
                  click: () => {
                    this.updateChosenStyle(4);
                  },
                },
              ],
            },
            { type: 'separator' },
            {
              label: this.$t('msg.subtitle.increaseSubtitleDelayS'),
              id: 'increaseSubDelay',
              accelerator: 'CmdOrCtrl+=',
              click: () => {
                this.updateSubDelay(0.1);
              },
            },
            {
              label: this.$t('msg.subtitle.decreaseSubtitleDelayS'),
              id: 'decreaseSubDelay',
              accelerator: 'CmdOrCtrl+-',
              click: () => {
                this.updateSubDelay(-0.1);
              },
            },
            // {
            //   label: this.$t('msg.subtitle.increaseSubtitleDelayL'),
            //   accelerator: 'CmdOrCtrl+Shift+=',
            //   click: () => {
            //     this.updateSubDelay(0.5);
            //   },
            // },
            // {
            //   label: this.$t('msg.subtitle.decreaseSubtitleDelayL'),
            //   accelerator: 'CmdOrCtrl+Shift+-',
            //   click: () => {
            //     this.updateSubDelay(-0.5);
            //   },
            // },
            // { type: 'separator' },
            // { label: 'Smart Translating' },
            // { label: 'Search on Shooter.cn' },
            { type: 'separator' },
            {
              label: this.$t('msg.subtitle.createSubtitle'),
              id: 'createSelectedSubtitle',
              click: () => {
                // this.$bus.$emit('upload-current-subtitle');
                if (!this.paused) this.$bus.$emit('toggle-playback');
                this.updateCurrentEditedSubtitle(null);
                this.swicthReferenceSubtitle(null);
                this.toggleProfessional(true);
              },
            },
            {
              label: this.$t('msg.subtitle.uploadSelectedSubtitle'),
              id: 'uploadSelectedSubtitle',
              click: () => this.$bus.$emit('upload-current-subtitle'),
            },
          ],
        },
        // menu.window
        {
          label: this.$t('msg.window.name'),
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
              checked: false,
              accelerator: 'CmdOrCtrl+0',
              click: () => {
                this.changeWindowSize(0.5);
              },
            },
            {
              label: this.$t('msg.window.originSize'),
              checked: true,
              accelerator: 'CmdOrCtrl+1',
              click: () => {
                this.changeWindowSize(1);
              },
            },
            {
              label: this.$t('msg.window.doubleSize'),
              checked: false,
              accelerator: 'CmdOrCtrl+2',
              click: () => {
                this.changeWindowSize(2);
              },
            },
            {
              label: this.$t('msg.window.maxmize'),
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
      return this.updateRecentPlay().then((result) => {
        // menu.file add "open recent"
        template[3].submenu.splice(3, 0, this.recentSubMenu());
        template[3].submenu.splice(4, 0, this.recentSecondarySubMenu());
        template[1].submenu.splice(0, 0, this.updatePlayOrPause);
        template[4].submenu.splice(2, 0, this.updateFullScreen);
        template[2].submenu.splice(7, 0, this.updateAudioTrack());
        template[0].submenu.splice(1, 0, result);
        // menu.about
        if (process.platform === 'darwin') {
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
              { type: 'separator' },
              {
                label: this.$t('msg.splayerx.quit'),
                role: 'quit',
              },
            ],
          });
        }
        if (process.platform === 'win32') {
          const file = template.shift();
          const winFile = file.submenu.slice(0, 2);
          winFile[1].submenu.unshift(file.submenu[3], file.submenu[2]);
          winFile.push(file.submenu[5], file.submenu[4]);
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
          template[9].submenu.unshift(
            {
              label: this.$t('msg.splayerx.about'),
              role: 'about',
              click: () => {
                this.$electron.ipcRenderer.send('add-windows-about');
              },
            },
            { type: 'separator' },
          );
        }
        // 时间轴高级编辑模式，菜单中file，subtile去掉，添加advanced目录
        if (this.isProfessional) {
          template.splice(4, 1, this.advancedMenu());
          template.splice(1, 1);
        }
        return template;
      }).then((result) => {
        this.menu = Menu.buildFromTemplate(result);
        Menu.setApplicationMenu(this.menu);
      }).then(() => {
        if (this.currentRouteName === 'landing-view') {
          this.menuStateControl(false);
        }
        const menuStyle = this.menu.getMenuItemById(`style${this.chosenStyle}`);
        if (this.chosenStyle !== '' && menuStyle) {
          menuStyle.checked = true;
        }
        const menuSize = this.menu.getMenuItemById(`size${this.chosenSize}`);
        if (this.chosenSize !== '' && menuSize) {
          menuSize.checked = true;
        }
        if (!this.isSubtitleAvailable && !this.isProfessional) {
          this.menu.getMenuItemById('increaseSubDelay').enabled = false;
          this.menu.getMenuItemById('decreaseSubDelay').enabled = false;
          this.menu.getMenuItemById('uploadSelectedSubtitle').enabled = this.ableToPushCurrentSubtitle;
          this.menu.getMenuItemById('sub-1').checked = true;
        }
        this.audioTrackList.forEach((item, index) => {
          const mebuTrackIndex = this.menu.getMenuItemById(`track${index}`);
          if (item.enabled === true && mebuTrackIndex) {
            mebuTrackIndex.checked = true;
          }
        });
        this.menu.getMenuItemById('windowFront').checked = this.topOnWindow;
        if (!this.isProfessional) {
          this.subtitleList.forEach((item, index) => {
            if (item.id === this.currentFirstSubtitleId && this.menu.getMenuItemById(`sub${index}`)) {
              this.menu.getMenuItemById(`sub${index}`).checked = true;
            }
            if (item.id === this.currentSecondSubtitleId && this.menu.getMenuItemById(`secondSub${index}`)) {
              this.menu.getMenuItemById(`secondSub${index}`).checked = true;
            }
            this.menu.getMenuItemById(`secondSub${index}`).enabled = this.enabledSecondarySub;
          });
          this.menu.getMenuItemById('secondSub-1').enabled = this.enabledSecondarySub;
        }
      })
        .catch((err) => {
          this.addLog('error', err);
        });
    },
    advancedMenu() {
      const reference = [{
        visible: true,
        id: `reference-${null}`,
        type: 'radio',
        checked: this.referenceSubtitleId === null,
        label: this.$t('msg.subtitle.notToShowSubtitle'),
        click: () => {
          this.swicthReferenceSubtitle(null);
        },
      }];
      const advancedTemplate = {
        label: this.$t('msg.advanced.name'),
        submenu: [
          {
            label: this.$t('msg.advanced.reference'),
            id: 'reference',
            submenu: reference,
          },
          { type: 'separator' },
          {
            label: this.$t('msg.advanced.enter'),
            enabled: this.subtitleEditMenuEnterEnable,
            id: 'advanced-enter',
            accelerator: 'Enter',
            click: () => {
              this.$bus.$emit(bus.SUBTITLE_EDITOR_FOCUS_BY_ENTER);
            },
          },
          {
            label: this.$t('msg.advanced.prev'),
            enabled: this.subtitleEditMenuPrevEnable,
            id: 'advanced-prev',
            accelerator: 'J',
            click: () => {
              this.$bus.$emit(bus.SUBTITLE_EDITOR_SELECT_PREV_SUBTITLE);
            },
          },
          {
            label: this.$t('msg.advanced.next'),
            enabled: this.subtitleEditMenuNextEnable,
            id: 'advanced-next',
            accelerator: 'K',
            click: () => {
              this.$bus.$emit(bus.SUBTITLE_EDITOR_SELECT_NEXT_SUBTITLE);
            },
          },
          { type: 'separator' },
          {
            label: this.$t('msg.advanced.save'),
            enabled: !!this.currentEditedSubtitleId,
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.$bus.$emit(bus.SUBTITLE_EDITOR_SAVE);
            },
          },
          {
            label: this.$t('msg.advanced.export'),
            enabled: !!this.currentEditedSubtitleId,
            accelerator: 'CmdOrCtrl+E',
            click: () => {
              this.$bus.$emit(bus.EXPORT_MODIFIED_SUBTITLE);
            },
          },
          { type: 'separator' },
          {
            label: this.$t('msg.advanced.undo'),
            id: 'advancedUndo',
            enabled: !!this.currentEditedSubtitleId && this.currentEditHistoryIndex >= 0,
            accelerator: 'CmdOrCtrl+Z',
            click: () => {
              this.$bus.$emit(bus.SUBTITLE_EDITOR_UNDO);
            },
          },
          {
            label: this.$t('msg.advanced.redo'),
            id: 'advancedRedo',
            enabled: !!this.currentEditedSubtitleId &&
              this.currentEditHistoryIndex < (this.editHistoryLen - 1),
            accelerator: 'CmdOrCtrl+Shift+Z',
            click: () => {
              this.$bus.$emit(bus.SUBTITLE_EDITOR_REDO);
            },
          },
          { type: 'separator' },
          {
            label: this.$t('msg.advanced.back'),
            accelerator: 'Esc',
            click: () => {
              this.$bus.$emit(bus.SUBTITLE_EDITOR_EXIT);
            },
          },
        ],
      };
      if (this.isFullScreen) {
        advancedTemplate.submenu.pop();
      }
      this.subtitleList.forEach((e) => {
        if (e.type !== 'modified' && reference.length < 11) {
          reference.push({
            id: `reference-${e.id}`,
            visible: true,
            checked: e.id === this.referenceSubtitleId,
            type: 'radio',
            label: this.getSubName(e),
            click: () => {
              this.swicthReferenceSubtitle(e.id);
            },
          });
        }
      });
      reference.push({ type: 'separator' });
      reference.push({
        visible: true,
        label: this.$t('msg.advanced.loadLocalSubtitleFile'),
        click: () => {
          const { remote } = this.$electron;
          const { dialog } = remote;
          const browserWindow = remote.BrowserWindow;
          const focusWindow = browserWindow.getFocusedWindow();
          const VALID_EXTENSION = ['ass', 'srt', 'vtt'];

          dialog.showOpenDialog(focusWindow, {
            title: 'Open Dialog',
            defaultPath: Path.dirname(this.originSrc),
            filters: [{
              name: 'Subtitle Files',
              extensions: VALID_EXTENSION,
            }],
            properties: ['openFile'],
          }, (item) => {
            if (item) {
              this.$bus.$emit('add-subtitles', [{ src: item[0], type: 'local' }]);
              // 发送到manager里面，等待字幕加载出id
              this.$bus.$emit(bus.SUBTITLE_EDITOR_LOAD_LOCAL, item[0]);
            }
          });
        },
      });
      return advancedTemplate;
    },
    updateRecentItem(key, value) {
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
    getSubName(item) {
      if (item.path) {
        return Path.basename(item);
      } else if (item.type === 'embedded') {
        return `${this.$t('subtitle.embedded')} ${item.name}`;
      } else if (item.type === 'modified') {
        return `${this.$t('subtitle.modified')} ${item.name}`;
      }
      return item.name;
    },
    recentSubTmp(key, value, type) {
      return {
        id: type ? `sub${key}` : `secondSub${key}`,
        visible: true,
        type: 'radio',
        label: this.getSubName(value),
        click: () => {
          this.updateSubtitleType(type);
          this.$bus.$emit('change-subtitle', value.id || value.src);
        },
      };
    },
    recentSubMenu() {
      const tmp = {
        label: this.$t('msg.subtitle.mainSubtitle'),
        id: 'main-subtitle',
        submenu: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => ({
          id: `sub${index - 2}`,
          visible: false,
          label: '',
        })),
      };
      tmp.submenu.splice(0, 1, {
        id: 'sub-1',
        visible: true,
        type: 'radio',
        label: this.calculatedNoSub ? this.$t('msg.subtitle.noSubtitle') : this.$t('msg.subtitle.notToShowSubtitle'),
        click: () => {
          this.changeFirstSubtitle('');
        },
      });
      this.subtitleList.forEach((item, index) => {
        tmp.submenu.splice(index + 1, 1, this.recentSubTmp(index, item, true));
      });
      return tmp;
    },
    recentSecondarySubMenu() {
      const tmp = {
        label: this.$t('msg.subtitle.secondarySubtitle'),
        id: 'secondary-subtitle',
        submenu: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => ({
          id: `secondSub${index - 2}`,
          visible: false,
          label: '',
        })),
      };
      tmp.submenu.splice(0, 1, this.updateSecondarySub);
      tmp.submenu.splice(1, 1, {
        type: 'separator',
      });
      tmp.submenu.splice(2, 1, {
        id: 'secondSub-1',
        visible: true,
        type: 'radio',
        label: this.calculatedNoSub ? this.$t('msg.subtitle.noSubtitle') : this.$t('msg.subtitle.notToShowSubtitle'),
        click: () => {
          this.changeSecondarySubtitle('');
        },
      });
      this.subtitleList.forEach((item, index) => {
        tmp.submenu.splice(index + 3, 1, this.recentSubTmp(index, item, false));
      });
      return tmp;
    },
    updateAudioTrackItem(key, value) {
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
        submenu: [],
      };
      if (this.audioTrackList.length === 1 && this.audioTrackList[0].language === 'und') {
        tmp.submenu.splice(0, 1, this.updateAudioTrackItem(0, this.$t('advance.chosenTrack')));
      } else {
        this.audioTrackList.forEach((item, index) => {
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
    pathProcess(path) {
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
      return this.infoDB.sortedResult('recent-played', 'lastOpened', 'prev').then((data) => {
        let menuRecentData = null;
        menuRecentData = this.processRecentPlay(data);
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
    menuStateControl(flag) {
      this.menu.getMenuItemById('playback').submenu.items.forEach((item) => {
        item.enabled = flag;
      });
      this.menu.getMenuItemById('audio').submenu.items.forEach((item) => {
        item.enabled = flag;
      });
      this.menu.getMenuItemById('subtitle').submenu.items.forEach((item) => {
        item.submenu?.items.forEach((item) => {
          item.enabled = flag;
        });
        item.enabled = flag;
      });
    },
    processRecentPlay(recentPlayData) {
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
      this.$electron.remote.Menu.getApplicationMenu()?.clear();
      await this.createMenu();
    },
    windowRotate() {
      this.$store.dispatch('windowRotate90Deg');
      if (this.isFullScreen) return;
      let newSize = [];
      const windowRect = [
        window.screen.availLeft, window.screen.availTop,
        window.screen.availWidth, window.screen.availHeight,
      ];
      const videoSize = (this.winAngle === 90 || this.winAngle === 270) ?
        [this.intrinsicHeight, this.intrinsicWidth] : [this.intrinsicWidth, this.intrinsicHeight];
      newSize = this.calculateWindowSize(
        [320, 180],
        windowRect.slice(2, 4),
        videoSize,
      );
      const newPosition = this.calculateWindowPosition(
        this.winPos.concat(this.winSize),
        windowRect,
        newSize,
      );
      const rect = newPosition.concat(newSize);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [rect.slice(2, 4)[0] / rect.slice(2, 4)[1]]);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', rect.slice(2, 4));
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', rect.slice(0, 2));
    },
    changeWindowSize(key) {
      if (!this.originSrc || key === this.sizePercent) {
        return;
      }
      let newSize = [];
      const windowRect = [
        window.screen.availLeft, window.screen.availTop,
        window.screen.availWidth, window.screen.availHeight,
      ];
      const videoSize = [this.intrinsicWidth * key, this.intrinsicHeight * key];
      if (key === 3) {
        if (videoSize[0] < windowRect[2] && videoSize[1] < windowRect[3]) {
          videoSize[1] = window.screen.availHeight;
          videoSize[0] = videoSize[1] * this.ratio;
        }
      }
      newSize = this.calculateWindowSize(
        [320, 180],
        windowRect.slice(2, 4),
        videoSize,
      );
      const newPosition = this.calculateWindowPosition(
        this.winPos.concat(this.winSize),
        windowRect,
        newSize,
      );
      this.$store.dispatch('updateSizePercent', key);
      const rect = newPosition.concat(newSize);
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setSize', rect.slice(2, 4));
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setPosition', rect.slice(0, 2));
      this.$electron.ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [rect.slice(2, 4)[0] / rect.slice(2, 4)[1]]);
    },
  },
  mounted() {
    // https://github.com/electron/electron/issues/3609
    // Disable Zooming
    this.$electron.webFrame.setVisualZoomLevelLimits(1, 1);
    this.createMenu();
    this.$bus.$on('new-file-open', this.refreshMenu);
    // TODO: Setup user identity
    this.$storage.get('user-uuid', (err, userUUID) => {
      if (err || Object.keys(userUUID).length === 0) {
        err && this.addLog('error', err);
        userUUID = uuidv4();
        this.$storage.set('user-uuid', userUUID);
      }
      const platform = os.platform() + os.release();
      const { app } = this.$electron.remote;
      const version = app.getVersion();

      Vue.http.headers.common['X-Application-Token'] = userUUID;
      Vue.http.headers.common['User-Agent'] = `SPlayerX@2018 ${platform} Version ${version}`;

      // set userUUID to google analytics uid
      this.$ga && this.$ga.set('userId', userUUID);
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 && process.platform === 'win32') {
        this.menu.popup(this.$electron.remote.getCurrentWindow());
      }
    });
    window.addEventListener('keydown', (e) => {
      switch (e.keyCode) {
        case 219:
          e.preventDefault();
          this.$store.dispatch(videoActions.DECREASE_RATE);
          break;
        case 221:
          e.preventDefault();
          this.$store.dispatch(videoActions.INCREASE_RATE);
          break;
        case 32:
          e.preventDefault();
          if (!this.isProfessional) {
            this.$bus.$emit('toggle-playback');
          }
          break;
        default:
          break;
      }
    });
    /* eslint-disable */
    window.addEventListener('wheel', (e) => {
      // ctrlKey is the official way of detecting pinch zoom on mac for chrome
      if (this.isEditable) return;
      if (!e.ctrlKey) {
        let isAdvanceColumeItem;
        let isSubtitleScrollItem;
        const advance = document.querySelector('.advance-column-items');
        const subtitle = document.querySelector('.subtitle-scroll-items');
        if (advance) {
          const nodeList = advance.childNodes;
          for (let i = 0; i < nodeList.length; i += 1) {
            isAdvanceColumeItem = nodeList[i].contains(e.target);
          }
        }
        if (subtitle) {
          const subList = subtitle.childNodes;
          for (let i = 0; i < subList.length; i += 1) {
            isSubtitleScrollItem = subList[i].contains(e.target);
          }
        }
        if (!isAdvanceColumeItem && !isSubtitleScrollItem) {
          if (Math.abs(e.deltaY) !== 0) {
            if (this.canSendVolumeGa) {
              this.$ga.event('app', 'volume', 'wheel');
              this.canSendVolumeGa = false;
              setTimeout(() => {
                this.canSendVolumeGa = true;
              }, 1000);
            }
            if (process.platform !== 'darwin') {
              this.$store.dispatch(
                e.deltaY < 0 ? videoActions.INCREASE_VOLUME : videoActions.DECREASE_VOLUME,
                Math.abs(e.deltaY) * 0.06,
              );
            } else {
              this.$store.dispatch(
                e.deltaY > 0 ? videoActions.INCREASE_VOLUME : videoActions.DECREASE_VOLUME,
                Math.abs(e.deltaY) * 0.06,
              );
            }
          }
        }
      }
    });
    /* eslint-disable */

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!this.isProfessional) {
        this.$bus.$emit('drop');
        this.$store.commit('source', 'drop');
        const files = Array.prototype.map.call(e.dataTransfer.files, f => f.path)
        const onlyFolders = files.every(file => fs.statSync(file).isDirectory());
        files.forEach(file => this.$electron.remote.app.addRecentDocument(file));
        if (onlyFolders) {
          this.openFolder(...files);
        } else {
          this.openFile(...files);
        }
      }
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.isProfessional) {
        this.$bus.$emit('drag-over');
        e.dataTransfer.dropEffect = process.platform === 'darwin' ? 'copy' : '';
      }
    });
    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.$bus.$emit('drag-leave');
    });

    this.$electron.ipcRenderer.on('open-file', (event, ...files) => {
      const onlyFolders = files.every(file => fs.statSync(file).isDirectory());
      if (onlyFolders) {
        this.openFolder(...files);
      } else {
        this.openFile(...files);
      }
    });
  },
}).$mount('#app');
