import Vue from 'vue';
import VueI18n from 'vue-i18n';
import os from 'os';
import axios from 'axios';
import uuidv4 from 'uuid/v4';
import VueElectronJSONStorage from 'vue-electron-json-storage';
import VueResource from 'vue-resource';
import VueAnalytics from 'vue-analytics';
import VueElectron from 'vue-electron';
import Path from 'path';
import { mapGetters } from 'vuex';
import osLocale from 'os-locale';

import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import messages from '@/locales';
import helpers from '@/helpers';
import { Video as videoActions } from '@/store/actionTypes';
import addLog from '@/helpers/index';
import asyncStorage from '@/helpers/asyncStorage';
import { videodata } from '@/store/video';

// causing callbacks-registry.js 404 error. disable temporarily
// require('source-map-support').install();

function getSystemLocale() {
  const locale = osLocale.sync();
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
Vue.directive('hidden', {
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

Vue.use(VueAnalytics, {
  id: 'UA-2468227-6',
  router,
});

Vue.mixin(helpers);
Vue.prototype.$bus = new Vue(); // Global event bus

const i18n = new VueI18n({
  locale: getSystemLocale(), // set locale
  messages, // set locale messages
});

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
    };
  },
  computed: {
    ...mapGetters(['volume', 'muted', 'winWidth', 'chosenStyle', 'chosenSize', 'deleteVideoHistoryOnExit', 'privacyAgreement', 'mediaHash', 'subtitleList', 'currentSubtitleId', 'audioTrackList', 'isFullScreen', 'paused']),
    updateFullScreen() {
      if (this.isFullScreen) {
        return {
          label: this.$t('msg.window_.exitFullScreen'),
          accelerator: 'Esc',
          click: () => {
            this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setFullScreen', [false]);
          },
        };
      }
      return {
        label: this.$t('msg.window_.enterFullScreen'),
        accelerator: 'F',
        click: () => {
          this.$electron.ipcRenderer.send('callCurrentWindowMethod', 'setFullScreen', [true]);
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
  },
  created() {
    asyncStorage.get('subtitle-style').then((data) => {
      if (data.chosenStyle) {
        this.$store.dispatch('updateChosenStyle', data.chosenStyle);
      }
      if (data.chosenSize) {
        this.$store.dispatch('updateChosenSize', data.chosenSize);
      }
    });
    this.$store.dispatch('getLocalPreference');
    this.$bus.$on('delete-file', () => {
      this.refreshMenu();
    });
  },
  watch: {
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
    deleteVideoHistoryOnExit(val) {
      if (this.menu) {
        this.menu.getMenuItemById('deleteHistory').checked = val;
      }
    },
    privacyAgreement(val) {
      if (this.menu) {
        this.menu.getMenuItemById('privacy').checked = val;
      }
    },
    volume(val) {
      if (val <= 0) {
        this.menu.getMenuItemById('mute').checked = true;
        this.menu.getMenuItemById('deVolume').enabled = false;
      } else if (val >= 1) {
        this.menu.getMenuItemById('mute').checked = false;
        this.menu.getMenuItemById('inVolume').enabled = false;
      } else {
        this.menu.getMenuItemById('inVolume').enabled = true;
        this.menu.getMenuItemById('deVolume').enabled = true;
        this.menu.getMenuItemById('mute').checked = false;
      }
    },
    muted(val) {
      if (val) {
        this.menu.getMenuItemById('mute').checked = val;
      }
    },
    subtitleList(val, oldval) {
      if (val.length !== oldval.length) {
        this.refreshMenu();
      }
    },
    currentSubtitleId(val) {
      if (this.menu) {
        if (val !== '') {
          this.subtitleList.forEach((item, index) => {
            if (item.id === val) {
              this.menu.getMenuItemById(`sub${index}`).checked = true;
            }
          });
        } else {
          this.menu.getMenuItemById('sub-1').checked = true;
        }
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
    isFullScreen() {
      this.refreshMenu();
    },
    paused() {
      this.refreshMenu();
    },
  },
  methods: {
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
                this.openFilesByDialog();
              },
            },
            {
              label: this.$t('msg.file.openURL'),
              accelerator: 'CmdOrCtrl+U',
              click: () => {
                // TODO: openURL.click
              },
              enabled: false,
            },
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
          submenu: [
            {
              label: this.$t('msg.playback.forward'),
              accelerator: 'Right',
              click: () => {
                this.$bus.$emit('seek', videodata.time + 5);
              },
            },
            {
              label: this.$t('msg.playback.backward'),
              accelerator: 'Left',
              click: () => {
                this.$bus.$emit('seek', videodata.time - 5);
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.playback.increasePlaybackSpeed'),
              click: () => {
                this.$store.dispatch(videoActions.INCREASE_RATE);
              },
            },
            {
              label: this.$t('msg.playback.decreasePlaybackSpeed'),
              click: () => {
                this.$store.dispatch(videoActions.DECREASE_RATE);
              },
            },
            /** */
            { type: 'separator' },
            { label: this.$t('msg.playback.captureScreen'), enabled: false },
            { label: this.$t('msg.playback.captureVideoClip'), enabled: false },
          ],
        },
        // menu.audio
        {
          label: this.$t('msg.audio.name'),
          submenu: [
            {
              label: this.$t('msg.audio.increaseVolume'),
              accelerator: 'Up',
              id: 'inVolume',
              click: () => {
                this.$store.dispatch(videoActions.INCREASE_VOLUME);
              },
            },
            {
              label: this.$t('msg.audio.decreaseVolume'),
              accelerator: 'Down',
              id: 'deVolume',
              click: () => {
                this.$store.dispatch(videoActions.DECREASE_VOLUME);
              },
            },
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
            { label: this.$t('msg.audio.increaseAudioDelay'), enabled: false },
            { label: this.$t('msg.audio.decreaseAudioDelay'), enabled: false },
            { type: 'separator' },
          ],
        },
        // menu.subtitle
        {
          label: this.$t('msg.subtitle.name'),
          submenu: [
            {
              label: this.$t('msg.subtitle.AITranslation'),
              click: () => {
                this.$bus.$emit('refresh-subtitles');
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
                  defaultPath: './',
                  filters: [{
                    name: 'Subtitle Files',
                    extensions: VALID_EXTENSION,
                  }],
                  properties: ['openFile'],
                }, (item) => {
                  if (item) {
                    this.$bus.$emit('add-subtitles', item);
                  }
                });
              },
            },
            { type: 'separator' },
            {
              label: this.$t('msg.subtitle.secondarySubtitle'),
              enabled: false,
            },
            { type: 'separator' },
            {
              label: this.$t('msg.subtitle.subtitleSize'),
              submenu: [
                {
                  label: this.$t('msg.subtitle.size1'),
                  type: 'radio',
                  id: 'size0',
                  click: () => {
                    this.$store.dispatch('updateChosenSize', 0);
                    this.$store.dispatch('updateScale', `${((21 / (11 * 1600)) * this.winWidth) + (24 / 55)}`);
                  },
                },
                {
                  label: this.$t('msg.subtitle.size2'),
                  type: 'radio',
                  id: 'size1',
                  checked: true,
                  click: () => {
                    this.$store.dispatch('updateChosenSize', 1);
                    this.$store.dispatch('updateScale', `${((29 / (11 * 1600)) * this.winWidth) + (26 / 55)}`);
                  },
                },
                {
                  label: this.$t('msg.subtitle.size3'),
                  type: 'radio',
                  id: 'size2',
                  click: () => {
                    this.$store.dispatch('updateChosenSize', 2);
                    this.$store.dispatch('updateScale', `${((37 / (11 * 1600)) * this.winWidth) + (28 / 55)}`);
                  },
                },
                {
                  label: this.$t('msg.subtitle.size4'),
                  type: 'radio',
                  id: 'size3',
                  click: () => {
                    this.$store.dispatch('updateChosenSize', 3);
                    this.$store.dispatch('updateScale', `${((45 / (11 * 1600)) * this.winWidth) + (30 / 55)}`);
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
                    this.$store.dispatch('updateChosenStyle', 0);
                    this.$store.dispatch('updateStyle', {
                      color: 'white',
                      fontWeight: '400',
                    });
                    this.$store.dispatch('updateBorderStyle', {
                      textShadow: '0px 0.7px 0.5px rgba(0,0,0,.5)',
                      textStroke: '0.5px #777',
                      backgroundColor: '',
                      fontWeight: '400',
                    });
                  },
                },
                {
                  label: this.$t('msg.subtitle.style2'),
                  type: 'radio',
                  id: 'style1',
                  click: () => {
                    this.$store.dispatch('updateChosenStyle', 1);
                    this.$store.dispatch('updateStyle', {
                      color: 'white',
                      fontWeight: '400',
                    });
                    this.$store.dispatch('updateBorderStyle', {
                      textShadow: '0px 1px 1px #333',
                      textStroke: '1.3px #222',
                      backgroundColor: '',
                      fontWeight: '400',
                      padding: '0',
                    });
                  },
                },
                {
                  label: this.$t('msg.subtitle.style3'),
                  type: 'radio',
                  id: 'style2',
                  click: () => {
                    this.$store.dispatch('updateChosenStyle', 2);
                    this.$store.dispatch('updateStyle', {
                      color: '#fffc00',
                      fontWeight: '400',
                    });
                    this.$store.dispatch('updateBorderStyle', {
                      textShadow: '0px 0.5px 0.5px #555',
                      textStroke: '',
                      backgroundColor: '',
                      fontWeight: '400',
                      padding: '0',
                    });
                  },
                },
                {
                  label: this.$t('msg.subtitle.style4'),
                  type: 'radio',
                  id: 'style3',
                  click: () => {
                    this.$store.dispatch('updateChosenStyle', 3);
                    this.$store.dispatch('updateStyle', {
                      color: '#fff',
                      fontWeight: '800',
                    });
                    this.$store.dispatch('updateBorderStyle', {
                      textShadow: '',
                      textStroke: '1.6px #009be6',
                      backgroundColor: '',
                      fontWeight: '800',
                      padding: '0',
                    });
                  },
                },
                {
                  label: this.$t('msg.subtitle.style5'),
                  type: 'radio',
                  id: 'style4',
                  click: () => {
                    this.$store.dispatch('updateChosenStyle', 4);
                    this.$store.dispatch('updateStyle', {
                      color: '#fff',
                      fontWeight: '400',
                    });
                    this.$store.dispatch('updateBorderStyle', {
                      textShadow: '',
                      textStroke: '',
                      backgroundColor: 'rgba(0,0,0,.5)',
                      fontWeight: '400',
                      padding: '0px 5px',
                    });
                  },
                },
              ],
            },
            { type: 'separator' },
            { label: this.$t('msg.subtitle.increaseSubtitleDelay'), enabled: false },
            { label: this.$t('msg.subtitle.decreaseSubtitleDelay'), enabled: false },
            // { type: 'separator' },
            // { label: 'Smart Translating' },
            // { label: 'Search on Shooter.cn' },
          ],
        },
        // menu.window
        {
          label: this.$t('msg.window_.name'),
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
              label: this.$t('msg.window_.minimize'),
              role: 'minimize',
            },
            { type: 'separator' },
            {
              label: this.$t('msg.window_.bossKey'),
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
          ],
        },
      ];
      this.updateRecentPlay().then((result) => {
        // menu.file add "open recent"
        template[3].submenu.splice(3, 0, this.recentSubMenu());
        template[1].submenu.splice(0, 0, this.updatePlayOrPause);
        template[4].submenu.splice(2, 0, this.updateFullScreen);
        template[2].submenu.splice(7, 0, this.updateAudioTrack());
        template[0].submenu.splice(2, 0, result);
        // menu.about
        if (process.platform === 'darwin') {
          template.unshift({
            label: app.getName(),
            submenu: [
              {
                label: this.$t('msg.splayerx.about'),
                role: 'about',
              },
              {
                label: this.$t('msg.splayerx.preferences'),
                enabled: true,
                submenu: [
                  {
                    label: this.$t('msg.preferences.clearHistory'),
                    id: 'deleteHistory',
                    type: 'checkbox',
                    checked: this.$store.getters.deleteVideoHistoryOnExit,
                    click: () => {
                      if (this.$store.getters.deleteVideoHistoryOnExit) {
                        this.$store.dispatch('notDeleteVideoHistoryOnExit');
                      } else {
                        this.$store.dispatch('deleteVideoHistoryOnExit');
                      }
                    },
                  },
                  {
                    label: this.$t('msg.preferences.privacyConfirm'),
                    id: 'privacy',
                    type: 'checkbox',
                    checked: this.$store.getters.privacyAgreement,
                    click: () => {
                      if (this.$store.getters.privacyAgreement) {
                        this.$store.dispatch('disagreeOnPrivacyPolicy');
                      } else {
                        this.$store.dispatch('agreeOnPrivacyPolicy');
                      }
                    },
                  },
                ],
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
                label: this.$t('msg.splayerx.quit'),
                role: 'quit',
              },
            ],
          });
        }
        if (process.platform === 'win32') {
          const file = template.shift();
          file.submenu = file.submenu.reverse();
          file.submenu.forEach((menuItem) => {
            template.unshift(menuItem);
          });
        }
        return template;
      }).then((result) => {
        this.menu = Menu.buildFromTemplate(result);
        Menu.setApplicationMenu(this.menu);
      }).then(() => {
        if (this.chosenStyle !== '') {
          this.menu.getMenuItemById(`style${this.chosenStyle}`).checked = true;
        }
        if (this.chosenSize !== '') {
          this.menu.getMenuItemById(`size${this.chosenSize}`).checked = true;
        }
        if (this.currentSubtitleId !== '') {
          this.subtitleList.forEach((item, index) => {
            if (item.id === this.currentSubtitleId) {
              this.menu.getMenuItemById(`sub${index}`).checked = true;
            }
          });
        } else {
          this.menu.getMenuItemById('sub-1').checked = true;
        }
        this.audioTrackList.forEach((item, index) => {
          if (item.enabled === true) {
            this.menu.getMenuItemById(`track${index}`).checked = true;
          }
        });
        if (this.volume >= 1) {
          this.menu.getMenuItemById('inVolume').enabled = false;
        } else if (this.volume <= 0) {
          this.menu.getMenuItemById('deVolume').enabled = false;
        }
        this.menu.getMenuItemById('windowFront').checked = this.topOnWindow;
      })
        .catch((err) => {
          this.addLog('error', err);
        });
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
    recentSubTmp(key, value) {
      return {
        id: `sub${key}`,
        visible: true,
        type: 'radio',
        label: value.path ? Path.basename(value.path) : value.name,
        click: () => {
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
        label: this.$t('msg.subtitle.noSubtitle'),
        click: () => {
          this.$bus.$emit('off-subtitle');
        },
      });
      this.subtitleList.forEach((item, index) => {
        tmp.submenu.splice(index + 1, 1, this.recentSubTmp(index, item));
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
          const detail = item.language === 'und' ? `${this.$t('advance.track')} ${index + 1}` : `${this.$t('advance.track')} ${index + 1}: ${item.name}`;
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
    refreshMenu() {
      this.$electron.remote.Menu.getApplicationMenu()?.clear();
      this.createMenu();
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
      if (err) {
        this.addLog('error', err);
        userUUID = uuidv4();
        this.$storage.set('user-uuid', userUUID);
      }
      const platform = os.platform() + os.release();
      const { app } = this.$electron.remote;
      const version = app.getVersion();

      Vue.http.headers.common['X-Application-Token'] = userUUID;
      Vue.http.headers.common['User-Agent'] = `SPlayerX@2018 ${platform} Version ${version}`;
    });

    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (e.altKey === true) {
            this.$bus.$emit('seek', videodata.time - 60);
          }
          break;
        case 'ArrowRight':
          if (e.altKey === true) {
            this.$bus.$emit('seek', videodata.time + 60);
          }
          break;
        default:
          break;
      }
      switch (e.keyCode) {
        case 219:
          this.$store.dispatch(videoActions.DECREASE_RATE);
          break;
        case 221:
          this.$store.dispatch(videoActions.INCREASE_RATE);
          break;
        default:
          break;
      }
    });
    /* eslint-disable */
    window.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) {
        const up = e.deltaY > 0;
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
          if (process.platform !== 'darwin') {
            this.$store.dispatch(
              up ? videoActions.INCREASE_VOLUME : videoActions.DECREASE_VOLUME,
              Math.abs(e.deltaY) * 0.2,
            );
          }
        }
      }
    });
    /* eslint-disable */

    /**
     * Todo:
     * Handle multiple files
     */
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      this.openFile(...Array.prototype.map.call(e.dataTransfer.files, f => f.path));
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.$electron.ipcRenderer.on('open-file', (event, ...files) => {
      this.openFile(...files);
    });
  },
}).$mount('#app');
