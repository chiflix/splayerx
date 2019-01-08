/* eslint-disable import/first */
// Be sure to call Sentry function as early as possible in the main process
import '../shared/sentry';

import { app, BrowserWindow, Tray, ipcMain, globalShortcut, nativeImage, splayerx } from 'electron' // eslint-disable-line
import { throttle, debounce } from 'lodash';
import path from 'path';
import fs from 'fs';
import './helpers/electronPrototypes';
import writeLog from './helpers/writeLog';
import { getOpenedFiles } from './helpers/argv';
import { getValidVideoRegex } from '../shared/utils';
import { FILE_NON_EXIST, EMPTY_FOLDER, OPEN_FAILED } from '../shared/errorcodes';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;
let aboutWindow = null;
let tray = null;
let inited = false;
const filesToOpen = [];
const snapShotQueue = [];
const mediaInfoQueue = [];
const mainURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;
const aboutURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080/about.html'
  : `file://${__dirname}/about.html`;

// requestSingleInstanceLock is not going to work for mas
// https://github.com/electron-userland/electron-packager/issues/923
if (process.mas === undefined && !app.requestSingleInstanceLock()) {
  app.quit();
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

  ipcMain.on('callMainWindowMethod', (evt, method, args = []) => {
    mainWindow?.[method]?.(...args);
  });
  /* eslint-disable no-unused-vars */
  ipcMain.on('windowSizeChange', (event, args) => {
    if (!mainWindow || event.sender.isDestroyed()) return;
    mainWindow.setSize(...args);
    event.sender.send('windowSizeChange-asyncReply', mainWindow.getSize());
  });

  function snapShot(video, callback) {
    const imgPath = path.join(app.getPath('temp'), video.quickHash);
    const randomNumber = Math.round((Math.random() * 20) + 5);
    const numberString = randomNumber < 10 ? `0${randomNumber}` : `${randomNumber}`;
    splayerx.snapshotVideo(video.videoPath, `${imgPath}.png`, `00:00:${numberString}`, (resultCode) => {
      console[resultCode === '0' ? 'log' : 'error'](resultCode, video.videoPath);
      callback(resultCode, imgPath);
    });
  }

  function extractSubtitle(videoPath, subtitlePath, index) {
    return new Promise((resolve, reject) => {
      splayerx.extractSubtitles(videoPath, subtitlePath, `0:${index}:0`, (err) => {
        if (err === 0) reject(index);
        resolve(index);
      });
    });
  }

  function snapShotQueueProcess(event) {
    const callback = (resultCode, imgPath) => {
      if (resultCode === 'Waiting for the task completion.') {
        snapShot(snapShotQueue[0], callback);
      } else if (resultCode === '0') {
        const lastRecord = snapShotQueue.shift();
        if (event.sender.isDestroyed()) {
          snapShotQueue.splice(0, snapShotQueue.length);
        } else {
          event.sender.send(`snapShot-${lastRecord.videoPath}-reply`, imgPath);
          if (snapShotQueue.length > 0) {
            snapShot(snapShotQueue[0], callback);
          }
        }
      } else {
        snapShotQueue.shift();
        if (snapShotQueue.length) {
          snapShot(snapShotQueue[0], callback);
        }
      }
    };
    snapShot(snapShotQueue[0], callback);
  }

  ipcMain.on('snapShot', (event, videoPath, quickHash) => {
    const imgPath = path.join(app.getPath('temp'), quickHash);

    if (!fs.existsSync(`${imgPath}.png`)) {
      snapShotQueue.push({ videoPath, quickHash });
      if (snapShotQueue.length === 1) {
        snapShotQueueProcess(event);
      }
    } else {
      console.log('pass', imgPath);
      event.sender.send(`snapShot-${videoPath}-reply`, imgPath);
    }
  });

  ipcMain.on('extract-subtitle-request', (event, videoPath, index, format, hash) => {
    const subtitlePath = path.join(app.getPath('temp'), `${hash}-${index}.${format}`);
    if (fs.existsSync(subtitlePath)) event.sender.send('extract-subtitle-response', { error: null, index, path: subtitlePath });
    else {
      extractSubtitle(videoPath, subtitlePath, index)
        .then(index => event.sender.send('extract-subtitle-response', { error: null, index, path: subtitlePath }))
        .catch(index => event.sender.send('extract-subtitle-response', { error: 'error', index }));
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
    if (mainWindow && log.message && log.errcode) {
      switch (log.errcode) {
        case FILE_NON_EXIST:
        case EMPTY_FOLDER:
        case OPEN_FAILED:
          mainWindow.webContents.send('addMessages', log.errcode);
          break;
        default:
          break;
      }
    }
  });
  ipcMain.on('add-windows-about', () => {
    const aboutWindowOptions = {
      useContentSize: true,
      frame: false,
      titleBarStyle: 'none',
      width: 390,
      height: 290,
      minWidth: 390,
      minHeight: 290,
      transparent: true,
      resizable: false,
      parent: mainWindow,
      show: false,
      webPreferences: {
        webSecurity: false,
        experimentalFeatures: true,
      },
      acceptFirstMouse: true,
      fullscreenable: false,
    };
    if (!aboutWindow) {
      aboutWindow = new BrowserWindow(aboutWindowOptions);
      aboutWindow.loadURL(`${aboutURL}`);
      aboutWindow.on('closed', () => {
        aboutWindow = null;
      });
    }
    aboutWindow.once('ready-to-show', () => {
      aboutWindow.show();
    });
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

  mainWindow.loadURL(filesToOpen.length ? `${mainURL}#/play` : mainURL);

  mainWindow.on('closed', () => {
    ipcMain.removeAllListeners();
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Open file by file association. Currently support 1 file only.
    if (filesToOpen.length) {
      mainWindow.webContents.send('open-file', ...filesToOpen);
      filesToOpen.splice(0, filesToOpen.length);
    }
    inited = true;
  });

  registerMainWindowEvent();

  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => { // wait some time to prevent `Object not found` error
      mainWindow?.openDevTools();
    }, 1000);
  }
}

app.on('second-instance', () => {
  if (mainWindow?.isMinimized()) mainWindow.restore();
  mainWindow?.focus();
});


function darwinOpenFilesToStart() {
  if (mainWindow) { // sencond instance
    if (!inited) return;
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    mainWindow.webContents.send('open-file', ...filesToOpen);
    filesToOpen.splice(0, filesToOpen.length);
  } else {
    createWindow();
  }
}
const darwinOpenFilesToStartDebounced = debounce(darwinOpenFilesToStart, 100);
if (process.platform === 'darwin') {
  app.on('will-finish-launching', () => {
    app.on('open-file', (event, file) => {
      if (!getValidVideoRegex().test(file)) return;
      filesToOpen.push(file);
      darwinOpenFilesToStartDebounced();
    });
  });
} else {
  filesToOpen.push(...getOpenedFiles(process.argv));
  app.on('second-instance', (event, argv) => {
    const opendFiles = getOpenedFiles(argv); // TODO: multiple files
    if (opendFiles.length) {
      mainWindow?.webContents.send('open-file', ...opendFiles);
    }
  });
}

app.on('ready', () => {
  app.setName('SPlayer');
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
  if (process.env.NODE_ENV !== 'development' || process.platform !== 'darwin') {
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
