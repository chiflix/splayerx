import Vue from 'vue';
import axios from 'axios';
import VueElectronJSONStorage from 'vue-electron-json-storage';

import App from './App';
import router from './router';
import store from './store';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

Vue.use(VueElectronJSONStorage);

Vue.prototype.$bus = new Vue(); // Global event bus

Vue.mixin({
  methods: {
    timecodeFromSeconds(s) {
      const dt = new Date(s * 1000);
      let hours = dt.getUTCHours();
      let minutes = dt.getUTCMinutes();
      let seconds = dt.getUTCSeconds();

      // the above dt.get...() functions return a single digit
      // so I prepend the zero here when needed
      if (minutes < 10) {
        minutes = `0${minutes}`;
      }
      if (seconds < 10) {
        seconds = `0${seconds}`;
      }
      if (hours > 0) {
        if (hours < 10) {
          hours = `0${hours}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      return `${minutes}:${seconds}`;
    },
  },
});

/* eslint-disable no-new */
new Vue({
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
              label: 'SplayerX Help',
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
      if (e.key === 'ArrowUp') {
        this.$bus.$emit('volumecontroller-appear');
        this.$bus.$emit('volumeslider-appear');
        if (this.$store.state.PlaybackState.Volume + 0.1 < 1) {
          this.$store.commit('Volume', this.$store.state.PlaybackState.Volume + 0.1);
        } else {
          this.$store.commit('Volume', 1);
        }
      } else if (e.key === 'ArrowDown') {
        this.$bus.$emit('volumecontroller-appear');
        this.$bus.$emit('volumeslider-appear');
        if (this.$store.state.PlaybackState.Volume - 0.1 > 0) {
          this.$store.commit('Volume', this.$store.state.PlaybackState.Volume - 0.1);
        } else {
          this.$store.commit('Volume', 0);
        }
      } else if (e.key === 'ArrowLeft') {
        this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime - 10);
      } else if (e.key === 'ArrowRight') {
        this.$bus.$emit('seek', this.$store.state.PlaybackState.CurrentTime + 10);
      }
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const { files } = e.dataTransfer;
      console.log(files);
      // TODO: play it if it's video file
      alert(`drag and drop are not yet supported.\nfile: ${files[0].path} ${files[0].name}`);
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
