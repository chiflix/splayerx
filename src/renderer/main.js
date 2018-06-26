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

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

Vue.use(VueI18n);
Vue.use(VueElectronJSONStorage);
Vue.use(VueResource);

Vue.mixin(helpers);

Vue.prototype.$bus = new Vue(); // Global event bus

const i18n = new VueI18n({
  locale: 'cn', // set locale
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
          label: 'File',
          submenu: [
            {
              label: 'Open',
              accelerator: 'Cmd+O',
              click: () => {
                dialog.showOpenDialog({
                  properties: ['openFile'],
                  filters: [{
                    name: 'Video Files',
                    extensions: ['mp4', 'mkv', 'mov'],
                  }],
                }, (file) => {
                  if (file !== undefined) {
                    const path = `file:///${file}`;
                    this.openFile(path);
                  }
                });
              },
            },
            {
              label: 'Open URL',
              accelerator: 'Cmd+U',
            },
            { label: 'Open Recent' },
            { role: 'Close' },
          ],
        },
        {
          label: 'Playback',
          submenu: [
            { label: 'Full Screen', accelerator: 'F' },
            // { label: 'Play from last stopped place' },
            // { label: 'Increase Size' },
            // { label: 'Decrease Size' },
            { type: 'separator' },
            { label: 'Increase Playback Speed' },
            { label: 'Decrease Playback Speed' },
            /** */
            { type: 'separator' },
            { label: 'Capture Screen' },
            { label: 'Capture Video Clip' },

            { type: 'separator' },
            { label: 'Media Info' },
          ],
        },
        {
          label: 'Audio',
          submenu: [
            { label: 'Increase Audio Delay' },
            { label: 'Decrease Audio Delay' },
            { type: 'separator' },
            { label: 'Switch Audio Track >' },
          ],
        },
        {
          label: 'Subtitle',
          submenu: [
            { label: 'Main Subtitle >' },
            { label: 'Secondary Subtitle >' },
            { type: 'separator' },
            { label: 'Subtitle Style >' },
            { type: 'separator' },
            { label: 'Increase Subtitle Size' },
            { label: 'Decrease Subtitle Size' },
            { type: 'separator' },
            { label: 'Increase Subtitle Delay' },
            { label: 'Decrease Subtitle Delay' },
            // { type: 'separator' },
            // { label: 'Smart Translating' },
            // { label: 'Search on Shooter.cn' },
          ],
        },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { label: 'Enter Full Screen', accelerator: 'Ctrl+Cmd+F' },
            { label: 'Bring All To Front', role: 'hideOthers', accelerator: '' },
          ],
        },
        {
          role: 'help',
          submenu: [
            {
              label: 'SPlayerX Help',
            },
          ],
        },
      ];

      if (process.platform === 'darwin') {
        template.unshift({
          label: app.getName(),
          submenu: [
            { role: 'about' },
            {
              label: 'Preferences',
              accelerator: 'Cmd+,',
            },
            {
              label: 'Homepage',
            },
            {
              label: 'Feedback',
            },
            { type: 'separator' },
            { role: 'services', submenu: [] },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'quit' },
          ],
        });
      }

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    },
  },
  mounted() {
    this.createMenu();

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
          this.$bus.$emit('volumecontroller-appear');
          this.$bus.$emit('volumeslider-appear');
          if (this.$store.state.PlaybackState.Volume + 0.1 < 1) {
            this.$store.commit('Volume', this.$store.state.PlaybackState.Volume + 0.1);
          } else {
            this.$store.commit('Volume', 1);
          }
          break;

        case 'ArrowDown':
          this.$bus.$emit('volumecontroller-appear');
          this.$bus.$emit('volumeslider-appear');
          if (this.$store.state.PlaybackState.Volume - 0.1 > 0) {
            this.$store.commit('Volume', this.$store.state.PlaybackState.Volume - 0.1);
          } else {
            this.$store.commit('Volume', 0);
          }
          break;

        case 'ArrowLeft':
          this.$bus.$emit('progressbar-appear');
          this.$bus.$emit('progressslider-appear');
          this.$bus.$emit('timecode-appear');
          if (e.altKey === true) {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime - 60);
          } else {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime - 5);
          }
          break;

        case 'ArrowRight':
          this.$bus.$emit('progressbar-appear');
          this.$bus.$emit('progressslider-appear');
          this.$bus.$emit('timecode-appear');
          if (e.altKey === true) {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime + 60);
          } else {
            this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime + 5);
          }
          break;
        default:
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const { files } = e.dataTransfer;
      console.log(files);
      // TODO: play it if it's video file
      const path = `file:///${files[0].path}`;

      this.openFile(path);

      /*
      for (const file in files) {
        if (files.hasOwnProperty(file)) {
          const filename = files[file].name
          const fileExt = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
          if (Videos.allowedExtensions().indexOf(fileExt) !== -1) {
            const video = {
              id: videos.length + 1,
              status: 'loading',
              name: filename,
              path: files[file].path,
              size: files[file].size
            }
            videos.push(video)
          }
        }
      } */
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  },
}).$mount('#app');
