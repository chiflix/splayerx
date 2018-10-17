import Vue from 'vue';
import VueI18n from 'vue-i18n';
import os from 'os';
import axios from 'axios';
import uuidv4 from 'uuid/v4';
import VueElectronJSONStorage from 'vue-electron-json-storage';
import VueResource from 'vue-resource';

import App from '@/App';
import router from '@/router';
import store from '@/store';
import messages from '@/locales';
import helpers from '@/helpers';
import Path from 'path';
import { Video as videoActions } from '@/store/action-types';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

Vue.use(VueI18n);
Vue.use(VueElectronJSONStorage);
Vue.use(VueResource);

Vue.mixin(helpers);
Vue.prototype.$bus = new Vue(); // Global event bus

const i18n = new VueI18n({
  locale: 'zhCN', // set locale
  messages, // set locale messages
});

/* eslint-disable no-new */
new Vue({
  i18n,
  components: { App },
  router,
  store,
  template: '<App/>',
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
                const VALID_EXTENSION = ['3g2', '3gp', '3gp2', '3gpp', 'amv', 'asf', 'avi', 'bik', 'bin', 'crf', 'divx', 'drc', 'dv', 'dvr-ms', 'evo', 'f4v', 'flv', 'gvi', 'gxf', 'iso', 'm1v', 'm2v', 'm2t', 'm2ts', 'm4v', 'mkv', 'mov', 'mp2', 'mp2v', 'mp4', 'mp4v', 'mpe', 'mpeg', 'mpeg1', 'mpeg2', 'mpeg4', 'mpg', 'mpv2', 'mts', 'mtv', 'mxf', 'mxg', 'nsv', 'nuv', 'ogg', 'ogm', 'ogv', 'ogx', 'ps', 'rec', 'rm', 'rmvb', 'rpl', 'thp', 'tod', 'tp', 'ts', 'tts', 'txd', 'vob', 'vro', 'webm', 'wm', 'wmv', 'wtv', 'xesc'];
                dialog.showOpenDialog({
                  properties: ['openFile'],
                  filters: [{
                    name: 'Video Files',
                    extensions: VALID_EXTENSION,
                  }],
                }, (files) => {
                  if (files !== undefined) {
                    if (!files[0].includes('\\') || process.platform === 'win32') {
                      this.openFile(files[0]);
                    } else {
                      this.$store.dispatch('addMessages', {
                        type: 'error', title: this.$t('errorFile.title'), content: this.$t('errorFile.content'), dismissAfter: 10000,
                      });
                    }
                    if (files.length > 1) {
                      this.$store.commit('PlayingList', files);
                    } else {
                      const similarVideos = this.findSimilarVideoByVidPath(files[0]);
                      this.$store.commit('PlayingList', similarVideos);
                    }
                  }
                });
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
              label: this.$t('msg.playback.fullScreen'),
              accelerator: 'CmdOrCtrl+F',
              enabled: false,
            },
            {
              label: this.$t('msg.playback.keepPlayingWindowFront'),
              type: 'checkbox',
              click: (menuItem, browserWindow) => {
                if (browserWindow.isAlwaysOnTop()) {
                  browserWindow.setAlwaysOnTop(false);
                  menuItem.checked = false;
                } else {
                  browserWindow.setAlwaysOnTop(true);
                  menuItem.checked = true;
                }
              },
            },
            // { label: 'Play from last stopped place' },
            // { label: 'Increase Size' },
            // { label: 'Decrease Size' },
            { type: 'separator' },
            { label: this.$t('msg.playback.increasePlaybackSpeed'), enabled: false },
            { label: this.$t('msg.playback.decreasePlaybackSpeed'), enabled: false },
            /** */
            { type: 'separator' },
            { label: this.$t('msg.playback.captureScreen'), enabled: false },
            { label: this.$t('msg.playback.captureVideoClip'), enabled: false },

            { type: 'separator' },
            { label: this.$t('msg.playback.mediaInfo'), enabled: false },
          ],
        },
        // menu.audio
        {
          label: this.$t('msg.audio.name'),
          submenu: [
            { label: this.$t('msg.audio.increaseAudioDelay'), enabled: false },
            { label: this.$t('msg.audio.decreaseAudioDelay'), enabled: false },
            { type: 'separator' },
            {
              label: this.$t('msg.audio.switchAudioTrack'),
              enabled: false,
              submenu: [
                { label: this.$t('msg.audio.track1'), enabled: false },
                { label: this.$t('msg.audio.track2'), enabled: false },
              ],
            },
          ],
        },
        // menu.subtitle
        {
          label: this.$t('msg.subtitle.name'),
          submenu: [
            { label: this.$t('msg.subtitle.AITranslation'), enabled: false },
            { label: this.$t('msg.subtitle.loadSubtitleFile'), enabled: false },
            {
              label: this.$t('msg.subtitle.mainSubtitle'),
              enabled: false,
              submenu: [
                { label: this.$t('msg.subtitle.langZhCN'), enabled: false },
                { label: this.$t('msg.subtitle.langEn'), enabled: false },
                { label: this.$t('msg.subtitle.noSubtitle'), enabled: false },
              ],
            },
            {
              label: this.$t('msg.subtitle.secondarySubtitle'),
              enabled: false,
              submenu: [],
            },
            { type: 'separator' },
            {
              label: this.$t('msg.subtitle.subtitleStyle'),
              enabled: false,
              submenu: [
                { label: this.$t('msg.subtitle.style1'), enabled: false },
                { label: this.$t('msg.subtitle.style2'), enabled: false },
                { label: this.$t('msg.subtitle.style3'), enabled: false },
              ],
            },
            { type: 'separator' },
            { label: this.$t('msg.subtitle.increaseSubtitleSize'), enabled: false },
            { label: this.$t('msg.subtitle.decreaseSubtitleSize'), enabled: false },
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
              label: this.$t('msg.window_.minimize'),
              role: 'minimize',
            },
            { label: this.$t('msg.window_.enterFullScreen'), enabled: 'false', accelerator: 'Ctrl+Cmd+F' },
            { label: this.$t('msg.window_.bringAllToFront'), accelerator: '' },
          ],
        },
        // menu.help
        {
          label: this.$t('msg.help.name'),
          role: 'help',
          submenu: [
            {
              label: this.$t('msg.help.splayerxHelp'),
            },
          ],
        },
      ];
      this.updateRecentPlay().then((result) => {
        // menu.file add "open recent"
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
                enabled: false,
                accelerator: 'Cmd+,',
              },
              {
                label: this.$t('msg.splayerx.homepage'),
                enabled: false,
              },
              {
                label: this.$t('msg.splayerx.feedback'),
                enabled: false,
              },
              { type: 'separator' },
              {
                label: this.$t('msg.splayerx.services'),
                role: 'services',
                submenu: [],
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
          file.submenu = Array.reverse(file.submenu);
          file.submenu.forEach((menuItem) => {
            template.unshift(menuItem);
          });
        }
        return template;
      }).then((result) => {
        const menu = Menu.buildFromTemplate(result);
        Menu.setApplicationMenu(menu);
      }).catch((err) => {
        console.log(err);
      });
    },
    getSystemLocale() {
      const localeMap = {
        'en': 'en',   // eslint-disable-line
        'en-AU': 'en',
        'en-CA': 'en',
        'en-GB': 'en',
        'en-NZ': 'en',
        'en-US': 'en',
        'en-ZA': 'en',
        'zh-CN': 'zhCN',
        'zh-TW': 'zhTW',
      };
      const { app } = this.$electron.remote;
      const locale = app.getLocale();
      this.$i18n.locale = localeMap[locale] || this.$i18n.locale;
    },
    updateRecentItem(key, value) {
      return {
        id: key,
        visible: true,
        label: value.label,
        click: () => {
          this.openFile(value.path);
        },
      };
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
        submenu: [
          {
            id: 'recent-1',
            visible: false,
          },
          {
            id: 'recent-2',
            visible: false,
          },
          {
            id: 'recent-3',
            visible: false,
          },
          {
            id: 'recent-4',
            visible: false,
          },
          {
            id: 'recent-5',
            visible: false,
          },
          {
            id: 'recent-6',
            visible: false,
          },
          {
            id: 'recent-7',
            visible: false,
          },
          {
            id: 'recent-8',
            visible: false,
          },
          {
            id: 'recent-9',
            visible: false,
          },
        ],
      };
      return this.infoDB().sortedResult('recent-played', 'lastOpened', 'prev').then((data) => {
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
      this.$electron.remote.Menu.getApplicationMenu().clear();
      this.createMenu();
    },
  },
  mounted() {
    // https://github.com/electron/electron/issues/3609
    // Disable Zooming
    this.$electron.webFrame.setVisualZoomLevelLimits(1, 1);
    this.getSystemLocale();
    this.infoDB().init().then(() => {
      this.createMenu();
      this.$bus.$on('new-file-open', this.refreshMenu);
    });
    // TODO: Setup user identity
    this.$storage.get('user-uuid', (err, userUUID) => {
      if (err) {
        userUUID = uuidv4();
        this.$storage.set('user-uuid', userUUID);
      }
      const platform = os.platform() + os.release();
      const { app } = this.$electron.remote;
      const version = app.getVersion();

      Vue.http.headers.common['X-Application-Token'] = userUUID;
      Vue.http.headers.common['User-Agent'] = `SPlayerX@2018 ${platform} Version ${version}`;
    });

    window.addEventListener('keypress', (e) => {
      if (e.key === ' ') { // space
        this.$bus.$emit('toggle-playback');
      }
    });
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
          this.$store.dispatch(videoActions.INCREASE_VOLUME);
          break;
        case 'ArrowDown':
          this.$store.dispatch(videoActions.DECREASE_VOLUME);
          break;
        case 'm':
          this.$store.dispatch(videoActions.TOGGLE_MUTE);
          break;
        case 'ArrowLeft':
          if (e.altKey === true) {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime - 60);
          } else {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime - 5);
          }
          break;
        case 'ArrowRight':
          if (e.altKey === true) {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime + 60);
          } else {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime + 5);
          }
          break;
        default:
          break;
      }
    });
    window.addEventListener('wheel', (e) => {
      const up = e.deltaY < 0;
      this.$store.dispatch(up ? videoActions.INCREASE_VOLUME : videoActions.DECREASE_VOLUME, 6);
    });

    /**
     * Todo:
     * Handle multiple files
     */
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      let tempFilePath;
      let containsSubFiles = false;
      const { files } = e.dataTransfer;
      // TODO: play it if it's video file
      const subtitleFiles = [];
      const subRegex = new RegExp('^(.srt|.ass|.vtt)$');
      const videoFiles = [];
      const vidRegex = new RegExp('^(3g2|.3gp|.3gp2|.3gpp|.amv|.asf|.avi|.bik|.bin|.crf|.divx|.drc|.dv|.dvr-ms|.evo|.f4v|.flv|.gvi|.gxf|.iso|.m1v|.m2v|.m2t|.m2ts|.m4v|.mkv|.mov|.mp2|.mp2v|.mp4|.mp4v|.mpe|.mpeg|.mpeg1|.mpeg2|.mpeg4|.mpg|.mpv2|.mts|.mtv|.mxf|.mxg|.nsv|.nuv|.ogg|.ogm|.ogv|.ogx|.ps|.rec|.rm|.rmvb|.rpl|.thp|.tod|.tp|.ts|.tts|.txd|.vob|.vro|.webm|.wm|.wmv|.wtv|.xesc)$');
      for (let i = 0; i < files.length; i += 1) {
        tempFilePath = files[i].path;
        if (subRegex.test(Path.extname(tempFilePath))) {
          subtitleFiles.push(tempFilePath);
          containsSubFiles = true;
        } else if (vidRegex.test(Path.extname(tempFilePath))) {
          videoFiles.push(tempFilePath);
        } else {
          this.$store.dispatch('addMessages', {
            type: 'error', title: this.$t('errorFile.title'), content: this.$t('errorFile.content'), dismissAfter: 10000,
          });
        }
      }
      if (videoFiles.length !== 0) {
        if (!videoFiles[0].includes('\\') || process.platform === 'win32') {
          this.openFile(videoFiles[0]);
        } else {
          this.$store.dispatch('addMessages', {
            type: 'error', title: this.$t('errorFile.title'), content: this.$t('errorFile.content'), dismissAfter: 10000,
          });
        }
        if (videoFiles.length > 1) {
          this.$store.commit('PlayingList', videoFiles);
        } else {
          const similarVideos = this.findSimilarVideoByVidPath(videoFiles[0]);
          this.$store.commit('PlayingList', similarVideos);
        }
      }
      if (containsSubFiles) {
        this.$bus.$emit('add-subtitle', subtitleFiles);
      }
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.$electron.ipcRenderer.on('open-file', (event, file) => {
      this.openFile(file);
    });
  },
}).$mount('#app');
