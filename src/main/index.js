import { app, BrowserWindow, Tray, ipcMain, globalShortcut, nativeImage, splayerx } from 'electron' // eslint-disable-line
import { throttle } from 'lodash';
import path from 'path';
import fs from 'fs';
import writeLog from './helpers/writeLog';
import WindowResizer from './helpers/windowResizer';
import { getOpenedFile } from './helpers/argv';
import { getValidVideoRegex } from '../shared/utils';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let startupOpenedFile;
let mainWindow = null;
let tray = null;
const snapShotQueue = [];
const mediaInfoQueue = [];
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}
app.on('second-instance', () => {
  if (mainWindow?.isMinimized()) mainWindow.restore();
  mainWindow?.focus();
});

if (process.platform === 'darwin') {
  app.on('will-finish-launching', () => {
    app.on('open-file', (event, file) => {
      if (!getValidVideoRegex().test(file)) return;
      if (mainWindow) { // sencond instance
        mainWindow.webContents.send('open-file', file);
      } else {
        startupOpenedFile = file;
      }
    });
  });
} else {
  startupOpenedFile = getOpenedFile(process.argv);
  app.on('second-instance', (event, argv) => {
    const opendFile = getOpenedFile(argv);
    if (opendFile) {
      mainWindow?.webContents.send('open-file', opendFile);
    }
  });
}

function handleBossKey() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    if (process.platform === 'darwin' && mainWindow.isFullScreen()) {
      mainWindow.once('leave-full-screen', handleBossKey);
      mainWindow.setFullScreen(false);
      return;
    }
    mainWindow.webContents.send('mainDispatch', 'PAUSE_VIDEO');
    mainWindow.hide();
    if (process.platform === 'win32') {
      tray = new Tray(nativeImage.createFromDataURL(require('../../build/icons/1024x1024.png')));
      tray.on('click', () => {
        mainWindow.show();
        tray.destroy();
        tray = null;
      });
    }
  }
}

function registerMainWindowEvent() {
  if (!mainWindow) return;
  // TODO: should be able to use window.outerWidth/outerHeight directly
  mainWindow.on('resize', throttle(() => {
    mainWindow?.webContents.send('mainCommit', 'windowSize', mainWindow.getSize());
  }, 100));
  mainWindow.on('move', throttle(() => {
    mainWindow?.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
  }, 100));
  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('mainCommit', 'isFullScreen', true);
    mainWindow?.webContents.send('mainCommit', 'isMaximized', mainWindow.isMaximized());
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('mainCommit', 'isFullScreen', false);
    mainWindow?.webContents.send('mainCommit', 'isMaximized', mainWindow.isMaximized());
  });
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('mainCommit', 'isMaximized', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('mainCommit', 'isMaximized', false);
  });
  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('mainCommit', 'isFocused', true);
  });
  mainWindow.on('blur', () => {
    mainWindow?.webContents.send('mainCommit', 'isFocused', false);
  });

  ipcMain.on('callCurrentWindowMethod', (evt, method, args = []) => {
    const currentWindow = BrowserWindow.getFocusedWindow() || mainWindow;
    currentWindow?.[method]?.(...args);
  });
  /* eslint-disable no-unused-vars */
  ipcMain.on('windowSizeChange', (event, args) => {
    if (!mainWindow || event.sender.isDestroyed()) return;
    mainWindow.setSize(...args);
    event.sender.send('windowSizeChange-asyncReply', mainWindow.getSize());
  });

  function snapShot(videoPath, callback) {
    /*
      TODO:
        img name should be more unique
     */
    const imgPath = path.join(app.getPath('temp'), path.basename(videoPath, path.extname(videoPath)));
    const randomNumber = Math.round((Math.random() * 20) + 5);
    const numberString = randomNumber < 10 ? `0${randomNumber}` : `${randomNumber}`;
    splayerx.snapshotVideo(videoPath, `${imgPath}.png`, `00:00:${numberString}`, (err) => {
      console[err ? 'error' : 'log'](err, videoPath);
      callback(err, imgPath);
    });
  }

  function snapShotQueueProcess(event) {
    const callback = (err, imgPath) => {
      if (err !== '0') {
        snapShot(snapShotQueue[0], callback);
      } else if (err === '0') {
        const lastRecord = snapShotQueue.shift();
        if (event.sender.isDestroyed()) {
          snapShotQueue.splice(0, snapShotQueue.length);
        } else {
          event.sender.send(`snapShot-${lastRecord}-reply`, imgPath);
          if (snapShotQueue.length > 0) {
            snapShot(snapShotQueue[0], callback);
          }
        }
      }
    };
    snapShot(snapShotQueue[0], callback);
  }

  ipcMain.on('snapShot', (event, videoPath) => {
    const imgPath = path.join(app.getPath('temp'), path.basename(videoPath, path.extname(videoPath)));

    if (!fs.existsSync(`${imgPath}.png`)) {
      if (snapShotQueue.length === 0) {
        snapShotQueue.push(videoPath);
        snapShotQueueProcess(event);
      } else {
        snapShotQueue.push(videoPath);
      }
    } else {
      console.log('pass', imgPath);
      event.sender.send(`snapShot-${videoPath}-reply`, imgPath);
    }
  });

  function mediaInfo(videoPath, callback) {
    splayerx.getMediaInfo(videoPath, (info) => {
      callback(info);
    });
  }

  function mediaInfoQueueProcess(event) {
    const callback = (info) => {
      event.sender.send(`mediaInfo-${mediaInfoQueue[0]}-reply`, info);
      mediaInfoQueue.shift();
      if (mediaInfoQueue.length > 0) {
        mediaInfo(mediaInfoQueue[0], callback);
      }
    };
    mediaInfo(mediaInfoQueue[0], callback);
  }

  ipcMain.on('mediaInfo', (event, path) => {
    if (mediaInfoQueue.length === 0) {
      mediaInfoQueue.push(path);
      mediaInfoQueueProcess(event);
    } else {
      mediaInfoQueue.push(path);
    }
  });
  ipcMain.on('windowPositionChange', (event, args) => {
    if (!mainWindow || event.sender.isDestroyed()) return;
    mainWindow.setPosition(...args);
    event.sender.send('windowPositionChange-asyncReply', mainWindow.getPosition());
  });
  ipcMain.on('windowInit', () => {
    mainWindow?.webContents.send('mainCommit', 'windowSize', mainWindow.getSize());
    mainWindow?.webContents.send('mainCommit', 'windowMinimumSize', mainWindow.getMinimumSize());
    mainWindow?.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
    mainWindow?.webContents.send('mainCommit', 'isFullScreen', mainWindow.isFullScreen());
    mainWindow?.webContents.send('mainCommit', 'isFocused', mainWindow.isFocused());
  });
  ipcMain.on('bossKey', () => {
    handleBossKey();
  });
  ipcMain.on('writeLog', (event, level, log) => {
    if (!log) return;
    writeLog(level, log);
    if (mainWindow && log.message && log.message.indexOf('Failed to open file') !== -1) {
      if (log.message.indexOf('it will be removed from list.') !== -1) {
        mainWindow.webContents.send('addMessages', 'remove-file');
      } else {
        mainWindow.webContents.send('addMessages');
      }
    }
  });
}

function createWindow() {
  /**
   * Initial window options
   */
  const windowOptions = {
    useContentSize: true,
    frame: false,
    titleBarStyle: 'none',
    width: 720,
    height: 405,
    minWidth: 720,
    minHeight: 405,
    // it can be set true here and be changed during player starting
    transparent: false, // set to false to solve the backdrop-filter bug
    webPreferences: {
      webSecurity: false,
      experimentalFeatures: true,
    },
    // See https://github.com/electron/electron/blob/master/docs/api/browser-window.md#showing-window-gracefully
    backgroundColor: '#802e2c29',
    acceptFirstMouse: true,
    show: false,
    ...({
      win32: {},
    })[process.platform],
  };

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadURL(startupOpenedFile ? `${winURL}#/play` : winURL);

  mainWindow.on('closed', () => {
    ipcMain.removeAllListeners();
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Open file by file association. Currently support 1 file only.
    if (startupOpenedFile) {
      mainWindow.webContents.send('open-file', startupOpenedFile);
    }
  });

  const resizer = new WindowResizer(mainWindow);
  resizer.onStart(); // will only register listener for win
  registerMainWindowEvent();
}

app.on('ready', () => {
  app.setName('SPlayerX');
  globalShortcut.register('CmdOrCtrl+Shift+I+O+P', () => {
    mainWindow?.openDevTools();
  });

  if (process.platform === 'win32') {
    globalShortcut.register('CmdOrCtrl+`', () => {
      handleBossKey();
    });
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  } else if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
});
