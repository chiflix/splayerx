import { app, BrowserWindow, Tray, ipcMain, globalShortcut, splayerx } from 'electron' // eslint-disable-line
import { throttle } from 'lodash';
import path from 'path';
import writeLog from './helpers/writeLog';
import WindowResizer from './helpers/windowResizer';
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}
// See https://github.com/electron/electron/issues/4690
if (!process.defaultApp) {
  process.argv.unshift(null);
}
const cliArgs = process.argv.slice(2);
let startupOpenedFile = cliArgs.length ? cliArgs[0] : null;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

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
  if (mainWindow) {
    try {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } catch (err) {
      this.addLog('error', err);
      // pass
    }
  }
});

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
      tray = new Tray('build/icons/icon.ico');
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
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('mainCommit', 'isFocused', true);
  });
  mainWindow.on('blur', () => {
    mainWindow.webContents.send('mainCommit', 'isFocused', false);
  });

  ipcMain.on('callCurrentWindowMethod', (evt, method, args = []) => {
    const currentWindow = BrowserWindow.getFocusedWindow() || mainWindow;
    if (currentWindow && typeof (currentWindow[method]) === 'function') {
      currentWindow[method](...args);
    }
  });
  /* eslint-disable no-unused-vars */
  ipcMain.on('windowSizeChange', (event, args) => {
    mainWindow.setSize(...args);
    event.sender.send('windowSizeChange-asyncReply', mainWindow.getSize());
  });

  function snapShot(videoPath, callback) {
    const imgPath = path.join(app.getPath('temp'), path.basename(videoPath, path.extname(videoPath)));
    const randomNumber = Math.round((Math.random() * 20) + 5);
    const numberString = randomNumber < 9 ? `0${randomNumber}` : `${randomNumber}`;
    splayerx.snapshotVideo(videoPath, `${imgPath}.png`, `00:00:${numberString}`, (err) => {
      console.log(err, videoPath);
      callback(err, imgPath);
    });
  }

  function snapShotQueueProcess(event) {
    const callback = (err, imgPath) => {
      if (err !== '0') {
        snapShot(snapShotQueue[0], callback);
      } else {
        event.sender.send(`snapShot-${snapShotQueue[0]}-reply`, imgPath);
        snapShotQueue.shift();
        if (snapShotQueue.length > 0) {
          snapShot(snapShotQueue[0], callback);
        }
      }
    };
    snapShot(snapShotQueue[0], callback);
  }

  ipcMain.on('snapShot', (event, path) => {
    if (snapShotQueue.length === 0) {
      snapShotQueue.push(path);
      snapShotQueueProcess(event);
    } else {
      snapShotQueue.push(path);
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
    mainWindow.setPosition(...args);
    event.sender.send('windowPositionChange-asyncReply', mainWindow.getPosition());
  });
  ipcMain.on('windowInit', () => {
    mainWindow.webContents.send('mainCommit', 'windowSize', mainWindow.getSize());
    mainWindow.webContents.send('mainCommit', 'windowMinimumSize', mainWindow.getMinimumSize());
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
    mainWindow.webContents.send('mainCommit', 'isFullScreen', mainWindow.isFullScreen());
    mainWindow.webContents.send('mainCommit', 'isFocused', mainWindow.isFocused());
  });
  ipcMain.on('bossKey', () => {
    handleBossKey();
  });
  ipcMain.on('writeLog', (event, level, log) => {
    if (!log) return;
    writeLog(level, log);
    if (mainWindow && log.message && log.message.indexOf('Failed to open file') !== -1) {
      mainWindow.webContents.send('addMessages');
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

  mainWindow.loadURL(winURL);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    const vidRegex = new RegExp('\\.(3g2|3gp|3gp2|3gpp|amv|asf|avi|bik|bin|crf|divx|drc|dv|dvr-ms|evo|f4v|flv|gvi|gxf|iso|m1v|m2v|m2t|m2ts|m4v|mkv|mov|mp2|mp2v|mp4|mp4v|mpe|mpeg|mpeg1|mpeg2|mpeg4|mpg|mpv2|mts|mtv|mxf|mxg|nsv|nuv|ogg|ogm|ogv|ogx|ps|rec|rm|rmvb|rpl|thp|tod|tp|ts|tts|txd|vob|vro|webm|wm|wmv|wtv|xesc)$');

    // Open file by file association. Currently support 1 file only.
    if (startupOpenedFile && vidRegex.test(startupOpenedFile)) {
      mainWindow.webContents.send('open-file', startupOpenedFile);
    }
  });

  const resizer = new WindowResizer(mainWindow);
  resizer.onStart(); // will only register listener for win
  registerMainWindowEvent();
}

if (process.platform === 'darwin') {
  app.on('will-finish-launching', () => {
    app.on('open-file', (event, file) => {
      startupOpenedFile = file;
    });
  });
}

app.on('ready', () => {
  app.setName('SPlayerX');
  globalShortcut.register('CmdOrCtrl+Shift+I+O+P', () => {
    if (mainWindow) {
      mainWindow.openDevTools();
    }
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
