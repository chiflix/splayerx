import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron' // eslint-disable-line
import Updater from './update/updater.js';
import WindowResizer from './helpers/windowResizer.js';
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

let mainWindow;
let updater;
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
      // pass
    }
  }
});

function createWindow() {
  /**
   * Initial window options
   */
  if (process.platform === 'win32') {
    mainWindow = new BrowserWindow({
      height: 432,
      useContentSize: true,
      width: 768,
      frame: false,
      titleBarStyle: 'none',
      minWidth: 427,
      minHeight: 240,
      webPreferences: {
        webSecurity: false,
        experimentalFeatures: true,
      },
      // See https://github.com/electron/electron/blob/master/docs/api/browser-window.md#showing-window-gracefully
      backgroundColor: '#802e2c29',
      show: false,
    });
  } else {
    mainWindow = new BrowserWindow({
      height: 405,
      useContentSize: true,
      width: 720,
      frame: false,
      titleBarStyle: 'none',
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
      show: false,
    });
  }

  mainWindow.loadURL(winURL);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

function initMainWindowEvent() {
  mainWindow.on('resize', () => {
    mainWindow.webContents.send('mainCommit', 'windowSize', mainWindow.getSize());
    mainWindow.webContents.send('mainCommit', 'fullscreen', mainWindow.isFullScreen());
    mainWindow.webContents.send('main-resize');
  });
  mainWindow.on('move', () => {
    mainWindow.webContents.send('mainCommit', 'windowPosition', mainWindow.getPosition());
    mainWindow.webContents.send('main-move');
  });
  /* eslint-disable no-unused-vars */
  ipcMain.on('windowSizeChange', (event, args) => {
    mainWindow.setSize(...args);
    event.sender.send('windowSizeChange-asyncReply', mainWindow.getSize());
  });
  ipcMain.on('windowPositionChange', (event, args) => {
    mainWindow.setPosition(...args);
    event.sender.send('windowPositionChange-asyncReply', mainWindow.getPosition());
  });
}

app.on('ready', () => {
  globalShortcut.register('CommandOrControl+Shift+I+O+P', () => {
    mainWindow.openDevTools();
  });
  app.setName('SPlayerX');
  createWindow();
  const resizer = new WindowResizer(mainWindow);
  resizer.onStart(); // will only register listener for win
  initMainWindowEvent();
  updater = Updater.getInstance(mainWindow, app);
  updater.onStart().then((message) => { console.log(message); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
    initMainWindowEvent();
    updater.Window = mainWindow;
  }
});
