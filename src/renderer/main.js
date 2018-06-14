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
//  右键菜单
// const remote = Electron.remote;
// const rightwindow = null;

/* eslint-disable no-new */
// Importing this adds a right-click menu with 'Inspect Element' option
/* const remote = require('remote');
const Menu = remote.require('menu');
const MenuItem = remote.require('menu-item');

let rightClickPosition = null;

const menu = new Menu();
const menuItem = new MenuItem({
  label: 'Inspect Element',
  click: () => {
    remote.getCurrentWindow().webContents
      .inspectElement(rightClickPosition.x, rightClickPosition.y);
  },
});
menu.append(menuItem); */
new Vue({
  i18n,
  components: { App },
  router,
  store,
  template: '<App/>',
  data() {
    return {
      globalMenu: null,
    };
  },
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
            {
              label: 'Open URL',
              accelerator: 'Cmd+U',
            },
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
            // { label: 'Increase Volume' },
            // { label: 'Decrease Volume' },
            {
              label: 'Forward 5s',
              accelerator: 'Right',
              click: () => {
                this.timeControl('Forward', 5);
              },
            },
            {
              label: 'Forward 1min',
              accelerator: 'Option+Right',
              click: () => {
                this.timeControl('Forward', 60);
              },
            },
            {
              label: 'Rewind 5s',
              accelerator: 'Left',
              click: () => {
                this.timeControl('Rewind', 5);
              },
            },
            {
              label: 'Rewind 1min',
              accelerator: 'Option+Left',
              click: () => {
                this.timeControl('Rewind', 60);
              },
            },
            { type: 'separator' },
            // { label: 'Increase Audio Delay' },
            // { label: 'Decrease Audio Delay' },
            {
              label: 'Increase Volume',
              accelerator: 'Up',
              click: () => {
                this.volumeControl('Increse');
              },
            },
            {
              label: 'Decrease Volume',
              accelerator: 'Down',
              click: () => {
                this.volumeControl('Decrese');
              },
            },
            { type: 'separator' },
            {
              label: 'Increase Audio Delay',
            },
            {
              label: 'Decrease Audio Delay',
            },
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
    createRightMenu() {
      const {
        Menu, MenuItem, dialog,
      } = this.$electron.remote;
      // const ipc = this.$electron.ipcRenderer;
      // const electron = require('electron');
      // const ipc = electron.ipcMain;
      /* const rightTemplate = [
        {
          label: '打开文件',
          accelerator: 'Ctrl+O',
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
        {
          label: '播放',
          submenu: [
            {
              label: '快进5秒',
              click: () => {
                this.timeControl('Forward', 5);
              },
            },
            {
              label: '快退5秒',
              click: () => {
                this.timeControl('Rewind', 5);
              },
            },
            {
              label: '快进1分钟',
              click: () => {
                this.timeControl('Rewind', 60);
              },
            },
            {
              label: '快退1分钟',
              click: () => {
                this.timeControl('Rewind', 60);
              },
            },
          ],
        },
        {
          label: '音量',
          submenu: [
            {
              label: '增加音量',
              click: () => {
                this.volumeControl('Increse');
              },
            },
            {
              label: '减少音量',
              click: () => {
                this.volumeControl('Decrese');
              },
            },
          ],
        },
      ];
      // 右键菜单
      const rightMenu = MenuItem.buildFromTemplate(rightTemplate);
      rightwindow.setContextMenu(rightMenu); */
      const menu = new Menu();
      menu.append(new MenuItem({
        label: '打开文件',
        accelerator: 'Ctrl+O',
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
      }));
      menu.append(new MenuItem({
        label: '播放',
        submenu: [
          {
            label: '快进5秒',
            accelerator: 'Right',
            click: () => {
              this.timeControl('Forward', 5);
            },
          },
          {
            label: '快退5秒',
            accelerator: 'Left',
            click: () => {
              this.timeControl('Rewind', 5);
            },
          },
          {
            label: '快进1分钟',
            accelerator: 'Shift+Right',
            click: () => {
              this.timeControl('Rewind', 60);
            },
          },
          {
            label: '快退1分钟',
            accelerator: 'Shift+Left',
            click: () => {
              this.timeControl('Rewind', 60);
            },
          },
        ],
      }));
      menu.append(new MenuItem({
        label: '音量',
        submenu: [
          {
            label: '增加音量',
            accelerator: 'Up',
            click: () => {
              this.volumeControl('Increse');
            },
          },
          {
            label: '减少音量',
            accelerator: 'Down',
            click: () => {
              this.volumeControl('Decrese');
            },
          },
        ],
      }));
      this.globalMenu = menu;
    },
    timeControl(type, seconds) {
      // show progress bar
      this.$bus.$emit('progressbar-appear');
      this.$bus.$emit('progressslider-appear');
      this.$bus.$emit('timecode-appear');
      const curTime = this.$store.state.PlaybackState.CurrentTime;
      // const duration = this.$store.PlaybackState.Duration;
      if (type === 'Forward') {
        this.$bus.$emit('seek', curTime + seconds);
      }
      if (type === 'Rewind') {
        if (curTime < seconds) {
          seconds = curTime;
        }
        this.$bus.$emit('seek', curTime - seconds);
      }
    },
    volumeControl(type) {
      // show volume controller
      this.$bus.$emit('volumecontroller-appear');
      this.$bus.$emit('volumeslider-appear');
      if (type === 'Increse') {
        if (this.$store.state.PlaybackState.Volume + 0.1 < 1) {
          this.$store.commit('Volume', this.$store.state.PlaybackState.Volume + 0.1);
        } else {
          this.$store.commit('Volume', 1);
        }
      }
      if (type === 'Decrese') {
        if (this.$store.state.PlaybackState.Volume - 0.1 > 0) {
          this.$store.commit('Volume', this.$store.state.PlaybackState.Volume - 0.1);
        } else {
          this.$store.commit('Volume', 0);
        }
      }
    },
  },
  mounted() {
    this.createMenu();
    // this.createRightMenu();
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
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.createRightMenu();
      this.globalMenu.popup(this.$electron.remote.getCurrentWindow());
    }, false);
  },
}).$mount('#app');
