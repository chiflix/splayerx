import { Menu, MenuItem, shell } from 'electron';

const fileMenu = [
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
];
const playbackMenu = [
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
];
const audioMenu = [
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
];
const subtitleMenu = [
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
    accelerator: 'CmdOrCtrl+\'',
    click: () => {
      this.updateSubDelay(0.1);
    },
  },
  {
    label: this.$t('msg.subtitle.decreaseSubtitleDelayS'),
    id: 'decreaseSubDelay',
    accelerator: 'CmdOrCtrl+;',
    click: () => {
      this.updateSubDelay(-0.1);
    },
  },
  { type: 'separator' },
  {
    label: this.$t('msg.subtitle.uploadSelectedSubtitle'),
    id: 'uploadSelectedSubtitle',
    click: () => this.$store.dispatch(SubtitleManager.manualUploadAllSubtitles),
  },
];
const windowMenu = [
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
    accelerator: 'CmdOrCtrl+Esc',
    click: () => {
      this.$bus.$emit('back-to-landingview');
    },
  },
];
const helpMenu = [
  {
    label: this.$t('msg.splayerx.feedback'),
    click: () => {
      shell.openExternal('https://feedback.splayer.org');
    },
  },
  {
    label: this.$t('msg.splayerx.homepage'),
    click: () => {
      shell.openExternal('https://beta.splayer.org');
    },
  },
  {
    label: this.$t('msg.help.shortCuts'),
    click: () => {
      shell.openExternal('https://github.com/chiflix/splayerx/wiki/SPlayer-Shortcuts-List');
    },
  },
];
const template: Electron.MenuItemConstructorOptions[] = [
  // menu.file
  {
    label: this.$t('msg.file.name'),
    submenu: fileMenu,
  },
  // menu.playback
  {
    label: this.$t('msg.playback.name'),
    id: 'playback',
    submenu: playbackMenu,
  },
  // menu.audio
  {
    label: this.$t('msg.audio.name'),
    id: 'audio',
    submenu: audioMenu,
  },
  // menu.subtitle
  {
    label: this.$t('msg.subtitle.name'),
    id: 'subtitle',
    submenu: subtitleMenu,
  },
  // menu.window
  {
    label: this.$t('msg.window.name'),
    submenu: windowMenu,
  },
  // menu.help
  {
    label: this.$t('msg.help.name'),
    role: 'help',
    submenu: helpMenu,
  },
];

export default class MenuService {
  detect = 1;
  createMenu() {
    this.detect = 2;
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

export const menuService = new MenuService();