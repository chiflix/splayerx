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
        {
          label: this.$t('msg.file.name'),
          submenu: [
            {
              label: this.$t('msg.file.open'),
              accelerator: 'CmdOrCtrl+O',
              click: () => {
                dialog.showOpenDialog({
                  properties: ['openFile'],
                  filters: [{
                    name: 'Video Files',
                    extensions: [],
                  }],
                }, (file) => {
                  if (file !== undefined) {
                    this.openFile(file[0]);
                  }
                });
              },
            },
            {
              label: this.$t('msg.file.openURL'),
              accelerator: 'CmdOrCtrl+U',
            },
            {
              label: this.$t('msg.file.closeWindow'),
              role: 'Close',
            },
          ],
        },
        {
          label: this.$t('msg.playback.name'),
          submenu: [
            {
              label: this.$t('msg.playback.fullScreen'),
              accelerator: 'CmdOrCtrl+F',
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
            { label: this.$t('msg.playback.increasePlaybackSpeed') },
            { label: this.$t('msg.playback.decreasePlaybackSpeed') },
            /** */
            { type: 'separator' },
            { label: this.$t('msg.playback.captureScreen') },
            { label: this.$t('msg.playback.captureVideoClip') },

            { type: 'separator' },
            { label: this.$t('msg.playback.mediaInfo') },
          ],
        },
        {
          label: this.$t('msg.audio.name'),
          submenu: [
            { label: this.$t('msg.audio.increaseAudioDelay') },
            { label: this.$t('msg.audio.decreaseAudioDelay') },
            { type: 'separator' },
            { label: this.$t('msg.audio.switchAudioTrack') },
          ],
        },
        {
          label: this.$t('msg.subtitle.name'),
          submenu: [
            { label: this.$t('msg.subtitle.mainSubtitle') },
            { label: this.$t('msg.subtitle.secondarySubtitle') },
            { type: 'separator' },
            { label: this.$t('msg.subtitle.subtitleStyle') },
            { type: 'separator' },
            { label: this.$t('msg.subtitle.increaseSubtitleSize') },
            { label: this.$t('msg.subtitle.decreaseSubtitleSize') },
            { type: 'separator' },
            { label: this.$t('msg.subtitle.increaseSubtitleDelay') },
            { label: this.$t('msg.subtitle.decreaseSubtitleDelay') },
            // { type: 'separator' },
            // { label: 'Smart Translating' },
            // { label: 'Search on Shooter.cn' },
          ],
        },
        {
          label: this.$t('msg.window_.name'),
          submenu: [
            {
              label: this.$t('msg.window_.minimize'),
              role: 'minimize',
            },
            { label: this.$t('msg.window_.enterFullScreen'), accelerator: 'Ctrl+Cmd+F' },
            { label: this.$t('msg.window_.bringAllToFront'), role: 'hideOthers', accelerator: '' },
          ],
        },
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
        template.splice(2, 0, result);
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
                accelerator: 'Cmd+,',
              },
              {
                label: this.$t('msg.splayerx.homepage'),
              },
              {
                label: this.$t('msg.splayerx.feedback'),
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
      console.log('Updating recent play!');
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
        console.log(menuRecentData);
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
          label: this.pathProcess(recentPlayData[i - 1].path),
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
          this.$bus.$emit('volumeslider-appear');
          if (this.$store.state.PlaybackState.Volume + 0.1 < 1) {
            this.$bus.$emit('volume', this.$store.state.PlaybackState.Volume + 0.1);
          } else {
            this.$bus.$emit('volume', 1);
          }
          break;

        case 'ArrowDown':
          this.$bus.$emit('volumeslider-appear');
          if (this.$store.state.PlaybackState.Volume - 0.1 > 0) {
            this.$bus.$emit('volume', this.$store.state.PlaybackState.Volume - 0.1);
          } else {
            this.$bus.$emit('volume', 0);
          }
          break;

        case 'ArrowLeft':
          this.$bus.$emit('progressbar-appear-delay');
          this.$bus.$emit('progressslider-appear');
          this.$bus.$emit('timecode-appear-delay');
          if (e.altKey === true) {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime - 60);
          } else {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime - 5);
          }
          break;

        case 'ArrowRight':
          this.$bus.$emit('progressbar-appear-delay');
          this.$bus.$emit('progressslider-appear');
          this.$bus.$emit('timecode-appear-delay');
          if (e.altKey === true) {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime + 60);
          } else {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime + 5);
          }
          break;
        default:
      }
    });

    /**
     * Todo:
     * Handle multiple files
     */
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      let potentialVidPath;
      let tempFilePath;
      let containsSubFiles = false;
      const { files } = e.dataTransfer;
      // TODO: play it if it's video file
      const subtitleFiles = [];
      const regex = '^(.srt|.ass|.vtt)$';
      const re = new RegExp(regex);
      for (let i = 0; i < files.length; i += 1) {
        tempFilePath = `file:///${files[i].path}`;
        if (re.test(Path.extname(tempFilePath))) {
          subtitleFiles.push(files[i].path);
          containsSubFiles = true;
        } else {
          potentialVidPath = tempFilePath;
        }
      }
      if (potentialVidPath) {
        this.openFile(potentialVidPath.replace(/^file:\/\/\//, ''));
      }
      if (containsSubFiles) {
        this.$bus.$emit('add-subtitle', subtitleFiles);
      }
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  },
}).$mount('#app');
