import Vue from 'vue';
import VueI18n from 'vue-i18n';
import axios from 'axios';
import VueElectronJSONStorage from 'vue-electron-json-storage';

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
              accelerator: 'Cmd+N',
              click: () => {
                dialog.showOpenDialog({
                  properties: ['openFile'],
                  filters: [{
                    name: 'Video Files',
                    extensions: ['mp4', 'mkv', 'mov'],
                  }],
                }, (file) => {
                  if (file) {
                    const path = `file:///${file}`;
                    this.$storage.set('recent-played', path);
                    this.$store.commit('SrcOfVideo', path);
                    this.$router.push({
                      name: 'playing-view',
                    });
                  }
                });
              },
            },
            { label: 'Open URL' },
            { label: 'Open Recent' },
            { label: 'Close' },
          ],
        },
        {
          label: 'Playback',
          submenu: [
            { label: 'Play from last stopped place' },
            { label: 'Increase Size' },
            { label: 'Decrease Size' },
            { type: 'separator' },
            { label: 'Increase Playback Speed' },
            { label: 'Decrease Playback Speed' },
            { type: 'separator' },
            { label: 'Increase Volume' },
            { label: 'Decrease Volume' },
            { type: 'separator' },
            { label: 'Increase Audio Delay' },
            { label: 'Decrease Audio Delay' },
            { type: 'separator' },
            { label: 'Capture Screen' },
          ],
        },
        {
          label: 'Subtitle',
          submenu: [
            { label: 'Main Subtitle' },
            { label: 'Secondary Subtitle' },
            { type: 'separator' },
            { label: 'Outside of Picture' },
            { type: 'separator' },
            { label: 'Increase Subtitle Size' },
            { label: 'Decrease Subtitle Size' },
            { type: 'separator' },
            { label: 'Increase Subtitle Delay' },
            { label: 'Decrease Subtitle Delay' },
            { type: 'separator' },
            { label: 'Increase Audio Delay' },
            { label: 'Decrease Audio Delay' },
            { type: 'separator' },
            { label: 'Smart Translating' },
            { label: 'Search on Shooter.cn' },
          ],
        },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { label: 'Enter Full Screen', accelerator: 'Ctrl+Cmd+F' },
            { role: 'close' },
            { type: 'separator' },
            { label: 'Media Info' },
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
      if (files[0].type.startsWith('video/')) {
        const path = `file:///${files[0].path}`;
        this.$storage.set('recent-played', path);
        this.$store.commit('SrcOfVideo', path);
        this.$router.push({
          name: 'playing-view',
        });
      } else {
        alert('We support video type only right now.');
      }
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
