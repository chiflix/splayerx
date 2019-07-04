// Be sure to call Sentry function as early as possible in the main process
import '../shared/sentry';

import { app, BrowserWindow, session, Tray, ipcMain, globalShortcut, nativeImage, splayerx } from 'electron' // eslint-disable-line
import { throttle, debounce } from 'lodash';
import os from 'os';
import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import TaskQueue from '../renderer/helpers/proceduralQueue';
import './helpers/electronPrototypes';
import writeLog from './helpers/writeLog';
import { getOpenedFiles } from './helpers/argv';
import { mouse } from './helpers/mouse';
import { getValidVideoRegex } from '../shared/utils';

// requestSingleInstanceLock is not going to work for mas
// https://github.com/electron-userland/electron-packager/issues/923
if (!process.mas && !app.requestSingleInstanceLock()) {
  app.quit();
}

/**
 * Check for restore mark and delete all user data
 */
const userDataPath = app.getPath('userData');
if (fs.existsSync(path.join(userDataPath, 'NEED_TO_RESTORE_MARK'))) {
  try {
    const tbdPath = `${userDataPath}-TBD`;
    if (fs.existsSync(tbdPath)) rimraf.sync(tbdPath);
    fs.renameSync(userDataPath, tbdPath);
    rimraf(tbdPath, (err) => {
      if (err) console.error(err);
    });
  } catch (ex) {
    console.error(ex);
    try {
      rimraf.sync(`${userDataPath}/**/!(lockfile)`);
      console.log('Successfully removed all user data.');
    } catch (ex) {
      console.error(ex);
    }
  }
}

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;
let aboutWindow = null;
let preferenceWindow = null;
let tray = null;
let needToRestore = false;
let inited = false;
const filesToOpen = [];
const snapShotQueue = [];
const thumbnailTask = [];
const mediaInfoQueue = [];
const embeeddSubtitlesQueue = new TaskQueue();
const mainURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;
const aboutURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080/about.html'
  : `file://${__dirname}/about.html`;
const preferenceURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080/preference.html'
  : `file://${__dirname}/preference.html`;

const tempFolderPath = path.join(app.getPath('temp'), 'splayer');
if (!fs.existsSync(tempFolderPath)) fs.mkdirSync(tempFolderPath);

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
    mainWindow.webContents.send('mainCommit', 'isHiddenByBossKey', true);
    if (process.platform === 'win32') {
      tray = new Tray(nativeImage.createFromDataURL(require('../../build/icons/1024x1024.png')));
      tray.on('click', () => {
        mainWindow.show();
        mainWindow.webContents.send('mainCommit', 'isHiddenByBossKey', false);
        tray.destroy();
        tray = null;
      });
    }
  }
}

function markNeedToRestore() {
  fs.closeSync(fs.openSync(path.join(app.getPath('userData'), 'NEED_TO_RESTORE_MARK'), 'w'));
}

function registerMainWindowEvent(mainWindow) {
  if (!mainWindow) return;
  // TODO: should be able to use window.outerWidth/outerHeight directly
  mainWindow.on('resize', throttle(() => {
    mainWindow.webContents.send('mainCommit', 'windowSize', mainWindow.getSize());
  }, 100));
  mainWindow.on('move', throttle(() => {
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
  }, 100));
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('mainCommit', 'isFullScreen', true);
    mainWindow.webContents.send('mainCommit', 'isMaximized', mainWindow.isMaximized());
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('mainCommit', 'isFullScreen', false);
    mainWindow.webContents.send('mainCommit', 'isMaximized', mainWindow.isMaximized());
  });
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('mainCommit', 'isMaximized', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('mainCommit', 'isMaximized', false);
  });
  mainWindow.on('minimize', () => {
    mainWindow.webContents.send('mainCommit', 'isMinimized', true);
  });
  mainWindow.on('restore', () => {
    mainWindow.webContents.send('mainCommit', 'isMinimized', false);
  });
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('mainCommit', 'isFocused', true);
    mainWindow.webContents.send('mainCommit', 'isHiddenByBossKey', false);
  });
  mainWindow.on('blur', () => {
    mainWindow.webContents.send('mainCommit', 'isFocused', false);
  });
  mainWindow.on('scroll-touch-begin', () => mainWindow.webContents.send('scroll-touch-begin'));
  mainWindow.on('scroll-touch-end', () => mainWindow.webContents.send('scroll-touch-end'));

  ipcMain.on('callMainWindowMethod', (evt, method, args = []) => {
    try {
      mainWindow[method](...args);
    } catch (ex) {
      console.error('callMainWindowMethod', ex, method, JSON.stringify(args));
    }
  });
  /* eslint-disable no-unused-vars */
  ipcMain.on('windowSizeChange', (event, args) => {
    if (!mainWindow || event.sender.isDestroyed()) return;
    mainWindow.setSize(...args);
    event.sender.send('windowSizeChange-asyncReply', mainWindow.getSize());
  });
  function thumbnail(args, cb) {
    splayerx.generateThumbnails(
      args.src, args.outPath, args.width, args.num.cols, args.num.rows,
      (ret) => {
        console[ret === '0' ? 'log' : 'error'](ret, args.src);
        cb(ret, args.src);
      },
    );
  }
  function thumbnailTaskCallback() {
    const cb = (ret, src) => {
      thumbnailTask.shift();
      if (thumbnailTask.length > 0) {
        thumbnail(thumbnailTask[0], cb);
      }
      if (mainWindow && !mainWindow.webContents.isDestroyed() && ret === '0') {
        mainWindow.webContents.send('thumbnail-saved', src);
      }
    };
    thumbnail(thumbnailTask[0], cb);
  }
  ipcMain.on('generateThumbnails', (event, args) => {
    if (thumbnailTask.length === 0) {
      thumbnailTask.push(args);
      thumbnailTaskCallback();
    } else {
      thumbnailTask.splice(1, 1, args);
    }
  });

  function timecodeFromSeconds(s) {
    const dt = new Date(Math.abs(s) * 1000);
    let hours = dt.getUTCHours();
    let minutes = dt.getUTCMinutes();
    let seconds = dt.getUTCSeconds();

    if (minutes < 10) {
      minutes = `0${minutes}`;
    }
    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    if (hours > 0) {
      if (hours < 10) {
        hours = `${hours}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    }
    return `00:${minutes}:${seconds}`;
  }

  function extractSubtitle(videoPath, subtitlePath, index) {
    return new Promise((resolve, reject) => {
      splayerx.extractSubtitles(videoPath, subtitlePath, `0:${index}:0`, (err) => {
        if (!err) resolve(subtitlePath);
        else reject(err);
      });
    });
  }

  function snapShot(info, callback) {
    let randomNumber = Math.round((Math.random() * 20) + 5);
    if (randomNumber > info.duration) randomNumber = info.duration;
    if (!info.width) info.width = 1920;
    if (!info.height) info.height = 1080;
    const numberString = timecodeFromSeconds(randomNumber);
    splayerx.snapshotVideo(
      info.path, info.imgPath, numberString, `${info.width}`, `${info.height}`,
      (resultCode) => {
        console[resultCode === '0' ? 'log' : 'error'](resultCode, info.path);
        callback(resultCode, info.imgPath);
      },
    );
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
          event.sender.send(`snapShot-${lastRecord.path}-reply`, imgPath);
          if (snapShotQueue.length > 0) {
            snapShot(snapShotQueue[0], callback);
          }
        }
      } else {
        snapShotQueue.shift();
        if (snapShotQueue.length > 0) {
          snapShot(snapShotQueue[0], callback);
        }
      }
    };
    snapShot(snapShotQueue[0], callback);
  }

  ipcMain.on('snapShot', (event, video) => {
    const imgPath = video.imgPath;

    if (!fs.existsSync(imgPath)) {
      snapShotQueue.push(video);
      if (snapShotQueue.length === 1) {
        snapShotQueueProcess(event);
      }
    } else {
      event.sender.send(`snapShot-${video.path}-reply`);
    }
  });

  ipcMain.on('extract-subtitle-request', (event, videoPath, index, format, hash) => {
    const subtitleFolderPath = path.join(tempFolderPath, hash);
    if (!fs.existsSync(subtitleFolderPath)) fs.mkdirSync(subtitleFolderPath);
    const subtitlePath = path.join(subtitleFolderPath, `embedded-${index}.${format}`);
    if (fs.existsSync(subtitlePath)) event.sender.send(`extract-subtitle-response-${index}`, { error: null, index, path: subtitlePath });
    else {
      embeeddSubtitlesQueue.add(() => extractSubtitle(videoPath, subtitlePath, index)
        .then(index => event.sender.send(`extract-subtitle-response-${index}`, { error: null, index, path: subtitlePath }))
        .catch(index => event.sender.send(`extract-subtitle-response-${index}`, { error: 'error', index })));
    }
  });

  function mediaInfo(videoPath, callback) {
    splayerx.getMediaInfo(videoPath, (info) => {
      callback(info);
    });
  }
  function mediaInfoQueueProcess() {
    const callback = (info) => {
      if (mainWindow && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send(`mediaInfo-${mediaInfoQueue[0]}-reply`, info);
      }
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
      mediaInfoQueueProcess();
    } else {
      mediaInfoQueue.push(path);
    }
  });
  ipcMain.on('simulate-closing-window', () => {
    mediaInfoQueue.splice(0);
    snapShotQueue.splice(0);
    thumbnailTask.splice(0);
  });
  ipcMain.on('windowPositionChange', (event, args) => {
    if (!mainWindow || event.sender.isDestroyed()) return;
    mainWindow.setPosition(...args);
    event.sender.send('windowPositionChange-asyncReply', mainWindow.getPosition());
  });
  ipcMain.on('windowInit', (event) => {
    if (!mainWindow || event.sender.isDestroyed()) return;
    mainWindow.webContents.send('mainCommit', 'windowSize', mainWindow.getSize());
    mainWindow.webContents.send('mainCommit', 'windowMinimumSize', mainWindow.getMinimumSize());
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
    mainWindow.webContents.send('mainCommit', 'isFullScreen', mainWindow.isFullScreen());
    mainWindow.webContents.send('mainCommit', 'isFocused', mainWindow.isFocused());
  });
  ipcMain.on('bossKey', () => {
    handleBossKey();
  });
  ipcMain.on('writeLog', (event, level, log) => { // eslint-disable-line complexity
    if (!log) return;
    writeLog(level, log);
  });
  ipcMain.on('add-windows-about', () => {
    const aboutWindowOptions = {
      useContentSize: true,
      frame: false,
      titleBarStyle: 'none',
      width: 190,
      height: 280,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        experimentalFeatures: true,
      },
      acceptFirstMouse: true,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
    };
    if (!aboutWindow) {
      aboutWindow = new BrowserWindow(aboutWindowOptions);
      // 如果播放窗口顶置，打开关于也顶置
      if (mainWindow.isAlwaysOnTop()) {
        aboutWindow.setAlwaysOnTop(true);
      }
      aboutWindow.loadURL(`${aboutURL}`);
      aboutWindow.on('closed', () => {
        aboutWindow = null;
      });
    }
    aboutWindow.once('ready-to-show', () => {
      aboutWindow.show();
    });
  });
  ipcMain.on('add-preference', () => {
    const preferenceWindowOptions = {
      useContentSize: true,
      frame: false,
      titleBarStyle: 'none',
      width: 540,
      height: 426,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        experimentalFeatures: true,
      },
      acceptFirstMouse: true,
      fullscreenable: false,
      maximizable: false,
      minimizable: false,
    };
    if (!preferenceWindow) {
      preferenceWindow = new BrowserWindow(preferenceWindowOptions);
      // 如果播放窗口顶置，打开首选项也顶置
      if (mainWindow.isAlwaysOnTop()) {
        preferenceWindow.setAlwaysOnTop(true);
      }
      preferenceWindow.loadURL(`${preferenceURL}`);
      preferenceWindow.on('closed', () => {
        preferenceWindow = null;
      });
    } else {
      preferenceWindow.focus();
    }
    preferenceWindow.once('ready-to-show', () => {
      preferenceWindow.show();
    });
  });
  ipcMain.on('need-to-restore', () => {
    needToRestore = true;
    markNeedToRestore();
  });
  ipcMain.on('relaunch', () => {
    const switches = process.argv.filter(a => a.startsWith('-'));
    const argv = process.argv.filter(a => !a.startsWith('-'))
      .slice(0, app.isPackaged ? 1 : 2).concat(switches);
    app.relaunch({ args: argv.slice(1), execPath: argv[0] });
    app.quit();
  });
  ipcMain.on('preference-to-main', (e, args) => {
    if (mainWindow && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('mainDispatch', 'setPreference', args);
    }
  });
  ipcMain.on('main-to-preference', (e, args) => {
    if (preferenceWindow && !preferenceWindow.webContents.isDestroyed()) {
      preferenceWindow.webContents.send('preferenceDispatch', 'setPreference', args);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
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
      nodeIntegration: true,
      experimentalFeatures: true,
    },
    // See https://github.com/electron/electron/blob/master/docs/api/browser-window.md#showing-window-gracefully
    backgroundColor: '#6a6a6a',
    acceptFirstMouse: true,
    show: false,
    ...({
      win32: {},
    })[process.platform],
  });
  mainWindow.webContents.setUserAgent(`SPlayerX@2018 ${os.platform() + os.release()} Version ${app.getVersion()}`);

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

  registerMainWindowEvent(mainWindow);

  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => { // wait some time to prevent `Object not found` error
      mainWindow.openDevTools({ mode: 'detach' });
    }, 1000);
  }
}

['left-drag', 'left-up'].forEach((channel) => {
  mouse.on(channel, (...args) => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send(`mouse-${channel}`, ...args);
  });
});

app.on('before-quit', () => {
  if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
  if (needToRestore) {
    mainWindow.webContents.send('quit', needToRestore);
  } else {
    mainWindow.webContents.send('quit');
  }
});

app.on('quit', () => {
  mouse.dispose();
});

app.on('second-instance', () => {
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});


function darwinOpenFilesToStart() {
  if (mainWindow) { // sencond instance
    if (!inited) return;
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    mainWindow.webContents.send('open-file', ...filesToOpen);
    filesToOpen.splice(0, filesToOpen.length);
  } else if (app.isReady()) {
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
      mainWindow.webContents.send('open-file', ...opendFiles);
    }
  });
}

app.on('ready', () => {
  createWindow();
  app.setName('SPlayer');
  globalShortcut.register('CmdOrCtrl+Shift+I+O+P', () => {
    mainWindow.openDevTools({ mode: 'detach' });
  });
  globalShortcut.register('CmdOrCtrl+Shift+J+K+L', () => {
    preferenceWindow.openDevTools({ mode: 'detach' });
  });

  if (process.platform === 'win32') {
    globalShortcut.register('CmdOrCtrl+`', () => {
      handleBossKey();
    });
  }
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
